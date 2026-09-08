#!/usr/bin/env node
/**
 * Live-system wire pipeline: Discover → Map → Linkage Check
 * Canonical roots only (excludes .claude/worktrees, node_modules, .git).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIR = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next',
  'worktrees', '.claude', '.system-audit', '_audit', '_EBDESIGN_LIBRARY'
]);

function walk(dir, files = [], pred) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (SKIP_DIR.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files, pred);
    else if (!pred || pred(full)) files.push(full);
  }
  return files;
}

function collectRefs(files) {
  const refs = new Set();
  const importRe = /(?:require\s*\(\s*|from\s+|import\s*\(\s*)['"`]([^'"`]+)['"`]/g;
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    let m;
    while ((m = importRe.exec(text))) refs.add(m[1]);
    // also capture lazy(() => import('...')) already covered
  }
  return refs;
}

function isReferenced(file, refs, srcRoot) {
  const rel = path.relative(srcRoot, file).replace(/\\/g, '/');
  const base = path.basename(file, path.extname(file));
  const noExt = rel.replace(/\.(js|jsx|ts|tsx)$/, '');
  for (const ref of refs) {
    if (!ref.startsWith('.') && !ref.startsWith('/')) continue;
    const normalized = ref.replace(/\\/g, '/');
    if (normalized.endsWith(base) || normalized.endsWith(noExt) || normalized.includes(`/${base}`)) {
      return true;
    }
    if (normalized.includes(base)) return true;
  }
  return false;
}

function scanBackend() {
  const src = path.join(ROOT, 'backend', 'src');
  const jsFiles = walk(src, [], (f) => f.endsWith('.js') && !f.includes('.test.'));
  const refs = collectRefs(jsFiles);
  const hay = jsFiles.map((f) => {
    try {
      return fs.readFileSync(f, 'utf8');
    } catch {
      return '';
    }
  }).join('\n');

  const routesDir = path.join(src, 'routes');
  const servicesDir = path.join(src, 'services');
  const coreDir = path.join(src, 'core');
  const mwDir = path.join(src, 'middleware');

  const routeFiles = walk(routesDir, [], (f) => f.endsWith('.js'));
  const serviceFiles = walk(servicesDir, [], (f) => f.endsWith('.js') && !f.includes('.test.'));
  const coreFiles = walk(coreDir, [], (f) => f.endsWith('.js'));
  const mwFiles = walk(mwDir, [], (f) => f.endsWith('.js'));

  const orphanRoutes = [];
  const nonRouters = [];
  for (const f of routeFiles) {
    const name = path.basename(f);
    const text = fs.readFileSync(f, 'utf8');
    const looksRouter = /express\.Router\(|module\.exports\s*=\s*router|exports\.router/.test(text);
    const setup = /setupRoutes/.test(text);
    if (!looksRouter && !setup) nonRouters.push(path.relative(src, f));
    const stem = name.replace(/\.js$/, '');
    const required = hay.includes(stem) || hay.includes(`routes/${stem}`) || hay.includes(`routes\\\\${stem}`);
    if (!required && !looksRouter) orphanRoutes.push(path.relative(src, f));
  }

  const orphanServices = [];
  const setupRoutesUncalled = [];
  for (const f of serviceFiles) {
    const stem = path.basename(f, '.js');
    const text = fs.readFileSync(f, 'utf8');
    const mentioned = new RegExp(`['"\`].*${stem}(\\.js)?['"\`]`).test(hay.replace(text, ''));
    const others = hay.split(text).join('');
    const referenced = others.includes(stem);
    if (!referenced) orphanServices.push(path.relative(src, f).replace(/\\/g, '/'));
    if (/function setupRoutes|setupRoutes\s*\(/.test(text) && !others.includes(`${stem}`) && !others.includes('setupRoutes(app)')) {
      setupRoutesUncalled.push(path.relative(src, f).replace(/\\/g, '/'));
    }
  }

  const coreIndex = fs.readFileSync(path.join(coreDir, 'index.js'), 'utf8');
  const orphanCore = coreFiles
    .filter((f) => path.basename(f) !== 'index.js')
    .filter((f) => {
      const stem = path.basename(f, '.js');
      return !coreIndex.includes(`./${stem}`) && !hay.includes(`core/${stem}`);
    })
    .map((f) => path.relative(src, f).replace(/\\/g, '/'));

  const indexJs = fs.readFileSync(path.join(src, 'index.js'), 'utf8');
  const orphanMw = mwFiles
    .filter((f) => {
      const stem = path.basename(f, '.js');
      return !indexJs.includes(stem) && !hay.replace(fs.readFileSync(f, 'utf8'), '').includes(stem);
    })
    .map((f) => path.relative(src, f).replace(/\\/g, '/'));

  return {
    files: jsFiles.length,
    routes: routeFiles.length,
    services: serviceFiles.length,
    orphanRoutes,
    nonRouters,
    orphanServices: orphanServices.slice(0, 80),
    orphanServiceCount: orphanServices.length,
    setupRoutesUncalled,
    orphanCore,
    orphanMw
  };
}

function scanFrontend() {
  const src = path.join(ROOT, 'frontend', 'src');
  const pagesDir = path.join(src, 'pages');
  const routesFile = fs.readFileSync(path.join(src, 'config', 'routes.js'), 'utf8');
  const appFile = fs.readFileSync(path.join(src, 'App.jsx'), 'utf8');
  const pageFiles = walk(pagesDir, [], (f) => /\.(jsx|tsx|js)$/.test(f));
  const unrouted = [];
  for (const f of pageFiles) {
    const base = path.basename(f, path.extname(f));
    if (!routesFile.includes(base) && !appFile.includes(base)) {
      unrouted.push(path.relative(src, f).replace(/\\/g, '/'));
    }
  }

  const componentFiles = walk(path.join(src, 'components'), [], (f) => /\.(jsx|js)$/.test(f));
  const allSrc = walk(src, [], (f) => /\.(jsx|js)$/.test(f));
  const hay = allSrc.map((f) => {
    try { return f + '\n' + fs.readFileSync(f, 'utf8'); } catch { return ''; }
  }).join('\n');

  const orphanComponents = [];
  for (const f of componentFiles) {
    const base = path.basename(f, path.extname(f));
    const others = hay.replace(fs.readFileSync(f, 'utf8'), '');
    const hits = (others.match(new RegExp(base, 'g')) || []).length;
    if (hits < 1) orphanComponents.push(path.relative(src, f).replace(/\\/g, '/'));
  }

  return {
    pages: pageFiles.length,
    unroutedPages: unrouted,
    components: componentFiles.length,
    orphanComponents: orphanComponents.slice(0, 60),
    orphanComponentCount: orphanComponents.length
  };
}

function main() {
  const backend = scanBackend();
  const frontend = scanFrontend();
  const report = {
    timestamp: new Date().toISOString(),
    liveSystems: ['backend', 'frontend', 'frontend/android', 'frontend/src-tauri'],
    excluded: ['.claude/worktrees/* (snapshots, not live)'],
    backend,
    frontend
  };
  const outDir = path.join(ROOT, '.system-audit');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '03_LIVE_LINKAGE.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    backendFiles: backend.files,
    routes: backend.routes,
    services: backend.services,
    orphanServices: backend.orphanServiceCount,
    orphanCore: backend.orphanCore,
    orphanMw: backend.orphanMw,
    nonRouters: backend.nonRouters,
    setupRoutesUncalled: backend.setupRoutesUncalled.length,
    frontendPages: frontend.pages,
    unroutedPages: frontend.unroutedPages.length,
    unroutedSample: frontend.unroutedPages.slice(0, 40),
    orphanComponents: frontend.orphanComponentCount
  }, null, 2));
}

main();
