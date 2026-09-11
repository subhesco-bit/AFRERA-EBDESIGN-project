#!/usr/bin/env node
/**
 * Repository-wide module completeness audit.
 *
 * The audit intentionally checks the repository rather than trusting module.json
 * alone. It identifies modules with missing implementation surfaces so that
 * untouched/partial systems cannot be mistaken for completed modules.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODULE_ROOT = path.join(ROOT, 'backend', 'src', 'modules');
const SERVICES = path.join(ROOT, 'backend', 'src', 'services');
const ROUTES = path.join(ROOT, 'backend', 'src', 'routes');
const PAGES = path.join(ROOT, 'frontend', 'src', 'pages');

const exists = p => fs.existsSync(p);
const read = p => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';

function walk(dir) {
  if (!exists(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function dirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

const files = {
  services: walk(SERVICES),
  routes: walk(ROUTES),
  pages: walk(PAGES),
  modules: walk(MODULE_ROOT)
};

const moduleDirs = dirs(MODULE_ROOT).filter(n => /^M\d+/.test(n));

function moduleId(name) {
  return (name.match(/^M\d+(?:_[A-Z0-9]+)*/) || [name])[0];
}

function lower(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function related(rootFiles, id, name) {
  const needles = [lower(id), lower(name), lower(name.replace(/^M\d+_?/, ''))].filter(Boolean);
  return rootFiles.filter(f => needles.some(n => lower(path.basename(f)).includes(n)));
}

const results = moduleDirs.map(name => {
  const dir = path.join(MODULE_ROOT, name);
  const id = moduleId(name);
  const all = files.modules.filter(f => f.startsWith(dir + path.sep));
  const manifest = all.find(f => path.basename(f) === 'module.json');
  const serviceMatches = related(files.services, id, name);
  const routeMatches = related(files.routes, id, name);
  const pageMatches = related(files.pages, id, name);

  const hasTests = all.some(f => /(^|[\\/])(test|tests)([\\/]|$)/i.test(f));
  const hasDocs = all.some(f => /(^|[\\/])(docs)([\\/]|$)/i.test(f));
  const hasAi = all.some(f => /(^|[\\/])ai([\\/]|$)/i.test(f));
  const hasConfig = all.some(f => /(^|[\\/])config([\\/]|$)/i.test(f));

  const checks = {
    manifest: !!manifest,
    moduleFiles: all.length > 0,
    backendEvidence: serviceMatches.length > 0 || all.some(f => /(^|[\\/])backend([\\/]|$)/i.test(f)),
    routeEvidence: routeMatches.length > 0 || all.some(f => /routes?\.(js|ts)$/i.test(f)),
    frontendEvidence: pageMatches.length > 0 || all.some(f => /(^|[\\/])frontend([\\/]|$)/i.test(f)),
    tests: hasTests,
    docs: hasDocs,
    ai: hasAi,
    config: hasConfig
  };

  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k);
  let status = 'PARTIAL';
  if (checks.manifest && checks.backendEvidence && checks.routeEvidence && checks.tests && checks.docs) status = 'IMPLEMENTED_NEEDS_HARDENING';
  if (!checks.manifest && all.length === 0) status = 'UNREPRESENTED';
  if (missing.length === 0) status = 'COMPLETE';

  return { name, id, files: all.length, serviceMatches: serviceMatches.length, routeMatches: routeMatches.length, pageMatches: pageMatches.length, status, missing };
});

const counts = results.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});

console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  repository: 'subhesco-bit/AFRERA-EBDESIGN-project',
  moduleRoot: path.relative(ROOT, MODULE_ROOT),
  moduleCount: results.length,
  counts,
  modules: results
}, null, 2));

if (process.argv.includes('--strict') && results.some(r => ['UNREPRESENTED', 'PARTIAL'].includes(r.status))) process.exitCode = 2;
