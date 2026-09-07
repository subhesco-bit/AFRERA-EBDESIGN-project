/**
 * Fertilizer Inventory Service (M112 — Input Supply domain)
 *
 * Backs frontend/src/pages/FertilizerInventoryPage.jsx, a real, already-built
 * stock list + "Issue Stock" flow that has never had a backend (see
 * migration 066_fertilizer_inventory_schema.sql). This file is the first
 * real backend M112 has had, and the first reader/writer agri_input_issues
 * (056_named_missing_modules.sql) has ever had.
 *
 * Reorder-point logic (getReorderAlerts): real recorded stock
 * (fertilizer_inventory.quantity) and real recorded consumption
 * (agri_input_issues rows written by issueStock() below) drive the
 * calculation:
 *
 *   reorderPoint = avgDailyConsumption * leadTimeDays + safetyStock
 *   alert when   currentStock <= reorderPoint
 *
 * avgDailyConsumption is computed from real agri_input_issues rows over a
 * trailing window. leadTimeDays and the safety-stock margin are not stored
 * anywhere in this schema, so — matching
 * financialService.farmerCreditRiskScore()'s real/assumed labelling
 * convention — they are named ASSUMED_* constants below and every alert
 * says so explicitly, rather than being presented as measured facts.
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { withTransaction } = require('../../core/withTransaction');

// ---- Assumed constants (not stored anywhere in the schema) ------------
const ASSUMED_LEAD_TIME_DAYS = 7; // typical local-dealer resupply time
const ASSUMED_SAFETY_STOCK_DAYS = 3; // buffer on top of lead time
const CONSUMPTION_WINDOW_DAYS = 90; // trailing window used to estimate daily consumption rate

// ---------------------------------------------------------------------
// Inventory CRUD (backing the stock table + add/edit/delete on the page)
// ---------------------------------------------------------------------

async function listInventory({ page = 1, limit = 100 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const offset = (Number(page) - 1) * Number(limit);
  const totalRes = await pg.query('SELECT COUNT(*) FROM fertilizer_inventory');
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  const res = await pg.query(
    'SELECT * FROM fertilizer_inventory ORDER BY name ASC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

async function createInventoryItem(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { name, category, unit, quantity, reorder_level, unit_price } = payload || {};
  if (!name || quantity === undefined || quantity === null) {
    throw new Error('name and quantity are required');
  }
  const res = await pg.query(
    `INSERT INTO fertilizer_inventory (name, category, unit, quantity, reorder_level, unit_price)
     VALUES ($1, COALESCE($2, 'Urea'), COALESCE($3, 'bag (50kg)'), $4, $5, $6)
     RETURNING *`,
    [name, category || null, unit || null, quantity, reorder_level ?? null, unit_price ?? null]
  );
  return res.rows[0];
}

async function updateInventoryItem(id, payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { name, category, unit, quantity, reorder_level, unit_price } = payload || {};
  const res = await pg.query(
    `UPDATE fertilizer_inventory SET
       name = COALESCE($1, name),
       category = COALESCE($2, category),
       unit = COALESCE($3, unit),
       quantity = COALESCE($4, quantity),
       reorder_level = COALESCE($5, reorder_level),
       unit_price = COALESCE($6, unit_price),
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, category, unit, quantity, reorder_level, unit_price, id]
  );
  return res.rows[0] || null;
}

async function deleteInventoryItem(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('DELETE FROM fertilizer_inventory WHERE id = $1 RETURNING id', [id]);
  return !!res.rows[0];
}

// ---------------------------------------------------------------------
// Issue stock — decrements real stock, writes a real consumption record
// into agri_input_issues (input_type = 'fertilizer').
// ---------------------------------------------------------------------

async function issueStock(id, payload) {
  const { quantity, issued_to, purpose } = payload || {};
  if (!quantity || Number(quantity) <= 0) throw new Error('quantity is required and must be positive');

  return withTransaction(async (client) => {
    const itemRes = await client.query('SELECT * FROM fertilizer_inventory WHERE id = $1 FOR UPDATE', [id]);
    const item = itemRes.rows[0];
    if (!item) throw new Error('Inventory item not found');
    if (Number(item.quantity) < Number(quantity)) {
      throw new Error(`Cannot issue ${quantity} ${item.unit} — only ${item.quantity} ${item.unit} in stock`);
    }

    const updateRes = await client.query(
      `UPDATE fertilizer_inventory SET quantity = quantity - $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [quantity, id]
    );

    const costInr = item.unit_price !== null ? Number(item.unit_price) * Number(quantity) : null;
    const issueRes = await client.query(
      `INSERT INTO agri_input_issues
         (input_type, product_name, quantity, unit, issued_on, cost_inr, issued_to, purpose, inventory_item_id)
       VALUES ('fertilizer', $1, $2, $3, CURRENT_DATE, $4, $5, $6, $7)
       RETURNING *`,
      [item.name, quantity, item.unit, costInr, issued_to || null, purpose || null, id]
    );

    return { item: updateRes.rows[0], issue: issueRes.rows[0] };
  }, { name: 'fertilizerInventoryService.issueStock', lockTables: [] });
}

async function listIssues({ page = 1, limit = 100 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const offset = (Number(page) - 1) * Number(limit);
  const totalRes = await pg.query(`SELECT COUNT(*) FROM agri_input_issues WHERE input_type = 'fertilizer'`);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  const res = await pg.query(
    `SELECT * FROM agri_input_issues WHERE input_type = 'fertilizer'
     ORDER BY issued_on DESC, created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { items: res.rows, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) || 1 } };
}

// ---------------------------------------------------------------------
// Reorder-point logic — real stock + real consumption, assumed constants
// labelled explicitly.
// ---------------------------------------------------------------------

async function getReorderAlerts() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  try {
    const { rows } = await pg.query(
      `SELECT
          f.id, f.name, f.category, f.unit, f.quantity, f.reorder_level,
          COALESCE(SUM(i.quantity) FILTER (
            WHERE i.issued_on >= CURRENT_DATE - ($1 || ' days')::interval
          ), 0) AS consumed_in_window,
          COUNT(*) FILTER (
            WHERE i.issued_on >= CURRENT_DATE - ($1 || ' days')::interval
          ) AS issue_count
        FROM fertilizer_inventory f
        LEFT JOIN agri_input_issues i
          ON i.inventory_item_id = f.id AND i.input_type = 'fertilizer'
        GROUP BY f.id, f.name, f.category, f.unit, f.quantity, f.reorder_level
        ORDER BY f.name`,
      [CONSUMPTION_WINDOW_DAYS]
    );

    const items = rows.map((r) => {
      const consumed = Number(r.consumed_in_window);
      const issueCount = Number(r.issue_count);
      const hasConsumptionHistory = issueCount > 0;
      const avgDailyConsumption = hasConsumptionHistory ? consumed / CONSUMPTION_WINDOW_DAYS : null;
      const reorderPoint = hasConsumptionHistory
        ? Math.round((avgDailyConsumption * ASSUMED_LEAD_TIME_DAYS + avgDailyConsumption * ASSUMED_SAFETY_STOCK_DAYS) * 100) / 100
        : null;
      const currentStock = Number(r.quantity);
      const needsReorder = reorderPoint !== null
        ? currentStock <= reorderPoint
        : (r.reorder_level !== null && currentStock <= Number(r.reorder_level)); // fallback: manual reorder_level, no consumption history yet

      return {
        id: r.id,
        name: r.name,
        category: r.category,
        unit: r.unit,
        currentStock,
        manualReorderLevel: r.reorder_level !== null ? Number(r.reorder_level) : null,
        avgDailyConsumption: avgDailyConsumption !== null ? Math.round(avgDailyConsumption * 1000) / 1000 : null,
        consumptionWindowDays: CONSUMPTION_WINDOW_DAYS,
        computedReorderPoint: reorderPoint,
        needsReorder,
        basis: hasConsumptionHistory
          ? 'real avg daily consumption (agri_input_issues) x assumed lead time + assumed safety stock'
          : 'no issuance history yet — falling back to the manually-set reorder_level (if any)',
        dataQuality: hasConsumptionHistory ? 'real' : 'assumed_fallback',
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      assumptions: {
        leadTimeDays: ASSUMED_LEAD_TIME_DAYS,
        safetyStockDays: ASSUMED_SAFETY_STOCK_DAYS,
        consumptionWindowDays: CONSUMPTION_WINDOW_DAYS,
        quality: 'assumed — lead time and safety-stock margin are not stored anywhere in the schema',
      },
      items,
      reorderCount: items.filter((i) => i.needsReorder).length,
    };
  } catch (error) {
    logger.error('Error computing fertilizer reorder alerts', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  issueStock,
  listIssues,
  getReorderAlerts,
};

// Merged from backend/src/modules/M042
{
  const m042 = require("../../modules/M042/service");
  const { ...rest } = m042;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M102
{
  const m102 = require("../../modules/M102/service");
  const { ...rest } = m102;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M103
{
  const m103 = require("../../modules/M103/service");
  const { ...rest } = m103;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M108
{
  const m108 = require("../../modules/M108/service");
  const { ...rest } = m108;
  Object.assign(module.exports, rest);
}

// Merged from backend/src/modules/M109 - 1 name(s) collided and were aliased
{
  const m109 = require("../../modules/M109/service");
  const { generateInventoryReport: generateInventoryReportFromBE109, ...rest } = m109;
  Object.assign(module.exports, rest, { generateInventoryReportFromBE109 });
}
