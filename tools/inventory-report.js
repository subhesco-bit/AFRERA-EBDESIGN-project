#!/usr/bin/env node
/**
 * inventory-report.js — reconciliation report from the deep-scan database.
 *
 * Answers the questions the rebuild actually turns on: what is real, what is
 * a duplicate, what is a stub, and what is reclaimable.
 *
 * Usage: node tools/inventory-report.js
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB = path.join(__dirname, '..', '.ai/inventory/inventory.db');
const db = new DatabaseSync(DB);
const all = (s, ...p) => db.prepare(s).all(...p);
const one = (s, ...p) => db.prepare(s).get(...p);
const mb = (b) => `${((b || 0) / 1048576).toFixed(0)} MB`;

/** Snapshot copies + the stray worktree dump are not part of the live project. */
const SNAPSHOT = `(path LIKE '\\_ACTIVE\\_PROJECT/%' ESCAPE '\\'
   OR path LIKE '\\_UNIFIED\\_PROJECT/%' ESCAPE '\\'
   OR path LIKE '\\_MERGE\\_LAB/%' ESCAPE '\\'
   OR path LIKE 'New folder/%')`;

console.log('══════════ SPACE: WHERE THE DISK WENT ══════════\n');
const buckets = all(`
  SELECT
    CASE
      WHEN path LIKE '\\_ACTIVE\\_PROJECT/%' ESCAPE '\\'  THEN '_ACTIVE_PROJECT (copy)'
      WHEN path LIKE '\\_UNIFIED\\_PROJECT/%' ESCAPE '\\' THEN '_UNIFIED_PROJECT (copy)'
      WHEN path LIKE '\\_MERGE\\_LAB/%' ESCAPE '\\'       THEN '_MERGE_LAB (scratch)'
      WHEN path LIKE 'New folder/%'                       THEN 'New folder (worktrees)'
      WHEN path LIKE '\\_EBDESIGN\\_LIBRARY/%' ESCAPE '\\' THEN '_EBDESIGN_LIBRARY'
      WHEN path LIKE 'backend/%'                          THEN 'backend'
      WHEN path LIKE 'frontend/%'                         THEN 'frontend'
      WHEN path LIKE '.ai/%'                              THEN '.ai (intelligence)'
      ELSE 'root + misc'
    END AS bucket,
    COUNT(*) AS n, SUM(size) AS bytes
  FROM files WHERE opaque = 0
  GROUP BY bucket ORDER BY bytes DESC`);
for (const b of buckets) {
  console.log(`  ${b.bucket.padEnd(26)} ${String(b.n).padStart(7)} files  ${mb(b.bytes).padStart(9)}`);
}

const dead = one(`SELECT COUNT(*) n, SUM(size) bytes FROM files WHERE opaque=0 AND ${SNAPSHOT}`);
console.log(`\n  ▸ Reclaimable snapshot/scratch: ${dead.n.toLocaleString()} files, ${mb(dead.bytes)}`);

console.log('\n\n══════════ LIVE TREE BY LAYER ══════════\n');
console.log(`  ${'layer'.padEnd(22)} ${'files'.padStart(6)} ${'stub'.padStart(6)} ${'real'.padStart(6)}   substance`);
const layers = all(`
  SELECT layer, COUNT(*) n, SUM(is_stub) stub,
         SUM(CASE WHEN size > 6000 THEN 1 ELSE 0 END) real
  FROM files
  WHERE opaque = 0 AND layer IS NOT NULL AND NOT ${SNAPSHOT}
  GROUP BY layer ORDER BY n DESC`);
for (const l of layers) {
  const pct = l.n ? Math.round((l.real / l.n) * 100) : 0;
  const bar = '█'.repeat(Math.round(pct / 5)).padEnd(20, '·');
  console.log(`  ${l.layer.padEnd(22)} ${String(l.n).padStart(6)} ${String(l.stub).padStart(6)} ${String(l.real).padStart(6)}   ${bar} ${pct}%`);
}

console.log('\n\n══════════ DUPLICATES ══════════\n');
const dupAll = one(`
  SELECT COUNT(*) groups, SUM(c - 1) redundant, SUM(waste) bytes FROM (
    SELECT sha256, COUNT(*) c, SUM(size) - MIN(size) waste
    FROM files WHERE opaque = 0 AND sha256 IS NOT NULL
    GROUP BY sha256 HAVING c > 1)`);
console.log(`  Whole tree:  ${dupAll.groups.toLocaleString()} groups, ${dupAll.redundant.toLocaleString()} redundant copies, ${mb(dupAll.bytes)}`);

const dupLive = one(`
  SELECT COUNT(*) groups, SUM(c - 1) redundant, SUM(waste) bytes FROM (
    SELECT sha256, COUNT(*) c, SUM(size) - MIN(size) waste
    FROM files WHERE opaque = 0 AND sha256 IS NOT NULL AND NOT ${SNAPSHOT}
    GROUP BY sha256 HAVING c > 1)`);
console.log(`  Live tree:   ${dupLive.groups.toLocaleString()} groups, ${dupLive.redundant.toLocaleString()} redundant copies, ${mb(dupLive.bytes)}`);

