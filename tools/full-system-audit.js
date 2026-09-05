#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'target', 'worktrees']);
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.sql', '.md', '.html', '.css', '.scss']);
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolutePath, files);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(absolutePath);
  }
  return files;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

function read(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function maskCommentsAndStrings(text) {
  let result = '';
  let state = 'code';
  let quote = '';
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];
    if (state === 'line-comment') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '*' && next === '/') {
        result += ' ';
        index += 1;
        state = 'code';
      }
      continue;
    }
    if (state === 'string') {
      result += current === '\n' ? '\n' : ' ';
      if (current === '\\') {
        result += next === '\n' ? '\n' : ' ';
        index += 1;
      } else if (current === quote) {
        state = 'code';
      }
      continue;
    }
    if (current === '/' && next === '/') {
      result += '  ';
      index += 1;
      state = 'line-comment';
    } else if (current === '/' && next === '*') {
      result += '  ';
      index += 1;
      state = 'block-comment';
    } else if (current === '\'' || current === '"' || current === '`') {
      result += ' ';
      quote = current;
      state = 'string';
    } else {
      result += current;
    }
  }
  return result;
}

function isTest(filePath) {
  return /(?:\.test|\.spec)\.[cm]?[jt]sx?$|(^|[/\\])tests?[/\\]/i.test(filePath);
}

function isProductionSource(filePath) {
  const normalized = relative(filePath);
  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
    && !isTest(filePath)
    && (/^(backend|frontend)\/src\//.test(normalized) || normalized.startsWith('tools/'));
}

function collectRegexes(files) {
  const findings = [];
  const patterns = [
    { kind: 'literal', regex: /(?:^|(?:return|throw|case)\s+|[=(,:;!&|?{}\[\]\n]\s*)\/(?!\/)[^/\r\n]{1,240}\/[dgimsuvy]*/g },
    { kind: 'constructor', regex: /new\s+RegExp\s*\(([^\n)]*)\)/g },
    { kind: 'dynamic-constructor', regex: /(?<!new\s)RegExp\s*\(([^\n)]*)\)/g }
  ];

  for (const filePath of files.filter(isProductionSource)) {
    const text = read(filePath);
    if (!text) continue;
    const code = maskCommentsAndStrings(text);
    for (const pattern of patterns) {
      for (const match of code.matchAll(pattern.regex)) {
        const expression = match[0].trim();
        const line = lineNumber(text, match.index);
        const securitySensitive = /(password|email|phone|token|auth|sql|xss|csrf|sanitize|validate|route|id|url|input|query)/i.test(text.split(/\r?\n/)[line - 1] || '');
        const issues = [];
        if (pattern.kind !== 'literal' && /\+|\$\{|concat|join|template/i.test(expression)) issues.push('dynamic-pattern-construction');
        if (/\(\.\*\)|\(\.\+\)|\.\*\+|\.\+\+|\(\[.*\]\+\)/.test(expression)) issues.push('possible-backtracking');
        if (securitySensitive && pattern.kind === 'literal' && !/\^/.test(expression) && !/\$/.test(expression)) issues.push('unanchored-sensitive-validation');
        findings.push({ path: relative(filePath), line, kind: pattern.kind, expression, securitySensitive, issues });
      }
    }
  }

  const byExpression = new Map();
  for (const finding of findings) {
    const key = finding.expression.replace(/\s+/g, ' ');
    byExpression.set(key, (byExpression.get(key) || 0) + 1);
  }
  for (const finding of findings) {
    const count = byExpression.get(finding.expression.replace(/\s+/g, ' '));
    if (count > 1) finding.issues.push('duplicate-pattern');
  }
  return findings;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...Array.from(SOURCE_EXTENSIONS, extension => `${base}${extension}`), ...Array.from(SOURCE_EXTENSIONS, extension => path.join(base, `index${extension}`))];
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || null;
}

