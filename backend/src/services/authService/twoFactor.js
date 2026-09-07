/**
 * Two-factor authentication setup/verify/disable flows, built on top of the
 * TOTP primitives in ./totp.js. Split out of the former monolithic
 * services/authService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { generateTOTPSecret, generateQRCode, generateBackupCodes, verifyTOTPCode } = require('./totp');
const { comparePassword } = require('./passwordUtils');

/**
 * Setup Two-Factor Authentication
 */
async function setupTwoFactor(userId) {
  try {
    const pg = getPostgreSQL();

    // Generate a real, unique-per-user TOTP secret
    const secret = generateTOTPSecret();

    // Store secret
    await pg.query(
      'UPDATE users SET two_factor_secret = $1, two_factor_enabled = FALSE WHERE id = $2',
      [secret, userId]
    );

    // Generate a real scannable QR code image
    const qrCode = await generateQRCode(secret, userId);

    return {
      secret,
      qrCode,
      backupCodes: generateBackupCodes()
    };
  } catch (error) {
    logger.error('2FA setup failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Verify Two-Factor Authentication code
 */
async function verifyTwoFactor(userId, code) {
  try {
    const pg = getPostgreSQL();

    // Get user's 2FA secret
    const userResult = await pg.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].two_factor_secret) {
      throw new Error('2FA not set up for user');
    }

    const secret = userResult.rows[0].two_factor_secret;

    // Verify TOTP code (in production, use speakeasy or similar library)
    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    // Enable 2FA
    await pg.query(
      'UPDATE users SET two_factor_enabled = TRUE WHERE id = $1',
      [userId]
    );

    logger.info(`2FA enabled for user: ${userId}`);

    return { success: true, message: '2FA enabled successfully' };
  } catch (error) {
    logger.error('2FA verification failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Disable Two-Factor Authentication
 */
async function disableTwoFactor(userId, password) {
  try {
    const pg = getPostgreSQL();

    // Verify password
    const userResult = await pg.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const passwordValid = await comparePassword(password, userResult.rows[0].password_hash);

    if (!passwordValid) {
      throw new Error('Invalid password');
    }

    // Disable 2FA
    await pg.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    logger.info(`2FA disabled for user: ${userId}`);

    return { success: true, message: '2FA disabled successfully' };
  } catch (error) {
    logger.error('2FA disable failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = { setupTwoFactor, verifyTwoFactor, disableTwoFactor };
