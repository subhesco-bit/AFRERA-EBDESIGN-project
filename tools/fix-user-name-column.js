#!/usr/bin/env node
/**
 * fix-user-name-column.js — point `u.name` at a column that exists.
 *
 * 79 references across 35 services select a display name from the users table
 * (`u.name`, and `u.full_name` in a few places). The users table has no such
 * column: the name lives on user_profiles.full_name. Every one of those
 * queries fails with 'column u.name does not exist', which was the single
 * largest source of API 500s.
 *
 * user_profiles.user_id is UNIQUE, so user_profiles is a strict 1:1 vertical
 * partition of users rather than a separate entity. The companion migration
 * therefore puts full_name on users and keeps it in sync from user_profiles,
 * and this rewrites the reads to match.
 *
 * Precision matters here: the alias `u` binds to `users` 103 times but to
 * `units` 11 times, and four files contain both. A file-wide rename would
 * corrupt the units queries. So this works one SQL literal at a time and only
 * rewrites a literal that actually binds u to users.
 *
 * Usage:
 *   node tools/fix-user-name-column.js           # dry run
 *   node tools/fix-user-name-column.js --apply
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

/** Split a source file into template literals and everything else. */
function templateLiterals(src) {
  const spans = [];
  let i = 0;
  while (i < src.length) {
    const tick = src.indexOf('`', i);
    if (tick === -1) break;
    let j = tick + 1;
    while (j < src.length) {
      if (src[j] === '\\') { j += 2; continue; }
      if (src[j] === '`') break;
      j += 1;
    }
    if (j >= src.length) break;
    spans.push({ start: tick, end: j + 1, text: src.slice(tick, j + 1) });
    i = j + 1;
  }
  return spans;
}

const BINDS_USERS = /\b(?:FROM|JOIN)\s+users\s+u\b/i;
const BINDS_UNITS = /\b(?:FROM|JOIN)\s+units\s+u\b/i;
const U_NAME = /\bu\.name\b/g;

const changes = [];
const skipped = [];

for (const file of walk(BE)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/\bu\.name\b/.test(src)) continue;
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');

  let out = '';
  let cursor = 0;
  let hits = 0;
  let skips = 0;

  for (const span of templateLiterals(src)) {
    out += src.slice(cursor, span.start);
    let text = span.text;
    if (U_NAME.test(text)) {
      U_NAME.lastIndex = 0;
      if (BINDS_USERS.test(text) && !BINDS_UNITS.test(text)) {
        const n = (text.match(U_NAME) || []).length;
        text = text.replace(U_NAME, 'u.full_name');
        hits += n;
      } else {
        // Either u is units here, or the literal does not show its own FROM
        // clause (a fragment). Leave it and report it rather than guess.
        skips += (text.match(U_NAME) || []).length;
      }
    }
    out += text;
    cursor = span.end;
  }
  out += src.slice(cursor);

  // Anything outside a template literal is left alone entirely.
  const outsideHits = (src.replace(/`[\s\S]*?`/g, '').match(U_NAME) || []).length;

  if (hits) changes.push({ file, rel, hits, skips, outsideHits, out });
  else if (skips || outsideHits) skipped.push({ rel, skips, outsideHits });
}

const totalHits = changes.reduce((a, c) => a + c.hits, 0);
const totalSkips = changes.reduce((a, c) => a + c.skips, 0) + skipped.reduce((a, c) => a + c.skips, 0);
const totalOutside = changes.reduce((a, c) => a + c.outsideHits, 0) + skipped.reduce((a, c) => a + c.outsideHits, 0);

console.log('\n══════════ u.name -> u.full_name ══════════\n');
console.log(`  files to change            : ${changes.length}`);
console.log(`  occurrences rewritten      : ${totalHits}`);
console.log(`  left alone (u = units, or  : ${totalSkips}`);
console.log(`   literal has no FROM users)`);
console.log(`  outside any SQL literal    : ${totalOutside}`);
console.log(`  mode                       : ${APPLY ? 'APPLY' : 'dry run'}\n`);

for (const c of changes.slice(0, 25)) {
  console.log(`    ${String(c.hits).padStart(3)}x  ${c.rel}${c.skips ? `   (${c.skips} left alone)` : ''}`);
}
if (changes.length > 25) console.log(`    … ${changes.length - 25} more`);

if (skipped.length) {
  console.log('\n  NOT REWRITTEN — needs a human look:\n');
  for (const s of skipped.slice(0, 15)) {
    console.log(`    ${s.rel}  (${s.skips} in-literal, ${s.outsideHits} outside)`);
  }
}

if (APPLY) {
  for (const c of changes) fs.writeFileSync(c.file, c.out);
  console.log(`\n  ✓ rewrote ${totalHits} occurrences across ${changes.length} files\n`);
} else {
  console.log('\n  (dry run — re-run with --apply)\n');
}
