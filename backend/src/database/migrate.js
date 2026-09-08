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

function stripTransactionMarkers(sql) {
  return sql
    .replace(/^\s*(BEGIN|START\s+TRANSACTION)\s*;\s*$/gim, '')
    .replace(/^\s*(COMMIT|END|ROLLBACK)\s*;\s*$/gim, '');
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
