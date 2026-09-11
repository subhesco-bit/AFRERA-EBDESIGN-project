#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN Production Hardening Gate
 *
 * Read-only by design. It inventories source/pages and evaluates production
 * readiness without rewriting business logic. This is the authoritative gate
 * used before an individual file/page is declared hardened.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOTS = ['backend/src', 'frontend/src'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (EXTENSIONS.has(path.extname(entry.name))) output.push(full);
  }
  return output;
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function classify(file) {
  const p = rel(file);
  if (p.startsWith('frontend/src/pages/')) return 'page';
  if (p.match(/^frontend\/src\/modules\/M\d{3}\//)) return 'module-page';
  if (p.startsWith('frontend/src/components/')) return 'component';
  if (p.startsWith('frontend/src/services/')) return 'frontend-service';
  if (p.startsWith('backend/src/routes/')) return 'route';
  if (p.startsWith('backend/src/controllers/')) return 'controller';
  if (p.startsWith('backend/src/services/')) return 'backend-service';
  if (p.startsWith('backend/src/database/')) return 'database';
  return 'source';
}

function checks(content, kind) {
  const checks = [];
  checks.push(['syntaxCandidate', content.trim().length > 0]);
  checks.push(['hasErrorHandling', /try\\s*\\{|catch\\s*\\(|ErrorBoundary|error boundary/i.test(content)]);
  checks.push(['hasValidationSignal', /validate|validation|schema|joi|zod|express-validator/i.test(content)]);
  checks.push(['hasObservabilitySignal', /logger|logging|monitor|telemetry|audit/i.test(content)]);
  checks.push(['hasAsyncSafetySignal', !/async\\s+function|async\\s*\\(/.test(content) || /try\\s*\\{|catch\\s*\\(/.test(content)]);
  checks.push(['noObviousPlaceholder', !/TODO:|FIXME:|coming soon|not implemented|placeholder/i.test(content)]);
  checks.push(['noDirectSecretLiteral', !/(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH) PRIVATE KEY)/.test(content)]);

  if (kind === 'page' || kind === 'module-page') {
    checks.push(['hasLoadingOrSuspenseSignal', /loading|Suspense|Skeleton/i.test(content)]);
    checks.push(['hasErrorOrRecoverySignal', /error|retry|ErrorBoundary/i.test(content)]);
    checks.push(['hasAccessibleLabelSignal', /aria-|<label\\b|alt=/i.test(content) || !/<(button|input|select|textarea)\\b/i.test(content)]);
  }

  return Object.fromEntries(checks);
}

const files = SOURCE_ROOTS.flatMap(root => walk(path.join(ROOT, root)));
const records = files.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const kind = classify(file);
  const result = checks(content, kind);
  const failed = Object.entries(result).filter(([, ok]) => !ok).map(([name]) => name);
  return {
    path: rel(file),
    kind,
    bytes: Buffer.byteLength(content),
    lines: content.split(/\\r?\\n/).length,
    status: failed.length === 0 ? 'PASS' : 'REVIEW',
    failedChecks: failed
  };
});

const summary = records.reduce((acc, r) => {
  acc.total += 1;
  acc[r.status.toLowerCase()] += 1;
  acc.byKind[r.kind] = (acc.byKind[r.kind] || 0) + 1;
  return acc;
}, { total: 0, pass: 0, review: 0, byKind: {} });

const outDir = path.join(ROOT, '.ai', 'production-hardening');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'PRODUCTION_HARDENING_MANIFEST.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  scope: SOURCE_ROOTS,
  policy: 'Read-only gate; existing business logic is never overwritten by this tool.',
  summary,
  records
}, null, 2));

console.log('EBDESIGN PRODUCTION HARDENING GATE');
console.log('===================================');
console.log(`Files evaluated : ${summary.total}`);
console.log(`PASS            : ${summary.pass}`);
console.log(`REVIEW          : ${summary.review}`);
console.log('By type         :', JSON.stringify(summary.byKind));
console.log(`Manifest        : ${path.relative(ROOT, path.join(outDir, 'PRODUCTION_HARDENING_MANIFEST.json'))}`);

process.exitCode = summary.review === 0 ? 0 : 2;
