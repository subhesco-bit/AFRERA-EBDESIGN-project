'use strict';
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
