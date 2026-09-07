/**
 * JWT access/refresh token generation, verification, and persistence.
 * Split out of the former monolithic services/authService.js (M11).
 */

const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('./config');
const { getUserPermissions } = require('./permissions');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

/**
 * Generate access token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user.role)
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user.id.toString()
  });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    tokenType: 'refresh'
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user.id.toString()
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    // JWT_CONFIG.secret already resolves JWT_SECRET (with the guarded dev
    // fallback above) - no need to re-read process.env here.
    const secret = JWT_CONFIG.secret;
    // Pin the algorithm explicitly (H3: algorithm confusion hardening) so a
    // token can't be forged by switching to 'none' or an asymmetric alg.
    // (L9, consolidated 2026-08-17): this used to have a separate NODE_ENV
    // === 'test' branch that skipped the issuer/audience check, creating a
    // third verification code path. generateAccessToken/generateRefreshToken
    // always sign with JWT_CONFIG.issuer/audience regardless of environment,
    // so every token this service issues - test or not - satisfies the same
    // check. One verification path, no environment-specific relaxation.
    return jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Store refresh token
 */
async function storeRefreshToken(userId, token, deviceInfo = {}) {
  try {
    const pg = getPostgreSQL();

    const query = `
      INSERT INTO refresh_tokens (user_id, token, device_info, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      RETURNING id
    `;

    await pg.query(query, [userId, token, JSON.stringify(deviceInfo)]);
  } catch (error) {
    logger.error('Failed to store refresh token', { error: error.message, stack: error.stack });
    // Don't throw error, as this is not critical
  }
}

/**
 * Revoke refresh token
 */
async function revokeRefreshToken(token) {
  try {
    const pg = getPostgreSQL();

    await pg.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
      [token]
    );
  } catch (error) {
    logger.error('Failed to revoke refresh token', { error: error.message, stack: error.stack });
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  storeRefreshToken,
  revokeRefreshToken
};
