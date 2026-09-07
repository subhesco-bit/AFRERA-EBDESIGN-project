/**
 * Generic CRUD over a real, named table with a fixed column whitelist.
 *
 * Built for the batch of frontend pages that were already shipped with a
 * ResourceManager form (real field names, real validation) pointed at a
 * backend route that was never built ("No backend route found" in api.js).
 * `fields` is always a hardcoded array supplied by the caller, never derived
 * from request data, so interpolating column names from it into SQL is safe
 * - only VALUES come from the request, and those are always parameterized.
 */

'use strict';

const pool = require('../database/pool');

function createCrudService(tableName, { idColumn = 'id', orderBy = 'created_at DESC', fields, requiredFields = [] } = {}) {
  if (!Array.isArray(fields) || !fields.length) {
    throw new Error(`createCrudService(${tableName}): fields must be a non-empty array`);
  }

  async function list({ page = 1, limit = 20, ...filters } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];
    for (const f of fields) {
      if (filters[f] !== undefined && filters[f] !== '') {
        params.push(filters[f]);
        whereClauses.push(`${f} = $${params.length}`);
      }
    }
    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalRes = await pool.query(`SELECT COUNT(*) FROM ${tableName} ${where}`, params);
    const total = parseInt(totalRes.rows[0].count, 10);

    const listParams = [...params, limitNum, offset];
    const res = await pool.query(
      `SELECT * FROM ${tableName} ${where} ORDER BY ${orderBy} LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );
    return { items: res.rows, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.max(1, Math.ceil(total / limitNum)) } };
  }

  async function get(id) {
    const res = await pool.query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
    return res.rows[0] || null;
  }

  function validateRequired(payload) {
    const missing = requiredFields.filter((f) => payload[f] === undefined || payload[f] === null || payload[f] === '');
    if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  }

  async function create(payload = {}) {
    validateRequired(payload);
    const cols = fields.filter((f) => payload[f] !== undefined);
    if (!cols.length) throw new Error('No valid fields supplied');
    const values = cols.map((c) => payload[c]);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const res = await pool.query(
      `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
      values
    );
    return res.rows[0];
  }

  async function update(id, payload = {}) {
    const cols = fields.filter((f) => payload[f] !== undefined);
    if (!cols.length) throw new Error('No valid fields supplied');
    const setClauses = cols.map((c, i) => `${c} = $${i + 1}`);
    const values = cols.map((c) => payload[c]);
    values.push(id);
    const res = await pool.query(
      `UPDATE ${tableName} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE ${idColumn} = $${values.length} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  }

  async function remove(id) {
    const res = await pool.query(`DELETE FROM ${tableName} WHERE ${idColumn} = $1 RETURNING ${idColumn}`, [id]);
    return !!res.rows[0];
  }

  return { list, get, create, update, remove };
}

module.exports = { createCrudService };
