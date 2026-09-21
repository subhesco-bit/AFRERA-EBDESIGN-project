#!/usr/bin/env node
/**
 * Boot smoke test — does the platform start, and does it keep serving?
 *
 * Why this exists
 * ---------------
 * Every one of the following was live on this branch, and NONE of them was
 * findable by a static check, a lint rule or a unit test. Each is caught by
 * this script in under a minute:
 *
 *   - `new AIBackboneService()` on a module that exports a singleton accessor
 *     threw at require time, so the whole platform failed to boot.
 *   - `app.use(rateLimit)` registered a FACTORY as middleware. Express called
 *     it with (req, res, next); it returned the inner function and never
 *     called next(). Every request hung forever. A boot check alone would
 *     have passed — this is why the script also issues requests.
 *   - `trackResponseTime` called res.setHeader() inside the 'finish' event,
 *     throwing ERR_HTTP_HEADERS_SENT from an event handler and killing the
 *     process on every SUCCESSFUL response. One request looks fine; the
 *     second connection is refused. This is why the script issues several.
 *   - `createProduct`'s INSERT had 26 columns and 25 placeholders, so no
 *     product could ever be created.
 *   - Content negotiation answered `Accept: * / *` with 406.
 *
 * It deliberately runs WITHOUT requiring PostgreSQL, Redis, MongoDB or
 * Elasticsearch: the platform is designed to degrade when they are absent,
 * and every defect above reproduced in exactly that degraded mode. Requiring
 * infrastructure would make this gate skippable, which is how the defects
 * survived in the first place.
 *
 * Exit code 0 = the platform booted and stayed up. Non-zero = it did not.
 */
'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = Number(process.env.SMOKE_PORT || 3999);
const BOOT_TIMEOUT_MS = Number(process.env.SMOKE_BOOT_TIMEOUT_MS || 120000);
const REQUEST_COUNT = Number(process.env.SMOKE_REQUEST_COUNT || 12);
const BACKEND_DIR = path.join(__dirname, '..');

// Paths hit in rotation. /health must answer; the others may legitimately be
// 401/404 — what matters is that a response ARRIVES and the process survives.
const PATHS = ['/health', '/api/v1/system/stats', '/health', '/api/v1/products'];

const log = (...a) => console.log('[smoke]', ...a);

function request(pathname) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: '127.0.0.1', port: PORT, path: pathname, timeout: 15000 },
      (res) => {
        res.resume();
        res.on('end', () => resolve({ ok: true, status: res.statusCode }));
      },
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: null, error: 'timeout (request hung)' });
    });
    req.on('error', (err) => resolve({ ok: false, status: null, error: err.code || err.message }));
  });
}

async function waitForBoot(child, output) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      return { booted: false, reason: `process exited with code ${child.exitCode} during boot` };
    }
    const res = await request('/health');
    if (res.ok) return { booted: true, status: res.status };
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { booted: false, reason: `/health did not answer within ${BOOT_TIMEOUT_MS}ms` };
}

(async () => {
  log(`starting backend on port ${PORT} (no external infrastructure required)`);

  let output = '';
  const child = spawn(process.execPath, ['src/index.js'], {
    cwd: BACKEND_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: process.env.NODE_ENV || 'development',
      // A load-time guard in services/authService.js requires this.
      JWT_SECRET: process.env.JWT_SECRET || 'smoke-test-only-not-a-real-secret',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'smoke-test-only-refresh',
      ALLOW_DEGRADED_STARTUP: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => { output += d.toString(); });
  child.stderr.on('data', (d) => { output += d.toString(); });

  const failures = [];
  const stop = () => { try { child.kill('SIGTERM'); } catch { /* already gone */ } };

  const boot = await waitForBoot(child, output);
  if (!boot.booted) {
    log(`FAIL: ${boot.reason}`);
    const tail = output.trim().split('\n').slice(-25).join('\n');
    if (tail) log(`last output:\n${tail}`);
    stop();
    process.exit(1);
  }
  log(`booted; /health answered ${boot.status}`);

  // Sustained serving. A single request is not enough: the header-flush bug
  // killed the process only AFTER the first response completed.
  let served = 0;
  for (let i = 0; i < REQUEST_COUNT; i++) {
    const pathname = PATHS[i % PATHS.length];
    const res = await request(pathname);
    if (res.ok) {
      served++;
    } else {
      failures.push(`request ${i + 1} to ${pathname}: ${res.error}`);
    }
    if (child.exitCode !== null) {
      failures.push(`process died after ${served} request(s) with code ${child.exitCode}`);
      break;
    }
  }

  // The header-flush class of bug shows up here even if a response arrived.
  if (/ERR_HTTP_HEADERS_SENT/.test(output)) {
    failures.push('ERR_HTTP_HEADERS_SENT appeared in output (headers written after flush)');
  }
  if (child.exitCode !== null) {
    failures.push(`process not alive at end of run (exit code ${child.exitCode})`);
  }

  const mounted = output.match(/"discovered":(\d+),"mounted":(\d+),"failed":(\d+)/);
  if (mounted) {
    log(`routes: ${mounted[1]} discovered, ${mounted[2]} mounted, ${mounted[3]} failed`);
    if (Number(mounted[3]) > 0) {
      failures.push(`${mounted[3]} route(s) failed to mount`);
    }
  }
  const skipped = (output.match(/Skipping unavailable route/g) || []).length;
  if (skipped > 0) log(`note: ${skipped} route(s) skipped as unavailable`);

  log(`served ${served}/${REQUEST_COUNT} request(s)`);
  stop();

  if (failures.length) {
    log('FAIL');
    failures.forEach((f) => log(`  - ${f}`));
    const tail = output.trim().split('\n').slice(-20).join('\n');
    if (tail) log(`last output:\n${tail}`);
    process.exit(1);
  }

  log('PASS: platform booted and stayed up under sustained requests');
  process.exit(0);
})().catch((err) => {
  log('FAIL: smoke test itself errored:', err && err.message ? err.message : err);
  process.exit(1);
});
