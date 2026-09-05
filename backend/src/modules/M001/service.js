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
    const error = new Error(result.error?.message || `${operation} failed`);
    error.code = result.error?.code || 'MODULE_EXECUTION_ERROR';
    error.statusCode = error.code === 'VALIDATION_ERROR' ? 400 : undefined;
    throw error;
  }
  return result.data;
}

async function initializePlatform(configData) {
  if (!configData || typeof configData !== 'object' || Array.isArray(configData)) {
    let error = new Error('Configuration payload is required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  const requiredIdentifiers = ['platform_name', 'version', 'environment', 'deployment_type'];
  if (requiredIdentifiers.some(identifier => typeof configData[identifier] !== 'string' || configData[identifier].trim().length === 0)) {
    let error = new Error('platform_name, version, environment, and deployment_type are required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return unwrap('initializePlatformDeployment', configData);
}

async function getPlatformHealth() {
  return unwrap('getHealth', {});
}

async function getPlatformMetrics(params) {
  return unwrap('getDetailedMetrics', params);
}

async function updatePlatformConfiguration(configId, updates) {
  if (typeof configId !== 'string' || configId.trim().length === 0 ||
      !updates || typeof updates !== 'object' || Array.isArray(updates)) {
    let error = new Error('configId and a configuration update object are required');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  return unwrap('updateDeploymentConfiguration', { configId, ...updates });
}

module.exports = {
  initializePlatform,
  getPlatformHealth,
  getPlatformMetrics,
  updatePlatformConfiguration
};
