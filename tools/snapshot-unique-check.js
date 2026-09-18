#!/usr/bin/env node
/**
 * snapshot-unique-check.js — prove (or disprove) that the snapshot folders
 * hold nothing the live tree does not.
 *
 * Before deleting ~2.4 GB of copies, each file is tested two ways:
 *   1. does its exact content (sha256) exist somewhere in the live tree?
 *   2. does a file exist at the equivalent live path?
 *
 * A file failing BOTH is genuinely unique and must be harvested, never
 * deleted. A file failing only (1) is an older version of something that still
 * exists — redundant, but listed so the difference is a decision, not an
 * assumption.
 *
 * Reads content from disk rather than the inventory database, so it reflects
 * the tree as it is now, not as it was when last scanned.
 *
 * Usage: node tools/snapshot-unique-check.js [--out <dir>]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : null;

const SNAPSHOTS = ['_ACTIVE_PROJECT', '_UNIFIED_PROJECT', '_MERGE_LAB', 'New folder'];
const SKIP = new Set(['node_modules', '.git', '.vs', '__pycache__', 'dist', 'build', 'coverage']);

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(abs, out);
    } else if (e.isFile()) {
      out.push(abs);
    }
  }
  return out;
}

const sha = (f) => {
  try { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); } catch { return null; }
};

// ---- index the live tree -------------------------------------------------

process.stderr.write('Indexing live tree…\n');
const liveDirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !SNAPSHOTS.includes(e.name) && !SKIP.has(e.name))
  .map((e) => path.join(ROOT, e.name));

const liveHashes = new Set();
const livePaths = new Set();
let liveCount = 0;
for (const d of liveDirs) {
  for (const f of walk(d)) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    livePaths.add(rel);
    const h = sha(f);
    if (h) liveHashes.add(h);
    if (++liveCount % 5000 === 0) process.stderr.write(`  live ${liveCount}\n`);
  }
}
// root-level files too
for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!e.isFile()) continue;
  const f = path.join(ROOT, e.name);
  livePaths.add(e.name);
  const h = sha(f);
  if (h) liveHashes.add(h);
  liveCount++;
}
process.stderr.write(`  live tree: ${liveCount} files, ${liveHashes.size} distinct contents\n`);

/** Strip a snapshot's own wrapper directories to get the equivalent live path. */
function livePathFor(rel) {
  let p = rel;
  for (const s of SNAPSHOTS) {
    if (p.startsWith(`${s}/`)) { p = p.slice(s.length + 1); break; }
  }
  // _ACTIVE_PROJECT/current/... and _UNIFIED_PROJECT/current/... mirror the root
  if (p.startsWith('current/')) p = p.slice('current/'.length);
  return p;
}

// ---- test each snapshot file --------------------------------------------

const unique = [];
const olderVersion = [];
let redundant = 0;
let bytesRedundant = 0;
let checked = 0;

for (const s of SNAPSHOTS) {
  const dir = path.join(ROOT, s);
  if (!fs.existsSync(dir)) continue;
  process.stderr.write(`Checking ${s}…\n`);
  for (const f of walk(dir)) {
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const h = sha(f);
    let size = 0;
    try { size = fs.statSync(f).size; } catch { /* vanished */ }

    const contentExists = h && liveHashes.has(h);
    const counterpart = livePathFor(rel);
    const pathExists = livePaths.has(counterpart);

    if (contentExists) { redundant++; bytesRedundant += size; }
    else if (pathExists) olderVersion.push({ rel, counterpart, size });
    else unique.push({ rel, size });

    if (++checked % 5000 === 0) process.stderr.write(`  ${checked}\n`);
  }
}

const mb = (b) => `${(b / 1048576).toFixed(0)} MB`;

console.log('\n══════════ SNAPSHOT UNIQUENESS CHECK ══════════\n');
console.log(`  snapshot files checked : ${checked.toLocaleString()}`);
console.log(`  exact copy in live tree: ${redundant.toLocaleString()}  (${mb(bytesRedundant)}) — safe to delete`);
console.log(`  older version of a live file: ${olderVersion.length.toLocaleString()}  (${mb(olderVersion.reduce((a, b) => a + b.size, 0))})`);
console.log(`  GENUINELY UNIQUE       : ${unique.length.toLocaleString()}  (${mb(unique.reduce((a, b) => a + b.size, 0))})\n`);

if (unique.length) {
  console.log('  Unique files — no live counterpart by content or path:');
  const byExt = new Map();
  for (const u of unique) {
    const e = path.extname(u.rel).toLowerCase() || '(none)';
    byExt.set(e, (byExt.get(e) || 0) + 1);
  }
  for (const [e, n] of [...byExt].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`    ${String(n).padStart(6)}  ${e}`);
  }
  console.log('\n  Largest unique files:');
  for (const u of [...unique].sort((a, b) => b.size - a.size).slice(0, 20)) {
    console.log(`    ${String((u.size / 1024).toFixed(0)).padStart(8)} KB  ${u.rel}`);
  }
}

if (OUT) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'snapshot-unique.json'), JSON.stringify({ unique, olderVersion }, null, 2));
  console.log(`\n  Wrote manifest to ${path.relative(ROOT, path.join(OUT, 'snapshot-unique.json'))}`);
}
console.log('');
