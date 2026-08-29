/**
 * Platform Core Service (M001)
 *
 * Thin wrapper delegating to the merged, Claude-compatible implementation at
 * modules/M001_PLATFORM_CORE/backend/service.js. All logic that used to live
 * here (AI-enriched deployment provisioning, detailed metrics, impact-analysis
 * config updates) was merged into that module as initializePlatformDeployment /
 * getDetailedMetrics / updateDeploymentConfiguration - see there for the real
 * implementation. This file exists only to keep controller.js's call shape
 * (raw return values, not the {success,data} envelope) unchanged.
 */

const PlatformCoreModule = require('../../../../modules/M001_PLATFORM_CORE/backend/service');

let moduleInstance = null;
async function getModule() {
  if (!moduleInstance) {
    moduleInstance = new PlatformCoreModule();
    await moduleInstance.initialize({});
  }
  return moduleInstance;
}

async function unwrap(operation, parameters) {
  const mod = await getModule();
  const result = await mod.execute(operation, parameters, {});
  if (!result.success) {
    throw new Error(result.error?.message || `${operation} failed`);
  }
  return result.data;
}

async function initializePlatform(configData) {
  return unwrap('initializePlatformDeployment', configData);
}

async function getPlatformHealth() {
  return unwrap('getHealth', {});
}

async function getPlatformMetrics(params) {
  return unwrap('getDetailedMetrics', params);
}

async function updatePlatformConfiguration(configId, updates) {
  return unwrap('updateDeploymentConfiguration', { configId, ...updates });
}

module.exports = {
  initializePlatform,
  getPlatformHealth,
  getPlatformMetrics,
  updatePlatformConfiguration
};
