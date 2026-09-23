'use strict';
/** STATUS: NOT a pine-shadow port. app-data.js/readiness.js/login.js/
 * types.js/errors.js in this directory were fabricated in an earlier
 * session before pine-shadow's real source was read, and never
 * rechecked against pine-shadow's actual src/lib/app-data/ (10 files:
 * app-data.ts, client.server.ts, errors.ts, index.ts, login.ts,
 * readiness-schedule.ts, readiness.ts, server-only.ts, types.ts,
 * use-connector-readiness.ts). Should not be cited as a port.
 * See backend/src/lib/auth/index.js for the fuller explanation of why
 * this directory and auth/ were left as-is rather than force-ported. */
const { AppData } = require('./app-data');
const { ReadinessManager } = require('./readiness');
const { LoginManager } = require('./login');
const { ReadinessStatus, LoginStatus, FeatureFlag } = require('./types');
const { AppDataError, ReadinessError, LoginError, StateError } = require('./errors');

// Singleton instance
let appData = null;

function getAppData() {
  if (!appData) appData = new AppData();
  return appData;
}

function initializeAppData(opts = {}) {
  appData = new AppData(opts);
  return appData;
}

module.exports = {
  AppData,
  ReadinessManager,
  LoginManager,
  ReadinessStatus,
  LoginStatus,
  FeatureFlag,
  AppDataError,
  ReadinessError,
  LoginError,
  StateError,
  getAppData,
  initializeAppData
};
