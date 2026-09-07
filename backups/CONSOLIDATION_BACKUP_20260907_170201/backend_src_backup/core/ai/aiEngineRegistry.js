/**
 * AI Engine Registry
 * Component ID: EBD-CMP-00000003
 * Purpose: AI capability engine registration and dispatch
 *
 * This module provides a centralized registry for all AI engines
 * with their capabilities, status, and dispatch logic.
 *
 * RECONCILED (2026-08-29) with core/aiOrchestrator.js — the file one
 * directory up that actually EXECUTES tasks (14 real engines, each with a
 * citation to the exact service file backing it). This registry's job is
 * narrower than its name suggests: it is the CAPABILITY SELECTION layer
 * (findBestEngine() picks a candidate by capability/cost/confidence for
 * ../ai/aiOrchestratorCore.js's guardrail pipeline to gate), not a second
 * execution engine. ../ai/aiOrchestratorCore.js's executeEngine() maps
 * whatever this file selects onto the matching real task-type key via
 * mapEngineToRealTaskType() and calls the real orchestrator - so this file's
 * metadata (cost_per_1k_tokens, confidence_threshold) still matters for
 * selection and cost estimation, but no entry here reimplements execution.
 *
 * One entry has no real backing anywhere in the codebase and is honestly
 * unmapped rather than faked: the `classification` entry below (generic
 * standalone text classification). mapEngineToRealTaskType() returns null
 * for it, and executeEngine() reports that explicitly instead of guessing.
 * Every other entry (llm_*, vision_*, speech_*, `recommendation`) does map
 * to a real, working engine - see aiOrchestratorCore.js's mapping function
 * for the exact correspondence.
 */

'use strict';

const { logger } = require('../../utils/logger');

/**
 * AI Engine Registry
 * Maintains all available AI engines and their metadata
 */
const AI_ENGINES = {
  // LLM Engines
  llm_claude: {
    id: 'EBD-ENG-00000001',
    name: 'Claude LLM',
    type: 'llm',
    provider: 'claude',
    status: 'ready',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: 0.003,
    max_tokens: 8192,
    confidence_threshold: 0.8,
  },
  llm_openai: {
    id: 'EBD-ENG-00000002',
    name: 'OpenAI GPT',
    type: 'llm',
    provider: 'openai',
    status: 'ready',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: 0.002,
    max_tokens: 4096,
    confidence_threshold: 0.8,
  },
  llm_gemini: {
    id: 'EBD-ENG-00000003',
    name: 'Google Gemini',
    type: 'llm',
    provider: 'gemini',
    status: 'ready',
    capabilities: ['text_generation', 'analysis', 'classification', 'summarization'],
    cost_per_1k_tokens: 0.001,
    max_tokens: 8192,
    confidence_threshold: 0.75,
  },
  
  // Vision Engines
  vision_quality: {
    id: 'EBD-ENG-00000004',
    name: 'Vision Quality Analysis',
    type: 'vision',
    provider: 'local',
    status: 'ready',
    capabilities: ['image_analysis', 'quality_check', 'metadata'],
    cost_per_request: 0.001,
    confidence_threshold: 0.9,
  },
  vision_ocr: {
    id: 'EBD-ENG-00000005',
    name: 'OCR Engine',
    type: 'vision',
    provider: 'local',
    status: 'ready',
    capabilities: ['text_extraction', 'document_processing'],
    cost_per_request: 0.002,
    confidence_threshold: 0.85,
  },
  
  // Speech Engines
  speech_google: {
    id: 'EBD-ENG-00000006',
    name: 'Google Speech',
    type: 'speech',
    provider: 'google',
    status: 'configured',
    capabilities: ['transcription', 'synthesis'],
    cost_per_minute: 0.006,
    confidence_threshold: 0.85,
  },
  speech_azure: {
    id: 'EBD-ENG-00000007',
    name: 'Azure Speech',
    type: 'speech',
    provider: 'azure',
    status: 'configured',
    capabilities: ['transcription', 'synthesis'],
    cost_per_minute: 0.008,
    confidence_threshold: 0.85,
  },
  
  // Domain-Specific Engines
  recommendation: {
    id: 'EBD-ENG-00000008',
    name: 'Recommendation Engine',
    type: 'domain',
    provider: 'local',
    status: 'ready',
    capabilities: ['product_recommendation', 'wellness_advice'],
    cost_per_request: 0.001,
    confidence_threshold: 0.9,
  },
  // No real backing anywhere in the codebase - mapEngineToRealTaskType() in
  // ../ai/aiOrchestratorCore.js returns null for this entry on purpose, and
  // executeEngine() reports that honestly rather than fabricating a result.
  classification: {
    id: 'EBD-ENG-00000009',
    name: 'Classification Engine',
    type: 'domain',
    provider: 'local',
    status: 'ready',
    capabilities: ['text_classification', 'category_mapping'],
    cost_per_request: 0.001,
    confidence_threshold: 0.85,
  },
};

