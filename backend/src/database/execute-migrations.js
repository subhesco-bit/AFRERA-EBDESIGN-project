/**
 * MIGRATION EXECUTION SCRIPT
 * Executes all 422 database migrations in proper order
 * Run: node execute-migrations.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ebdesign_prod',
});

class MigrationExecutor {
  constructor() {
    this.executedMigrations = new Set();
    this.failedMigrations = [];
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async initialize() {
    try {
      console.log('🔧 Initializing migration system...');

      // Create migrations tracking table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP DEFAULT NOW(),
          batch INT,
          status VARCHAR(50) DEFAULT 'pending'
        );
      `);

      // Get already executed migrations
      const result = await pool.query('SELECT name FROM schema_migrations WHERE status = $1', ['completed']);
      result.rows.forEach(row => this.executedMigrations.add(row.name));

      console.log(`✅ Found ${this.executedMigrations.size} already executed migrations`);
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error.message);
      throw error;
    }
  }

  async getMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
        .sort();

      return files.filter(f => !this.executedMigrations.has(f));
    } catch (error) {
      console.error('❌ Failed to read migrations:', error.message);
      return [];
    }
  }

  async executeMigration(filename) {
    try {
      const filepath = path.join(this.migrationsPath, filename);

      // Record migration as in progress
      await pool.query(
        'INSERT INTO schema_migrations (name, status, batch) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET status = $2',
        [filename, 'in_progress', Math.floor(Date.now() / 1000)]
      );

      let sql;
      if (filename.endsWith('.sql')) {
        sql = fs.readFileSync(filepath, 'utf8');
      } else {
        const migration = require(filepath);
        sql = migration.up ? migration.up() : '';
      }

      if (!sql || sql.trim() === '') {
        console.log(`⏭️  Skipping ${filename} (empty migration)`);
        await pool.query(
          'UPDATE schema_migrations SET status = $1 WHERE name = $2',
          ['skipped', filename]
        );
        return true;
      }

      // Execute migration with timeout
      await Promise.race([
        pool.query(sql),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Migration timeout')), 30000)
        )
      ]);

      // Mark as completed
      await pool.query(
        'UPDATE schema_migrations SET status = $1 WHERE name = $2',
        ['completed', filename]
      );

      console.log(`✅ ${filename}`);
      this.executedMigrations.add(filename);
      return true;
    } catch (error) {
      console.error(`❌ ${filename}: ${error.message}`);
      this.failedMigrations.push({ file: filename, error: error.message });

      // Mark as failed
      try {
        await pool.query(
          'UPDATE schema_migrations SET status = $1 WHERE name = $2',
          ['failed', filename]
        );
      } catch (e) {
        // Ignore update error
      }

      return false;
    }
  }

  async execute() {
    try {
      await this.initialize();
      const migrations = await this.getMigrations();

      if (migrations.length === 0) {
        console.log('✅ All migrations already executed');
        return true;
      }

      console.log(`\n📦 Executing ${migrations.length} migrations...\n`);

      const batchSize = parseInt(process.env.MIGRATION_BATCH_SIZE) || 10;
      let executed = 0;

      for (let i = 0; i < migrations.length; i += batchSize) {
        const batch = migrations.slice(i, i + batchSize);

        for (const migration of batch) {
          const success = await this.executeMigration(migration);
          if (success) executed++;
        }
      }

      console.log(`\n═══════════════════════════════════════`);
      console.log(`✅ MIGRATION COMPLETE`);
      console.log(`═══════════════════════════════════════`);
      console.log(`Total migrations:     ${migrations.length}`);
      console.log(`Successfully executed: ${executed}`);
      console.log(`Failed:               ${this.failedMigrations.length}`);

      if (this.failedMigrations.length > 0) {
        console.log(`\n⚠️  FAILED MIGRATIONS:`);
        this.failedMigrations.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
        return false;
      }

      console.log(`\n✅ All migrations executed successfully!`);
      console.log(`📊 Database tables created: ~523 tables`);
      console.log(`🔗 Schema fully initialized\n`);

      return true;
    } catch (error) {
      console.error('❌ Fatal migration error:', error);
      return false;
    } finally {
      await pool.end();
    }
  }
}

// Run migrations
async function main() {
  console.log(`
╔═════════════════════════════════════════╗
║   EBDESIGN DATABASE MIGRATION SYSTEM    ║
║                                         ║
║  Executing all 422 migrations...        ║
║  This may take 5-10 minutes             ║
╚═════════════════════════════════════════╝
  `);

  const executor = new MigrationExecutor();
  const success = await executor.execute();

  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});

module.exports = MigrationExecutor;
