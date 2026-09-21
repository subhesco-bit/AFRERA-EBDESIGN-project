/**
 * AI Intelligence Fabric - Main Entry Point
 * Module ID: EBD-MOD-00000001
 */
'use strict';

const { AIOrchestrator, orchestrator } = require('./aiOrchestratorCore');
const aiProviderAdapters = require('./aiProviderAdapters');
const aiEngineRegistry = require('./aiEngineRegistry');
const aiConfidenceEngine = require('./aiConfidenceEngine');
const aiCostController = require('./aiCostController');
const aiGuardrails = require('./aiGuardrails');
const aiAuditLogger = require('./aiAuditLogger');
const aiBackboneRuntime = require('./aiBackboneRuntime');
const integrationRegistry = require('../integration/systemIntegrationRegistry');
const AI_MODULE_REGISTRY = require('./AI_MODULE_REGISTRY.json');

async function initializeAI(config = {}) {
  try {
    await orchestrator.initialize();
    return {
      success: true,
      message: 'AI Intelligence Fabric initialized successfully',
      status: orchestrator.getStatus(),
      backbone: {
        enabled: true,
        agents: aiBackboneRuntime.listAgents().length,
        integrationContracts: integrationRegistry.listContracts().length,
      },
      config: { hasConfig: Object.keys(config).length > 0 },
    };
  } catch (error) {
    return { success: false, message: `Failed to initialize AI Intelligence Fabric: ${error.message}`, error };
  }
}

function getAIStatus() {
  return {
    module: AI_MODULE_REGISTRY,
    orchestrator: orchestrator.getStatus(),
    providers: aiProviderAdapters.listConfiguredProviders(),
    engines: aiEngineRegistry.listReadyEngines(),
    cost: aiCostController.getCostState(),
    backbone: {
      enabled: true,
      agents: aiBackboneRuntime.listAgents(),
      autonomyLevels: aiBackboneRuntime.AUTONOMY,
      integrationContracts: integrationRegistry.listContracts(),
    },
  };
}

async function handleAIRequest(req, res) {
  try {
    const { taskType, payload = {}, options = {}, agentId, objective, execute = false, autonomyLevel } = req.body;

    if (agentId) {
      const result = await aiBackboneRuntime.runAgent({
        agentId,
        taskType,
        payload,
        objective,
        query: payload.query,
        context: payload.context,
        execute,
        autonomyLevel,
        options,
        actorId: req.user?.id || req.user?.userId,
      });
      return res.json({ success: true, data: result });
    }

    if (!taskType) return res.status(400).json({ success: false, error: 'taskType or agentId is required' });
    const result = await orchestrator.route(taskType, payload, { user: req.user, ...options });
    return res.json({ success: true, data: result });
  } catch (error) {
    const status = error.code === 'UNKNOWN_AI_AGENT' ? 400 : 500;
    return res.status(status).json({ success: false, error: error.message });
  }
}

module.exports = {
  AIOrchestrator,
  orchestrator,
  aiProviderAdapters,
  aiEngineRegistry,
  aiConfidenceEngine,
  aiCostController,
  aiGuardrails,
  aiAuditLogger,
  aiBackboneRuntime,
  integrationRegistry,
  AI_MODULE_REGISTRY,
  initializeAI,
  getAIStatus,
  handleAIRequest,
};
