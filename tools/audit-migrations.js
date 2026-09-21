#!/usr/bin/env node
/**
 * Migration audit — reports ordering and integrity risks across the SQL
 * migration set without needing a live database.
 *
 * Checks:
 *   1. Duplicate numeric prefixes (ambiguous execution order).
 *   2. Filename-based ordering hacks (`z`/`zz` prefixes used as sequencing).
 *   3. Non-conforming filenames (no recognisable order key at all).
 *   4. Objects created more than once across files (collision candidates).
 *   5. Missing IF NOT EXISTS on CREATE (re-run safety).
 *   6. Files with no statements (empty/placeholder migrations).
 *
 * Usage: node tools/audit-migrations.js [migrationsDir]
 * Exits non-zero when ordering is ambiguous, so it can gate CI.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(
  process.argv[2] || path.join(__dirname, '..', 'backend', 'src', 'database', 'migrations'),
);

if (!fs.existsSync(DIR)) {
  console.error(`Migrations directory not found: ${DIR}`);
  process.exit(2);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();

const byPrefix = new Map();
const orderingHacks = [];
const noOrderKey = [];
const empty = [];
const unsafeCreates = [];
const createdObjects = new Map();

for (const file of files) {
  const numeric = file.match(/^(\d+)/);
  if (numeric) {
    if (!byPrefix.has(numeric[1])) byPrefix.set(numeric[1], []);
    byPrefix.get(numeric[1]).push(file);
  } else if (/^z+/i.test(file)) {
    orderingHacks.push(file);
  } else {
    noOrderKey.push(file);
  }
  // a numeric-prefixed file can still carry an internal zz ordering hack
  if (numeric && /_z{1,5}\d*_/i.test(file)) orderingHacks.push(file);

  const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
  const stripped = sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!stripped) {
    empty.push(file);
    continue;
  }

  for (const m of stripped.matchAll(
    /CREATE\s+(?:UNIQUE\s+)?(TABLE|INDEX|TYPE|VIEW|SCHEMA|FUNCTION)\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)/gi,
  )) {
    const kind = m[1].toUpperCase();
    const name = m[2].replace(/"/g, '').toLowerCase();
    const key = `${kind} ${name}`;
    if (!createdObjects.has(key)) createdObjects.set(key, []);
    createdObjects.get(key).push(file);
    if (!/IF\s+NOT\s+EXISTS/i.test(m[0])) unsafeCreates.push({ file, object: key });
  }
}

const duplicatePrefixes = [...byPrefix.entries()].filter(([, v]) => v.length > 1);
const duplicateObjects = [...createdObjects.entries()].filter(([, v]) => v.length > 1);

console.log(`Migration audit of ${path.relative(process.cwd(), DIR) || DIR}`);
console.log(`  migration files                 : ${files.length}`);
console.log(`  reused numeric prefixes         : ${duplicatePrefixes.length}`);
console.log(`  filename ordering hacks (z/zz)  : ${new Set(orderingHacks).size}`);
console.log(`  files with no order key         : ${noOrderKey.length}`);
console.log(`  empty / placeholder files       : ${empty.length}`);
console.log(`  objects created in >1 file      : ${duplicateObjects.length}`);
console.log(`  CREATE without IF NOT EXISTS    : ${unsafeCreates.length}`);

const show = (label, rows, fmt, limit = 15) => {
  if (!rows.length) return;
  console.log(`\n${label}${rows.length > limit ? ` (first ${limit} of ${rows.length})` : ''}:`);
  rows.slice(0, limit).forEach((r) => console.log(`  ${fmt(r)}`));
};

show('Reused numeric prefixes — execution order is ambiguous', duplicatePrefixes,
  ([p, v]) => `${p}: ${v.join(', ')}`);
show('Objects created in more than one migration', duplicateObjects,
  ([o, v]) => `${o} <- ${v.join(', ')}`);
show('Filename ordering hacks', [...new Set(orderingHacks)], (f) => f);
show('Files with no recognisable order key', noOrderKey, (f) => f);
show('Empty / placeholder migrations', empty, (f) => f);

// Ambiguous ordering is the blocking condition: the same set can apply in
// different orders on different machines, which is not a reproducible schema.
const blocking = duplicatePrefixes.length + noOrderKey.length;
console.log(
  blocking === 0
    ? '\nPASS: migration order is deterministic.'
    : `\nFAIL: ${blocking} ordering ambiguity source(s). Schema is not reproducible.`,
);
process.exit(blocking === 0 ? 0 : 1);
