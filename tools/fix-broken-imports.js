#!/usr/bin/env node
/**
 * fix-broken-imports.js — repoint relative imports that no longer resolve.
 *
 * The repo has been reorganised several times; files moved into subfolders kept
 * relative specifiers written for their old depth. This walks the tree, finds
 * every relative require/import that does not resolve, and rewrites it to the
 * real file — but ONLY when exactly one candidate matches. Ambiguous and
 * unresolvable cases are reported, never guessed.
 *
 * Usage:
 *   node tools/fix-broken-imports.js            # dry run, prints the plan
 *   node tools/fix-broken-imports.js --apply    # write the changes
 *   node tools/fix-broken-imports.js --scope backend/src
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SCOPE = process.argv.includes('--scope')
  ? process.argv[process.argv.indexOf('--scope') + 1]
  : 'backend/src';

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.vs', '__pycache__', 'dist', 'build', 'coverage',
  '_ACTIVE_PROJECT', '_UNIFIED_PROJECT', '_MERGE_LAB', 'New folder',
]);
const EXT = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json'];
const CODE_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

// ------------------------------------------------------------------ index

/** Every real file, indexed by basename-without-extension, for candidate lookup. */
const byBase = new Map();
const allFiles = [];

function index(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) index(abs);
      continue;
    }
    if (!e.isFile()) continue;
    const ext = path.extname(e.name);
    if (!EXT.includes(ext)) continue;
    allFiles.push(abs);
    const base = path.basename(e.name, ext);
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(abs);
  }
}

/** Resolve a specifier the way Node would. Returns absolute path or null. */
function resolveFrom(fromAbs, spec) {
  const target = path.resolve(path.dirname(fromAbs), spec);
  const tries = [target, ...EXT.map((e) => target + e), ...EXT.map((e) => path.join(target, 'index' + e))];
  for (const t of tries) {
    try { if (fs.statSync(t).isFile()) return t; } catch { /* next */ }
  }
  return null;
}

/** Turn an absolute target into a relative specifier from a source file. */
function toSpec(fromAbs, targetAbs) {
  let rel = path.relative(path.dirname(fromAbs), targetAbs).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  // Node resolves extensionless CommonJS; keep the written form idiomatic.
  return rel.replace(/\.(js|jsx|ts|tsx|mjs|cjs)$/, (m) => (m === '.json' ? m : ''));
}

// ------------------------------------------------------------------ scan

