/**
 * Fallback (no-Postgres) auth store: a JSON file used when getPostgreSQL()
 * has no connection, so registration/login/refresh still work in local/dev
 * mode. Split out of the former monolithic services/authService.js (M11).
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');

// __dirname is now backend/src/services/authService, so we need to go up
// TWO levels (out of authService/, out of services/) to reach backend/src,
// then into database/ - one level more than the original single-file
// authService.js needed (which only went up one level from services/).
const AUTH_STORE_PATH = path.join(__dirname, '..', '..', 'database', 'auth_store.json');

function ensureAuthStore() {
  return {
    users: []
  };
}

function readAuthStore() {
  try {
    if (!fs.existsSync(AUTH_STORE_PATH)) {
      fs.writeFileSync(AUTH_STORE_PATH, JSON.stringify(ensureAuthStore(), null, 2));
      return ensureAuthStore();
    }

    const raw = fs.readFileSync(AUTH_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : []
    };
  } catch (error) {
    logger.warn('Unable to read auth store, resetting it', { error: error.message });
    return ensureAuthStore();
  }
}

function writeAuthStore(store) {
  try {
    fs.writeFileSync(AUTH_STORE_PATH, JSON.stringify(store, null, 2));
    return true;
  } catch (error) {
    logger.error('Unable to persist auth store', { error: error.message, stack: error.stack });
    return false;
  }
}

function getFallbackUserByEmail(email) {
  const store = readAuthStore();
  return store.users.find((user) => user.email === email.toLowerCase());
}

module.exports = {
  AUTH_STORE_PATH,
  ensureAuthStore,
  readAuthStore,
  writeAuthStore,
  getFallbackUserByEmail
};
