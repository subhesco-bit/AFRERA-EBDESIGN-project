#!/usr/bin/env node
/**
 * Single-pass repository completion gate.
 *
 * Order is deliberate:
 *   1. Complete repository re-audit
 *   2. AI backbone/enhancement verification
 *   3. Production lint + tests
 *   4. Final complete re-audit
 *
 * This orchestrates verification without rewriting application business logic.
 */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, args) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(npm, args, { cwd: ROOT, stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    console.error(`FAILED: ${label}`);
    process.exit(result.status || 1);
  }
}

run('PHASE 1 — COMPLETE RE-AUDIT', ['run', 'audit:complete']);
run('PHASE 2 — AI ENHANCEMENT / BACKBONE VERIFICATION', ['test', '--', 'src/core/ai/aiBackboneRuntime.test.js', '--runInBand']);
run('PHASE 3 — PRODUCTION HARDENING', ['run', 'lint']);
run('PHASE 3 — FULL TEST SUITE', ['test', '--', '--runInBand']);
run('PHASE 4 — FINAL RE-AUDIT', ['run', 'audit:complete']);

console.log('\nCOMPLETE PASS FINISHED. Review .audit/production-re-audit/SUMMARY.json and GAP_REGISTER.json.');
