#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROOTS = ['backend/src', 'frontend/src'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const IGNORED = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const rx = {
  error: /try\s*\{|catch\s*\(|ErrorBoundary|error boundary/i,
  validation: /validate|validation|schema|joi|zod|express-validator/i,
  observability: /logger|logging|monitor|telemetry|audit/i,
  placeholder: /TODO:|FIXME:|coming soon|not implemented|placeholder/i,
  secret: /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH) PRIVATE KEY)/,
  async: /async\s+function|async\s*\(/,
  loading: /loading|Suspense|Skeleton/i,
  recovery: /error|retry|ErrorBoundary/i,
  accessible: /aria-|<label\b|alt=/i,
  controls: /<(button|input|select|textarea)\b/i
};

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/');
}

function kindFor(file) {
  const p = relative(file);
  if (p.startsWith('frontend/src/pages/')) return 'page';
  if (/^frontend\/src\/modules\/M\d{3}\//.test(p)) return 'module-page';
  if (p.startsWith('frontend/src/components/')) return 'component';
  if (p.startsWith('frontend/src/services/')) return 'frontend-service';
  if (p.startsWith('backend/src/routes/')) return 'route';
  if (p.startsWith('backend/src/controllers/')) return 'controller';
  if (p.startsWith('backend/src/services/')) return 'backend-service';
  if (p.startsWith('backend/src/database/')) return 'database';
  return 'source';
}

function evaluate(content, kind) {
  const result = {
    nonEmpty: content.trim().length > 0,
    errorHandling: rx.error.test(content),
    validationSignal: rx.validation.test(content),
    observabilitySignal: rx.observability.test(content),
    noObviousPlaceholder: !rx.placeholder.test(content),
    noDirectSecretLiteral: !rx.secret.test(content),
    asyncSafety: !rx.async.test(content) || rx.error.test(content)
  };
  if (kind === 'page' || kind === 'module-page') {
    result.loadingStateSignal = rx.loading.test(content);
    result.errorRecoverySignal = rx.recovery.test(content);
    result.accessibilitySignal = rx.accessible.test(content) || !rx.controls.test(content);
  }
  return result;
}

const files = ROOTS.flatMap(root => walk(path.join(ROOT, root)));
const records = files.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const kind = kindFor(file);
  const checks = evaluate(content, kind);
  const failedChecks = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  return {
    path: relative(file),
    kind,
    bytes: Buffer.byteLength(content),
    lines: content.split(/\r?\n/).length,
    status: failedChecks.length ? 'REVIEW' : 'PASS',
    failedChecks
  };
});

const summary = {
  total: records.length,
  pass: records.filter(r => r.status === 'PASS').length,
  review: records.filter(r => r.status === 'REVIEW').length,
  byKind: records.reduce((a, r) => {
    a[r.kind] = (a[r.kind] || 0) + 1;
    return a;
  }, {})
};

const outDir = path.join(ROOT, '.ai', 'production-hardening');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'PRODUCTION_HARDENING_MANIFEST.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), scope: ROOTS, summary, records }, null, 2)
);

console.log('EBDESIGN PRODUCTION HARDENING GATE');
console.log('===================================');
console.log(`Files evaluated : ${summary.total}`);
console.log(`PASS            : ${summary.pass}`);
console.log(`REVIEW          : ${summary.review}`);
console.log(`Manifest        : .ai/production-hardening/PRODUCTION_HARDENING_MANIFEST.json`);

// A non-zero exit means there are items requiring actual engineering review.
process.exitCode = summary.review === 0 ? 0 : 2;
