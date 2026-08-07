#!/usr/bin/env node
/**
 * Duplicate-object detector for the migration chain.
 *
 * WHY THIS EXISTS
 *
 * `CREATE TABLE IF NOT EXISTS` is silent when the table already exists. If two
 * migrations declare the same table name with different columns, the second one
 * is a no-op and NOBODY IS TOLD. The migration "succeeds". The chain goes green.
 * The columns you wrote are simply not there, and you find out later when a view
 * or a query fails with "column does not exist" — pointing at the view, not at
 * the collision that actually caused it.
 *
 * This has happened 19 times in this repository (see
 * docs/registry/06_DUPLICATION_REPORT.md). The most recent was 990_ai_outcomes.sql
 * declaring `ai_predictions`, a name already taken by 000_base_schema.sql for a
 * completely different concept — model inference logging vs agent forecast
 * calibration. Renamed to `ai_prediction_log`.
 *
 * WHAT IT CHECKS
 *
 *   1. Two migrations creating the same TABLE  -> error if columns differ,
 *                                                 warning if identical
 *   2. Two migrations creating the same VIEW   -> warning (later silently wins,
 *                                                 which is at least visible)
 *   3. Two migrations creating the same TYPE   -> error (CREATE TYPE has no
 *                                                 IF NOT EXISTS; it hard-fails
 *                                                 on a re-run)
 *
 * Exit code 1 on any error, so CI fails before the chain is applied.
 *
 * Usage:  node tools/schema-collisions.js [--json]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const MIGRATIONS = path.join(__dirname, '..', 'backend', 'src', 'database', 'migrations');
const DECISIONS = path.join(__dirname, '..', 'backend', 'src', 'database', 'schema-decisions.json');

/**
 * Collisions somebody has already thought about, keyed by table name.
 *
 * A checker that keeps reporting a question you have answered trains people to
 * ignore it, and then it stops catching the real ones. Decisions live in
 * schema-decisions.json with their reasoning; this only reads them.
 */
function loadDecisions() {
  if (!fs.existsSync(DECISIONS)) return new Map();
  const raw = JSON.parse(fs.readFileSync(DECISIONS, 'utf8'));
  return new Map((raw.decisions || []).map((d) => [d.table.toLowerCase(), d]));
}

/**
 * Strip comments and string literals before matching.
 *
 * This is not decoration. An earlier generator in this repo produced a broken
 * migration because a `--` comment swallowed the CREATE INDEX that followed it,
 * and a separate scan lost a row because a regex matched inside a quoted string.
 * Name-based inference over SQL is only trustworthy once the text that merely
 * LOOKS like SQL has been removed.
 */
function stripNoise(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')   // block comments
    .replace(/--[^\n]*/g, ' ')           // line comments
    .replace(/'(?:[^']|'')*'/g, "''");   // string literals (incl. '' escapes)
}

/** Extract the column-name list from a CREATE TABLE body. */
function columnsOf(body) {
  const cols = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { cols.push(current); current = ''; continue; }
    current += ch;
  }
  cols.push(current);

  const TABLE_LEVEL = /^(constraint|primary|unique|foreign|check|exclude|like)\b/i;
  return cols
    .map((c) => c.trim())
    .filter((c) => c && !TABLE_LEVEL.test(c))
    .map((c) => (c.match(/^"?([a-z_][a-z0-9_]*)"?/i) || [, null])[1])
    .filter(Boolean)
    .map((c) => c.toLowerCase());
}

/** Find CREATE TABLE statements with balanced-paren body extraction. */
function findTables(sql) {
  const out = [];
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    let depth = 1;
    let i = re.lastIndex;
    while (i < sql.length && depth > 0) {
      if (sql[i] === '(') depth += 1;
      else if (sql[i] === ')') depth -= 1;
      i += 1;
    }
    out.push({ name: m[1].toLowerCase(), columns: columnsOf(sql.slice(re.lastIndex, i - 1)) });
  }
  return out;
}

