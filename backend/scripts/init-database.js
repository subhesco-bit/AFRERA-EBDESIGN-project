#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL, runs migrations, loads seed data
 *
 * Usage: node scripts/init-database.js
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function header(message) {
  log(`\n${'═'.repeat(60)}`, 'cyan');
  log(`   ${message}`, 'cyan');
  log(`${'═'.repeat(60)}\n`, 'cyan');
}

async function runCommand(command, description) {
  try {
    info(description);
    execSync(command, { stdio: 'inherit' });
    success(`${description} completed`);
    return true;
  } catch (err) {
    error(`${description} failed: ${err.message}`);
    return false;
  }
}

async function main() {
  header('EBDESIGN DATABASE INITIALIZATION');

  log('Starting database setup...\n');

  // Step 1: Check prerequisites
  log('Step 1/5: Checking prerequisites...', 'cyan');

  // Check if .env exists
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    warning('No .env file found. Creating .env with defaults...');
    const envExample = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(envExample)) {
      fs.copyFileSync(envExample, envPath);
      success('.env created from .env.example');
    } else {
      error('.env.example not found!');
      process.exit(1);
    }
  } else {
    success('.env file exists');
  }

  // Check if Node modules installed
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    warning('node_modules not found. Running npm install...');
    await runCommand('npm install', 'Installing dependencies');
  } else {
    success('Dependencies installed');
  }

  // Step 2: Database connection
  log('\nStep 2/5: Database connection...', 'cyan');
  info('Testing PostgreSQL connection...');

  try {
    const { initialize, getPostgreSQL } = require('../src/database/connection');
    await initialize();
    const db = getPostgreSQL();

    if (db) {
      const result = await db.query('SELECT version()');
      success(`PostgreSQL connected: ${result.rows[0].version.split(',')[0]}`);
    } else {
      error('Database connection failed!');
      process.exit(1);
    }
  } catch (err) {
    error(`Database connection error: ${err.message}`);
    info('Make sure PostgreSQL is running on port 15432');
    info('Docker command: docker run -d -p 15432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine');
    process.exit(1);
  }

  // Step 3: Run migrations
  log('\nStep 3/5: Running migrations...', 'cyan');
  info('Executing all database migrations (this may take 2-3 minutes)...');

  try {
    const migrationDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    info(`Found ${files.length} migration files to execute`);

    const { getPostgreSQL } = require('../src/database/connection');
    const db = getPostgreSQL();

    let executed = 0;
    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await db.query(sql);
        executed++;
        if (executed % 50 === 0) {
          info(`Executed ${executed}/${files.length} migrations...`);
        }
      } catch (err) {
        warning(`Migration ${file} failed (might already be executed): ${err.message}`);
      }
    }

    success(`Executed ${executed}/${files.length} migrations`);
  } catch (err) {
    error(`Migration execution failed: ${err.message}`);
    process.exit(1);
  }

  // Step 4: Load seed data
  log('\nStep 4/5: Loading seed data...', 'cyan');
  info('Loading 100+ agricultural varieties and product data...');

  try {
    const seedDir = path.join(__dirname, '..', 'src', 'database', 'seeds');
    if (fs.existsSync(seedDir)) {
      const seedFiles = fs.readdirSync(seedDir)
        .filter(f => f.endsWith('.js'))
        .sort();

      const { getPostgreSQL } = require('../src/database/connection');
      const db = getPostgreSQL();

      for (const file of seedFiles) {
        const seedPath = path.join(seedDir, file);
        info(`Running seed: ${file}`);
        const seedFunc = require(seedPath);

        if (typeof seedFunc === 'function') {
          await seedFunc(db);
        }
      }

      success('Seed data loaded');
    } else {
      warning('No seed data directory found (optional step)');
    }
  } catch (err) {
    warning(`Seed data loading failed (non-critical): ${err.message}`);
  }

  // Step 5: Verification
  log('\nStep 5/5: Verification...', 'cyan');

  try {
    const { getPostgreSQL } = require('../src/database/connection');
    const db = getPostgreSQL();

    // Count tables
    const tablesResult = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tableCount = tablesResult.rows[0].count;

    // Get schema size
    const sizeResult = await db.query(`
      SELECT pg_size_pretty(pg_database_size('ebdesign_prod')) as size
    `);
    const dbSize = sizeResult.rows[0].size;

    success(`Database verification complete:`);
    info(`  • Tables created: ${tableCount}`);
    info(`  • Database size: ${dbSize}`);

    if (tableCount > 100) {
      success('✨ Database is ready for production!');
    }
  } catch (err) {
    error(`Verification failed: ${err.message}`);
  }

  header('DATABASE INITIALIZATION COMPLETE');

  log('\nNext steps:', 'cyan');
  log('1. Start backend: npm run dev', 'blue');
  log('2. Check health: curl http://localhost:3000/health', 'blue');
  log('3. View status: curl http://localhost:3000/api/v1/system/stats', 'blue');
  log('\n');
}

// Run with error handling
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
