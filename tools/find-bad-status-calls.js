#!/usr/bin/env node
/**
 * find-bad-status-calls.js — res.status() called with something that is not a
 * status code.
 *
 * Express passes the value straight to writeHead, which throws
 * ERR_HTTP_INVALID_STATUS_CODE. That throw happens while the response is being
 * written, outside any route try/catch, so it reaches the top and kills the
 * process. One bad error path is enough to take the server down — this is what
 * crashed it on /api/v1/.../subsidy-programs with
 * "Invalid status code: Failed to retrieve subsidy programs".
 *
 * Reports two shapes:
 *   LITERAL  res.status('some string')      — certainly broken
 *   RISKY    res.status(someIdentifier)     — broken whenever that value is
 *            not a number; flagged when the name suggests a message or error
 *
 * Usage:
 *   node tools/find-bad-status-calls.js
 *   node tools/find-bad-status-calls.js --apply   # wrap RISKY in a numeric guard
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const APPLY = process.argv.includes('--apply');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '__tests__'].includes(e.name)) walk(abs, out);
    } else if (e.isFile() && e.name.endsWith('.js')) out.push(abs);
  }
  return out;
}

// res.status( <arg> )  — capture a single simple argument
const STATUS_RE = /\bres\s*\.\s*status\s*\(\s*([^()]*?)\s*\)/g;
/** Identifier names that clearly hold a message rather than a code. */
const MESSAGEY = /(message|msg|error|err|reason|text|detail|description|title)$/i;

const literals = [];
const risky = [];

for (const file of walk(BE)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('res.status')) continue;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  STATUS_RE.lastIndex = 0;
  let m;
  while ((m = STATUS_RE.exec(src)) !== null) {
    const arg = m[1].trim();
    if (!arg) continue;
    const line = src.slice(0, m.index).split('\n').length;

    if (/^\d{3}$/.test(arg)) continue;                    // fine
    if (/^['"`]/.test(arg)) { literals.push({ rel, line, arg }); continue; }
    if (/^\d/.test(arg)) continue;                        // numeric expression
    // An identifier or member expression.
    const bare = arg.replace(/\?\?.*$/, '').trim();
    if (MESSAGEY.test(bare.split('.').pop() || '')) risky.push({ rel, line, arg });
  }
}

console.log('\n══════════ res.status() ARGUMENT CHECK ══════════\n');
console.log(`  LITERAL string status (certainly broken) : ${literals.length}`);
console.log(`  RISKY message-shaped identifier          : ${risky.length}\n`);

if (literals.length) {
  console.log('  LITERAL — res.status() given a string:\n');
  for (const l of literals.slice(0, 40)) {
    console.log(`    ${l.rel}:${l.line}   res.status(${l.arg.slice(0, 70)})`);
  }
  if (literals.length > 40) console.log(`    … ${literals.length - 40} more`);
}

if (risky.length) {
  console.log('\n  RISKY — identifier whose name suggests a message:\n');
  for (const r of risky.slice(0, 40)) {
    console.log(`    ${r.rel}:${r.line}   res.status(${r.arg.slice(0, 70)})`);
  }
  if (risky.length > 40) console.log(`    … ${risky.length - 40} more`);
}

if (!literals.length && !risky.length) {
  console.log('  No res.status() call passes an obviously non-numeric argument.');
  console.log('  A value can still be wrong at runtime — see the middleware guard.\n');
}
console.log('');

if (APPLY) {
  console.log('  --apply is intentionally a no-op for these call sites.\n');
  console.log('  Rewriting hundreds of call sites is riskier than one guard in the');
  console.log('  response pipeline that coerces a non-numeric status to 500 and logs');
  console.log('  the offender. See middleware/apiResponseStandardizer.js.\n');
}
