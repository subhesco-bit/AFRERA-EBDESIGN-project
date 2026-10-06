/**
 * Test-only auth helper for DB-backed integration suites.
 *
 * These suites used to POST /api/v1/auth/register with `role: 'admin'` and
 * read `body.token`. Registration (correctly) ignores the requested role,
 * creates a `pending` consumer and returns no token, so every authenticated
 * request in those suites was a 401. This helper creates (or reuses) a real,
 * active user row with the requested role, so foreign keys to users(id)
 * resolve, and signs a token with the same generateAccessToken() the app
 * uses.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateAccessToken } = require('../../services/dual-use/authService');

async function createTestUserToken(pool, { email, role = 'consumer' }) {
  const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 4);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, status = 'active'
     RETURNING id, email, role`,
    [email.toLowerCase(), passwordHash, role],
  );
  const user = result.rows[0];
  return { user, token: generateAccessToken(user) };
}

/**
 * Response payload under the app's standard envelope. responseFormatter
 * wraps successful JSON as { success, data, message, metadata }; error
 * responses carry no `data`, so they are returned unchanged.
 */
function unwrap(response) {
  const body = response.body;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) return body.data;
  return body;
}

module.exports = { createTestUserToken, unwrap };
