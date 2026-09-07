// Service for M092 Module — Warehouse Capacity Tracking. See README.md.
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'logistics_m092_items';

function utilizationStatus(pct) {
  if (pct >= 100) return 'over_capacity';
  if (pct >= 90) return 'critical';
  if (pct >= 75) return 'high';
  return 'normal';
}

/** Real algorithm: compute utilization band from declared capacity vs occupied units. */
function computeCapacitySnapshot(payload) {
  const totalCapacityUnits = Number(payload.totalCapacityUnits);
  const occupiedUnits = Number(payload.occupiedUnits);

  if (!payload.warehouseName && !payload.warehouseId) {
    throw new Error('warehouseId or warehouseName is required');
  }
  if (!Number.isFinite(totalCapacityUnits) || totalCapacityUnits <= 0) {
    throw new Error('totalCapacityUnits must be a positive number');
  }
  if (!Number.isFinite(occupiedUnits) || occupiedUnits < 0) {
    throw new Error('occupiedUnits must be a non-negative number');
  }

  const utilizationPct = Number(((occupiedUnits / totalCapacityUnits) * 100).toFixed(1));

  return {
    ...payload,
    totalCapacityUnits,
    occupiedUnits,
    unit: payload.unit || 'sqft',
    zoneBreakdown: Array.isArray(payload.zoneBreakdown) ? payload.zoneBreakdown : [],
    recordedAt: payload.recordedAt || new Date().toISOString(),
    utilizationPct,
    status: utilizationStatus(utilizationPct),
    overCapacity: occupiedUnits > totalCapacityUnits
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
  const snapshot = computeCapacitySnapshot(payload || {});
  const res = await pg.query(`INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW()) RETURNING *`, [snapshot]);
  if (snapshot.status !== 'normal') {
    logger.warn(`Warehouse capacity ${snapshot.status}: ${snapshot.warehouseName || snapshot.warehouseId} at ${snapshot.utilizationPct}%`);
  }
  return res.rows[0];
}

async function updateItem(id, payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const existing = await getItem(id);
  if (!existing) return null;
  const merged = computeCapacitySnapshot({ ...existing.data, ...payload });
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [merged, id]);
  return res.rows[0] || null;
}

async function deleteItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

/** Most recent snapshot for one warehouse, identified by data->>'warehouseId'. */
async function getLatestForWarehouse(warehouseId) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `SELECT * FROM ${tableName} WHERE data->>'warehouseId' = $1 ORDER BY created_at DESC LIMIT 1`,
    [warehouseId]
  );
  return res.rows[0] || null;
}

/**
 * Real trend algorithm: compares the oldest vs newest utilizationPct across
 * the most recent `limit` snapshots for a warehouse. A >5 percentage-point
 * swing is treated as a genuine trend; anything smaller is noise.
 */
async function getTrend(warehouseId, { limit = 10 } = {}) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const boundedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 2), 100);
  const res = await pg.query(
    `SELECT * FROM ${tableName} WHERE data->>'warehouseId' = $1 ORDER BY created_at DESC LIMIT $2`,
    [warehouseId, boundedLimit]
  );
  const snapshots = res.rows.reverse(); // oldest first
  if (snapshots.length < 2) {
    return { warehouseId, snapshotCount: snapshots.length, trend: 'insufficient_data', snapshots };
  }
  const first = Number(snapshots[0].data.utilizationPct);
  const last = Number(snapshots[snapshots.length - 1].data.utilizationPct);
  const deltaPct = Number((last - first).toFixed(1));
  let trend = 'stable';
  if (deltaPct > 5) trend = 'worsening';
  else if (deltaPct < -5) trend = 'improving';
  return { warehouseId, snapshotCount: snapshots.length, firstUtilizationPct: first, lastUtilizationPct: last, deltaPct, trend, snapshots };
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, getLatestForWarehouse, getTrend, computeCapacitySnapshot };
