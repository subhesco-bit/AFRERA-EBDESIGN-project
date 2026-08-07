#!/usr/bin/env node
/**
 * Generate the ALTER TABLE statements needed to recover columns that were
 * silently dropped by table-name collisions.
 *
 * Run `node tools/schema-collisions.js` first to see the problem. This script
 * produces the fix: for every column that a losing CREATE TABLE declared and
 * the winning one did not, emit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
 * with the ORIGINAL type, copied verbatim from the losing definition.
 *
 * WHAT IT DELIBERATELY STRIPS
 *
 *   NOT NULL      — cannot be added to a table that may already hold rows
 *                   without a default; would fail on any live database.
 *   PRIMARY KEY   — the winning definition already has one.
 *   UNIQUE        — may be violated by data already present.
 *   REFERENCES    — the target table may not exist yet at 999's position, and
 *                   an FK added blind can fail on existing rows.
 *
 * Everything else (type, precision, DEFAULT, CHECK) is preserved exactly.
 * Constraints stripped here are listed in the output so they can be restored
 * deliberately rather than forgotten.
 *
 * Usage:  node tools/gen-reconciliation.js            # print SQL
 *         node tools/gen-reconciliation.js --stats    # summary only
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { stripNoise } = require('./schema-collisions');

/**
 * Comment-only strip. `stripNoise` also blanks string literals, which is right
 * for FINDING statements but destructive when copying a definition: it turns
 * `DEFAULT 'normal'` into `DEFAULT ''` and would write a wrong default into the
 * schema. Types and defaults must be read from text that still has its strings.
 */
function stripComments(sql) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ');
}

const MIGRATIONS = path.join(__dirname, '..', 'backend', 'src', 'database', 'migrations');
const RECON = path.join(MIGRATIONS, '999_schema_reconciliation.sql');

/** Split a CREATE TABLE body on top-level commas — paren-aware. */
function splitTopLevel(body) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of body) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

const TABLE_LEVEL = /^(constraint|primary|unique|foreign|check|exclude|like)\b/i;

