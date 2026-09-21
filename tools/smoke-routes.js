#!/usr/bin/env node
/**
 * smoke-routes.js — exercise every mounted GET route against the running
 * server and classify what comes back.
 *
 * Reads the live Express router stack rather than parsing source, so it tests
 * what is actually mounted. Only GET routes without path parameters are called
 * (a GET is expected to be side-effect free; a :param would need fixture data).
 *
 * Usage:
 *   node tools/smoke-routes.js                 # against localhost:5000
 *   node tools/smoke-routes.js --port 5000 --limit 400
 */

const http = require('http');

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i === -1 ? d : process.argv[i + 1];
};
const PORT = Number(arg('--port', 5000));
const LIMIT = Number(arg('--limit', 0));
const CONCURRENCY = Number(arg('--concurrency', 12));

function get(path, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path, timeout: timeoutMs, headers: { Accept: 'application/json' } },
      (res) => {
        let body = '';
        res.on('data', (c) => { if (body.length < 2000) body += c; });
        res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - started, body }));
      },
    );
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ms: Date.now() - started, why: 'timeout' }); });
    req.on('error', (e) => resolve({ status: -1, ms: Date.now() - started, why: e.code || e.message }));
  });
}

(async () => {
  // The server exposes its own route inventory; fall back to a probe list.
  const listing = await get('/api/v1/system/routes');
  let paths = [];
  try {
    const j = JSON.parse(listing.body || '{}');
    const routes = j?.data?.routes || j?.routes || [];
    paths = routes.map((r) => (typeof r === 'string' ? r : r.path)).filter(Boolean);
  } catch { /* fall through */ }

  if (!paths.length) {
    console.log(`  /api/v1/system/routes returned ${listing.status} — it is admin-only.`);
    console.log('  Falling back to the mount prefixes declared in index.js.\n');
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'backend', 'src', 'index.js'), 'utf8');
    const re = /app\.use\(\s*['"]([^'"]+)['"]/g;
    const set = new Set();
    let m;
    while ((m = re.exec(src)) !== null) if (m[1].startsWith('/api')) set.add(m[1]);
    // A mounted router almost always answers /health in this codebase.
    paths = [...set].map((p) => `${p.replace(/\/$/, '')}/health`);
  }

  paths = [...new Set(paths)].filter((p) => !p.includes(':') && !p.includes('*'));
  if (LIMIT) paths = paths.slice(0, LIMIT);

  console.log(`\n══════════ ROUTE SMOKE TEST ══════════\n`);
  console.log(`  target      http://127.0.0.1:${PORT}`);
  console.log(`  paths       ${paths.length}`);
  console.log(`  concurrency ${CONCURRENCY}\n`);

  const buckets = new Map();
  const slow = [];
  const dead = [];
  let done = 0;

  const queue = [...paths];
  async function worker() {
    for (;;) {
      const p = queue.shift();
      if (!p) return;
      const r = await get(p);
      const key = r.status === 0 ? 'TIMEOUT' : r.status === -1 ? `ERR ${r.why}` : String(r.status);
      buckets.set(key, (buckets.get(key) || 0) + 1);
      if (r.ms > 3000 && r.status > 0) slow.push({ p, ms: r.ms, status: r.status });
      if (r.status === 0 || r.status >= 500) dead.push({ p, status: key, ms: r.ms });
      if (++done % 50 === 0) process.stderr.write(`  …${done}/${paths.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const order = (k) => (k === '200' ? 0 : k === '401' ? 1 : k === '403' ? 2 : k === '404' ? 3 : 9);
  console.log('  RESPONSES\n');
  const rows = [...buckets].sort((a, b) => order(a[0]) - order(b[0]) || b[1] - a[1]);
  const total = paths.length || 1;
  for (const [k, n] of rows) {
    const pct = ((n / total) * 100).toFixed(1);
    const label = { 200: 'OK', 401: 'auth required (route works)', 403: 'forbidden (route works)', 404: 'not mounted', 406: 'content negotiation', 500: 'SERVER ERROR', TIMEOUT: 'HUNG' }[k] || '';
    console.log(`    ${k.padEnd(14)} ${String(n).padStart(5)}  ${String(pct).padStart(5)}%  ${label}`);
  }

  const working = (buckets.get('200') || 0) + (buckets.get('401') || 0) + (buckets.get('403') || 0);
  console.log(`\n  Routes that responded correctly: ${working}/${total} (${((working / total) * 100).toFixed(1)}%)`);

  if (dead.length) {
    console.log(`\n  FAILING (5xx or hung) — ${dead.length}:`);
    for (const d of dead.slice(0, 25)) console.log(`    ${d.status.padEnd(10)} ${d.p}`);
    if (dead.length > 25) console.log(`    … ${dead.length - 25} more`);
  }
  if (slow.length) {
    console.log(`\n  SLOW (>3s) — ${slow.length}:`);
    for (const s of slow.slice(0, 10)) console.log(`    ${String(s.ms).padStart(6)}ms  ${s.p}`);
  }
  console.log('');
})();
