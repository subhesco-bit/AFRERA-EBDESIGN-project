#!/usr/bin/env node
/**
 * route-reachability-audit.js — what is actually mounted, and does it answer?
 *
 * Two earlier versions of this tool were wrong, in instructive ways:
 *
 *  1. Reading index.js. index.js is NOT the mounting source of truth —
 *     core/dynamicRouteLoader.js discovers backend/src/routes/** at boot and
 *     mounts each module at a derived path. That version reported 383 orphan
 *     files / 2,391 unreachable endpoints; all of them were live.
 *
 *  2. Probing derived paths WITHOUT a token. The global auth guard answers 401
 *     before routing, so every path looked mounted. That version reported 100%
 *     reachable.
 *
 * So this asks the server for its own route table (/api/v1/system/routes,
 * admin-only), then probes each real mount path WITH an admin token. A 404
 * there is genuine: the prefix is mounted but has no handler for that method
 * and path.
 *
 * Usage:
 *   AUDIT_TOKEN=<admin jwt> node tools/route-reachability-audit.js [--port 5000] [--json <out>]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const ROUTES_DIR = path.join(ROOT, 'backend', 'src', 'routes');
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i === -1 ? d : process.argv[i + 1];
};
const PORT = Number(arg('--port', 5000));
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;
let TOKEN = process.env.AUDIT_TOKEN || '';
const CONCURRENCY = 10;

// Access tokens live 15 minutes and a full probe of ~1,300 endpoints takes
// longer than that, so a run started with one token dies halfway through with
// every remaining request reporting 401. Given credentials, the tool mints its
// own token and re-mints on expiry.
const AUDIT_EMAIL = process.env.AUDIT_EMAIL || '';
const AUDIT_PASSWORD = process.env.AUDIT_PASSWORD || '';

function login() {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: AUDIT_EMAIL, password: AUDIT_PASSWORD });
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        timeout: 15000,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        let out = '';
        res.on('data', (c) => { out += c; });
        res.on('end', () => {
          try {
            const d = JSON.parse(out).data || {};
            resolve(d.access_token || d.token || '');
          } catch { resolve(''); }
        });
      },
    );
    req.on('timeout', () => { req.destroy(); resolve(''); });
    req.on('error', () => resolve(''));
    req.end(body);
  });
}

function get(p) {
  return new Promise((resolve) => {
    const headers = { Accept: 'application/json' };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    const req = http.get({ host: '127.0.0.1', port: PORT, path: p, timeout: 8000, headers }, (res) => {
      let body = '';
      res.on('data', (c) => { if (body.length < 400000) body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0 }); });
    req.on('error', (e) => resolve({ status: -1, why: e.code }));
  });
}

const ENDPOINT_RE = /\brouter\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]*)/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '__tests__'].includes(e.name)) walk(abs, out);
    } else if (e.isFile() && e.name.endsWith('.js')) out.push(abs);
  }
  return out;
}

(async () => {
  console.log('\n══════════ ROUTE REACHABILITY ══════════\n');

  if (!TOKEN && AUDIT_EMAIL && AUDIT_PASSWORD) TOKEN = await login();
  if (!TOKEN) {
    console.error('  AUDIT_TOKEN is not set. Without an admin token the global auth guard');
    console.error('  answers 401 before routing and every path looks mounted. Aborting.\n');
    process.exit(1);
  }

  const health = await get('/health');
  if (health.status !== 200) {
    console.error(`  Server not answering on :${PORT} (/health -> ${health.status}).\n`);
    process.exit(1);
  }

  // Page through the whole table — the endpoint caps a page at 1000 and the
  // default page is 100, so a single unpaged call silently truncates.
  const mounted = [];
  let offset = 0;
  let declaredTotal = null;
  for (;;) {
    const table = await get(`/api/v1/system/routes?limit=1000&offset=${offset}`);
    if (table.status !== 200) {
      console.error(`  /api/v1/system/routes -> ${table.status}. An ADMIN token is required.\n`);
      process.exit(1);
    }
    const parsed = JSON.parse(table.body);
    const d = parsed.data || parsed;
    const page = d.routes || [];
    if (declaredTotal === null) declaredTotal = d.total ?? page.length;
    mounted.push(...page);
    if (!page.length || mounted.length >= declaredTotal || d.hasMore === false) break;
    offset += page.length;
  }
  console.log(`  routes mounted (per server) : ${mounted.length}${declaredTotal !== null && mounted.length !== declaredTotal ? ` of ${declaredTotal} reported` : ''}`);

  // What is on disk, and how many endpoints does each module declare?
  const files = walk(ROUTES_DIR).map((f) => {
    const src = fs.readFileSync(f, 'utf8');
    const eps = [];
    ENDPOINT_RE.lastIndex = 0;
    let m;
    while ((m = ENDPOINT_RE.exec(src)) !== null) eps.push({ method: m[1].toUpperCase(), sub: m[2] || '/' });
    return { rel: path.relative(ROOT, f).replace(/\\/g, '/'), name: path.basename(f, '.js'), eps };
  });
  const totalEndpoints = files.reduce((a, f) => a + f.eps.length, 0);
  console.log(`  route files on disk         : ${files.length}`);
  console.log(`  endpoints declared          : ${totalEndpoints}`);

  const mountedByName = new Map(mounted.map((r) => [r.name, r.path]));
  const notMounted = files.filter((f) => !mountedByName.has(f.name));
  console.log(`  files with no mount entry   : ${notMounted.length}  (${notMounted.reduce((a, f) => a + f.eps.length, 0)} endpoints)`);

  // Probe every mounted prefix's GET endpoints that take no path parameter.
  const targets = [];
  for (const f of files) {
    const base = mountedByName.get(f.name);
    if (!base) continue;
    for (const e of f.eps) {
      if (e.method !== 'GET') continue;
      if (e.sub.includes(':') || e.sub.includes('*')) continue;
      const full = (base + (e.sub === '/' ? '' : e.sub)).replace(/\/+$/, '') || base;
      targets.push({ file: f.rel, path: full });
    }
  }
  const uniq = [...new Map(targets.map((t) => [t.path, t])).values()];
  console.log(`  parameterless GET endpoints : ${uniq.length}  (probing all)\n`);

  const results = [];
  let done = 0;
  const queue = [...uniq];
  async function worker() {
    for (;;) {
      const t = queue.shift();
      if (!t) return;
      let r = await get(t.path);
      // A 401 mid-run means the token aged out, not that the route is
      // protected differently — re-mint once and retry before recording.
      if (r.status === 401 && AUDIT_EMAIL && AUDIT_PASSWORD) {
        const fresh = await login();
        if (fresh) {
          TOKEN = fresh;
          r = await get(t.path);
        }
      }
      results.push({ ...t, status: r.status });
      if (++done % 100 === 0) process.stderr.write(`  …${done}/${uniq.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const buckets = new Map();
  for (const r of results) buckets.set(r.status, (buckets.get(r.status) || 0) + 1);
  const label = {
    200: 'OK', 201: 'created', 400: 'bad request (route works)', 401: 'auth', 403: 'forbidden',
    404: 'NOT FOUND', 500: 'SERVER ERROR', 0: 'TIMEOUT', '-1': 'connection error',
  };
  console.log('  PROBE RESULTS\n');
  for (const [s, n] of [...buckets].sort((a, b) => a[0] - b[0])) {
    const pc = ((n / results.length) * 100).toFixed(1);
    console.log(`    ${String(s).padEnd(6)} ${String(n).padStart(5)}  ${String(pc).padStart(5)}%  ${label[s] || ''}`);
  }
  const working = results.filter((r) => r.status > 0 && r.status !== 404 && r.status < 500).length;
  console.log(`\n  Endpoints that answered correctly: ${working}/${results.length} (${Math.round((working / results.length) * 100)}%)`);

  const failing = results.filter((r) => r.status >= 500 || r.status === 0);
  if (failing.length) {
    console.log(`\n  FAILING (5xx or hung) — ${failing.length}\n`);
    for (const f of failing.slice(0, 25)) console.log(`    ${String(f.status).padEnd(5)} ${f.path}`);
    if (failing.length > 25) console.log(`    … ${failing.length - 25} more`);
  }

  const missing = results.filter((r) => r.status === 404);
  if (missing.length) {
    console.log(`\n  404 — mounted prefix, no handler at that path — ${missing.length}\n`);
    for (const f of missing.slice(0, 20)) console.log(`    ${f.path}`);
    if (missing.length > 20) console.log(`    … ${missing.length - 20} more`);
  }

  if (notMounted.length) {
    console.log(`\n  ROUTE FILES WITH NO MOUNT ENTRY — ${notMounted.length}\n`);
    for (const f of notMounted.filter((x) => x.eps.length).sort((a, b) => b.eps.length - a.eps.length).slice(0, 20)) {
      console.log(`    ${String(f.eps.length).padStart(3)} ep  ${f.rel}`);
    }
  }
  console.log('');

  if (JSON_OUT) {
    fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
    fs.writeFileSync(JSON_OUT, JSON.stringify({ mountedCount: mounted.length, results, notMounted }, null, 2));
    console.log(`  json -> ${path.relative(ROOT, JSON_OUT)}\n`);
  }
})();