/**
 * Get engine by ID
 */
function getEngine(engineId) {
  return Object.values(AI_ENGINES).find(engine => engine.id === engineId);
}

/**
 * Get engine by name
 */
function getEngineByName(engineName) {
  return AI_ENGINES[engineName];
}

/**
 * Get engines by type
 */
function getEnginesByType(type) {
  return Object.values(AI_ENGINES).filter(engine => engine.type === type);
}

/**
 * Get engines by capability
 */
function getEnginesByCapability(capability) {
  return Object.values(AI_ENGINES).filter(engine => 
    engine.capabilities.includes(capability)
  );
}

/**
 * Get all engines
 */
function listEngines() {
  return Object.values(AI_ENGINES);
}

/**
 * Get ready engines only
 */
function listReadyEngines() {
  return Object.values(AI_ENGINES).filter(engine => 
    engine.status === 'ready' || engine.status === 'configured'
  );
}

/**
 * Register a new engine
 */
function registerEngine(engineConfig) {
  const engineId = engineConfig.id || `EBD-ENG-${generateEngineId()}`;
  
  AI_ENGINES[engineConfig.name] = {
    id: engineId,
    name: engineConfig.name,
    type: engineConfig.type,
    provider: engineConfig.provider,
    status: engineConfig.status || 'ready',
    capabilities: engineConfig.capabilities || [],
    cost_per_1k_tokens: engineConfig.cost_per_1k_tokens || 0,
    max_tokens: engineConfig.max_tokens || 4096,
    confidence_threshold: engineConfig.confidence_threshold || 0.8,
  };
  
  logger.info(`Registered AI engine: ${engineConfig.name} (${engineId})`);
  return engineId;
}

/**
 * Generate unique engine ID
 */
function generateEngineId() {
  return Date.now().toString(16).toUpperCase();
}

/**
 * Find best engine for capability
 */
function findBestEngine(capability, options = {}) {
  const { preferProvider, maxCost, minConfidence } = options;
  
  let candidates = getEnginesByCapability(capability);
  
  if (preferProvider) {
    candidates = candidates.filter(e => e.provider === preferProvider);
  }
  
  if (maxCost) {
    candidates = candidates.filter(e => e.cost_per_1k_tokens <= maxCost);
  }
  
  if (minConfidence) {
    candidates = candidates.filter(e => e.confidence_threshold >= minConfidence);
  }
  
  // Sort by confidence and cost
  candidates.sort((a, b) => {
    if (b.confidence_threshold !== a.confidence_threshold) {
      return b.confidence_threshold - a.confidence_threshold;
    }
    return a.cost_per_1k_tokens - b.cost_per_1k_tokens;
  });
  
  return candidates[0] || null;
}

module.exports = {
  AI_ENGINES,
  getEngine,
  getEngineByName,
  getEnginesByType,
  getEnginesByCapability,
  listEngines,
  listReadyEngines,
  registerEngine,
  findBestEngine,
};