'use strict';

const { getPostgreSQL } = require('../database/connection');

function db() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  return pg;
}

async function list(filters = {}) {
  const params = [];
  const where = filters.status ? (params.push(filters.status), `WHERE status = $${params.length}`) : '';
  const result = await db().query(`SELECT * FROM farmer_kyc_applications ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

async function get(id) {
  const result = await db().query('SELECT * FROM farmer_kyc_applications WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function create(data) {
  const result = await db().query(
    `INSERT INTO farmer_kyc_applications
      (farmer_name, phone, id_type, id_number, village, land_holding_hectares)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.farmer_name, data.phone || null, data.id_type, data.id_number,
      data.village || null, data.land_holding_hectares || null]
  );
  return result.rows[0];
}

async function decide(id, status, notes) {
  const result = await db().query(
    `UPDATE farmer_kyc_applications SET status = $1, decision_notes = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, notes || null, id]
  );
  return result.rows[0] || null;
}

module.exports = { list, get, create, decide };