const dupSrc = one(`
  SELECT COUNT(*) groups, SUM(c - 1) redundant FROM (
    SELECT sha256, COUNT(*) c
    FROM files WHERE opaque = 0 AND sha256 IS NOT NULL AND category = 'source' AND NOT ${SNAPSHOT}
    GROUP BY sha256 HAVING c > 1)`);
console.log(`  Live source: ${dupSrc.groups.toLocaleString()} groups, ${dupSrc.redundant.toLocaleString()} redundant copies  ← must merge, not delete`);

console.log('\n  Worst live-tree duplicate groups:');
const worst = all(`
  SELECT sha256, COUNT(*) c, MIN(size) sz, GROUP_CONCAT(path, ' | ') paths
  FROM files WHERE opaque = 0 AND sha256 IS NOT NULL AND category = 'source' AND NOT ${SNAPSHOT}
  GROUP BY sha256 HAVING c > 2 ORDER BY c DESC, sz DESC LIMIT 8`);
for (const w of worst) {
  const list = String(w.paths).split(' | ');
  console.log(`    ${String(w.c).padStart(3)}x  ${(w.sz / 1024).toFixed(1)}KB  ${list[0]}`);
  console.log(`         also: ${list.slice(1, 3).join(', ')}${list.length > 3 ? ` …+${list.length - 3}` : ''}`);
}

console.log('\n\n══════════ WIRING INTEGRITY ══════════\n');
const brokenLive = one(`
  SELECT COUNT(*) n, COUNT(DISTINCT e.src_id) files FROM edges e
  JOIN files f ON f.id = e.src_id
  WHERE e.missing = 1 AND NOT (${SNAPSHOT.replace(/path/g, 'f.path')})`);
console.log(`  Unresolved relative imports (live): ${brokenLive.n.toLocaleString()} across ${brokenLive.files.toLocaleString()} files`);

console.log('\n  Broken imports by layer:');
const byLayer = all(`
  SELECT f.layer, COUNT(*) n FROM edges e JOIN files f ON f.id = e.src_id
  WHERE e.missing = 1 AND NOT (${SNAPSHOT.replace(/path/g, 'f.path')}) AND f.layer IS NOT NULL
  GROUP BY f.layer ORDER BY n DESC LIMIT 10`);
for (const b of byLayer) console.log(`    ${b.layer.padEnd(22)} ${String(b.n).padStart(6)}`);

console.log('\n  Most-referenced missing targets:');
const targets = all(`
  SELECT e.spec, COUNT(*) n FROM edges e JOIN files f ON f.id = e.src_id
  WHERE e.missing = 1 AND NOT (${SNAPSHOT.replace(/path/g, 'f.path')})
  GROUP BY e.spec ORDER BY n DESC LIMIT 12`);
for (const t of targets) console.log(`    ${String(t.n).padStart(5)}x  ${t.spec}`);

console.log('\n\n══════════ API + DATA SURFACE (live) ══════════\n');
const r = one(`SELECT COUNT(*) n FROM routes rt JOIN files f ON f.id = rt.src_id WHERE NOT (${SNAPSHOT.replace(/path/g, 'f.path')})`);
const rf = one(`SELECT COUNT(DISTINCT rt.src_id) n FROM routes rt JOIN files f ON f.id = rt.src_id WHERE NOT (${SNAPSHOT.replace(/path/g, 'f.path')})`);
const tbl = one(`SELECT COUNT(DISTINCT s.name) n FROM sql_objects s JOIN files f ON f.id = s.src_id WHERE s.op='create_table' AND f.layer='migration'`);
const mig = one(`SELECT COUNT(*) n FROM files WHERE layer='migration' AND NOT ${SNAPSHOT}`);
const api = one(`SELECT COUNT(DISTINCT a.url) n FROM api_calls a JOIN files f ON f.id = a.src_id WHERE f.layer LIKE 'frontend%'`);
console.log(`  Express route declarations   ${String(r.n).padStart(7)}  in ${rf.n} files`);
console.log(`  Migration files              ${String(mig.n).padStart(7)}`);
console.log(`  Distinct tables created      ${String(tbl.n).padStart(7)}`);
console.log(`  Distinct frontend API URLs   ${String(api.n).padStart(7)}`);

console.log('\n  Duplicate table definitions (same table created in >1 migration):');
const dupTbl = all(`
  SELECT s.name, COUNT(DISTINCT s.src_id) c FROM sql_objects s JOIN files f ON f.id = s.src_id
  WHERE s.op = 'create_table' AND f.layer = 'migration' AND NOT (${SNAPSHOT.replace(/path/g, 'f.path')})
  GROUP BY s.name HAVING c > 1 ORDER BY c DESC LIMIT 10`);
console.log(`    ${dupTbl.length ? '' : '(none)'}`);
for (const t of dupTbl) console.log(`    ${String(t.c).padStart(3)}x  ${t.name}`);
const dupTblTotal = one(`
  SELECT COUNT(*) n FROM (
    SELECT s.name FROM sql_objects s JOIN files f ON f.id = s.src_id
    WHERE s.op='create_table' AND f.layer='migration' AND NOT (${SNAPSHOT.replace(/path/g, 'f.path')})
    GROUP BY s.name HAVING COUNT(DISTINCT s.src_id) > 1)`);
console.log(`    → ${dupTblTotal.n} tables defined in more than one migration`);

db.close();
