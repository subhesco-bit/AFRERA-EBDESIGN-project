/**
 * M118 — Internal Audit Trail Viewer
 *
 * Strategy Card: see README.md.
 *
 * Every row is one audit-worthy internal event (a config override, a manual
 * data correction, an access grant, an emergency bypass — the kind of thing
 * that isn't a normal CRUD action on a business record and needs a human to
 * eyeball it). This is deliberately separate from the transactional
 * audit_logs table (services/platform/auditService.js): that table logs
 * every write for forensics; this module is a curated review queue an admin
 * actually works through, with severity-weighted risk scoring and an
 * overdue-review alert — the DB-level log has neither.
 *
 * DATA SHAPE (core_m0nn_items.data JSONB, table fpo_m118_items):
 * {
 *   eventType:   string   // 'data_change'|'access'|'policy_override'|'security'|'other'
 *   entityType:  string   // e.g. 'order', 'farmer', 'payout'
 *   entityId:    string
 *   actorId:     string
 *   actorRole:   string
 *   action:      string   // 'create'|'update'|'delete'|'approve'|'override'|'export'
 *   severity:    'low'|'medium'|'high'|'critical'
 *   description: string
 *   beforeState: object|null
 *   afterState:  object|null
 *   reviewed:    boolean
 *   reviewedBy:  string|null
 *   reviewedAt:  string|null   // ISO
 *   occurredAt:  string        // ISO — when the underlying event happened
 * }
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'fpo_m118_items';

// Higher = more urgent. Used both for weighted risk scoring and sort order.
const SEVERITY_WEIGHT = Object.freeze({ low: 1, medium: 3, high: 7, critical: 15 });
const VALID_SEVERITIES = Object.keys(SEVERITY_WEIGHT);
// An unreviewed entry older than this is a compliance gap, not just a backlog item.
const OVERDUE_REVIEW_HOURS = 72;

function normalizeSeverity(s) {
  return VALID_SEVERITIES.includes(s) ? s : 'medium';
}

function toRow(row) {
  if (!row) return null;
  const data = row.data || {};
  return { id: row.id, ...data, created_at: row.created_at, updated_at: row.updated_at };
}

async function listItems({ page = 1, limit = 20, severity, entityType, reviewed } = {}) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  if (severity) { params.push(severity); where.push(`data->>'severity' = $${params.length}`); }
  if (entityType) { params.push(entityType); where.push(`data->>'entityType' = $${params.length}`); }
  if (reviewed !== undefined) { params.push(String(reviewed === true || reviewed === 'true')); where.push(`(data->>'reviewed') = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRes = await pg.query(`SELECT COUNT(*) FROM ${tableName} ${whereSql}`, params);
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query(
    `SELECT * FROM ${tableName} ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: res.rows.map(toRow), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  return toRow(res.rows[0]);
}

async function createItem(payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const data = {
    eventType: payload.eventType || 'other',
    entityType: payload.entityType || null,
    entityId: payload.entityId || null,
    actorId: payload.actorId || null,
    actorRole: payload.actorRole || null,
    action: payload.action || 'update',
    severity: normalizeSeverity(payload.severity),
    description: payload.description || '',
    beforeState: payload.beforeState ?? null,
    afterState: payload.afterState ?? null,
    reviewed: false,
    reviewedBy: null,
    reviewedAt: null,
    occurredAt: payload.occurredAt || new Date().toISOString(),
  };
  const res = await pg.query(`INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW()) RETURNING *`, [data]);
  return toRow(res.rows[0]);
}

async function updateItem(id, payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const existing = await getItem(id);
  if (!existing) return null;
  const { id: _drop, created_at, updated_at, ...prev } = existing;
  const merged = { ...prev, ...payload };
  if (merged.severity) merged.severity = normalizeSeverity(merged.severity);
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [merged, id]);
  return toRow(res.rows[0]);
}

async function deleteItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

/** Mark an entry reviewed. A required reviewer id — an anonymous review is not a review. */
async function markReviewed(id, reviewedBy) {
  if (!reviewedBy) throw new Error('reviewedBy is required to mark an audit entry reviewed');
  return updateItem(id, { reviewed: true, reviewedBy, reviewedAt: new Date().toISOString() });
}

/**
 * Risk summary: severity distribution, a weighted risk score, and the
 * overdue-review queue (unreviewed entries older than OVERDUE_REVIEW_HOURS).
 * Real algorithm: score = sum(SEVERITY_WEIGHT[severity] for each unreviewed
 * entry) / max(1, unreviewedCount) — the average weight of what's still
 * outstanding, so a single critical item in an otherwise-clear queue still
 * reads as urgent rather than being diluted by history.
 */
async function computeRiskSummary({ sinceDays = 30 } = {}) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `SELECT * FROM ${tableName} WHERE created_at >= NOW() - ($1 || ' days')::interval ORDER BY created_at DESC`,
    [String(sinceDays)]
  );
  const items = res.rows.map(toRow);

  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  const overdueThreshold = Date.now() - OVERDUE_REVIEW_HOURS * 3600 * 1000;
  let unreviewedWeight = 0;
  let unreviewedCount = 0;
  const overdue = [];

  for (const item of items) {
    const sev = normalizeSeverity(item.severity);
    bySeverity[sev] += 1;
    if (!item.reviewed) {
      unreviewedWeight += SEVERITY_WEIGHT[sev];
      unreviewedCount += 1;
      const occurred = item.occurredAt ? new Date(item.occurredAt).getTime() : new Date(item.created_at).getTime();
      if (occurred <= overdueThreshold) overdue.push(item);
    }
  }

  const riskScore = unreviewedCount > 0 ? Number((unreviewedWeight / unreviewedCount).toFixed(2)) : 0;

  return {
    windowDays: sinceDays,
    totalEvents: items.length,
    bySeverity,
    unreviewedCount,
    riskScore, // 0 (clear) .. 15 (critical average)
    riskBand: riskScore >= 10 ? 'critical' : riskScore >= 6 ? 'high' : riskScore >= 2 ? 'medium' : 'low',
    overdueReviewCount: overdue.length,
    overdueReviewThresholdHours: OVERDUE_REVIEW_HOURS,
    overdueItems: overdue.slice(0, 20),
  };
}

module.exports = {
  listItems, getItem, createItem, updateItem, deleteItem,
  markReviewed, computeRiskSummary, SEVERITY_WEIGHT,
};
