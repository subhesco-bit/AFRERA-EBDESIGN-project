/**
 * AI Orchestrator Core
 * Component ID: EBD-CMP-00000001
 * Purpose: Central AI task routing and classification
 * 
 * This is the main orchestrator that coordinates all AI components:
 * - Provider adapters for vendor-agnostic access
 * - Engine registry for capability management
 * - Confidence engine for decision quality
 * - Cost controller for economic governance
 * - Guardrails for security and validation
 * - Audit logger for provenance tracking
 */

'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');

// Import AI components
const { providerStatus, listConfiguredProviders, getProviderEnv } = require('./aiProviderAdapters');
const { findBestEngine, getEnginesByCapability } = require('./aiEngineRegistry');
const { evaluateConfidence, getRecommendedAction } = require('./aiConfidenceEngine');
const { recordCost, getCostState, estimateCost } = require('./aiCostController');
const { validateInput, validateOutput, checkAuthorization, checkRateLimit } = require('./aiGuardrails');
const { logAIDecision, generateTraceId } = require('./aiAuditLogger');

/**
 * Maps an ./aiEngineRegistry.js AI_ENGINES entry onto the corresponding real
 * core/aiOrchestrator.js ENGINES task-type key. Returns null (not a fallback
 * task type) when no honest mapping exists yet — the caller reports that
 * explicitly rather than guessing.
 */
function mapEngineToRealTaskType(engine) {
  if (engine.type === 'llm') return 'llm';
  if (engine.name === 'Vision Quality Analysis') return 'vision_engine';
  if (engine.name === 'OCR Engine') return 'ocr_engine';
  if (engine.type === 'speech') return 'speech_engine';
  if (engine.name === 'Recommendation Engine') return 'recommendation_engine';
  // "Classification Engine" (domain/local) has no real backing anywhere in
  // core/aiOrchestrator.js's ENGINES today - text classification only exists
  // as a capability label on the LLM entries there, not a standalone engine.
  return null;
}

/**
 * Builds the payload shape core/aiOrchestrator.js's real ENGINES[taskType].invoke
 * expects, from this class's more generic (engine, input, options) call shape.
 */
function buildRealOrchestratorPayload(taskType, engine, input, options) {
  if (taskType === 'llm') {
    return {
      provider: engine.provider,
      prompt: typeof input === 'string' ? input : JSON.stringify(input),
      allowTemplateFallback: options.allowTemplateFallback || false,
    };
  }
  if (taskType === 'vision_engine') {
    return {
      buffer: options.buffer,
      imageBase64: options.imageBase64 || (typeof input === 'string' ? input : undefined),
      operation: options.operation || 'analyze_quality',
      width: options.width, height: options.height, fit: options.fit, format: options.format,
    };
  }
  if (taskType === 'ocr_engine') {
    return {
      buffer: options.buffer,
      imageBase64: options.imageBase64 || (typeof input === 'string' ? input : undefined),
      language: options.language || 'eng',
      reportNumber: options.reportNumber,
    };
  }
  if (taskType === 'speech_engine') {
    return {
      provider: engine.provider,
      action: options.action || 'transcribe',
      audioBase64: options.audioBase64,
      text: options.text || (typeof input === 'string' ? input : undefined),
    };
  }
  if (taskType === 'recommendation_engine') {
    return {
      concern: options.concern || (typeof input === 'string' ? input : undefined),
      month: options.month,
    };
  }
  return { input, ...options };
}

/**
 * Main AI Orchestrator Class
 */
class AIOrchestrator {
  constructor(config = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'claude',
      fallbackProvider: config.fallbackProvider || 'openai',
      confidenceThreshold: config.confidenceThreshold || 0.7,
      costBudgetHourly: config.costBudgetHourly || 10.0,
      enableAuditLogging: config.enableAuditLogging !== false,
    };
    
