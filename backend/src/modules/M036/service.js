// Service for M036 Module — Seed Germination Tracking
//
// Logs germination test batches (seeds tested vs. seeds germinated) and
// computes a germination-rate percentage, checks it against the
// crop-specific minimum certified-seed standard, and estimates when the
// lot's viability should next be re-tested based on storage condition.
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'agronomist_m036_items';

// Minimum germination standards (%) for certified seed by crop group —
// modelled on Indian Minimum Seed Certification Standards (IMSCS).
const MIN_GERMINATION_STANDARD = {
  cereal: 85, rice: 80, wheat: 85, maize: 90,
  pulse: 75, legume: 75,
  vegetable: 70, oilseed: 70
};

// How fast stored seed viability decays per month (percentage points),
// and therefore how soon a retest is recommended, by storage condition.
const VIABILITY_DECAY_PER_MONTH = { cold_storage: 0.5, ambient_dry: 1.5, ambient_humid: 4 };
const RETEST_INTERVAL_MONTHS = { cold_storage: 6, ambient_dry: 4, ambient_humid: 2 };

function standardFor(cropGroup) {
  return MIN_GERMINATION_STANDARD[String(cropGroup || '').toLowerCase()] || MIN_GERMINATION_STANDARD.vegetable;
}

/**
 * Compute germination rate and viability status for one test batch.
 */
function computeGerminationStatus({ crop_group, seeds_tested, seeds_germinated, test_date, storage_condition }) {
  if (!seeds_tested || seeds_tested <= 0) {
    return { error: 'seeds_tested must be a positive number' };
  }
  const rate = Math.round((seeds_germinated / seeds_tested) * 1000) / 10;
  const standard = standardFor(crop_group);
  const meetsStandard = rate >= standard;

  const storageKey = MIN_GERMINATION_STANDARD[storage_condition] ? storage_condition : (VIABILITY_DECAY_PER_MONTH[storage_condition] ? storage_condition : 'ambient_dry');
  const decayPerMonth = VIABILITY_DECAY_PER_MONTH[storageKey] || VIABILITY_DECAY_PER_MONTH.ambient_dry;
  const retestMonths = RETEST_INTERVAL_MONTHS[storageKey] || RETEST_INTERVAL_MONTHS.ambient_dry;

  const testDate = test_date ? new Date(test_date) : new Date();
  const nextRetestDate = new Date(testDate);
  nextRetestDate.setMonth(nextRetestDate.getMonth() + retestMonths);

  // Projected viability at the next retest date, given the storage decay rate.
  const projectedViability = Math.max(0, Math.round((rate - decayPerMonth * retestMonths) * 10) / 10);

  return {
    germination_rate_pct: rate,
    min_standard_pct: standard,
    meets_certification_standard: meetsStandard,
    storage_condition: storageKey,
    viability_decay_pct_per_month: decayPerMonth,
    next_retest_date: nextRetestDate.toISOString().slice(0, 10),
    projected_viability_at_retest_pct: projectedViability,
    reasoning: `${seeds_germinated}/${seeds_tested} seeds germinated (${rate}%) against a ${standard}% minimum standard for ` +
      `${crop_group || 'this crop group'} — ${meetsStandard ? 'meets' : 'FAILS'} certification. ` +
      `Under ${storageKey} storage, viability decays ~${decayPerMonth}%/month, so a retest is recommended by ${nextRetestDate.toISOString().slice(0, 10)} ` +
      `(projected viability by then: ${projectedViability}%).`
  };
}

async function listItems({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM ${tableName}`);
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function createItem(payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW()) RETURNING *`, [payload]);
  return res.rows[0];
}

async function updateItem(id, payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [payload, id]);
  return res.rows[0] || null;
}

async function deleteItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

async function createGerminationTest(payload) {
  const status = computeGerminationStatus(payload);
  if (status.error) return status;
  return createItem({ ...payload, ...status, record_type: 'germination_test' });
}

module.exports = {
  listItems, getItem, createItem, updateItem, deleteItem,
  MIN_GERMINATION_STANDARD, computeGerminationStatus, createGerminationTest
};
