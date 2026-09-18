#!/usr/bin/env node
/**
 * bisect-middleware.js — find which global middleware stops a request.
 *
 * A middleware that neither responds nor calls next() hangs the request with
 * no error anywhere. Reading the code does not always reveal it (a promise
 * that rejects silently, a conditional branch with no exit). This mounts the
 * real middleware chain one layer at a time on a bare Express app and issues a
 * request after each addition, reporting the first layer that fails to pass it
 * through.
 *
 * Usage: node tools/bisect-middleware.js
 */

const path = require('path');
const http = require('http');

const BACKEND = path.join(__dirname, '..', 'backend');
const SRC = path.join(BACKEND, 'src');
require(path.join(BACKEND, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND, '.env') });

const express = require(path.join(BACKEND, 'node_modules', 'express'));

// The global chain from index.js, in order. `factory: true` means call it.
const CHAIN = [
  { name: 'correlationId', mod: './middleware/apiResponseStandardizer', key: 'correlationId', factory: true },
  { name: 'contentNegotiation', mod: './middleware/apiResponseStandardizer', key: 'contentNegotiation', factory: true },
  { name: 'addStandardHeaders', mod: './middleware/apiResponseStandardizer', key: 'addStandardHeaders', factory: true },
  { name: 'trackResponseTime', mod: './middleware/apiResponseStandardizer', key: 'trackResponseTime', factory: true },
  { name: 'requestId', mod: './middleware/requestId', key: 'requestId' },
  { name: 'responseFormatter', mod: './middleware/responseFormatter', key: 'responseFormatter' },
  { name: 'routeMonitoring', mod: './middleware/routeMonitoring', key: 'routeMonitoring' },
  { name: 'securityHeaders', mod: './middleware/securityMiddleware', key: 'securityHeaders' },
  { name: 'rateLimit', mod: './middleware/securityMiddleware', key: 'rateLimit', factory: true },
];

function probe(port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/__probe', timeout: timeoutMs }, (res) => {
      res.resume();
      res.on('end', () => resolve({ ok: true, status: res.statusCode }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, why: 'HUNG (no response)' }); });
    req.on('error', (e) => resolve({ ok: false, why: e.message }));
  });
}

(async () => {
  console.log('\n══════════ MIDDLEWARE CHAIN BISECT ══════════\n');
  const mounted = [];

  for (let i = 0; i < CHAIN.length; i++) {
    const spec = CHAIN[i];
    let mw;
    try {
      const mod = require(path.resolve(SRC, spec.mod));
      const v = spec.key ? mod[spec.key] : mod;
      mw = spec.factory ? v() : v;
      if (typeof mw !== 'function') {
        console.log(`  ${String(i + 1).padStart(2)}. ${spec.name.padEnd(22)} SKIPPED — resolves to ${typeof v}`);
        continue;
      }
    } catch (e) {
      console.log(`  ${String(i + 1).padStart(2)}. ${spec.name.padEnd(22)} LOAD FAILED — ${e.message.split('\n')[0]}`);
      continue;
    }

    mounted.push({ name: spec.name, mw });

    const app = express();
    for (const m of mounted) app.use(m.mw);
    app.get('/__probe', (req, res) => res.json({ ok: true }));

    const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
    const port = server.address().port;
    const result = await probe(port);
    await new Promise((r) => server.close(r));

    if (result.ok) {
      console.log(`  ${String(i + 1).padStart(2)}. ${spec.name.padEnd(22)} pass (${result.status})`);
    } else {
      console.log(`  ${String(i + 1).padStart(2)}. ${spec.name.padEnd(22)} >>> ${result.why} <<<`);
      console.log(`\n  First blocking layer: ${spec.name}  (${spec.mod})`);
      console.log('  Every request reaching this layer stops here.\n');
      process.exit(0);
    }
  }

  console.log('\n  Whole global chain passes a request through.');
  console.log('  The hang is therefore in a route-level layer, not the global chain.\n');
  process.exit(0);
})();