function main() {
  const asJson = process.argv.includes('--json');
  const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

  const tables = new Map();  // name -> [{file, columns}]
  const views = new Map();   // name -> [file]
  const types = new Map();   // name -> [file]

  for (const file of files) {
    const sql = stripNoise(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));

    for (const t of findTables(sql)) {
      if (!tables.has(t.name)) tables.set(t.name, []);
      tables.get(t.name).push({ file, columns: t.columns });
    }
    for (const m of sql.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
      const n = m[1].toLowerCase();
      if (!views.has(n)) views.set(n, []);
      if (!views.get(n).includes(file)) views.get(n).push(file);
    }
    for (const m of sql.matchAll(/CREATE\s+TYPE\s+"?([a-z_][a-z0-9_]*)"?/gi)) {
      const n = m[1].toLowerCase();
      if (!types.has(n)) types.set(n, []);
      if (!types.get(n).includes(file)) types.get(n).push(file);
    }
  }

  // Columns recovered anywhere in the chain by an explicit ALTER. Several
  // migrations already repair their own collision this way (019 and 047 do),
  // and 999_schema_reconciliation.sql repairs others centrally. A collision
  // whose columns are all recovered is resolved, not outstanding — treating it
  // as an error would put this tool permanently at odds with the database it
  // is supposed to describe.
  const recovered = new Map();
  for (const file of files) {
    const sql = stripNoise(fs.readFileSync(path.join(MIGRATIONS, file), 'utf8'));
    for (const m of sql.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?/gi)) {
      const t = m[1].toLowerCase();
      if (!recovered.has(t)) recovered.set(t, new Set());
      recovered.get(t).add(m[2].toLowerCase());
    }
  }

  const errors = [];
  const warnings = [];
  const decided = [];
  const reconciled = [];
  const decisions = loadDecisions();

  for (const [name, defs] of tables) {
    if (defs.length < 2) continue;

    // Already answered in schema-decisions.json — record it, don't fail on it.
    if (decisions.has(name)) {
      const d = decisions.get(name);
      decided.push({ name, kind: d.kind, files: defs.map((x) => x.file), rationale: d.rationale });
      continue;
    }
    const sets = defs.map((d) => new Set(d.columns));
    const first = sets[0];
    const identical = sets.every(
      (s) => s.size === first.size && [...s].every((c) => first.has(c))
    );

    if (identical) {
      warnings.push({
        kind: 'table', name, files: defs.map((d) => d.file),
        detail: 'declared more than once with identical columns — redundant but harmless',
      });
    } else {
      // Report what the LATER migration silently loses, minus anything an
      // ALTER elsewhere in the chain puts back.
      const fixed = recovered.get(name) || new Set();
      const lost = defs.slice(1).map((d) => ({
        file: d.file,
        columns_never_created: d.columns.filter((c) => !sets[0].has(c) && !fixed.has(c)),
        winner: defs[0].file,
      })).filter((d) => d.columns_never_created.length);

      if (lost.length === 0) {
        reconciled.push({ name, files: defs.map((d) => d.file) });
        continue;
      }
      errors.push({
        kind: 'table', name, files: defs.map((d) => d.file),
        detail: 'same table name, DIFFERENT columns — CREATE TABLE IF NOT EXISTS '
              + 'silently skips the later one, so those columns are never created',
        silently_dropped: lost,
      });
    }
  }

  for (const [name, fl] of views) {
    if (fl.length > 1) {
      warnings.push({
        kind: 'view', name, files: fl,
        detail: 'CREATE OR REPLACE VIEW — the last migration to run wins',
      });
    }
  }
  for (const [name, fl] of types) {
    if (fl.length > 1) {
      errors.push({
        kind: 'type', name, files: fl,
        detail: 'CREATE TYPE has no IF NOT EXISTS — the second one hard-fails on re-run',
      });
    }
  }

  if (asJson) {
    console.log(JSON.stringify({
      scanned: files.length,
      tables_total: tables.size,
      errors,
      warnings,
      decided,
      reconciled,
    }, null, 2));
    process.exit(errors.length ? 1 : 0);
  }

  console.log(`schema-collisions: scanned ${files.length} migrations, ${tables.size} distinct tables`);
  if (reconciled.length) {
    console.log(`${reconciled.length} collision(s) already repaired by ALTER statements in the chain`);
  }
  if (decided.length) {
    console.log(`${decided.length} collision(s) already decided in schema-decisions.json:`);
    for (const d of decided) console.log(`   ${d.kind.padEnd(8)} ${d.name}  (${d.files.join(' vs ')})`);
  }
  console.log('');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  no undecided collisions');
    process.exit(0);
  }

  for (const e of errors) {
    console.log(`  ERROR  ${e.kind} "${e.name}"`);
    console.log(`         in: ${e.files.join(', ')}`);
    console.log(`         ${e.detail}`);
    for (const l of e.silently_dropped || []) {
      console.log(`         ${l.file} loses: ${l.columns_never_created.join(', ')}`);
      console.log(`         (${l.winner} already claimed the name)`);
    }
    console.log('');
  }
  for (const w of warnings) {
    console.log(`  warn   ${w.kind} "${w.name}" in ${w.files.join(', ')}`);
    console.log(`         ${w.detail}\n`);
  }

  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  if (errors.length) {
    console.log('\nFix by renaming the later table to reflect what it actually holds.');
    console.log('Merging two unrelated concepts under one name is what produced the');
    console.log('17-table reconciliation mess already recorded in');
    console.log('docs/registry/06_DUPLICATION_REPORT.md.');
  }
  process.exit(errors.length ? 1 : 0);
}

if (require.main === module) main();
module.exports = { stripNoise, findTables, columnsOf };
