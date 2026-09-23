#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs all SQL migration files in sequential order
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

const migrationsDir = path.join(__dirname, 'migrations');

function getMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

/**
 * Remove top-level BEGIN/COMMIT/END/ROLLBACK, because runMigrations wraps each
 * file in its own transaction and a nested BEGIN is an error.
 *
 * DOLLAR-QUOTE AWARE, and that is the whole point. This used to be two flat
 * regexes over the file, which also deleted the `END;` that closes a PL/pgSQL
 * body:
 *
 *     CREATE OR REPLACE FUNCTION update_updated_at_column()
 *     RETURNS TRIGGER AS $$
 *     BEGIN
 *         NEW.updated_at = CURRENT_TIMESTAMP;
 *         RETURN NEW;
 *     END;            <-- deleted, along with the BEGIN above it
 *     $$ LANGUAGE plpgsql;
 *
 * 000_base_schema.sql contains exactly that, so `npm run migrate` died on the
 * FIRST file with "syntax error at end of input" and no migration ever ran.
 * 59 files in this directory carry a line matching that pattern.
 *
 * Lines inside a dollar-quoted string ($$ ... $$, $tag$ ... $tag$) are now left
 * exactly as written; only markers outside one are stripped.
 */
function stripTransactionMarkers(sql) {
  const marker = /^\s*(BEGIN|START\s+TRANSACTION|COMMIT|END|ROLLBACK)\s*;\s*$/i;
  const dollarTag = /\$[A-Za-z_][A-Za-z0-9_]*\$|\$\$/g;

  let openTag = null;
  return sql
    .split('\n')
    .map((line) => {
      const stripThisLine = openTag === null && marker.test(line);

      // Track dollar-quote state across the line before deciding the next one.
      let match;
      dollarTag.lastIndex = 0;
      // eslint-disable-next-line no-cond-assign
      while ((match = dollarTag.exec(line)) !== null) {
        if (openTag === null) {
          openTag = match[0];
        } else if (match[0] === openTag) {
          openTag = null;
        }
      }

      return stripThisLine ? '' : line;
    })
    .join('\n');
}

function runPreflight() {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'migration_preflight.js'), '--json'], {
    encoding: 'utf8',
  });
  const report = JSON.parse(output);
  if (report.blockers > 0) {
    throw new Error(`Migration preflight found ${report.blockers} blocking issue(s)`);
  }
  return report;
}

async function runMigrations() {
  const pool = new Pool({
    user: process.env.DB_USER || 'ebdesign_user',
    password: process.env.DB_PASSWORD || 'ebdesign_dev_password_change_in_prod',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ebdesign',
  });

  try {
    console.log('✅ Connected to PostgreSQL');
    const preflight = runPreflight();
    console.log(`✅ Migration preflight passed: ${preflight.migrationCount} files, ${preflight.blockers} blockers`);

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Migrations table ready');

    // Get list of migration files
    const migrationFiles = getMigrationFiles();

    console.log(`\n📋 Found ${migrationFiles.length} migration files\n`);

    for (const file of migrationFiles) {
      // Check if already executed
      const result = await pool.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file],
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = stripTransactionMarkers(fs.readFileSync(filePath, 'utf8'));

      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file],
        );
        await pool.query('COMMIT');
        console.log(`✅ Executed ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error(`❌ Failed to execute ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n✅ All migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
