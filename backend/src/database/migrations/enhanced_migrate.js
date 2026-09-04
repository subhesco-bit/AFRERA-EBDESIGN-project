/**
 * Enhanced Database Migration System
 * Production-ready migration runner with advanced features
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');
const { ensureSchemaMigrations } = require('../schema_migrations');
const { isMechanicallyCertainTypeError, quarantineMigration } = require('../migration_quarantine');

class EnhancedMigrationSystem {
  constructor(config = {}) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...config.poolConfig
    });
    this.migrationsDir = config.migrationsDir || __dirname;
    this.lockTimeout = config.lockTimeout || 300000; // 5 minutes default
    this.dryRun = config.dryRun || false;
    this.force = config.force || false;
  }

  /**
   * Initialize migration system
   */
  async initialize() {
    try {
      await ensureSchemaMigrations(this.pool);

      // Create migration lock table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS migration_locks (
          id SERIAL PRIMARY KEY,
          lock_key VARCHAR(255) UNIQUE NOT NULL,
          locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          locked_by VARCHAR(255),
          expires_at TIMESTAMP
        )
      `);

      logger.info('Enhanced migration system initialized');
    } catch (error) {
      logger.error('Failed to initialize migration system', { error: error.message });
      throw error;
    }
  }

  /**
   * Acquire migration lock to prevent concurrent runs
   */
  async acquireLock() {
    const lockKey = 'migration_runner';
    const expiresAt = new Date(Date.now() + this.lockTimeout);
    const lockedBy = process.env.HOSTNAME || 'unknown';

    try {
      await this.pool.query(`
        INSERT INTO migration_locks (lock_key, locked_by, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (lock_key) 
        DO UPDATE SET 
          locked_by = EXCLUDED.locked_by,
          expires_at = EXCLUDED.expires_at
        WHERE migration_locks.expires_at < CURRENT_TIMESTAMP
      `, [lockKey, lockedBy, expiresAt]);

      // Verify we got the lock
      const { rows } = await this.pool.query(
        'SELECT * FROM migration_locks WHERE lock_key = $1 AND locked_by = $2',
        [lockKey, lockedBy]
      );

      if (rows.length === 0) {
        throw new Error('Migration is already locked by another process');
      }

      logger.info('Migration lock acquired');
      return true;
    } catch (error) {
      logger.error('Failed to acquire migration lock', { error: error.message });
      throw error;
    }
  }

  /**
   * Release migration lock
   */
  async releaseLock() {
    try {
      await this.pool.query('DELETE FROM migration_locks WHERE lock_key = $1', ['migration_runner']);
      logger.info('Migration lock released');
    } catch (error) {
      logger.error('Failed to release migration lock', { error: error.message });
    }
  }

  /**
   * Calculate checksum of migration file
   */
  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Extract migration metadata from file
   */
  extractMetadata(filename, content) {
    const metadata = {
      version: filename.split('_')[0] || '1.0.0',
      description: '',
      dependencies: []
    };

    // Parse comments for metadata
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^--\s*@(\w+):\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        if (key === 'description') {
          metadata.description = value;
        } else if (key === 'depends') {
          metadata.dependencies = value.split(',').map(d => d.trim());
        } else if (key === 'version') {
          metadata.version = value;
        }
      }
    }

    return metadata;
  }

  /**
   * Get all migration files with metadata
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    this.logPrefixCollisions(files);

    return files.map(file => {
      const filePath = path.join(this.migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const checksum = this.calculateChecksum(content);
      const metadata = this.extractMetadata(file, content);

      return {
        filename: file,
        path: filePath,
        content,
        checksum,
        ...metadata
      };
    });
  }

  logPrefixCollisions(files) {
    const prefixes = new Map();
    for (const file of files) {
      const prefix = file.match(/^([^_]+)_/)?.[1] || '[no-prefix]';
      if (!prefixes.has(prefix)) prefixes.set(prefix, []);
      prefixes.get(prefix).push(file);
    }
    for (const [prefix, names] of prefixes) {
      if (names.length > 1) {
        logger.warn(`Migration filename prefix collision ${prefix}; deterministic lexical order: ${names.join(', ')}`);
      }
    }
  }

  /**
   * Get executed migrations from database
   */
  async getExecutedMigrations() {
    try {
      const { rows } = await this.pool.query(
        'SELECT filename, version, checksum, executed_at FROM schema_migrations ORDER BY executed_at'
      );
      return new Map(rows.map(row => [row.filename, row]));
    } catch (error) {
      logger.error('Failed to get executed migrations', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate migration dependencies
   */
  validateDependencies(migrations, executedMigrations) {
    const executedSet = new Set(executedMigrations.keys());
    const errors = [];

    for (const migration of migrations) {
      for (const dep of migration.dependencies) {
        if (!executedSet.has(dep)) {
          errors.push(`Migration ${migration.filename} depends on ${dep} which has not been executed`);
        }
      }
      executedSet.add(migration.filename);
    }

    return errors;
  }

  /**
   * Check if migration checksum has changed
   */
  async checkChecksumIntegrity(migrations, executedMigrations) {
    const warnings = [];

    for (const migration of migrations) {
      const executed = executedMigrations.get(migration.filename);
      if (executed && executed.checksum !== migration.checksum) {
        warnings.push(
          `Migration ${migration.filename} has changed since execution. ` +
          `Original: ${executed.checksum.substring(0, 8)}..., Current: ${migration.checksum.substring(0, 8)}...`
        );
      }
    }

    return warnings;
  }

  /**
   * Execute a single migration
   */
  async executeMigration(migration) {
    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      if (this.dryRun) {
        logger.info(`[DRY RUN] Would execute migration: ${migration.filename}`);
        return { success: true, executionTime: 0 };
      }

      await client.query('BEGIN');

      // Execute migration SQL
      await client.query(migration.content);

      const executionTime = Date.now() - startTime;

      // Record migration execution
      await client.query(`
        INSERT INTO schema_migrations (
          filename, version, checksum, execution_time_ms, 
          success, dependencies, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        migration.filename,
        migration.version,
        migration.checksum,
        executionTime,
        true,
        migration.dependencies,
        migration.description
      ]);

      await client.query('COMMIT');

      logger.info(`Migration executed: ${migration.filename} (${executionTime}ms)`);
      return { success: true, executionTime };
    } catch (error) {
      await client.query('ROLLBACK');
      
      // Record failed migration
      await client.query(`
        INSERT INTO schema_migrations (
          filename, version, checksum, execution_time_ms, 
          success, dependencies, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        migration.filename,
        migration.version,
        migration.checksum,
        Date.now() - startTime,
        false,
        migration.dependencies,
        migration.description
      ]);

      logger.error(`Migration failed: ${migration.filename}`, { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    try {
      if (this.dryRun) {
        const migrations = this.getMigrationFiles();
        logger.info(`[DRY RUN] Would inspect ${migrations.length} migration files`);
        migrations.forEach(migration => {
          logger.info(`[DRY RUN] Would execute migration: ${migration.filename}`);
        });
        return {
          success: true,
          executed: 0,
          failed: 0,
          totalTime: 0,
          dryRun: true
        };
      }

      await this.initialize();
      await this.acquireLock();

      logger.info('Starting enhanced migration process...');

      const migrations = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      logger.info(`Found ${migrations.length} migration files`);
      logger.info(`Already executed: ${executedMigrations.size} migrations`);

      // Validate dependencies
      const dependencyErrors = this.validateDependencies(migrations, executedMigrations);
      if (dependencyErrors.length > 0) {
        if (!this.force) {
          throw new Error(`Dependency validation failed:\n${dependencyErrors.join('\n')}`);
        }
        logger.warn('Dependency validation errors (force mode):', dependencyErrors);
      }

      // Check checksum integrity
      const checksumWarnings = await this.checkChecksumIntegrity(migrations, executedMigrations);
      if (checksumWarnings.length > 0) {
        logger.warn('Checksum integrity warnings:', checksumWarnings);
        if (!this.force) {
          throw new Error('Migration files have changed since execution. Use --force to proceed.');
        }
      }

      // Execute pending migrations
      let executedCount = 0;
      let failedCount = 0;
      let totalExecutionTime = 0;

      for (const migration of migrations) {
        if (executedMigrations.has(migration.filename)) {
          logger.info(`Skipping already executed migration: ${migration.filename}`);
          continue;
        }

        try {
          const result = await this.executeMigration(migration);
          if (result.success) {
            executedCount++;
            totalExecutionTime += result.executionTime;
          }
        } catch (error) {
          failedCount++;
          if (isMechanicallyCertainTypeError(error)) {
            const quarantinePath = quarantineMigration(this.migrationsDir, migration.filename, error);
            logger.error(`Quarantined ${migration.filename} after confirmed type/FK incompatibility: ${quarantinePath}`);
          }
          logger.error(`Migration ${migration.filename} failed, stopping execution`);
          break;
        }
      }

      logger.info(`Migration complete: ${executedCount} executed, ${failedCount} failed`);
      logger.info(`Total execution time: ${totalExecutionTime}ms`);

      return {
        success: failedCount === 0,
        executed: executedCount,
        failed: failedCount,
        totalTime: totalExecutionTime
      };
    } catch (error) {
      logger.error('Migration process failed', { error: error.message, stack: error.stack });
      throw error;
    } finally {
      if (!this.dryRun) {
        await this.releaseLock();
      }
      await this.pool.end();
    }
  }

  /**
   * Rollback last migration
   */
  async rollback() {
    try {
      await this.initialize();
      await this.acquireLock();

      const { rows } = await this.pool.query(`
        SELECT filename, rollback_filename 
        FROM schema_migrations 
        WHERE success = TRUE 
        ORDER BY executed_at DESC 
        LIMIT 1
      `);

      if (rows.length === 0) {
        logger.info('No migrations to rollback');
        return { success: true, message: 'No migrations to rollback' };
      }

      const lastMigration = rows[0];
      
      if (!lastMigration.rollback_filename) {
        throw new Error(`Migration ${lastMigration.filename} does not have a rollback file`);
      }

      const rollbackPath = path.join(this.migrationsDir, lastMigration.rollback_filename);
      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackPath}`);
      }

      const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');
        await client.query(rollbackContent);
        await client.query('DELETE FROM schema_migrations WHERE filename = $1', [lastMigration.filename]);
        await client.query('COMMIT');

        logger.info(`Rollback completed: ${lastMigration.filename}`);
        return { success: true, rolledBack: lastMigration.filename };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Rollback failed', { error: error.message });
      throw error;
    } finally {
      await this.releaseLock();
      await this.pool.end();
    }
  }

  /**
   * Show migration status
   */
  async status() {
    try {
      await this.initialize();

      const migrations = this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();

      const statusLines = ['\nMigration Status:', '=================='];
      const checksumWarnings = await this.checkChecksumIntegrity(migrations, executedMigrations);

      for (const migration of migrations) {
        const executed = executedMigrations.get(migration.filename);
        if (executed) {
          const checksumChanged = executed.checksum !== migration.checksum;
          const status = checksumChanged ? '⚠️  MODIFIED' : '✅';
          statusLines.push(
            `${status} ${migration.filename} - Executed at ${new Date(executed.executed_at).toLocaleString()}`
          );
        } else {
          statusLines.push(`⏳ ${migration.filename} - Pending`);
        }
      }

      if (checksumWarnings.length > 0) {
        statusLines.push('\n⚠️  Checksum Warnings:');
        checksumWarnings.forEach(w => statusLines.push(`  - ${w}`));
      }

      statusLines.push('==================\n');
      console.log(statusLines.join('\n'));

      return {
        total: migrations.length,
        executed: executedMigrations.size,
        pending: migrations.length - executedMigrations.size,
        warnings: checksumWarnings.length
      };
    } catch (error) {
      logger.error('Failed to get migration status', { error: error.message });
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  /**
   * Create a new migration file
   */
  createMigration(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filePath = path.join(this.migrationsDir, filename);

    const template = `-- Migration: ${name}
-- Description: ${description}
-- Version: 1.0.0
-- Created: ${new Date().toISOString()}
-- @depends: 
-- @description: ${description}

-- Add your migration SQL here

-- For rollback, create a corresponding file: rollback_${filename}
`;

    fs.writeFileSync(filePath, template, 'utf8');
    logger.info(`Created migration file: ${filename}`);
    return filename;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const system = new EnhancedMigrationSystem({
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force')
  });

  switch (command) {
    case 'up':
    case 'migrate':
    case undefined:
      system.runMigrations().catch(error => {
        logger.error('Migration run failed', { error: error.message, stack: error.stack });
        process.exit(1);
      });
      break;
    case 'down':
    case 'rollback':
      system.rollback().catch(error => {
        logger.error('Rollback failed', { error: error.message, stack: error.stack });
        process.exit(1);
      });
      break;
    case 'status':
      system.status().catch(error => {
        logger.error('Status check failed', { error: error.message, stack: error.stack });
        process.exit(1);
      });
      break;
    case 'create': {
      const name = args[1];
      const description = args[2] || '';
      if (!name) {
        logger.error('Usage: node enhanced_migrate.js create <name> [description]');
        process.exit(1);
      }
      system.createMigration(name, description);
      break;
    }
    default:
      logger.error(`Unknown command: ${command}`);
      logger.error('Usage: node enhanced_migrate.js <command> [options]');
      logger.error('Commands:');
      logger.error('  up | migrate          Run all pending migrations');
      logger.error('  down | rollback        Roll back the last migration');
      logger.error('  status                 Show migration status');
      logger.error('  create <name> [desc]   Scaffold a new migration file');
      logger.error('Options:');
      logger.error('  --dry-run              Preview migrations without executing');
      logger.error('  --force                Bypass dependency/checksum validation warnings');
      process.exit(1);
  }
}

module.exports = EnhancedMigrationSystem;
