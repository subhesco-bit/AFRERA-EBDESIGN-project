#!/usr/bin/env node
/**
 * Canonical database migration runner.
 * Uses the same PostgreSQL configuration contract as runtime connection.js.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { Pool } = require('pg');
require('dotenv').config();

const migrationsDir = path.join(__dirname, 'migrations');
const legacyMigrationsDir = path.resolve(__dirname, '..', '..', 'migrations');

function getMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function getPostgresConfig() {
  const config = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT, 10) || 5432,
        database: process.env.PG_DATABASE || 'afrera_db',
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'password',
      };
  if (process.env.PG_SSL === 'true') {
    config.ssl = { rejectUnauthorized: process.env.PG_SSL_STRICT !== 'false' };
  }
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    const unsafe = config.password === 'password' || !process.env.PG_PASSWORD;
    if (unsafe) throw new Error('Production migrations require DATABASE_URL or an explicit non-default PG_PASSWORD');
  }
  return config;
}

function stripTransactionMarkers(sql) {
  return sql
    .replace(/^\s*(BEGIN|START\s+TRANSACTION)\s*;\s*$/gim, '')
    .replace(/^\s*(COMMIT|END|ROLLBACK)\s*;\s*$/gim, '');
}

function runPreflight() {
  const output = execFileSync(process.execPath, [path.join(__dirname, 'migration_preflight.js'), '--json'], { encoding: 'utf8' });
  const report = JSON.parse(output);
  if (report.blockers > 0) throw new Error(`Migration preflight found ${report.blockers} blocking issue(s)`);
  return report;
}

function reportLegacyMigrationDirectory() {
  if (!fs.existsSync(legacyMigrationsDir)) return [];
  const files = fs.readdirSync(legacyMigrationsDir).filter(file => file.endsWith('.sql')).sort();
  if (files.length) {
    console.warn(`⚠️  Found ${files.length} SQL files in legacy backend/migrations. Canonical execution is backend/src/database/migrations only.`);
    console.warn('⚠️  These files must be reconciled/promoted before production; they are never silently executed by this runner.');
  }
  return files;
}

async function runMigrations() {
  const pool = new Pool({ ...getPostgresConfig(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to the same PostgreSQL target used by application runtime');
    const preflight = runPreflight();
    reportLegacyMigrationDirectory();
    console.log(`✅ Migration preflight passed: ${preflight.migrationCount} canonical files, ${preflight.blockers} blockers`);

    await pool.query(`CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const migrationFiles = getMigrationFiles();
    console.log(`\n📋 Found ${migrationFiles.length} canonical migration files\n`);

    for (const file of migrationFiles) {
      const result = await pool.query('SELECT 1 FROM migrations WHERE name = $1', [file]);
      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      const sql = stripTransactionMarkers(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        await pool.query('COMMIT');
        console.log(`✅ Executed ${file}`);
      } catch (error) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error(`❌ Failed to execute ${file}:`, error.message);
        throw error;
      }
    }
    console.log('\n✅ All canonical migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runMigrations();
