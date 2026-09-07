/**
 * Database Seed Script
 *
 * package.json declares `npm run seed` -> `node src/database/seed.js`, but this
 * file did not exist at all, so that command was crashing with
 * "Cannot find module". This is a minimal, honest placeholder: it seeds a
 * small amount of reference data that other seed data can reasonably depend
 * on (roles, GST rate slabs), and logs clearly what it does NOT do.
 *
 * It does not fabricate fake farmers/products/orders/users — inventing
 * realistic-looking business data is a product decision, not something to
 * guess at silently. Extend the `seed*` functions below as real fixtures are
 * defined.
 */

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const { seedEconomic } = require('./seed_economic');

async function seedRoles() {
  const roles = [
    { name: 'admin', description: 'Full platform administrator' },
    { name: 'farmer', description: 'Farmer / producer account' },
    { name: 'buyer', description: 'Marketplace buyer account' },
    { name: 'fpo_manager', description: 'Farmer Producer Organization manager' },
    { name: 'superadmin', description: 'Super administrator' }
  ];

  for (const role of roles) {
    await pool.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [role.name, role.description]
    );
  }

  logger.info(`Seeded ${roles.length} roles`);
}

async function seedGSTRates() {
  const rates = [
    { category: 'fresh_produce', rate: 0, hsn: '0701' },
    { category: 'processed_food', rate: 5, hsn: '2001' },
    { category: 'packaged_food', rate: 12, hsn: '2106' },
    { category: 'agri_equipment', rate: 18, hsn: '8432' }
  ];

  for (const rate of rates) {
    await pool.query(
      `INSERT INTO gst_rates (product_category, gst_rate, hsn_code, effective_date, is_active)
       VALUES ($1, $2, $3, CURRENT_DATE, true)
       ON CONFLICT (product_category) DO NOTHING`,
      [rate.category, rate.rate, rate.hsn]
    );
  }

  logger.info(`Seeded ${rates.length} GST rate slabs`);
}

async function seed() {
  try {
    logger.info('Starting database seed...');
    await seedRoles();
    await seedGSTRates();
    // Economic layer seeds
    await seedEconomic(pool, logger);
    logger.info('Seed completed. NOTE: no farmers/products/orders/users were seeded — add fixtures as needed.');
  } catch (error) {
    logger.error('Seed failed', { error: error.message, stack: error.stack });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