const SPEC_RE = /(\brequire\(\s*|\bfrom\s+|\bimport\(\s*)(['"])(\.[^'"]*)\2/g;

const fixes = [];      // { file, spec, replacement, reason }
const ambiguous = [];  // { file, spec, candidates }
const unresolved = []; // { file, spec }
const crossTree = [];  // { file, spec } — basename matches only across a tree boundary

/** Which top-level tree a file belongs to. Repairs must stay inside one. */
function treeOf(abs) {
  const r = path.relative(ROOT, abs).replace(/\\/g, '/');
  if (r.startsWith('backend/')) return 'backend';
  if (r.startsWith('frontend/')) return 'frontend';
  return 'other';
}
function sameTree(a, b) {
  const ta = treeOf(a);
  const tb = treeOf(b);
  if (ta === 'other' || tb === 'other') return true;
  return ta === tb;
}

function scan(fileAbs) {
  const ext = path.extname(fileAbs);
  if (!CODE_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(fileAbs, 'utf8'); } catch { return; }
  if (!src.includes('require(') && !src.includes('import')) return;

  SPEC_RE.lastIndex = 0;
  let m;
  const seen = new Set();
  while ((m = SPEC_RE.exec(src)) !== null) {
    const spec = m[3];
    if (seen.has(spec)) continue;
    seen.add(spec);
    if (resolveFrom(fileAbs, spec)) continue; // already fine

    // An unexpanded template literal is a generator bug, not a path problem.
    if (spec.includes('${')) {
      unresolved.push({ file: fileAbs, spec, note: 'unexpanded template literal (generator bug)' });
      continue;
    }

    const wanted = path.basename(spec).replace(/\.(js|jsx|ts|tsx|mjs|cjs|json)$/, '');
    const cands = (byBase.get(wanted) || []).slice();

    if (cands.length === 0) {
      unresolved.push({ file: fileAbs, spec, note: 'no file with that name exists' });
      continue;
    }

    // Prefer candidates whose parent directory matches the specifier's parent.
    const wantedParent = path.basename(path.dirname(spec));
    let pool = cands;
    if (wantedParent && wantedParent !== '.' && wantedParent !== '..') {
      const narrowed = cands.filter((c) => path.basename(path.dirname(c)) === wantedParent);
      if (narrowed.length) pool = narrowed;
    }

    // Prefer the nearest candidate by directory distance — a moved file's real
    // target is almost always the closest one sharing its subtree.
    if (pool.length > 1) {
      const dist = (c) => path.relative(path.dirname(fileAbs), c).split(/[\\/]/).length;
      const min = Math.min(...pool.map(dist));
      const nearest = pool.filter((c) => dist(c) === min);
      if (nearest.length === 1) pool = nearest;
    }

    // A backend file must not be repointed into the frontend tree (or vice
    // versa) just because a basename matches. Crossing the boundary is an
    // architectural decision, never an automatic repair.
    pool = pool.filter((c) => sameTree(fileAbs, c));
    if (pool.length === 0) {
      crossTree.push({ file: fileAbs, spec });
      continue;
    }

    if (pool.length === 1) {
      fixes.push({ file: fileAbs, spec, replacement: toSpec(fileAbs, pool[0]), target: pool[0] });
    } else {
      ambiguous.push({ file: fileAbs, spec, candidates: pool });
    }
  }
}

// ------------------------------------------------------------------ apply

function applyFixes() {
  const byFile = new Map();
  for (const f of fixes) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file).push(f);
  }
  let changed = 0;
  for (const [file, list] of byFile) {
    let src = fs.readFileSync(file, 'utf8');
    for (const { spec, replacement } of list) {
      // Replace only inside a quoted specifier, so unrelated text is untouched.
      for (const q of ['"', "'"]) {
        src = src.split(q + spec + q).join(q + replacement + q);
      }
    }
    fs.writeFileSync(file, src);
    changed++;
  }
  return changed;
}

// ------------------------------------------------------------------ run

const scopeAbs = path.join(ROOT, SCOPE);
process.stderr.write(`Indexing ${ROOT} …\n`);
index(ROOT);
process.stderr.write(`  ${allFiles.length} files indexed\n`);
process.stderr.write(`Scanning ${SCOPE} …\n`);
for (const f of allFiles) if (f.startsWith(scopeAbs)) scan(f);

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

console.log(`\n══════════ BROKEN IMPORT REPAIR ══════════\n`);
console.log(`  scope        ${SCOPE}`);
console.log(`  fixable      ${fixes.length}   (single unambiguous target)`);
console.log(`  ambiguous    ${ambiguous.length}   (multiple candidates — not touched)`);
console.log(`  unresolvable ${unresolved.length}   (no such file — not touched)`);
console.log(`  cross-tree   ${crossTree.length}   (matches only across the backend/frontend boundary — not touched)`);
console.log(`  mode         ${APPLY ? 'APPLY' : 'dry run'}\n`);

if (fixes.length) {
  console.log('  Fixes by specifier:');
  const grouped = new Map();
  for (const f of fixes) {
    const k = `${f.spec}  →  ${f.replacement}`;
    grouped.set(k, (grouped.get(k) || 0) + 1);
  }
  for (const [k, n] of [...grouped].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`    ${String(n).padStart(4)}x  ${k}`);
  }
  if (grouped.size > 25) console.log(`    … ${grouped.size - 25} more distinct rewrites`);
}

if (ambiguous.length) {
  console.log('\n  AMBIGUOUS — needs a human decision:');
  for (const a of ambiguous.slice(0, 15)) {
    console.log(`    ${rel(a.file)}`);
    console.log(`      ${a.spec}  →  ${a.candidates.length} candidates:`);
    for (const c of a.candidates.slice(0, 4)) console.log(`         ${rel(c)}`);
  }
  if (ambiguous.length > 15) console.log(`    … ${ambiguous.length - 15} more`);
}

if (unresolved.length) {
  console.log('\n  UNRESOLVABLE — grouped by cause:');
  const byNote = new Map();
  for (const u of unresolved) {
    if (!byNote.has(u.note)) byNote.set(u.note, []);
    byNote.get(u.note).push(u);
  }
  for (const [note, list] of byNote) {
    console.log(`    ${list.length}x  ${note}`);
    const specs = new Map();
    for (const u of list) specs.set(u.spec, (specs.get(u.spec) || 0) + 1);
    for (const [s, n] of [...specs].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
      console.log(`         ${String(n).padStart(4)}x  ${s}`);
    }
  }
}

if (crossTree.length) {
  console.log('\n  CROSS-TREE — a backend file naming a frontend module, or the reverse.');
  console.log('  Not repaired: this is an architecture question, not a path typo.');
  const g = new Map();
  for (const c of crossTree) g.set(c.spec, (g.get(c.spec) || 0) + 1);
  for (const [s2, n] of [...g].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`    ${String(n).padStart(4)}x  ${s2}`);
  }
  console.log(`    across ${new Set(crossTree.map((c) => c.file)).size} files`);
}

if (APPLY && fixes.length) {
  const n = applyFixes();
  console.log(`\n  ✓ rewrote ${fixes.length} specifiers across ${n} files\n`);
} else if (!APPLY) {
  console.log(`\n  (dry run — re-run with --apply to write)\n`);
}
