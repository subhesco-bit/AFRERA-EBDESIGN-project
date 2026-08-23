/**
 * Database Migration Runner
 * Runs all pending migrations in order
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const migrationsDir = path.join(__dirname, 'migrations');

// Was declared inside the for-loop body below (a function declaration
// re-created on every iteration - harmless here since it was redefined
// identically each time, but non-standard block-scoped function
// declarations behave inconsistently across engines/modes). Hoisted out and
// takes the filename explicitly instead of closing over the loop's `file`.
async function runMigrationWithRecording(sql, filename) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    logger.info(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'NOT CONFIGURED'}`);

    // Test database connection first
    try {
      await pool.query('SELECT NOW()');
      logger.info('Database connection successful');
    } catch (connError) {
      logger.error('Database connection failed', { error: connError.message });
      logger.error('Please ensure:');
      logger.error('1. PostgreSQL is running');
      logger.error('2. DATABASE_URL is set in .env file');
      logger.error('3. Database exists and is accessible');
      logger.error('');
      logger.error('To set up database, run: node scripts/setup_database.ps1');
      throw new Error('Database connection failed. Please check your DATABASE_URL configuration.');
    }

    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${migrationFiles.length} migration files`);

    // Get executed migrations
    const executedResult = await pool.query('SELECT filename FROM schema_migrations');
    const executedFiles = new Set(executedResult.rows.map(row => row.filename));

    // Prepare helper folders
    const failedDir = path.join(migrationsDir, 'failed');
    const repairsDir = path.join(migrationsDir, 'repairs');
    if (!fs.existsSync(failedDir)) fs.mkdirSync(failedDir);
    if (!fs.existsSync(repairsDir)) fs.mkdirSync(repairsDir);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedFiles.has(file)) {
        logger.info(`Skipping already executed migration: ${file}`);
        continue;
      }

      logger.info(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Attempt to run the migration; on failure try an automated repair then archive
      let migrationSuccess = false;
      let firstError = null;

      try {
        await runMigrationWithRecording(migrationSQL, file);
        logger.info(`Migration completed: ${file}`);
        migrationSuccess = true;
      } catch (error) {
        firstError = error;
        logger.warn(`Migration ${file} failed on first attempt: ${error.message}`);
      }

      if (!migrationSuccess) {
        // Try automated repair heuristics
        const repairedSQL = tryAutoRepair(migrationSQL);
        if (repairedSQL && repairedSQL !== migrationSQL) {
          logger.info(`Attempting automated repair for ${file}`);
          try {
            await runMigrationWithRecording(repairedSQL, file);
            logger.info(`Migration completed after automated repair: ${file}`);
            // Save repaired version for audit
            fs.writeFileSync(path.join(repairsDir, `repaired_${file}`), repairedSQL, 'utf8');
            migrationSuccess = true;
          } catch (err2) {
            logger.warn(`Automated repair also failed for ${file}: ${err2.message}`);
          }
        } else {
          logger.info(`No automated repair available for ${file}`);
        }
      }

      if (migrationSuccess) {
        continue;
      }

      // Archive the failing migration and create a repair template for manual rewrite
      const archivedPath = path.join(failedDir, `${file}.failed`);
      fs.copyFileSync(migrationPath, archivedPath);
      logger.warn(`Archived failing migration to ${archivedPath}`);

      const repairTemplate = `-- Repair template for ${file}\n-- Original migration archived at: migrations/failed/${file}.failed\n-- Please inspect the archived SQL and write a corrected, idempotent migration here.\n\n-- Original SQL (commented)\n-- ==================================\n${migrationSQL.split('\n').map(line => `-- ${line}`).join('\n')}\n\n-- REWRITE YOUR MIGRATION BELOW THIS LINE\n`;
      const repairPath = path.join(repairsDir, `repair_${file}`);
      fs.writeFileSync(repairPath, repairTemplate, 'utf8');
      logger.warn(`Created repair template at ${repairPath}`);

      // Stop processing further migrations so user can fix the issue
      throw new Error(`Migration ${file} failed and requires manual repair; archived at ${archivedPath}, repair template at ${repairPath}`);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration error', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (poolError) {
      logger.error('Error closing database pool', { error: poolError.message });
    }
  }
}

/**
 * tryAutoRepair - apply simple idempotent heuristics to make common migrations safer
 * Returns repaired SQL string or null if no repair was performed
 */
function tryAutoRepair(sql) {
  const original = sql;
  let modified = sql;

  // Add IF NOT EXISTS to CREATE TABLE if missing
  modified = modified.replace(/CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?([\w.]+)/gi, (m, ifExists) => {
    if (ifExists) return m; // already has IF NOT EXISTS
    return m.replace(/CREATE\s+TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
  });

  // Add IF NOT EXISTS to ALTER TABLE ... ADD COLUMN
  modified = modified.replace(/ALTER\s+TABLE\s+([\w.]+)\s+ADD\s+COLUMN\s+/gi, (m) => {
    return m.replace(/ADD\s+COLUMN\s+/i, 'ADD COLUMN IF NOT EXISTS ');
  });

  // Ensure INSERT ... ON CONFLICT DO NOTHING for idempotent seeds
  modified = modified.replace(/INSERT\s+INTO\s+([\w._]+)\s+\(([^)]+)\)\s+VALUES\s*\(([^;]+)\);/gi, (m) => {
    if (/ON\s+CONFLICT/i.test(m)) return m; // already has conflict handling
    return m.replace(/;?\s*$/,' ON CONFLICT DO NOTHING;');
  });

  if (modified === original) return null;
  return modified;
}


async function rollbackMigration(filename) {
  try {
    logger.info(`Rolling back migration: ${filename}`);

    // Remove from executed migrations
    await pool.query('DELETE FROM schema_migrations WHERE filename = $1', [filename]);

    logger.info(`Rollback completed: ${filename}`);
  } catch (error) {
    // eslint-disable-next-line no-process-exit
    logger.error('Rollback error', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (poolError) {
      logger.error('Error closing database pool', { error: poolError.message });
    }
  }
}

async function showMigrationStatus() {
  try {
    // Synchronous readdir is acceptable for CLI tool one-time execution
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const executedResult = await pool.query('SELECT filename, executed_at FROM schema_migrations ORDER BY executed_at');
    const executedFiles = new Map(executedResult.rows.map(row => [row.filename, row.executed_at]));

    const statusLines = ['\nMigration Status:', '=================='];

    for (const file of migrationFiles) {
      const executed = executedFiles.get(file);
      if (executed) {
        statusLines.push(`✅ ${file} - Executed at ${new Date(executed).toLocaleString()}`);
      } else {
        statusLines.push(`⏳ ${file} - Pending`);
      }
    }

    statusLines.push('==================\n');
    console.log(statusLines.join('\n'));
  } catch (error) {
    // eslint-disable-next-line no-process-exit
    logger.error('Error showing migration status', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (poolError) {
      logger.error('Error closing database pool', { error: poolError.message });
    }
  }
}

// CLI interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'up':
  case undefined:
    runMigrations();
    break;
  case 'down':
    if (!arg) {
      console.error('Usage: node migrate.js down <filename>');
      process.exit(1);
    }
    rollbackMigration(arg);
    break;
  case 'status':
    showMigrationStatus();
    break;
  default:
    console.error(`Unknown command: ${command}. Usage: node migrate.js [up|down <filename>|status]`);
    process.exit(1);
    break;
}
