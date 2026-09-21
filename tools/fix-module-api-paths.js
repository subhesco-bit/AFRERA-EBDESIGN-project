#!/usr/bin/env node
/**
 * fix-module-api-paths.js — point generated module pages at the API that exists.
 *
 * The auto-generated module pages call `/api/m100/`, a prefix the backend never
 * mounted, so every one of those calls 404s. The backend actually mounts its
 * module routers at `/api/v1/backend-modules/M100`. This rewrites the former to
 * the latter — but only for module ids that are genuinely mounted in index.js,
 * so a page is never repointed at a second URL that also does not exist.
 *
 * Usage:
 *   node tools/fix-module-api-paths.js            # dry run
 *   node tools/fix-module-api-paths.js --apply
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = path.join(ROOT, 'frontend', 'src', 'pages');
const INDEX = path.join(ROOT, 'backend', 'src', 'index.js');
const APPLY = process.argv.includes('--apply');

// Which module ids does the backend actually mount, and under what prefix?
const indexSrc = fs.readFileSync(INDEX, 'utf8');
const mounted = new Map(); // 'M100' -> '/api/v1/backend-modules/M100'
const mountRe = /app\.use\(\s*['"](\/api\/v1\/backend-modules\/(M\d+))['"]/g;
let m;
while ((m = mountRe.exec(indexSrc)) !== null) mounted.set(m[2].toUpperCase(), m[1]);

if (mounted.size === 0) {
  console.error('  No /api/v1/backend-modules/* mounts found in index.js — aborting.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walk(abs, out);
    else if (/\.(jsx|tsx|js)$/.test(e.name)) out.push(abs);
  }
  return out;
}

// `/api/m100/` or `/api/m100` inside a quote or template literal
const CALL_RE = /\/api\/(m\d+)(?=[/'"`)\s])/gi;

const changes = [];
const unmounted = new Map();

for (const file of walk(PAGES)) {
  const src = fs.readFileSync(file, 'utf8');
  if (!/\/api\/m\d+/i.test(src)) continue;

  let hits = 0;
  const out = src.replace(CALL_RE, (whole, id) => {
    const key = id.toUpperCase();
    // Page directories use M31 while module ids are zero-padded to M031, so a
    // direct miss is usually a padding difference rather than a missing module.
    const digits = key.slice(1);
    const padded = `M${digits.padStart(3, '0')}`;
    const prefix = mounted.get(key) || mounted.get(padded);
    if (!prefix) {
      unmounted.set(key, (unmounted.get(key) || 0) + 1);
      return whole; // leave it: repointing at another dead URL helps nobody
    }
    hits += 1;
    return prefix;
  });

  if (hits) changes.push({ file, hits, out });
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');
const totalHits = changes.reduce((a, c) => a + c.hits, 0);

console.log('\n══════════ MODULE API PATH ALIGNMENT ══════════\n');
console.log(`  mounted module ids in index.js : ${mounted.size}`);
console.log(`  files to change                : ${changes.length}`);
console.log(`  call sites to rewrite          : ${totalHits}`);
console.log(`  ids referenced but NOT mounted : ${unmounted.size}`);
console.log(`  mode                           : ${APPLY ? 'APPLY' : 'dry run'}\n`);

console.log(`  /api/m100/  ->  ${mounted.get('M100') || '(example)'}\n`);

if (unmounted.size) {
  console.log('  Left alone — no backend mount exists for these ids:');
  for (const [id, n] of [...unmounted].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    console.log(`    ${String(n).padStart(4)}x  ${id}`);
  }
  console.log('');
}

if (APPLY) {
  for (const c of changes) fs.writeFileSync(c.file, c.out);
  console.log(`  ✓ rewrote ${totalHits} call sites across ${changes.length} files\n`);
} else {
  console.log('  Sample files:');
  for (const c of changes.slice(0, 8)) console.log(`    ${String(c.hits).padStart(3)}x  ${rel(c.file)}`);
  console.log('\n  (dry run — re-run with --apply)\n');
}
