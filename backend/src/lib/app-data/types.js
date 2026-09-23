'use strict';
// Domain types for app-data system
const ReadinessStatus = {
  NOT_READY: 'NOT_READY',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED'
};

const LoginStatus = {
  LOGGED_OUT: 'LOGGED_OUT',
  LOGGING_IN: 'LOGGING_IN',
  LOGGED_IN: 'LOGGED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ERROR: 'ERROR'
};

const FeatureFlag = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
  BETA: 'BETA',
  DEPRECATED: 'DEPRECATED'
};

module.exports = { ReadinessStatus, LoginStatus, FeatureFlag };
