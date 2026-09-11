#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN production-hardening batch auditor.
 *
 * This intentionally does NOT rewrite application code automatically. It
 * creates a deterministic, file-by-file work queue so production hardening
 * can be applied without destroying existing business logic.
 *
 * Scope: backend/frontend source plus page components.
 * Batch size: 5 actionable files by default; repeat until the queue is empty.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_EBDESIGN_LIBRARY', '_CONTROL', 'PRODUCTION_HARDENING');
const MANIFEST = path.join(OUT, 'PRODUCTION_HARDENING_MANIFEST.json');
const QUEUE = path.join(OUT, 'BATCH_QUEUE.json');
const BATCH_SIZE = Math.max(1, Number(process.env.BATCH_SIZE || 5));

const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
const SOURCE_EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.vue','.py','.java','.go','.rs','.php']);
const PAGE_RE = /(^|\/)(pages?|screens?|views?)(\/|$)|Page\.(jsx?|tsx?)$/i;
const TEST_RE = /(^|[._-])(test|spec)([._-]|$)|(^|\/)__tests__(\/|$)/i;
const CONFIG_RE = /(^|\/)(config|constants|schemas?)(\/|$)/i;
const SERVICE_RE = /(^|\/)(services?|providers?|repositories?)(\/|$)/i;
const ROUTE_RE = /(^|\/)(routes?|router)(\/|$)/i;
const CONTROLLER_RE = /(^|\/)(controllers?)(\/|$)/i;
const MODEL_RE = /(^|\/)(models?|entities?|schemas?)(\/|$)/i;

function rel(p) { return path.relative(ROOT, p).split(path.sep).join('/'); }
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    const r = rel(p);
    if (!r || SKIP.has(e.name)) continue;
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
}
function sha256(p) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(p));
  return h.digest('hex');
}
function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; }
}
function classify(p) {
  const r = rel(p).toLowerCase();
  const ext = path.extname(p).toLowerCase();
  const checks = {
    source: SOURCE_EXT.has(ext),
    page: PAGE_RE.test(r),
    test: TEST_RE.test(r),
    config: CONFIG_RE.test(r),
    service: SERVICE_RE.test(r),
    route: ROUTE_RE.test(r),
    controller: CONTROLLER_RE.test(r),
    model: MODEL_RE.test(r),
  };
  if (checks.page) return 'frontend-page';
  if (checks.service) return 'backend-service';
  if (checks.controller) return 'backend-controller';
  if (checks.route) return 'backend-route';
  if (checks.model) return 'backend-model';
  if (checks.test) return 'test';
  if (checks.config) return 'configuration';
  return checks.source ? 'source' : 'other';
}
function score(p, text, type) {
  const checks = [];
  const add = (name, pass, reason) => checks.push({ name, pass, reason });
  const source = SOURCE_EXT.has(path.extname(p).toLowerCase());
  if (!source) return { score: 0, checks };

  add('error-handling', /try\s*\{|catch\s*\(|ErrorBoundary|onError|errorHandler/i.test(text), 'Explicit error path detected');
  add('validation', /validate|validator|schema|joi|zod|yup|express-validator/i.test(text), 'Input/data validation evidence');
  add('authorization', /authorize|authorization|permission|role|rbac|acl|protectedroute|authmiddleware/i.test(text), 'Access-control evidence');
  add('observability', /logger|winston|monitor|telemetry|trace|metric|audit/i.test(text), 'Logging/monitoring/audit evidence');
  add('loading-or-state', type === 'frontend-page' ? /loading|pending|skeleton|suspense/i.test(text) : true, 'Loading/state handling');
  add('empty-state', type === 'frontend-page' ? /empty|no data|no results|not found/i.test(text) : true, 'Empty-state handling');
  add('api-boundary', type === 'frontend-page' ? /api|fetch\(|axios|query|mutation/i.test(text) : true, 'API/data boundary evidence');
  add('test-evidence', TEST_RE.test(rel(p)) || /describe\(|it\(|test\(/.test(text), 'Automated test evidence');
  add('security-sensitive-data', !/console\.log\([^)]*(password|token|secret|api[_-]?key)/i.test(text), 'No obvious sensitive-data logging');
  const passed = checks.filter(c => c.pass).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}
function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = [];
  walk(ROOT, files);
  const records = [];
  for (const p of files) {
    const type = classify(p);
    if (!['frontend-page','backend-service','backend-controller','backend-route','backend-model','source'].includes(type)) continue;
    const text = read(p);
    const s = score(p, text, type);
    records.push({
      path: rel(p), type, bytes: fs.statSync(p).size,
      sha256: sha256(p), production_hardening_score: s.score,
      checks: s.checks,
      status: s.score >= 90 ? 'READY_FOR_REVIEW' : 'ACTION_REQUIRED'
    });
  }
  records.sort((a,b) => a.production_hardening_score - b.production_hardening_score || a.path.localeCompare(b.path));
  const actionable = records.filter(r => r.status === 'ACTION_REQUIRED');
  const batch = actionable.slice(0, BATCH_SIZE);
  const manifest = {
    schema_version: '1.0.0', generated_at: new Date().toISOString(),
    batch_size: BATCH_SIZE, total_scanned: records.length,
    actionable: actionable.length, review_ready: records.length - actionable.length,
    completed: records.length === 0 || actionable.length === 0,
    files: records
  };
  const queue = { generated_at: manifest.generated_at, batch_size: BATCH_SIZE, remaining: actionable.length, batch: batch.map(r => r.path) };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + '\n');
  console.log(JSON.stringify({ ok: true, total_scanned: records.length, actionable: actionable.length, review_ready: manifest.review_ready, batch }, null, 2));
}
main();