function collectImports(files) {
  const imports = [];
  const importPattern = /(?:import\s+(?:[^'";]+?\s+from\s+)?|require\s*\(\s*)['"]([^'"]+)['"]/g;
  for (const filePath of files.filter(isProductionSource)) {
    const text = read(filePath);
    for (const match of text.matchAll(importPattern)) {
      const resolved = resolveImport(filePath, match[1]);
      imports.push({ from: relative(filePath), specifier: match[1], resolved: resolved ? relative(resolved) : null, line: lineNumber(text, match.index) });
    }
  }
  return imports;
}

function collectComponents(files, imports) {
  const source = files.filter(filePath => /^frontend\/src\//.test(relative(filePath)) && SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase()) && !isTest(filePath));
  const componentPaths = source.filter(filePath => /\.jsx?$|\.tsx?$/.test(filePath) && /(?:function\s+[A-Z]\w*|const\s+[A-Z]\w*\s*=|class\s+[A-Z]\w*|export\s+default\s+function\s+[A-Z])/.test(read(filePath)));
  const routeConfig = source.find(filePath => relative(filePath) === 'frontend/src/config/routes.js');
  const routeText = routeConfig ? read(routeConfig) : '';
  return componentPaths.map(filePath => {
    const componentPath = relative(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const referencedBy = imports.filter(item => item.resolved === componentPath).map(item => item.from);
    const routeReferenced = routeText.includes(`../pages/${base}`) || routeText.includes(`../components/${base}`);
    const hasTest = files.some(testPath => {
      if (!isTest(testPath)) return false;
      const testBase = path.basename(testPath).replace(/\.[^.]+$/, '').toLowerCase();
      const componentBase = base.toLowerCase();
      return testBase === componentBase || testBase.startsWith(`${componentBase}.test`) || testBase.startsWith(`${componentBase}.spec`);
    });
    const text = read(filePath);
    const markers = [...text.matchAll(/\b(TODO|FIXME|stub|placeholder|mock implementation|not implemented)\b/gi)].map(match => ({ marker: match[0], line: lineNumber(text, match.index) }));
    return { path: componentPath, name: base, referencedBy, routeReferenced, hasTest, placeholderMarkers: markers, status: referencedBy.length || routeReferenced ? 'connected' : 'unreferenced-candidate' };
  });
}

function collectRoutes(files) {
  const routeFiles = files.filter(filePath => /^backend\/src\/routes\//.test(relative(filePath)) && path.extname(filePath) === '.js');
  const frontendRouteFile = files.find(filePath => relative(filePath) === 'frontend/src/config/routes.js');
  const frontendText = frontendRouteFile ? read(frontendRouteFile) : '';
  const frontendRoutes = [...frontendText.matchAll(/path:\s*['"]([^'"]+)['"]/g)].map(match => ({ path: match[1], line: lineNumber(frontendText, match.index) }));
  const backendIndex = files.find(filePath => relative(filePath) === 'backend/src/index.js');
  const backendText = backendIndex ? read(backendIndex) : '';
  const routeVariables = new Map([...backendText.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g)].map(match => [match[1], `${match[2]}.js`]));
  const directMounts = [...backendText.matchAll(/(?:app|router)\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*require\(['"]\.\/routes\/([^'"]+)['"]\)\s*\)/g)].map(match => ({ path: match[1], file: `${match[2]}.js`, line: lineNumber(backendText, match.index) }));
  const variableMounts = [...backendText.matchAll(/(?:app|router)\.use\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g)]
    .filter(match => routeVariables.has(match[2]))
    .map(match => ({ path: match[1], file: routeVariables.get(match[2]), line: lineNumber(backendText, match.index) }));
  const backendMounts = [...directMounts, ...variableMounts];
  return {
    frontend: { declarations: frontendRoutes, duplicatePaths: frontendRoutes.map(route => route.path).filter((value, index, values) => values.indexOf(value) !== index) },
    backend: { files: routeFiles.map(relative), mounts: backendMounts, unmountedFiles: routeFiles.map(relative).filter(file => !backendMounts.some(mount => mount.file === path.basename(file))) }
  };
}

function collectTestGaps(files, components, regexes) {
  const testBasenames = new Set(files.filter(isTest).map(filePath => path.basename(filePath).toLowerCase()));
  return {
    untestedComponents: components.filter(component => !component.hasTest).map(component => component.path),
    regexesWithoutNearbyTest: regexes.filter(regex => !testBasenames.has(path.basename(regex.path).toLowerCase())).map(regex => ({ path: regex.path, line: regex.line, expression: regex.expression })),
    testFiles: files.filter(isTest).map(relative)
  };
}

function main() {
  const files = walk(ROOT);
  const imports = collectImports(files);
  const regexes = collectRegexes(files);
  const components = collectComponents(files, imports);
  const routes = collectRoutes(files);
  const unresolvedImports = imports.filter(item => item.specifier.startsWith('.') && !item.resolved);
  const placeholders = components.filter(component => component.placeholderMarkers.length > 0);
  const report = {
    generatedAt: new Date().toISOString(),
    method: 'Static deterministic audit. It reports candidates; runtime registration, database execution, and browser behavior require executable environment evidence.',
    counts: { files: files.length, imports: imports.length, unresolvedImports: unresolvedImports.length, regexes: regexes.length, regexesWithIssues: regexes.filter(regex => regex.issues.length).length, components: components.length, untestedComponents: components.filter(component => !component.hasTest).length, placeholderComponents: placeholders.length, frontendRoutes: routes.frontend.declarations.length, duplicateFrontendRoutes: routes.frontend.duplicatePaths.length, backendRouteFiles: routes.backend.files.length, backendMounts: routes.backend.mounts.length, unmountedBackendRouteFiles: routes.backend.unmountedFiles.length },
    regexes: regexes.filter(regex => regex.issues.length || regex.securitySensitive),
    components: components.filter(component => component.status !== 'connected' || component.placeholderMarkers.length || !component.hasTest),
    routes,
    imports: { unresolved: unresolvedImports },
    testGaps: collectTestGaps(files, components, regexes),
    productionHardeningCandidates: [
      ...regexes.filter(regex => regex.issues.length).map(regex => ({ category: 'regex', ...regex })),
      ...unresolvedImports.map(item => ({ category: 'unresolved-import', ...item })),
      ...components.filter(component => component.placeholderMarkers.length).map(component => ({ category: 'placeholder', ...component })),
      ...routes.backend.unmountedFiles.map(file => ({ category: 'unmounted-backend-route', path: file }))
    ]
  };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'full-system-audit.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'full-system-audit.md'), [
    '# Full System Audit', '', `Generated: ${report.generatedAt}`, '',
    `- Files scanned: ${report.counts.files}`,
    `- Regexes found: ${report.counts.regexes}; with issues: ${report.counts.regexesWithIssues}`,
    `- Components found: ${report.counts.components}; untested: ${report.counts.untestedComponents}`,
    `- Frontend routes: ${report.counts.frontendRoutes}; duplicate declarations: ${report.counts.duplicateFrontendRoutes}`,
    `- Backend route files: ${report.counts.backendRouteFiles}; mounts detected: ${report.counts.backendMounts}; unmounted candidates: ${report.counts.unmountedBackendRouteFiles}`,
    `- Unresolved local imports: ${report.counts.unresolvedImports}`,
    `- Placeholder-marked components: ${report.counts.placeholderComponents}`,
    '', 'This report is static evidence and does not prove runtime or database connectivity.', ''
  ].join('\n'));
  process.stdout.write(JSON.stringify(report.counts, null, 2) + '\n');
}

main();