#!/usr/bin/env node
/**
 * Validate every autonomous-resolution rule against the LIVE schema.
 *
 * WHY THIS MATTERS
 *
 * `ai_resolution_rules` tells the learning loop where to find ground truth: a
 * table, a column, a join key. If any of those names is wrong the resolver
 * throws on that row and the prediction stays unresolved — which is
 * indistinguishable, from outside, from "ground truth has not arrived yet".
 * The loop appears to run. Nothing is learned. Nobody is told.
 *
 * Not hypothetical: the first seed of these rules named `gross_revenue`,
 * `checked_at`, `batch_id` and `actual_delivery_hours`. None of the four
 * exists. Every one would have failed silently.
 *
 * WHY IT QUERIES THE DATABASE INSTEAD OF READING THE SQL
 *
 * The first version of this tool parsed the INSERT statements out of
 * 990_ai_outcomes.sql. Its paren tracker miscounted across the multi-line
 * string concatenation in the `rationale` column: it found 4 rules instead of
 * 9 and reported a false error about an empty `truth_table`.
 *
 * Parsing SQL text to check SQL was the wrong idea. After migrations apply,
 * `information_schema` holds the answer directly, and it accounts for columns
 * added by ALTER, by reconciliation, by anything — which a text parser over
 * CREATE TABLE never could. CI already provisions PostgreSQL, so the real
 * schema is available. Ask the database.
 *
 * Usage:
 *   node tools/validate-resolution-rules.js
 *   DATABASE_URL=postgres://... node tools/validate-resolution-rules.js
 *
 * Exit 1 if any ENABLED rule references a table or column that does not exist,
 * or if a proxy rule claims full verdict weight.
 */

'use strict';

const path = require('path');

/**
 * `pg` is a dependency of backend/, not of the repo root where this tool
 * lives, so a bare require('pg') fails with MODULE_NOT_FOUND. Resolve it from
 * the backend's own node_modules, and fall back to the plain name in case the
 * tool is ever run from inside backend/.
 */
function loadPg() {
  const backend = path.join(__dirname, '..', 'backend');
  try {
    return require(require.resolve('pg', { paths: [backend] }));
  } catch {
    try {
      return require('pg');
    } catch {
      console.log('validate-resolution-rules: the "pg" package is not installed.');
      console.log('  Run `npm ci` in backend/ first — this tool talks to a real database');
      console.log('  because parsing the migration text to check the schema is what the');
      console.log('  previous version did, and it got the answer wrong.');
      process.exit(1);
    }
  }
}

const { Pool } = loadPg();

const CONN = process.env.DATABASE_URL
  || `postgres://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}`
     + `@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || 5432}`
     + `/${process.env.PGDATABASE || 'postgres'}`;

async function main() {
  const pool = new Pool({ connectionString: CONN, max: 2, connectionTimeoutMillis: 8000 });

  let rules;
  try {
    const check = await pool.query(
      "SELECT to_regclass('public.ai_resolution_rules') IS NOT NULL AS present"
    );
    if (!check.rows[0].present) {
      console.log('validate-resolution-rules: ai_resolution_rules does not exist.');
      console.log('  Run migrations first — this tool checks the applied schema, not the SQL text.');
      await pool.end();
      process.exit(1);
    }
    rules = (await pool.query(
      `SELECT prediction_type, truth_table, truth_column, subject_column,
              truth_aggregate, date_column, window_days, resolution_mode,
              verdict_weight, enabled
         FROM ai_resolution_rules
        ORDER BY enabled DESC, prediction_type`
    )).rows;
  } catch (err) {
    console.log(`validate-resolution-rules: cannot reach the database — ${err.message}`);
    console.log('  Set DATABASE_URL, or run after the migration step in CI.');
    await pool.end().catch(() => {});
    process.exit(1);
  }

  // Whole public schema in one round trip.
  const cols = new Map();   // table -> Set(column)
  for (const r of (await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public'`
  )).rows) {
    if (!cols.has(r.table_name)) cols.set(r.table_name, new Set());
    cols.get(r.table_name).add(r.column_name);
  }
  await pool.end();

  const errors = [];
  const warnings = [];
  const disabled = [];
  let checked = 0;

  for (const r of rules) {
    const label = `${r.prediction_type} (${r.resolution_mode})`;

    if (!r.enabled) {
      // Still worth reporting a broken reference on a disabled rule — somebody
      // will enable it one day and it should not be a landmine then. But it is
      // a warning, not a failure, because it is not running now.
      const c = cols.get(r.truth_table);
      if (!c) warnings.push(`${label} [disabled]: truth_table "${r.truth_table}" does not exist`);
      else {
        for (const k of ['truth_column', 'subject_column', 'date_column']) {
          if (r[k] && !c.has(r[k])) {
            warnings.push(`${label} [disabled]: ${k} "${r[k]}" not a column of ${r.truth_table}`);
          }
        }
      }
      disabled.push(r.prediction_type);
      continue;
    }

    checked += 1;
    const c = cols.get(r.truth_table);
    if (!c) {
      errors.push(`${label}: truth_table "${r.truth_table}" does not exist`);
      continue;
    }
    for (const k of ['truth_column', 'subject_column', 'date_column']) {
      if (r[k] && !c.has(r[k])) {
        errors.push(`${label}: ${k} "${r[k]}" is not a column of ${r.truth_table}`);
      }
    }
    // A window needs a date column to apply itself to.
    if (r.window_days && !r.date_column) {
      errors.push(`${label}: window_days=${r.window_days} but no date_column — the window would be ignored`);
    }
    // Mirrors the DB CHECK, but names the rule rather than the constraint.
    if (r.resolution_mode === 'proxy' && Number(r.verdict_weight) >= 1) {
      errors.push(`${label}: proxy rule claims verdict_weight ${r.verdict_weight} — `
                + 'a counterfactual stand-in must not carry the authority of a real measurement');
    }
  }

  console.log(`validate-resolution-rules: ${rules.length} rules in the applied schema `
            + `(${checked} enabled and checked, ${disabled.length} disabled)`);
  if (disabled.length) console.log(`  disabled: ${disabled.join(', ')}`);
  for (const w of warnings) console.log(`  warn   ${w}`);

  if (errors.length === 0) {
    console.log('  every enabled rule resolves against a real table and column');
    process.exit(0);
  }
  console.log('');
  for (const e of errors) console.log(`  ERROR  ${e}`);
  console.log('');
  console.log(`${errors.length} broken rule reference(s). Each would fail at resolution time`);
  console.log('and look exactly like "ground truth has not arrived yet", so the learning');
  console.log('loop would appear alive while learning nothing.');
  process.exit(1);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
