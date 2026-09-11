#!/usr/bin/env node
'use strict';

/**
 * Repository-wide production capability audit.
 *
 * This is intentionally evidence based: it never marks a module/page complete
 * because a file exists. It checks the implementation graph, local imports,
 * route mounting, page state handling, production controls, tests and the
 * presence of the shared AI/ERP integration surfaces.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.ai', 'production-hardening', 'system-audit');
const IGNORE = new Set(['.git', 'node_modules', 'coverage', 'dist', 'build', '.next', '.vite', '.audit']);
const CODE_EXT = /\.(?:js|jsx|ts|tsx|mjs|cjs|vue|svelte)$/i;
const PAGE_RE = /(^|[\\/])(pages?|screens?|views?)([\\/]|$)|Page\.(?:jsx?|tsx?)$/i;
const ROUTE_RE = /(?:^|[\\/])routes?([\\/]|$)|Routes?\.(?:js|ts)$/i;
const SERVICE_RE = /(?:^|[\\/])services?([\\/]|$)|Service\.(?:js|ts)$/i;
const CONTROLLER_RE = /controller/i;
const MODULE_RE = /(?:^|[\\/])modules?([\\/]|$).*M\d+/i;
const DB_RE = /(?:migration|schema|models?)(?:[\\/]|$)|\.sql$/i;
const PLACEHOLDER = /TODO|FIXME|HACK|XXX|not implemented|coming soon|placeholder|stubbed|skeleton/i;
const SECRET = /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY)/;
const DANGEROUS = /\b(?:eval|new Function)\s*\(|child_process\.(?:exec|execSync)\s*\(/;

function gitFiles() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean)
    .filter(p => !p.split(/[\\/]/).some(x => IGNORE.has(x)));
}
function kind(p) {
  if (PAGE_RE.test(p)) return 'page';
  if (MODULE_RE.test(p)) return 'module';
  if (ROUTE_RE.test(p)) return 'route';
  if (SERVICE_RE.test(p)) return 'service';
  if (CONTROLLER_RE.test(p)) return 'controller';
  if (DB_RE.test(p)) return 'database';
  if (/^(?:backend|frontend)(?:[\\/]|$)/i.test(p)) return 'application';
  return 'artifact';
}
function text(p) {
  if (!CODE_EXT.test(p) && !/\.(?:json|yaml|yml|md|sql|tf)$/i.test(p)) return null;
  try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; }
}
function localImports(p, source) {
  if (!source || !CODE_EXT.test(p)) return [];
  const result = [];
  const re = /(?:from\s*|require\s*\()(['"])(\.\.?[\\/][^'"]+)\1/g;
  let m;
  while ((m = re.exec(source))) result.push(m[2]);
  return [...new Set(result)];
}
function resolveLocal(p, spec) {
  const base = path.resolve(ROOT, path.dirname(p), spec);
  const candidates = [base, `${base}.js`, `${base}.jsx`, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.cjs`, `${base}.json`, path.join(base, 'index.js'), path.join(base, 'index.ts')];
  return candidates.some(fs.existsSync);
}
function routeMounts() {
  const index = path.join(ROOT, 'backend', 'src', 'index.js');
  if (!fs.existsSync(index)) return { exists: false, imports: [] };
  const source = fs.readFileSync(index, 'utf8');
  const imports = [...source.matchAll(/['"]\.\/routes\/([^'"]+?)(?:\.js)?['"]/g)].map(m => `${m[1]}.js`);
  return { exists: true, imports: [...new Set(imports)] };
}
function testsFor(p) {
  const base = path.basename(p, path.extname(p));
  const dir = path.dirname(p);
  const candidates = [
    path.join(dir, `${base}.test.js`),
    path.join(dir, `${base}.spec.js`),
    path.join(dir, '__tests__', `${base}.test.js`),
    path.join(dir, '__tests__', `${base}.spec.js`),
    path.join(ROOT, 'backend', 'src', '__tests__', `${base}.test.js`),
    path.join(ROOT, 'backend', '__tests__', `${base}.test.js`)
  ];
  return candidates.some(fs.existsSync);
}
function inspect(p) {
  const source = text(p);
  const k = kind(p);
  const findings = [];
  if (source === '') findings.push('empty-file');
  if (source && PLACEHOLDER.test(source)) findings.push('unfinished-marker');
  if (source && SECRET.test(source)) findings.push('possible-secret-literal');
  if (source && DANGEROUS.test(source)) findings.push('dangerous-runtime-api-review');

  const imports = localImports(p, source);
  const missing = imports.filter(spec => !resolveLocal(p, spec));
  if (missing.length) findings.push('missing-local-import');

  if (k === 'page' && source) {
    const interactive = /<(?:button|input|select|textarea|form)\b/i.test(source);
    if (interactive && !/(aria-|<label\b|role=)/i.test(source)) findings.push('accessibility-review');
    if (/<(?:img|Image)\b/i.test(source) && !/\balt\s*=/i.test(source)) findings.push('image-alt-review');
    if (/\b(?:fetch|axios)\s*\(|\.(?:get|post|put|patch|delete)\s*\(/i.test(source)) {
      if (!/(loading|isLoading|skeleton)/i.test(source)) findings.push('loading-state-review');
      if (!/(catch|onError|error)/i.test(source)) findings.push('error-state-review');
    }
  }
  if (['route', 'service', 'controller'].includes(k) && source && /async\b/.test(source) && !/catch\s*\(/.test(source)) findings.push('async-error-path-review');
  if (['service', 'controller'].includes(k) && source && /(?:query|INSERT|UPDATE|DELETE|SELECT)\b/i.test(source) && !/transaction|BEGIN|COMMIT|ROLLBACK/i.test(source)) findings.push('transaction-boundary-review');
  if (['service', 'route', 'controller', 'module'].includes(k) && source && !testsFor(p)) findings.push('test-evidence-missing');

  return { path: p, kind: k, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex'), findings, missingImports: missing };
}
function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = gitFiles();
  const records = files.map(inspect);
  const routes = records.filter(r => r.kind === 'route').map(r => r.path.replace(/\\/g, '/'));
  const mounted = routeMounts();
  const unmountedRoutes = mounted.exists ? routes.filter(r => !mounted.imports.some(i => r.endsWith(i))) : routes;
  const summary = {
    generatedAt: new Date().toISOString(),
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    files: records.length,
    pages: records.filter(r => r.kind === 'page').length,
    modules: records.filter(r => r.kind === 'module').length,
    services: records.filter(r => r.kind === 'service').length,
    routes: records.filter(r => r.kind === 'route').length,
    databaseArtifacts: records.filter(r => r.kind === 'database').length,
    reviewFiles: records.filter(r => r.findings.length).length,
    findings: records.reduce((n, r) => n + r.findings.length, 0),
    missingLocalImports: records.reduce((n, r) => n + r.missingImports.length, 0),
    unmountedRoutes,
    routeMountEvidence: mounted,
    byFinding: {}
  };
  for (const r of records) for (const f of r.findings) summary.byFinding[f] = (summary.byFinding[f] || 0) + 1;
  const gaps = records.filter(r => r.findings.length).map(r => ({ ...r, severity: r.findings.includes('possible-secret-literal') ? 'CRITICAL' : r.findings.includes('missing-local-import') ? 'HIGH' : 'MEDIUM' }));
  if (unmountedRoutes.length) gaps.push({ path: 'backend/src/index.js', kind: 'route-integration', findings: ['unmounted-route-files'], severity: 'HIGH', unmountedRoutes });

  fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, 'GAP_REGISTER.json'), JSON.stringify(gaps, null, 2));
  fs.writeFileSync(path.join(OUT, 'FILE_EVIDENCE.json'), JSON.stringify(records, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (summary.byFinding['possible-secret-literal'] || summary.missingLocalImports || unmountedRoutes.length) process.exitCode = 2;
}
main();
