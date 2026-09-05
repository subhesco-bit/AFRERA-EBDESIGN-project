#!/usr/bin/env node
/**
 * Database Migration Runner
 * Runs all SQL migration files in sequential order
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const migrationsDir = path.join(__dirname, 'migrations');

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
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📋 Found ${migrationFiles.length} migration files\n`);

    for (const file of migrationFiles) {
      // Check if already executed
      const result = await pool.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        console.log(`✅ Executed ${file}`);
      } catch (err) {
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
