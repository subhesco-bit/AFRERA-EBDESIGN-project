// Service for Harvest Planning (M069)
// Real CRUD over the `crop_m069_items` table created in
// migrations/3000_M069_generated.sql. That table (like every generated
// scaffold table — see M022/M055/M056) stores the record payload in a
// generic `data` JSONB column; this service flattens `data` back onto
// each row before returning it, so callers get a normal
// { id, crop, field_name, ... } shape instead of a nested `data` object.
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'crop_m069_items';

const MAX_PAGE_SIZE = 100;

function normalizePagination({ page = 1, limit = 20 } = {}) {
  const normalizedPage = Number.parseInt(page, 10);
  const normalizedLimit = Number.parseInt(limit, 10);
  return {
    page: Number.isInteger(normalizedPage) && normalizedPage > 0 ? normalizedPage : 1,
    limit: Number.isInteger(normalizedLimit) && normalizedLimit > 0
      ? Math.min(normalizedLimit, MAX_PAGE_SIZE)
      : 20,
  };
}

function assertHarvestPlan(payload = {}) {
  const required = ['plotId', 'cropId', 'plannedHarvestDate', 'labourPlan', 'equipmentPlan'];
  const missing = required.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
  if (missing.length) throw new Error(`Harvest plan requires: ${missing.join(', ')}`);
  if (!Number.isFinite(Number(payload.expectedQuantity)) || Number(payload.expectedQuantity) < 0) {
    throw new Error('expectedQuantity must be a non-negative number');
  }
  if (Number.isNaN(Date.parse(payload.plannedHarvestDate))) {
    throw new Error('plannedHarvestDate must be an ISO-compatible date');
  }
}

function flatten(row) {
  if (!row) return row;
  const { data, ...rest } = row;
  return { ...rest, ...(data || {}) };
}

async function listItems({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  ({ page, limit } = normalizePagination({ page, limit }));
  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM ${tableName}`);
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
  return { items: res.rows.map(flatten), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getItem(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return flatten(res.rows[0]) || null;
}

async function createItem(payload = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  assertHarvestPlan(payload);
  const res = await pg.query(`INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW()) RETURNING *`, [payload]);
  return flatten(res.rows[0]);
}

async function updateItem(id, payload = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const current = await pg.query(`SELECT data FROM ${tableName} WHERE id = $1`, [id]);
  if (!current.rows[0]) return null;
  // PUT is treated as a safe replacement only after preserving unspecified
  // plan fields. This avoids a partial client update silently deleting the
  // operational evidence required for a harvest plan.
  const merged = { ...(current.rows[0].data || {}), ...payload };
  assertHarvestPlan(merged);
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [merged, id]);
  return flatten(res.rows[0]) || null;
}

async function deleteItem(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return Boolean(res.rows[0]);
}

module.exports = {
  MAX_PAGE_SIZE,
  assertHarvestPlan,
  normalizePagination,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};
