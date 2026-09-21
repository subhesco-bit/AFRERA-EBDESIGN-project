/**
 * M784_PRESCRIPTION_WRITER_AI Service - AI Prescription Writer
 */

'use strict';

const aiBackbone = require('../../M400_AI_BACKBONE/backend/service');
const { logger } = require('../../../backend/src/utils/logger');

class PRESCRIPTIONWRITERAIService {
  constructor() {
    this.moduleId = 'M784_PRESCRIPTION_WRITER_AI';
    this.name = 'AI Prescription Writer';
    this.capabilities = ["prescription_generation","medicine_recommendation","dosage_calculation"];
    this.metrics = { requestsProcessed: 0, successCount: 0, errorCount: 0 };
  }

  async initialize(config) {
    logger.info(`Initializing ${this.moduleId}`);
    return { success: true, moduleId: this.moduleId, capabilities: this.capabilities };
  }

  async process(request) {
    const { capability, data, provider } = request;
    if (!this.capabilities.includes(capability)) throw new Error('Unknown capability: ' + capability);
    
    this.metrics.requestsProcessed++;
    try {
      const response = await aiBackbone.makeDecision({ confidence: 0.85 }, {
        moduleId: this.moduleId,
        capability,
        data,
        provider: provider || 'claude',
      });
      this.metrics.successCount++;
      return { success: true, moduleId: this.moduleId, capability, result: response.reasoning };
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  getMetrics() {
    return this.metrics;
  }

  async shutdown() {
    return { success: true };
  }
}

let instance = null;

module.exports = {
  getInstance: () => instance || (instance = new PRESCRIPTIONWRITERAIService()),
  initialize: async (cfg) => module.exports.getInstance().initialize(cfg),
  process: async (req) => module.exports.getInstance().process(req),
  getMetrics: () => module.exports.getInstance().getMetrics(),
  shutdown: async () => module.exports.getInstance().shutdown(),
};
