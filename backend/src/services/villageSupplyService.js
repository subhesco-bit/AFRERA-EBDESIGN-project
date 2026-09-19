'use strict';

const { getPostgreSQL } = require('../database/connection');

function dbOrThrow() {
  const db = getPostgreSQL();
  if (!db) throw new Error('PostgreSQL is not initialized');
  return db;
}

const ALLOWED_LAYERS = new Set(['household', 'village', 'agro']);
const ALLOWED_PRIORITIES = new Set(['critical', 'high', 'normal', 'low']);

function assertLayer(value) {
  if (!ALLOWED_LAYERS.has(value)) throw new Error('Invalid demand layer');
}

function assertPriority(value) {
  if (!ALLOWED_PRIORITIES.has(value)) throw new Error('Invalid priority');
}

async function listCatalog({ demandLayer, category } = {}) {
  const db = dbOrThrow();
  if (demandLayer) assertLayer(demandLayer);
  const result = await db.query(
    `SELECT * FROM village_supply_catalog
     WHERE active = TRUE
       AND ($1::varchar IS NULL OR demand_layer = $1)
       AND ($2::varchar IS NULL OR category = $2)
     ORDER BY category, item_name`,
    [demandLayer || null, category || null],
  );
  return result.rows;
}

async function createDemand({ villageId, demandLayer, itemId, requiredQuantity, unit, needPeriodStart,
  needPeriodEnd = null, priority = 'normal', source = 'manual', purpose = null,
  householdId = null, requesterType = null, requesterId = null, metadata = {} }) {
  const db = dbOrThrow();
  assertLayer(demandLayer);
  assertPriority(priority);
  if (!villageId || !itemId || !requiredQuantity || !unit || !needPeriodStart) {
    throw new Error('villageId, demandLayer, itemId, requiredQuantity, unit and needPeriodStart are required');
  }
  if (Number(requiredQuantity) <= 0) throw new Error('requiredQuantity must be greater than zero');

  const result = await db.query(
    `INSERT INTO village_external_demands
      (village_id, demand_layer, household_id, requester_type, requester_id, item_id,
       required_quantity, unit, need_period_start, need_period_end, priority, source, purpose, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
     RETURNING *`,
    [villageId, demandLayer, householdId, requesterType, requesterId, itemId,
      requiredQuantity, unit, needPeriodStart, needPeriodEnd, priority, source, purpose, JSON.stringify(metadata)],
  );
  return result.rows[0];
}

async function getPlan(villageId, demandLayer) {
  const db = dbOrThrow();
  if (demandLayer) assertLayer(demandLayer);
  const result = await db.query(
    `SELECT * FROM village_external_supply_plan
     WHERE village_id = $1
       AND ($2::varchar IS NULL OR demand_layer = $2)
     ORDER BY critical_records DESC, high_priority_records DESC, earliest_need_date, item_name`,
    [villageId, demandLayer || null],
  );
  return result.rows;
}

async function createOrder({ villageId, demandLayer, requestedByType, requestedById,
  requiredBy = null, deliveryAddress = null, supplierType = 'subh_network',
  supplierId = null, lines = [], notes = null, metadata = {} }) {
  const db = dbOrThrow();
  assertLayer(demandLayer);
  if (!villageId || !Array.isArray(lines) || lines.length === 0) throw new Error('villageId and at least one order line are required');

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const orderNumber = `VSO-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const order = await client.query(
      `INSERT INTO village_supply_orders
       (order_number, village_id, demand_layer, requested_by_type, requested_by_id,
        supplier_type, supplier_id, required_by, delivery_address, notes, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       RETURNING *`,
      [orderNumber, villageId, demandLayer, requestedByType || null, requestedById || null,
        supplierType, supplierId, requiredBy, deliveryAddress, notes, JSON.stringify(metadata)],
    );

    let subtotal = 0;
    let tax = 0;
    for (const line of lines) {
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice || 0);
      const taxAmount = Number(line.taxAmount || 0);
      if (!line.itemId || !Number.isFinite(quantity) || quantity <= 0) throw new Error('Each line requires a positive quantity and itemId');
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isFinite(taxAmount) || taxAmount < 0) throw new Error('Invalid line pricing');
      const lineTotal = quantity * unitPrice + taxAmount;
      subtotal += quantity * unitPrice;
      tax += taxAmount;
      await client.query(
        `INSERT INTO village_supply_order_lines
         (order_id, demand_id, item_id, quantity, unit, unit_price, tax_amount, line_total, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
        [order.rows[0].id, line.demandId || null, line.itemId, quantity, line.unit || 'unit', unitPrice, taxAmount, lineTotal, JSON.stringify(line.metadata || {})],
      );
    }

    const total = subtotal + tax;
    const updated = await client.query(
      `UPDATE village_supply_orders
       SET estimated_subtotal=$2, estimated_tax=$3, estimated_total=$4, updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [order.rows[0].id, subtotal, tax, total],
    );

    await client.query('COMMIT');
    return updated.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { listCatalog, createDemand, getPlan, createOrder, assertLayer, assertPriority };
