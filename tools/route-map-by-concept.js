#!/usr/bin/env node
/**
 * route-map-by-concept.js — which business concepts are actually mounted.
 *
 * Answers "is weather / DPR / subsidy / GPS reachable" from the server's own
 * route table rather than by guessing URLs. Guessed paths gave a string of
 * false 404s during this project; the loader derives mount paths and only it
 * knows the answer.
 *
 * Logs in and queries in one process, because access tokens live 15 minutes
 * and a token minted in a previous shell command is routinely stale by the
 * time the next one runs.
 *
 * Usage:
 *   AUDIT_EMAIL=... AUDIT_PASSWORD=... node tools/route-map-by-concept.js
 */

const http = require('http');

const PORT = Number(process.env.PORT_AUDIT || 5000);
const EMAIL = process.env.AUDIT_EMAIL || 'audit3@ebdesign.local';
const PASSWORD = process.env.AUDIT_PASSWORD || 'AuditPass123!';

/** Business concepts, as the platform's own language uses them. */
const CONCEPTS = {
  'weather / agromet': /weather|agromet|climate|forecast|monsoon/i,
  'education / training': /train|tutorial|educat|learn|course|curricul/i,
  'advisory': /advisor/i,
  'DPR / engineering': /dpr|village.?project|engineer|blueprint/i,
  'loans / credit': /loan|credit|lending|finance.?appl/i,
  'subsidy / schemes': /subsid|scheme|grant|entitle/i,
  'notification / alerts': /notif|alert|reminder/i,
  'GPS / geofence / tracking': /gps|geofenc|tracking|location|fleet|telemetr/i,
  'cold chain': /cold|temperature|reefer/i,
  'marketplace / orders': /marketplace|order|cart|checkout|listing/i,
};

function request(opts, body) {
  return new Promise((resolve) => {
    const req = http.request(opts, (res) => {
      let out = '';
      res.on('data', (c) => { out += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: out }));
    });
    req.on('error', (e) => resolve({ status: -1, body: e.message }));
    req.setTimeout(20000, () => { req.destroy(); resolve({ status: 0, body: 'timeout' }); });
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const creds = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const login = await request({
    host: '127.0.0.1', port: PORT, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(creds) },
  }, creds);

  if (login.status === 429) {
    console.error('\n  Login rate-limited (5 requests / 60s brute-force limiter). Wait a minute.\n');
    process.exit(1);
  }
  let token = '';
  try {
    const d = JSON.parse(login.body).data || {};
    token = d.access_token || d.token || '';
  } catch { /* handled below */ }
  if (!token) {
    console.error(`\n  Login failed (${login.status}): ${login.body.slice(0, 160)}\n`);
    process.exit(1);
  }

  const table = await request({
    host: '127.0.0.1', port: PORT, path: '/api/v1/system/routes?limit=1000', method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const parsed = JSON.parse(table.body);
  const routes = (parsed.data || parsed).routes || [];

  console.log('\n══════════ MOUNTED ROUTES BY BUSINESS CONCEPT ══════════\n');
  console.log(`  total mounted: ${routes.length}\n`);

  const seen = new Set();
  for (const [name, re] of Object.entries(CONCEPTS)) {
    const hits = routes.filter((r) => re.test(r.name) || re.test(r.path));
    hits.forEach((h) => seen.add(h.path));
    console.log(`  ${name.padEnd(28)} ${String(hits.length).padStart(3)} mounted`);
    for (const h of hits.slice(0, 8)) console.log(`        ${h.path}`);
    if (hits.length > 8) console.log(`        … ${hits.length - 8} more`);
    console.log('');
  }

  console.log(`  routes matching no concept above: ${routes.length - seen.size}`);
  console.log('');
})();