/** Full column definitions (name + everything after it) for one table in one file. */
function columnDefs(sql, table) {
  const re = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?"?${table}"?\\s*\\(`, 'i');
  const m = re.exec(sql);
  if (!m) return [];
  let depth = 1;
  let i = m.index + m[0].length;
  const start = i;
  while (i < sql.length && depth > 0) {
    if (sql[i] === '(') depth += 1;
    else if (sql[i] === ')') depth -= 1;
    i += 1;
  }
  return splitTopLevel(sql.slice(start, i - 1))
    .filter((d) => !TABLE_LEVEL.test(d))
    .map((d) => {
      const nm = d.match(/^"?([a-z_][a-z0-9_]*)"?\s+([\s\S]+)$/i);
      return nm ? { name: nm[1].toLowerCase(), rest: nm[2].replace(/\s+/g, ' ').trim() } : null;
    })
    .filter(Boolean);
}

/** Remove constraints that cannot be safely applied via ALTER on a live table. */
function sanitise(rest) {
  const stripped = [];
  let out = rest;
  const rules = [
    [/\bPRIMARY\s+KEY\b/gi, 'PRIMARY KEY'],
    [/\bNOT\s+NULL\b/gi, 'NOT NULL'],
    [/\bUNIQUE\b/gi, 'UNIQUE'],
    [/\bREFERENCES\s+[a-z_][a-z0-9_]*\s*(\([^)]*\))?(\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*/gi, 'REFERENCES'],
    [/\bGENERATED\s+ALWAYS\s+AS[\s\S]*?STORED\b/gi, 'GENERATED'],
  ];
  for (const [re, label] of rules) {
    if (re.test(out)) { stripped.push(label); out = out.replace(re, ' '); }
  }
  return { type: out.replace(/\s+/g, ' ').trim().replace(/,+$/, ''), stripped };
}

function main() {
  const statsOnly = process.argv.includes('--stats');
  const files = fs.readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();

  // table -> [{file, cols:[{name,rest}]}] in migration order
  const byTable = new Map();
  for (const file of files) {
    if (file === '999_schema_reconciliation.sql') continue;
    const raw = fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
    const sql = stripComments(raw);          // keeps string literals -> real DEFAULTs
    const scan = stripNoise(raw);            // strings blanked -> safe for matching
    for (const m of scan.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi)) {
      const t = m[1].toLowerCase();
      const cols = columnDefs(sql, t);
      if (!cols.length) continue;
      if (!byTable.has(t)) byTable.set(t, []);
      if (!byTable.get(t).some((d) => d.file === file)) byTable.get(t).push({ file, cols });
    }
  }

  // what 999 already repairs
  // Several migrations already self-reconcile with their own ALTER statements
  // (023 does this for labor_hours). Scan the WHOLE chain, not just 999, or we
  // emit duplicates and overstate how much is actually missing.
  const recon = files.map((f) => stripNoise(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'))).join('\n');
  const already = new Map();
  for (const m of recon.matchAll(/ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?"?([a-z_][a-z0-9_]*)"?\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+"?([a-z_][a-z0-9_]*)"?/gi)) {
    const t = m[1].toLowerCase();
    if (!already.has(t)) already.set(t, new Set());
    already.get(t).add(m[2].toLowerCase());
  }

  const plan = [];
  for (const [table, defs] of byTable) {
    if (defs.length < 2) continue;
    const winner = new Set(defs[0].cols.map((c) => c.name));
    const done = new Set(already.get(table) || []);
    const seen = new Set();
    for (const d of defs.slice(1)) {
      for (const col of d.cols) {
        if (winner.has(col.name) || done.has(col.name) || seen.has(col.name)) continue;
        seen.add(col.name);
        const { type, stripped } = sanitise(col.rest);
        if (!type) continue;
        plan.push({ table, column: col.name, type, from: d.file, winner: defs[0].file, stripped });
      }
    }
  }

  if (statsOnly) {
    const tables = new Set(plan.map((p) => p.table));
    console.log(`${plan.length} columns to recover across ${tables.size} tables`);
    const withStripped = plan.filter((p) => p.stripped.length);
    console.log(`${withStripped.length} had constraints stripped:`);
    for (const p of withStripped) {
      console.log(`   ${p.table}.${p.column} — dropped ${p.stripped.join(', ')}`);
    }
    return;
  }

  const tables = [...new Set(plan.map((p) => p.table))];
  const out = [];
  out.push('-- ' + '='.repeat(74));
  out.push('-- Recovered columns from table-name collisions');
  out.push('--');
  out.push('-- GENERATED by tools/gen-reconciliation.js — do not hand-edit this block.');
  out.push('--');
  out.push('-- Each column below was declared in a migration whose CREATE TABLE was');
  out.push('-- silently skipped, because an earlier migration had already claimed the');
  out.push('-- table name. `IF NOT EXISTS` made that skip invisible: the migration');
  out.push('-- reported success and the columns were never created. Code that reads');
  out.push('-- them fails at query time, far from the cause.');
  out.push('--');
  out.push(`-- ${plan.length} columns across ${tables.length} tables.`);
  out.push('-- ' + '='.repeat(74));
  out.push('');

  for (const table of tables) {
    const rows = plan.filter((p) => p.table === table);
    out.push(`-- ${table}: ${rows[0].winner} won the name; `
           + `${[...new Set(rows.map((r) => r.from))].join(', ')} lost ${rows.length} column(s)`);
    out.push(`DO $$ BEGIN IF to_regclass('public.${table}') IS NULL THEN RETURN; END IF; END $$;`);
    for (const r of rows) {
      const note = r.stripped.length ? `  -- ${r.stripped.join(' + ')} not re-applied` : '';
      out.push(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${r.column} ${r.type};${note}`);
    }
    out.push('');
  }
  console.log(out.join('\n'));
}

if (require.main === module) main();
module.exports = { columnDefs, sanitise, splitTopLevel };
