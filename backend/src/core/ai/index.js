/**
 * AI Intelligence Fabric - Main Entry Point
 * Module ID: EBD-MOD-00000001
 * 
 * This module exports all AI intelligence fabric components
 * in a structured, professional manner with unique IDs.
 */

'use strict';

// Core AI Components
const { AIOrchestrator, orchestrator } = require('./aiOrchestratorCore');
const aiProviderAdapters = require('./aiProviderAdapters');
const aiEngineRegistry = require('./aiEngineRegistry');
const aiConfidenceEngine = require('./aiConfidenceEngine');
const aiCostController = require('./aiCostController');
const aiGuardrails = require('./aiGuardrails');
const aiAuditLogger = require('./aiAuditLogger');

// Module Registry
const AI_MODULE_REGISTRY = require('./AI_MODULE_REGISTRY.json');

/**
 * Initialize AI Intelligence Fabric
 */
async function initializeAI(config = {}) {
  try {
    await orchestrator.initialize();
    return {
      success: true,
      message: 'AI Intelligence Fabric initialized successfully',
      status: orchestrator.getStatus(),
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize AI Intelligence Fabric: ${error.message}`,
      error,
    };
  }
}

/**
 * Get AI Fabric status
 */
function getAIStatus() {
  return {
    module: AI_MODULE_REGISTRY,
    orchestrator: orchestrator.getStatus(),
    providers: aiProviderAdapters.listConfiguredProviders(),
    engines: aiEngineRegistry.listReadyEngines(),
    cost: aiCostController.getCostState(),
  };
}

/**
 * Main AI route handler
 */
async function handleAIRequest(req, res) {
  try {
    const { taskType, payload, options } = req.body;
    
    const result = await orchestrator.route(taskType, payload, {
      user: req.user,
      ...options,
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  // Core Components
  AIOrchestrator,
  orchestrator,
  aiProviderAdapters,
  aiEngineRegistry,
  aiConfidenceEngine,
  aiCostController,
  aiGuardrails,
  aiAuditLogger,
  
  // Module Registry
  AI_MODULE_REGISTRY,
  
  // Initialization
  initializeAI,
  getAIStatus,
  
  // Route Handler
  handleAIRequest,
};