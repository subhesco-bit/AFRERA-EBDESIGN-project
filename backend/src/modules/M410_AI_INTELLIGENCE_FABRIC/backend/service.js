/**
 * AI Intelligence Fabric (EBD-MOD-00000001) - Plug-and-Play Module
 *
 * Thin wrapper delegating to the real, already-live implementation at
 * backend/src/core/ai/index.js (imported directly in backend/src/index.js,
 * initialized on every boot). This file exists only to make that real
 * implementation discoverable/executable through Claude's module registry
 * (moduleRegistry.js / /api/v1/ai/modules/*), which never saw it before -
 * found via a whole-repo audit, 2026-08-28. No logic is duplicated here.
 */

'use strict';

const aiFabric = require('../../../backend/src/core/ai/index');

class AIIntelligenceFabricModule {
  constructor() {
    this.moduleId = 'M410_AI_INTELLIGENCE_FABRIC';
  }

  async initialize(config) {
    return aiFabric.initializeAI(config || {});
  }

  async healthCheck() {
    const status = aiFabric.getAIStatus();
    return { status: 'healthy', moduleId: this.moduleId, timestamp: new Date().toISOString(), detail: status };
  }

  async execute(operation, parameters = {}, context = {}) {
    try {
      switch (operation) {
        case 'route': {
          const { taskType, payload } = parameters;
          if (!taskType) throw new Error('taskType is required');
          const data = await aiFabric.orchestrator.route(taskType, payload, context);
          return { success: true, data, metadata: { operation, moduleId: this.moduleId, timestamp: new Date().toISOString() } };
        }
        case 'getStatus': {
          const data = aiFabric.getAIStatus();
          return { success: true, data, metadata: { operation, moduleId: this.moduleId, timestamp: new Date().toISOString() } };
        }
        case 'initialize': {
          const data = await aiFabric.initializeAI(parameters);
          return { success: data.success !== false, data, metadata: { operation, moduleId: this.moduleId, timestamp: new Date().toISOString() } };
        }
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: { code: 'MODULE_EXECUTION_ERROR', message: error.message, operation, moduleId: this.moduleId, timestamp: new Date().toISOString() },
      };
    }
  }
}

module.exports = AIIntelligenceFabricModule;
