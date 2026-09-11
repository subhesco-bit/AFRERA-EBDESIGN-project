#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN clone — complete production re-audit.
 *
 * Scope is deliberately the whole Git-tracked tree, not only backend/src and
 * frontend/src. This captures earlier ChatGPT/Claude/Devin work, pages,
 * services, modules, migrations, CI/IaC, documentation and configuration.
 *
 * Read-only: it never rewrites application files. It produces a deterministic
 * manifest so engineering batches can fix real findings without replacing
 * existing business logic.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.ai', 'production-hardening', 'complete-re-audit');
const IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.vite',
  '.cache', 'vendor', '.audit'
]);
const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.css',
  '.scss', '.less', '.html', '.json', '.jsonc', '.yaml', '.yml', '.md',
  '.txt', '.sql', '.sh', '.ps1', '.tf', '.env', '.xml', '.graphql', '.gql'
]);
const PAGE_RE = /(^|\/)(pages?|screens?|views?)(\/|$)|Page\.(jsx?|tsx?)$/i;
const SERVICE_RE = /(service|services)(\/|\\)/i;
const MODULE_RE = /(^|\/)(modules?)(\/|\\)M\d+/i;
const ROUTE_RE = /(route|routes)(\/|\\)|Routes?\.(jsx?|tsx?)$/i;
const CONTROLLER_RE = /controller/i;
const DB_RE = /(migration|migrations|schema|database|models?)(\/|\\)|\.sql$/i;
const PLACEHOLDER_RE = /TODO|FIXME|HACK|XXX|coming soon|not implemented|placeholder|stub(?:bed)?/i;
const SECRET_RE = /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY)/;
const NETWORK_RE = /\b(?:fetch|axios|superagent)\s*\(|\.(?:get|post|put|patch|delete)\s*\(/i;
const UI_CONTROL_RE = /<(?:button|input|select|textarea|a)\b/i;

function gitFiles() {
  return execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean).filter(p => !p.split('/').some(x => IGNORE_DIRS.has(x)));
}
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function kindFor(p) {
  if (PAGE_RE.test(p)) return 'page';
  if (MODULE_RE.test(p)) return 'module-artifact';
  if (SERVICE_RE.test(p)) return 'service';
  if (ROUTE_RE.test(p)) return 'route';
  if (CONTROLLER_RE.test(p)) return 'controller';
  if (DB_RE.test(p)) return 'database';
  if (/^(?:\.github|\.devin|\.claude|\.ai)(\/|$)/i.test(p)) return 'governance';
  if (/^(?:infra|terraform|docker|compose)(\/|$)|Dockerfile/i.test(p)) return 'infrastructure';
  if (/frontend(\/|$)/i.test(p)) return 'frontend';
  if (/backend(\/|$)/i.test(p)) return 'backend';
  return 'artifact';
}
function readText(abs) {
  const ext = path.extname(abs).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) && path.basename(abs) !== 'Dockerfile') return null;
  try { return fs.readFileSync(abs, 'utf8'); } catch { return null; }
}
function evaluate(p, text, kind) {
  const findings = [];
  const lines = text ? text.split(/\r?\n/).length : 0;
  const empty = !text || text.trim().length === 0;
  if (empty) findings.push('empty-file');
  if (text && PLACEHOLDER_RE.test(text)) findings.push('unfinished-marker');
  if (text && SECRET_RE.test(text)) findings.push('possible-secret-literal');

  const isCode = /\.(?:js|jsx|ts|tsx|mjs|cjs|vue|svelte)$/i.test(p);
  if (isCode && text && /console\.(log|debug|info)\s*\(/.test(text)) findings.push('console-output');
  if (kind === 'service' || kind === 'route' || kind === 'controller') {
    if (text && /async\s+function|async\s*\(/.test(text) && !/catch\s*\(/.test(text)) findings.push('async-error-review');
    if (text && NETWORK_RE.test(text) && !/(catch|finally|ErrorBoundary|errorHandler)/i.test(text)) findings.push('failure-path-review');
  }
  if (kind === 'page' || kind === 'module-artifact') {
    if (text && UI_CONTROL_RE.test(text) && !/(aria-|role=|<label\b|type=)/i.test(text)) findings.push('accessibility-review');
    if (text && /<(?:img|Image)\b/i.test(text) && !/\balt\s*=/.test(text)) findings.push('image-alt-review');
    if (text && NETWORK_RE.test(text) && !/(catch|finally|error|retry|loading|skeleton)/i.test(text)) findings.push('page-state-review');
    if (text && NETWORK_RE.test(text) && !/(Suspense|loading|skeleton)/i.test(text)) findings.push('loading-state-review');
  }
  if (text && /process\.env\.[A-Z0-9_]+/.test(text)) findings.push('runtime-config-dependency');

  // Very small files are not automatically wrong; flag them only when their
  // shape also looks like a scaffold. This prevents false positives on utils.
  const scaffoldSignal = text && lines <= 35 && /module\.exports|export\s+(?:default|const|function)|class\s+/m.test(text)
    && /return\s+(?:\{\}|null|undefined|\[\]|['"](?:TODO|stub|not implemented|placeholder))/i.test(text);
  if (scaffoldSignal) findings.push('skeleton-likely');

  return {
    path: p,
    kind,
    bytes: text == null ? fs.statSync(path.join(ROOT, p)).size : Buffer.byteLength(text),
    lines,
    sha256: sha256(fs.readFileSync(path.join(ROOT, p))),
    textAnalyzed: text != null,
    findings,
    status: findings.length ? 'REVIEW' : 'PASS'
  };
}
function missingLocalImports(p, text) {
  if (!text || !/\.(?:js|jsx|ts|tsx|mjs|cjs)$/.test(p)) return [];
  const imports = [];
  const re = /(?:from\s*|require\s*\()(['"])(\.\.?\/[^'"]+)\1/g;
  let m;
  while ((m = re.exec(text))) imports.push(m[2]);
  const missing = [];
  for (const spec of imports) {
    const base = path.resolve(ROOT, path.dirname(p), spec);
    const candidates = [base, `${base}.js`, `${base}.jsx`, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, 'index.js'), path.join(base, 'index.jsx'), path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
    if (!candidates.some(fs.existsSync)) missing.push(spec);
  }
  return [...new Set(missing)];
}
function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const paths = gitFiles();
  const records = [];
  let missingImportCount = 0;
  for (const p of paths) {
    const abs = path.join(ROOT, p);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    const text = readText(abs);
    const kind = kindFor(p);
    const record = evaluate(p, text, kind);
    const missingImports = missingLocalImports(p, text);
    if (missingImports.length) {
      record.findings.push('missing-local-import');
      record.missingImports = missingImports;
      record.status = 'REVIEW';
      missingImportCount += missingImports.length;
    }
    records.push(record);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    branch: execFileSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    trackedAndUntrackedSourceFiles: records.length,
    pass: records.filter(r => r.status === 'PASS').length,
    review: records.filter(r => r.status === 'REVIEW').length,
    pages: records.filter(r => r.kind === 'page').length,
    modules: records.filter(r => r.kind === 'module-artifact').length,
    services: records.filter(r => r.kind === 'service').length,
    routes: records.filter(r => r.kind === 'route').length,
    controllers: records.filter(r => r.kind === 'controller').length,
    databaseArtifacts: records.filter(r => r.kind === 'database').length,
    missingLocalImports: missingImportCount,
    findings: records.reduce((n, r) => n + r.findings.length, 0),
    byFinding: {}
  };
  for (const r of records) for (const f of r.findings) summary.byFinding[f] = (summary.byFinding[f] || 0) + 1;

  const findings = records.filter(r => r.findings.length);
  fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, 'FILE_MANIFEST.json'), JSON.stringify(records, null, 2));
  fs.writeFileSync(path.join(OUT, 'GAPS.json'), JSON.stringify(findings, null, 2));
  fs.writeFileSync(path.join(OUT, 'FILE_MANIFEST.csv'), [
    'path,kind,status,bytes,lines,sha256,findings,missingImports',
    ...records.map(r => [r.path, r.kind, r.status, r.bytes, r.lines, r.sha256, `"${r.findings.join(';')}"`, `"${(r.missingImports || []).join(';')}"`].join(','))
  ].join('\n'));

  console.log(JSON.stringify(summary, null, 2));
  if (summary.byFinding['possible-secret-literal']) process.exitCode = 2;
}
main();
