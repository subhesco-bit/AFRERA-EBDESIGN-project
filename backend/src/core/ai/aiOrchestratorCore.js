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
   * Execute AI engine (placeholder for actual implementation)
   */
  async executeEngine(engine, input, options) {
    // This would dispatch to the actual engine implementation
    // For now, we'll return a placeholder response
    
    return {
      output: {
        message: 'AI engine execution placeholder',
        engine: engine.name,
        inputSummary: typeof input === 'string' ? input.substring(0, 100) : 'complex input',
      },
    };
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