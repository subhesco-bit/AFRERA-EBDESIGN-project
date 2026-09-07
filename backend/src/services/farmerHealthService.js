/**
 * Farmer Health & Welfare Service (M029)
 *
 * Implements the 8 methods farmerHealthRoutes.js expects, querying the
 * purpose-built schema from migrations/013_farmer_health_welfare_module.sql
 * (farmer_health_records, welfare_programs, welfare_enrollments) instead of
 * the generic M029 scaffold module that previously backed this route file.
 *
 * Ownership scoping: record-level methods accept { farmerId, isAdmin } so
 * the route layer's resolveFarmerId-based auth actually reaches the data
 * layer — non-admin callers can only see/mutate their own farmer_id rows.
 */

const { getPostgreSQL } = require('../database/connection');

async function listHealthRecords({ page = 1, limit = 20, farmerId = null, isAdmin = false } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const offset = (safePage - 1) * safeLimit;

  // The route layer already decides what farmerId to pass: a non-admin's
  // own farmerId, or (for admins) whatever farmerId query filter was given.
  const conditions = [];
  const params = [];
  if (farmerId) {
    params.push(farmerId);
    conditions.push(`farmer_id = $${params.length}`);
  }
  const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

  const totalRes = await pg.query(`SELECT COUNT(*) FROM farmer_health_records${whereClause}`, params);
  const total = parseInt(totalRes.rows[0].count || '0', 10);

  const dataParams = [...params, safeLimit, offset];
  const res = await pg.query(
    `SELECT * FROM farmer_health_records${whereClause} ORDER BY date DESC, id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    items: res.rows,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) || 1 }
  };
}

async function getHealthRecord(id, { farmerId = null, isAdmin = false } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM farmer_health_records WHERE id = $1', [id]);
  const record = res.rows[0] || null;
  if (!record) return null;
  if (!isAdmin && record.farmer_id !== farmerId) return null;
  return record;
}

async function createHealthRecord(payload, { farmerId = null, isAdmin = false } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { healthType, description, severity, date, metadata } = payload || {};
  // Non-admins can only ever create records for themselves — the caller's
  // farmerId always wins, regardless of what the request body claims.
  const targetFarmerId = isAdmin && payload && payload.farmerId ? payload.farmerId : farmerId;
  if (!targetFarmerId) throw new Error('farmerId is required');
  if (!healthType || !severity || !date) {
    throw new Error('healthType, severity and date are required');
  }

  const res = await pg.query(
    `INSERT INTO farmer_health_records (farmer_id, health_type, description, severity, date, metadata)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [targetFarmerId, healthType, description || null, severity, date, JSON.stringify(metadata || {})]
  );
  return res.rows[0];
}

async function updateHealthRecord(id, payload, { farmerId = null, isAdmin = false } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const existing = await pg.query('SELECT * FROM farmer_health_records WHERE id = $1', [id]);
  if (existing.rows.length === 0) return null;
  if (!isAdmin && existing.rows[0].farmer_id !== farmerId) return null;

  const current = existing.rows[0];
  const { healthType, description, severity, date, metadata } = payload || {};
  const res = await pg.query(
    `UPDATE farmer_health_records
     SET health_type = $1, description = $2, severity = $3, date = $4, metadata = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 RETURNING *`,
    [
      healthType || current.health_type,
      description !== undefined ? description : current.description,
      severity || current.severity,
      date || current.date,
      JSON.stringify(metadata || current.metadata || {}),
      id
    ]
  );
  return res.rows[0] || null;
}

async function deleteHealthRecord(id, { farmerId = null, isAdmin = false } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const existing = await pg.query('SELECT farmer_id FROM farmer_health_records WHERE id = $1', [id]);
  if (existing.rows.length === 0) return false;
  if (!isAdmin && existing.rows[0].farmer_id !== farmerId) return false;

  const res = await pg.query('DELETE FROM farmer_health_records WHERE id = $1 RETURNING id', [id]);
  return !!res.rows[0];
}

async function getFarmerHealthSummary(farmerId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const res = await pg.query(
    `SELECT
       health_type,
       COUNT(*) AS count,
       AVG(CASE severity WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 0.5 ELSE 0 END) AS risk_score
     FROM farmer_health_records
     WHERE farmer_id = $1
     GROUP BY health_type`,
    [farmerId]
  );

  return {
    farmerId,
    summary: res.rows,
    totalRecords: res.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0)
  };
}

async function getWelfarePrograms({ page = 1, limit = 20, eligibility = null } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const offset = (safePage - 1) * safeLimit;

  const params = [];
  let whereClause = '';
  if (eligibility) {
    params.push(eligibility);
    whereClause = ` WHERE eligibility = $${params.length}`;
  }

  const totalRes = await pg.query(`SELECT COUNT(*) FROM welfare_programs${whereClause}`, params);
  const total = parseInt(totalRes.rows[0].count || '0', 10);

  const dataParams = [...params, safeLimit, offset];
  const res = await pg.query(
    `SELECT * FROM welfare_programs${whereClause} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
    dataParams
  );

  return {
    items: res.rows,
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) || 1 }
  };
}

async function enrollWelfareProgram(farmerId, programId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  if (!farmerId || !programId) throw new Error('farmerId and programId are required');

  const program = await pg.query('SELECT id FROM welfare_programs WHERE id = $1', [programId]);
  if (program.rows.length === 0) throw new Error('Welfare program not found');

  const res = await pg.query(
    `INSERT INTO welfare_enrollments (farmer_id, program_id, enrollment_date, status)
     VALUES ($1, $2, CURRENT_DATE, 'PENDING') RETURNING *`,
    [farmerId, programId]
  );
  return res.rows[0];
}

module.exports = {
  listHealthRecords,
  getHealthRecord,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  getFarmerHealthSummary,
  getWelfarePrograms,
  enrollWelfareProgram
};
