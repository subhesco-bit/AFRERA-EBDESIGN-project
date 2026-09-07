/**
 * MFA Service — real TOTP-based multi-factor authentication against the
 * users table's existing two_factor_enabled/two_factor_secret columns
 * (see database/schema.sql). Uses the already-declared `speakeasy` dependency.
 */
const speakeasy = require('speakeasy');
const { getPostgreSQL } = require('../database/connection');
const { logger } = require('../utils/logger');

async function generateSecret(userId, accountLabel) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const secret = speakeasy.generateSecret({
    name: `AFRERA (${accountLabel || userId})`,
    length: 20,
  });

  await pg.query(
    'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
    [secret.base32, userId]
  );

  return { secret: secret.base32, otpauth_url: secret.otpauth_url };
}

function verifyToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token),
    window: 1,
  });
}

async function enable(userId, token) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const result = await pg.query('SELECT two_factor_secret FROM users WHERE id = $1', [userId]);
  const row = result.rows[0];
  if (!row || !row.two_factor_secret) {
    return { success: false, error: 'No MFA secret generated yet. Call setup first.' };
  }

  const valid = verifyToken(row.two_factor_secret, token);
  if (!valid) return { success: false, error: 'Invalid verification code' };

  await pg.query('UPDATE users SET two_factor_enabled = TRUE WHERE id = $1', [userId]);
  logger.info('MFA enabled for user', { userId });
  return { success: true };
}

async function disable(userId, token) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const result = await pg.query(
    'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
    [userId]
  );
  const row = result.rows[0];
  if (!row || !row.two_factor_enabled) {
    return { success: false, error: 'MFA is not currently enabled' };
  }

  const valid = verifyToken(row.two_factor_secret, token);
  if (!valid) return { success: false, error: 'Invalid verification code' };

  await pg.query(
    'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
    [userId]
  );
  logger.info('MFA disabled for user', { userId });
  return { success: true };
}

async function verifyLogin(userId, token) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const result = await pg.query(
    'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
    [userId]
  );
  const row = result.rows[0];
  if (!row || !row.two_factor_enabled) return { success: true, mfaRequired: false };

  const valid = verifyToken(row.two_factor_secret, token);
  return { success: valid, mfaRequired: true };
}

async function status(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const result = await pg.query('SELECT two_factor_enabled FROM users WHERE id = $1', [userId]);
  return { enabled: !!result.rows[0]?.two_factor_enabled };
}

module.exports = { generateSecret, enable, disable, verifyLogin, status };
