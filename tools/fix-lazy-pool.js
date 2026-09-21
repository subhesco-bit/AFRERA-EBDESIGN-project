#!/usr/bin/env node
/**
 * fix-lazy-pool.js — stop services caching a null database pool.
 *
 * `getPostgreSQL()` returns null until the shared pool is initialised. Several
 * module services do `this.pool = await getPostgreSQL()` during their own
 * init, which can run first — so they cache null and every later
 * `this.pool.query(...)` throws "Cannot read properties of null" for the rest
 * of the process lifetime.
 *
 * Replaces that assignment with a lazy accessor that re-resolves the shared
 * pool on each read. The pool's lifecycle belongs to database/connection.js,
 * so assignments from module shutdown paths are ignored rather than clobbering
 * the accessor.
 *
 * Usage:
 *   node tools/fix-lazy-pool.js           # dry run
 *   node tools/fix-lazy-pool.js --apply
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'backend', 'src');
const APPLY = process.argv.includes('--apply');

const ASSIGN = /^([ \t]*)this\.pool\s*=\s*(?:await\s+)?getPostgreSQL\(\)\s*;[ \t]*$/m;

const REPLACEMENT = (indent) => [
  `${indent}// Resolve the shared pool on each read. getPostgreSQL() returns null`,
  `${indent}// until database/connection.js has initialised it, and module init can`,
  `${indent}// run first — caching that null left every query dereferencing null for`,
  `${indent}// the life of the process.`,
  `${indent}Object.defineProperty(this, 'pool', {`,
  `${indent}  configurable: true,`,
  `${indent}  get: () => getPostgreSQL(),`,
  `${indent}  set: () => {}, // connection.js owns the pool lifecycle`,
  `${indent}});`,
].join('\n');

const files = [];
(function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git'].includes(e.name)) walk(abs);
    } else if (e.isFile() && e.name.endsWith('.js')) {
      files.push(abs);
    }
  }
})(SRC);

const changed = [];
const skipped = [];

for (const f of files) {
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
  // Handle both the original assignment and a file already half-converted,
  // where only the constructor's `this.pool = null` declaration remains.
  const hasAssign = ASSIGN.test(text);
  const halfDone = text.includes("defineProperty(this, 'pool'") && /^[ \t]*this\.pool\s*=\s*null\s*;[ \t]*$/m.test(text);
  if (!hasAssign && !halfDone) continue;

  // Only safe when the file imports getPostgreSQL itself.
  if (!/getPostgreSQL/.test(text.split('\n').slice(0, 40).join('\n'))) {
    skipped.push({ f, why: 'getPostgreSQL not imported near top' });
    continue;
  }

  let out = text.replace(new RegExp(ASSIGN.source, 'gm'), (_m, indent) => REPLACEMENT(indent));

  // The accessor must also be installed where the field is first declared. A
  // service whose initialize() is never called (several routes only require
  // the module) would otherwise keep the constructor's null forever. The
  // accessor's no-op setter makes any later `this.pool = null` harmless, so
  // only the first declaration needs replacing.
  const DECL = /^([ \t]*)this\.pool\s*=\s*null\s*;[ \t]*$/m;
  if (DECL.test(out)) {
    out = out.replace(DECL, (_m, indent) => REPLACEMENT(indent));
  }

  if (out === text) { skipped.push({ f, why: 'no substitution made' }); continue; }
  changed.push({ f, out });
}

const rel = (p) => path.relative(path.join(__dirname, '..'), p).replace(/\\/g, '/');

console.log('\n══════════ LAZY POOL FIX ══════════\n');
console.log(`  files scanned : ${files.length}`);
console.log(`  to change     : ${changed.length}`);
console.log(`  skipped       : ${skipped.length}`);
console.log(`  mode          : ${APPLY ? 'APPLY' : 'dry run'}\n`);

for (const c of changed) console.log(`    ${rel(c.f)}`);
for (const s of skipped) console.log(`    SKIP ${rel(s.f)} — ${s.why}`);

if (APPLY) {
  for (const c of changed) fs.writeFileSync(c.f, c.out);
  console.log(`\n  ✓ rewrote ${changed.length} files\n`);
} else {
  console.log('\n  (dry run — re-run with --apply)\n');
}
