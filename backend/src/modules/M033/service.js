// Service for M033 Module — Farm Equipment Maintenance Log
//
// Tracks usage hours on farm equipment (tractors, pumps, threshers, etc.)
// and computes whether each piece is due/overdue for service based on a
// service-interval-hours threshold, plus an estimated calendar due date
// from the equipment's average daily usage rate.
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'agronomist_m033_items';

// Standard service intervals (engine hours) by equipment type, used as a
// fallback when a piece of equipment doesn't specify its own interval.
const DEFAULT_SERVICE_INTERVAL_HOURS = {
  tractor: 250,
  irrigation_pump: 500,
  thresher: 150,
  power_tiller: 200,
  sprayer: 100
};

/**
 * Compute maintenance status for one equipment record.
 */
function computeMaintenanceStatus(equipment) {
  const {
    equipment_type, usage_hours = 0, last_service_hours = 0,
    service_interval_hours, purchase_date, daily_usage_hours_avg
  } = equipment;

  const interval = service_interval_hours || DEFAULT_SERVICE_INTERVAL_HOURS[String(equipment_type || '').toLowerCase()] || 200;
  const hoursSinceService = Math.max(0, usage_hours - last_service_hours);
  const hoursRemaining = interval - hoursSinceService;
  const percentUsed = Math.round((hoursSinceService / interval) * 1000) / 10;

  let status = 'ok';
  if (hoursRemaining <= 0) status = 'overdue';
  else if (hoursRemaining <= interval * 0.1) status = 'due_soon';

  // Estimate calendar due date from average daily usage, if known.
  let estimatedDueDate = null;
  if (daily_usage_hours_avg && daily_usage_hours_avg > 0 && hoursRemaining > 0) {
    const daysRemaining = Math.ceil(hoursRemaining / daily_usage_hours_avg);
    estimatedDueDate = new Date(Date.now() + daysRemaining * 86400000).toISOString().slice(0, 10);
  }

  return {
    equipment_type,
    service_interval_hours: interval,
    hours_since_service: hoursSinceService,
    hours_remaining: hoursRemaining,
    percent_of_interval_used: percentUsed,
    status,
    estimated_due_date: estimatedDueDate,
    reasoning: `${hoursSinceService} of ${interval} interval hours used (${percentUsed}%). ` +
      (status === 'overdue'
        ? `Overdue by ${Math.abs(hoursRemaining)} hours.`
        : status === 'due_soon'
          ? `Due soon — within 10% of the service interval.`
          : `Within normal service window.`)
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

/**
 * List all equipment items whose computed status is due_soon or overdue.
 */
async function listDueForService() {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE data->>'record_type' = 'equipment'`);
  return res.rows
    .map(row => ({ ...row, maintenance: computeMaintenanceStatus(row.data || {}) }))
    .filter(row => row.maintenance.status !== 'ok');
}

module.exports = {
  listItems, getItem, createItem, updateItem, deleteItem,
  DEFAULT_SERVICE_INTERVAL_HOURS, computeMaintenanceStatus, listDueForService
};
