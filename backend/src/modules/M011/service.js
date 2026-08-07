// Service for User Management (M011)
// Implements basic CRUD and authentication helpers.
const bcrypt = require('bcryptjs');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

async function createUser({ name, email, password, role = 'farmer', status = 'active' }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    const hashed = password ? await bcrypt.hash(password, 12) : null;

    const insertUserText = `
      INSERT INTO users (name, email, password_hash, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, email, role, status, created_at
    `;
    const res = await client.query(insertUserText, [name, email, hashed, role, status]);

    await client.query('COMMIT');
    return res.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('createUser failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getUserByEmail(email) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  return res.rows[0] || null;
}

async function listUsers({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  const totalRes = await pg.query('SELECT COUNT(*) FROM users');
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);

  return {
    users: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function updateUser(id, { name, email, role, status }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING id, name, email, role, status, updated_at`,
    [name, email, role, status, id]
  );
  return res.rows[0] || null;
}

async function deleteUser(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  // Soft-delete by setting status to 'deleted'
  const res = await pg.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id', ['deleted', id]);
  return !!res.rows[0];
}

async function changePassword(id, newPassword) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const hashed = await bcrypt.hash(newPassword, 12);
  await pg.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashed, id]);
  return true;
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
  changePassword
};

