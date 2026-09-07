'use strict';

const { getPostgreSQL } = require('../database/connection');

function db() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  return pg;
}

async function listRequests(filters = {}) {
  const params = [];
  let where = '';
  if (filters.status) {
    params.push(filters.status);
    where = `WHERE status = $${params.length}`;
  }
  const result = await db().query(
    `SELECT * FROM farmer_verification_requests ${where} ORDER BY created_at DESC`,
    params
  );
  return result.rows;
}

async function createRequest(data) {
  const result = await db().query(
    `INSERT INTO farmer_verification_requests
      (farmer_name, verification_type, claim_details, verifier_name, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.farmer_name, data.verification_type, data.claim_details || null,
      data.verifier_name || null, data.status || 'Pending']
  );
  return result.rows[0];
}

async function updateDecision(id, status, notes) {
  const result = await db().query(
    `UPDATE farmer_verification_requests
     SET status = $1, decision_notes = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, notes || null, id]
  );
  return result.rows[0] || null;
}

module.exports = { listRequests, createRequest, updateDecision };