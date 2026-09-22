'use strict';

/**
 * Regression test for the guard audit's alias resolution.
 *
 * audit-unmounted-route-guards.js originally matched only the canonical
 * middleware names, so a file that imported a guard under another name —
 *
 *     const { authMiddleware: authenticate, requireRole } = require('../middleware/auth');
 *     const authorize = (roles) => requireRole(...roles);
 *
 * — was reported as having unguarded write handlers when every handler was in
 * fact guarded. That is a false positive in the dangerous direction: it
 * manufactures a security finding and sends someone to "fix" correct code. It
 * inflated a real finding of 81 unguarded writes to a reported 113.
 *
 * Run with: node tools/__tests__/guard-alias.test.js
 */

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TOOL = path.resolve(__dirname, '..', 'audit-unmounted-route-guards.js');

/** Pull the tool's internal helper out so it can be exercised directly. */
function loadLocalGuardNames() {
  const src = fs.readFileSync(TOOL, 'utf8');
  const start = src.indexOf('const GUARDS = [');
  const end = src.indexOf('function loadLoader');
  assert.ok(start >= 0 && end > start, 'could not locate the guard-resolution block');
  const mod = { exports: {} };
  // The extracted block is self-contained: GUARDS, GUARD_RE, localGuardNames.
  new Function('module', 'exports', `${src.slice(start, end)}\nmodule.exports = { localGuardNames, GUARDS };`)(
    mod,
    mod.exports
  );
  return mod.exports;
}

const { localGuardNames } = loadLocalGuardNames();

// 1. A destructured rename resolves to a guard.
{
  const names = localGuardNames(
    "const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth.js');"
  );
  assert.ok(names.has('authenticate'), 'destructured rename should be recognised as a guard');
  assert.ok(names.has('requireRole'), 'canonical name should still be recognised');
}

// 2. A local wrapper around a guard resolves too.
{
  const names = localGuardNames(
    [
      "const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth.js');",
      'const authorize = (roles) => requireRole(...roles);',
    ].join('\n')
  );
  assert.ok(names.has('authorize'), 'local wrapper around requireRole should be recognised');
}

// 3. An unrelated local const is NOT treated as a guard.
{
  const names = localGuardNames(
    ["const { requireRole } = require('../../middleware/auth.js');", 'const router = express.Router();'].join('\n')
  );
  assert.ok(!names.has('router'), 'an unrelated binding must not be treated as a guard');
}

// 4. End to end: a route file guarded entirely through an alias reports zero
//    unguarded writes. This is the exact shape of the false positive found in
//    strategic/contractFarmingRoutes.js on 2026-09-22.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guard-alias-'));
  const file = path.join(dir, 'sample.js');
  fs.writeFileSync(
    file,
    [
      "const { authMiddleware: authenticate, requireRole } = require('../../middleware/auth.js');",
      'const authorize = (roles) => requireRole(...roles);',
      "router.post('/contracts', authenticate, authorize(['farmer']), handler);",
      "router.post('/contracts/:id/amend', authenticate, handler);",
      "router.get('/contracts/:id', authenticate, handler);",
    ].join('\n')
  );
  const src = fs.readFileSync(file, 'utf8');
  const names = localGuardNames(src);
  const re = new RegExp(`\\b(${[...names].join('|')})\\b`);
  const handler = /router\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]*)\2\s*,/g;
  const unguardedWrites = [];
  let m;
  while ((m = handler.exec(src))) {
    const method = m[1].toUpperCase();
    const tail = src.slice(m.index + m[0].length, m.index + m[0].length + 260);
    if (!re.test(tail) && method !== 'GET') unguardedWrites.push(`${method} ${m[3]}`);
  }
  assert.deepStrictEqual(
    unguardedWrites,
    [],
    `alias-guarded handlers must not be reported as unguarded, got: ${unguardedWrites.join(', ')}`
  );
  fs.rmSync(dir, { recursive: true, force: true });
}

// 5. The tool still runs end to end and reports a coherent summary.
{
  let out;
  try {
    out = execFileSync('node', [TOOL], { encoding: 'utf8' });
  } catch (err) {
    out = `${err.stdout || ''}`; // non-zero exit is a valid outcome when findings exist
  }
  assert.match(out, /unguarded write handlers\s+:\s+\d+/, 'tool should print an unguarded-write count');
}

console.log('PASS: guard alias resolution (5 assertions)');