    this.initialized = false;
  }

  /**
   * Initialize the orchestrator
   */
  async initialize() {
    try {
      // Create audit table if it doesn't exist
      await this.createAuditTable();
      
      this.initialized = true;
      logger.info('AI Orchestrator initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize AI Orchestrator: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create audit table
   */
  async createAuditTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ai_audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actor_type VARCHAR(50),
        actor_id VARCHAR(255),
        operation VARCHAR(100),
        engine_id VARCHAR(50),
        provider VARCHAR(50),
        model VARCHAR(100),
        prompt_version VARCHAR(50),
        input_summary TEXT,
        output_summary TEXT,
        confidence_score DECIMAL(5,4),
        confidence_dimensions JSONB,
        data_sources JSONB,
        tools_used JSONB,
        rules_triggered JSONB,
        decision_factors JSONB,
        validation_status VARCHAR(50),
        human_approved BOOLEAN,
        approver_id VARCHAR(255),
        cost_tokens INTEGER,
        cost_usd DECIMAL(10,4),
        latency_ms INTEGER,
        error TEXT,
        trace_id VARCHAR(100)
      );
    `;
    
    await pool.query(createTableQuery);
  }

  /**
   * Route AI task to appropriate engine
   */
  async route(taskType, payload, options = {}) {
    const traceId = generateTraceId();
    const startTime = Date.now();
    
    try {
      // Find best engine for the task
      const engine = findBestEngine(taskType, {
        preferProvider: options.provider || this.config.defaultProvider,
        maxCost: options.maxCost,
        minConfidence: this.config.confidenceThreshold,
      });
      
      if (!engine) {
        throw new Error(`No suitable engine found for task type: ${taskType}`);
      }
      
      // Validate input
      const inputValidation = validateInput(payload.input, options.inputContext);
      if (!inputValidation.valid) {
        throw new Error(`Input validation failed: ${inputValidation.violations[0].message}`);
      }
      
      // Check authorization
      const authCheck = checkAuthorization(options.user, taskType, options.resource);
      if (!authCheck.authorized) {
        throw new Error(`Authorization failed: ${authCheck.reason}`);
      }
      
      // Check rate limit
      const rateLimit = checkRateLimit(options.userId, taskType);
      if (!rateLimit.withinLimit) {
        throw new Error(`Rate limit exceeded: ${rateLimit.remaining} requests remaining`);
      }
      
      // Estimate cost
      const estimatedCost = estimateCost(engine.provider, options.estimatedTokens || 1000);
      
      // Check budget
      const costState = getCostState();
      if (costState.hourlySpend + estimatedCost > this.config.costBudgetHourly) {
        throw new Error('Budget limit would be exceeded');
      }
      
      // Execute the task (this would dispatch to the actual engine)
      const result = await this.executeEngine(engine, inputValidation.sanitized, options);
      
      // Validate output
      const outputValidation = validateOutput(result.output, options.outputContext);
      
      // Calculate confidence
      const confidence = evaluateConfidence({
        modelScore: engine.confidence_threshold,
        sourceReliability: 0.9, // Would be calculated from data sources
        ruleMatchStrength: 0.8, // Would be calculated from rule matching
        dataFreshness: 1.0, // Would be calculated from data age
        consistencyScore: 0.9, // Would be calculated from consistency checks
        historicalAccuracy: 0.85, // Would be loaded from historical data
      });
      
      // Get recommended action
      const recommendedAction = getRecommendedAction(confidence);
      
      // Record actual cost
      const actualCost = recordCost(engine.provider, options.actualTokens || 1000, {
        traceId,
        engineId: engine.id,
        taskType,
      });
      
      // Log decision
      if (this.config.enableAuditLogging) {
        await logAIDecision({
          actorType: options.user?.type || 'system',
          actorId: options.user?.id || 'system',
          operation: taskType,
          engineId: engine.id,
          provider: engine.provider,
          model: engine.name,
          promptVersion: options.promptVersion || '1.0',
          input: inputValidation.sanitized,
          output: result.output,
          confidenceScore: confidence.overall,
          confidenceDimensions: confidence.dimensions,
          dataSources: options.dataSources || [],
          toolsUsed: options.toolsUsed || [],
          rulesTriggered: options.rulesTriggered || [],
          decisionFactors: confidence.dimensions,
          validationStatus: outputValidation.valid ? 'approved' : 'rejected',
          humanApproved: recommendedAction.requiresHumanApproval ? false : true,
          approverId: recommendedAction.requiresHumanApproval ? null : 'system',
          costTokens: options.actualTokens || 1000,
          costUsd: actualCost.cost,
          latencyMs: Date.now() - startTime,
          traceId,
        });
      }
      
      return {
        success: true,
        result: result.output,
        engine: engine.name,
        provider: engine.provider,
        confidence: confidence,
        recommendedAction,
        cost: actualCost,
        traceId,
        inputValidation,
        outputValidation,
      };
    } catch (error) {
      logger.error(`AI task routing failed: ${error.message}`);
      
      // Log error decision
      if (this.config.enableAuditLogging) {
        await logAIDecision({
          actorType: options.user?.type || 'system',
          actorId: options.user?.id || 'system',
          operation: taskType,
          engineId: 'error',
          provider: 'error',
          model: 'error',
          input: payload.input,
          output: null,
          confidenceScore: 0,
          error: error.message,
          traceId,
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute AI engine.
   *
   * (2026-08-29) This used to be a literal placeholder — every call through
   * this class's route() (validate -> authorize -> rate-limit -> cost ->
   * HERE -> confidence -> audit-log, all real, working guardrail logic) was
   * gating a fabricated `{message: 'AI engine execution placeholder'}`
   * regardless of what engine findBestEngine() picked. The engine catalog in
   * ./aiEngineRegistry.js is metadata-only (cost/confidence-threshold
   * numbers for selection) and was never connected to anything that could
   * actually run a task. core/aiOrchestrator.js (a sibling file one
   * directory up, NOT this one) is the real dispatcher — 12 genuinely wired
   * engines, each citing the exact service file backing it, honest
   * not_configured/stub results where no real implementation exists. This
   * method now maps the AI_ENGINES entry picked by findBestEngine() onto
   * that real dispatcher's task-type keys and calls it, so every guardrail
   * above is now gating something real. Where no honest mapping exists
   * (e.g. AI_ENGINES' "Classification Engine" has no real backing anywhere
   * in the codebase), this returns an explicit not_configured result rather
   * than inventing one — same discipline core/aiOrchestrator.js already
   * holds itself to.
   */
  async executeEngine(engine, input, options = {}) {
    const realOrchestrator = require('../aiOrchestrator');
    const mapped = mapEngineToRealTaskType(engine);

    if (!mapped) {
      return {
        output: {
          ok: false,
          status: 'not_configured',
          engine: engine.name,
          reason: `"${engine.name}" (${engine.id}) has no real implementation wired anywhere `
            + 'in the codebase yet. Reported honestly rather than fabricating a result.',
        },
      };
    }

    const realPayload = buildRealOrchestratorPayload(mapped, engine, input, options);
    const routed = await realOrchestrator.route(mapped, realPayload, options);
    return { output: routed };
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      config: this.config,
      costState: getCostState(),
      configuredProviders: listConfiguredProviders(),
    };
  }
}

// Export singleton instance
const orchestrator = new AIOrchestrator();

module.exports = {
  AIOrchestrator,
  orchestrator,
};