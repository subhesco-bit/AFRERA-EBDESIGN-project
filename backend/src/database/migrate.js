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

// Plain lexicographic order, deliberately NOT numeric: the whole chain (and
// backend/src/database/schema-decisions.json, tools/schema-collisions.js) is
// written against filename order - e.g. 3102_*.sql runs before 996_*.sql and
// 9999_zzz*.sql runs last. A numeric sort silently reorders ~100 files and
// breaks every collision decision that depends on which CREATE wins.
function getMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

// A bare `END;` line is NOT stripped: it is how every PL/pgSQL function and
// DO block body terminates, and removing it leaves those bodies unterminated
// ("syntax error at end of input"). Only unambiguous transaction markers go.
function stripTransactionMarkers(sql) {
  return sql
    .replace(/^\s*(BEGIN(\s+(TRANSACTION|WORK))?|START\s+TRANSACTION)\s*;\s*$/gim, '')
    .replace(/^\s*(COMMIT|ROLLBACK|END\s+(TRANSACTION|WORK))\s*;\s*$/gim, '');
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
  // Same precedence as database/connection.js (DATABASE_URL, then PG_*), so
  // migrations always target the database the app itself connects to. The
  // older DB_* names are kept as a fallback for existing local .env files.
  const pool = new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
    user: process.env.PG_USER || process.env.DB_USER || 'ebdesign_user',
    password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || 'ebdesign_dev_password_change_in_prod',
    host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.PG_PORT || process.env.DB_PORT || 5432,
    database: process.env.PG_DATABASE || process.env.DB_NAME || 'ebdesign',
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

      // One dedicated client per migration: pool.query() may hand BEGIN,
      // the body and COMMIT to different connections, which would make the
      // transaction (and the ROLLBACK on failure) meaningless.
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
        console.log(`✅ Executed ${file}`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`❌ Failed to execute ${file}:`, err.message);
        throw err;
      } finally {
        client.release();
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
