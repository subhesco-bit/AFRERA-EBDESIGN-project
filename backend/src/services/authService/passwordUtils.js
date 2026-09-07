/**
 * Password hashing helpers. Split out of the former monolithic
 * services/authService.js (M11).
 */

const bcrypt = require('bcryptjs');

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
