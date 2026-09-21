/**
 * M400 AI Backbone Service - Central AI Orchestration
 * Enterprise-level AI coordination and decision-making backbone
 * 
 * INTEGRATION POINTS:
 * - M401_AI_GATEWAY: Routes all AI requests through governance layer
 * - M402_AI_ORCHESTRATION: Coordinates multi-agent execution
 * - M403-M410: Domain-specific AI modules use backbone for inference
 * - All ERP modules (M0xx): Can call backbone for AI decisions/predictions
 */

const aiProvider = require('../../../backend/src/services/legacy/aiBackboneService');
const { getPostgreSQL, getRedis, getMongoDB } = require('../../../backend/src/database/connection');
const { logger } = require('../../../backend/src/utils/logger');
const crypto = require('crypto');

class AIBackboneService {
  constructor() {
    this.moduleId = 'M400_AI_BACKBONE';
    this.version = '1.0.0';
    this.config = null;
    this.pool = null;
    this.redis = null;
    this.mongodb = null;
    
    // AI Components - lazy initialized
    this.decisionEngine = null;
    this.strategyEngine = null;
    this.learningEngine = null;
    this.predictionEngine = null;
    this.coordinationEngine = null;
    
    // Module Registry - maps modules to AI capabilities
    this.moduleRegistry = new Map();
    this.aiAgents = new Map();
    this.intelligenceCache = new Map();
    
    // Cable System - module-to-module connections
    this.cableConnections = new Map();
    
    // Telemetry
    this.metrics = {
      decisionsCount: 0,
      strategiesCount: 0,
      predictionsCount: 0,
      coordinationEvents: 0,
      cacheHits: 0,
      cacheMisses: 0,
      aiProviderUsage: {},
    };
  }

  /**
   * REQUIRED: Module initialization
   */
  async initialize(config) {
    try {
      logger.info(`Initializing ${this.moduleId}...`);
      
      this.config = config || {};
      this.pool = await getPostgreSQL();
      this.redis = await getRedis();
      this.mongodb = await getMongoDB();
      
      // Initialize AI engines
      await this.initializeDecisionEngine();
      await this.initializeStrategyEngine();
      await this.initializeLearningEngine();
      await this.initializePredictionEngine();
      await this.initializeCoordinationEngine();
      
      // Initialize database tables
      await this.initializeDatabase();
      
      // Load module registry and cable connections
      await this.loadModuleRegistry();
      await this.establishCableConnections();
      
      logger.info(`${this.moduleId} initialized successfully`, {
        engines: ['decision', 'strategy', 'learning', 'prediction', 'coordination'],
        database: 'ready',
        cache: 'ready',
      });
      
      return {
        success: true,
        message: 'AI Backbone initialized successfully',
        moduleId: this.moduleId,
        components: {
          decisionEngine: 'operational',
          strategyEngine: 'operational',
          learningEngine: 'operational',
          predictionEngine: 'operational',
          coordinationEngine: 'operational'
        }
      };
    } catch (error) {
      logger.error(`Failed to initialize ${this.moduleId}:`, error);
      throw new Error(`AI Backbone initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize Decision Engine
   * Handles business logic decisions with AI reasoning
   */
  async initializeDecisionEngine() {
    this.decisionEngine = {
      rules: new Map(),
      history: [],
      statistics: {
        totalDecisions: 0,
        acceptedDecisions: 0,
        rejectedDecisions: 0,
        avgConfidence: 0,
      },

      /**
       * Make a business decision based on context and rules
       */
      makeDecision: async (context, options = {}) => {
        return await this.makeAIDecision(context, options);
      },

      /**
       * Register a decision rule
       */
      registerRule: (ruleId, rule) => {
        this.decisionEngine.rules.set(ruleId, rule);
      },

      /**
       * Get decision statistics
       */
      getStats: () => this.decisionEngine.statistics,
    };
    
    logger.info('Decision Engine initialized');
  }

  /**
   * Initialize Strategy Engine
   * Formulates strategic plans and execution tactics
   */
  async initializeStrategyEngine() {
    this.strategyEngine = {
      strategies: new Map(),
      executionPlans: [],
      status: 'ready',

      /**
       * Generate strategic plan for objectives
       */
      generateStrategy: async (objectives, currentState, options = {}) => {
        return await this.generateAIStrategy(objectives, currentState, options);
      },

      /**
       * Create execution plan from strategy
       */
      createExecutionPlan: (strategy) => {
        return {
          strategyId: strategy.id,
          phases: strategy.phases || [],
          timeline: strategy.timeline || [],
          resources: strategy.resources || [],
          checkpoints: strategy.checkpoints || [],
          createdAt: new Date().toISOString(),
        };
      },

      /**
       * Track strategy execution
       */
      trackExecution: (executionPlan) => {
        this.strategyEngine.executionPlans.push({
          ...executionPlan,
          status: 'active',
          progress: 0,
        });
      },
    };
    
    logger.info('Strategy Engine initialized');
  }

  /**
   * Initialize Learning Engine
   * Accumulates knowledge from decisions and outcomes
   */
  async initializeLearningEngine() {
    this.learningEngine = {
      models: new Map(),
      trainingData: [],
      performanceMetrics: {},
      feedback: new Map(),

      /**
       * Learn from decision outcomes
       */
      learn: async (trainingData) => {
        return await this.learnFromData(trainingData);
      },

      /**
       * Collect feedback on past decisions
       */
      recordFeedback: (decisionId, feedback) => {
        this.learningEngine.feedback.set(decisionId, {
          ...feedback,
          timestamp: new Date().toISOString(),
        });
      },

      /**
       * Get learned patterns
       */
      getPatterns: () => {
        return Array.from(this.learningEngine.models.values());
      },
    };
    
    logger.info('Learning Engine initialized');
  }

  /**
   * Initialize Prediction Engine
   * Forecasts outcomes based on historical data and patterns
   */
  async initializePredictionEngine() {
    this.predictionEngine = {
      models: new Map(),
      predictions: new Map(),
      accuracy: {},
      confidenceThresholds: {
        high: 0.8,
        medium: 0.6,
        low: 0.4,
      },

      /**
       * Predict future outcome
       */
      predict: async (context, modelId, options = {}) => {
        return await this.makePrediction(context, modelId, options);
      },

      /**
       * Get prediction accuracy for model
       */
      getAccuracy: (modelId) => {
        return this.predictionEngine.accuracy[modelId] || 0;
      },

      /**
       * Register prediction model
       */
      registerModel: (modelId, model) => {
        this.predictionEngine.models.set(modelId, model);
      },
    };
    
    logger.info('Prediction Engine initialized');
  }

  /**
   * Initialize Coordination Engine
   * Manages multi-agent orchestration and resource allocation
   */
  async initializeCoordinationEngine() {
    this.coordinationEngine = {
      activeRequests: new Map(),
      agentRegistry: new Map(),
      resourcePool: new Map(),
      queue: [],

      /**
       * Coordinate AI request across agents
       */
      coordinate: async (request) => {
        return await this.coordinateAIRequest(request);
      },

      /**
       * Register AI agent capability
       */
      registerAgent: (agentId, capabilities) => {
        this.coordinationEngine.agentRegistry.set(agentId, {
          id: agentId,
          capabilities,
          status: 'ready',
          lastUsed: null,
        });
      },

      /**
       * Get available agents for capability
       */
      getAvailableAgents: (capability) => {
        const agents = Array.from(this.coordinationEngine.agentRegistry.values());
        return agents.filter(a => a.capabilities.includes(capability) && a.status === 'ready');
      },
    };
    
    logger.info('Coordination Engine initialized');
  }

  /**
   * Initialize database tables for AI backbone
   */
  async initializeDatabase() {
    try {
      // AI decisions table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_decisions (
          id SERIAL PRIMARY KEY,
          decision_id VARCHAR(100) UNIQUE NOT NULL,
          module_id VARCHAR(50),
          decision_type VARCHAR(50),
          context JSONB,
          decision_data JSONB,
          confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
          reasoning TEXT,
          provider VARCHAR(50),
          model VARCHAR(100),
          status VARCHAR(20) DEFAULT 'created',
          feedback JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (module_id, created_at),
          INDEX (status)
        )
      `);

      // AI strategies table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_strategies (
          id SERIAL PRIMARY KEY,
          strategy_id VARCHAR(100) UNIQUE NOT NULL,
          strategy_name VARCHAR(100),
          module_id VARCHAR(50),
          objectives TEXT[],
          tactics JSONB,
          execution_plan JSONB,
          status VARCHAR(20) DEFAULT 'created',
          confidence NUMERIC,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP,
          INDEX (module_id, status)
        )
      `);

      // AI predictions table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_predictions (
          id SERIAL PRIMARY KEY,
          prediction_id VARCHAR(100) UNIQUE NOT NULL,
          module_id VARCHAR(50),
          model_id VARCHAR(100),
          prediction_data JSONB,
          confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
          accuracy NUMERIC,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verified_at TIMESTAMP,
          actual_outcome JSONB,
          INDEX (module_id, created_at)
        )
      `);

      // AI intelligence cache table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_intelligence_cache (
          id SERIAL PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          intelligence_data JSONB,
          source_modules TEXT[],
          expiry_time TIMESTAMP,
          hit_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          accessed_at TIMESTAMP,
          INDEX (expiry_time)
        )
      `);

      // AI agent executions table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_agent_executions (
          id SERIAL PRIMARY KEY,
          execution_id VARCHAR(100) UNIQUE NOT NULL,
          agent_id VARCHAR(100),
          capability VARCHAR(100),
          input_data JSONB,
          output_data JSONB,
          status VARCHAR(20),
          duration_ms INT,
          provider VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (agent_id, created_at)
        )
      `);

      // AI learning feedback table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_learning_feedback (
          id SERIAL PRIMARY KEY,
          decision_id VARCHAR(100),
          feedback_type VARCHAR(50),
          feedback_data JSONB,
          accuracy_impact NUMERIC,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (decision_id)
        )
      `);

      logger.info('AI Backbone database tables initialized');
    } catch (error) {
      logger.error('Failed to initialize AI Backbone database tables:', error);
      throw error;
    }
  }

  /**
   * Load module registry from configuration
   */
  async loadModuleRegistry() {
    try {
      // Load from database or config
      const result = await this.pool.query(`
        SELECT module_id, capabilities, status 
        FROM module_registry 
        WHERE is_active = true
      `);

      result.rows.forEach(row => {
        this.moduleRegistry.set(row.module_id, {
          moduleId: row.module_id,
          capabilities: row.capabilities || [],
          status: row.status,
        });
      });

      logger.info(`Loaded ${this.moduleRegistry.size} modules into registry`);
    } catch (error) {
      logger.warn('Could not load module registry from database:', error.message);
      // Continue with empty registry - modules can register dynamically
    }
  }

  /**
   * Establish cable connections between modules and AI backbone
   */
  async establishCableConnections() {
    try {
      const result = await this.pool.query(`
        SELECT source_module, target_module, connection_type, metadata
        FROM module_cables
        WHERE (source_module LIKE 'M4%' OR target_module LIKE 'M4%')
        AND status = 'active'
      `);

      result.rows.forEach(row => {
        const key = `${row.source_module}:${row.target_module}`;
        this.cableConnections.set(key, {
          sourceModule: row.source_module,
          targetModule: row.target_module,
          connectionType: row.connection_type,
          metadata: row.metadata || {},
          status: 'connected',
        });
      });

      logger.info(`Established ${this.cableConnections.size} cable connections`);
    } catch (error) {
      logger.warn('Could not establish cable connections:', error.message);
    }
  }

  /**
   * Make an AI-powered decision
   */
  async makeAIDecision(context, options = {}) {
    const decisionId = `DEC_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const { moduleId, capability, data, provider, maxTokens } = options;

    try {
      // Build decision context
      const decisionContext = {
        moduleId: moduleId || 'unknown',
        capability: capability || 'general',
        timestamp: new Date().toISOString(),
        ...context,
      };

      // Check cache first
      const cacheKey = `decision:${moduleId}:${JSON.stringify(data).slice(0, 50)}`;
      const cached = await this.redis?.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        logger.info('Decision cache hit', { decisionId, cacheKey });
        return JSON.parse(cached);
      }

      this.metrics.cacheMisses++;

      // Call AI provider
      const aiResponse = await aiProvider.callAI(
        this.buildDecisionPrompt(decisionContext, data),
        { provider, maxTokens: maxTokens || 2048 }
      );

      // Store decision in database
      await this.pool.query(
        `INSERT INTO ai_decisions 
         (decision_id, module_id, decision_type, context, decision_data, confidence, reasoning, provider, model, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          decisionId,
          moduleId || 'unknown',
          capability,
          JSON.stringify(decisionContext),
          JSON.stringify(data),
          context.confidence || 0.75,
          aiResponse.content,
          aiResponse.provider,
          aiResponse.model,
          'created',
        ]
      );

      // Cache the decision
      if (this.redis) {
        await this.redis.setex(cacheKey, 3600, JSON.stringify({
          decisionId,
          reasoning: aiResponse.content,
          provider: aiResponse.provider,
          model: aiResponse.model,
        }));
      }

      this.metrics.decisionsCount++;

      const decision = {
        success: true,
        decisionId,
        moduleId: moduleId || 'unknown',
        capability,
        reasoning: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        confidence: context.confidence || 0.75,
        timestamp: new Date().toISOString(),
      };

      logger.info('AI Decision made', { decisionId, moduleId, confidence: context.confidence });
      return decision;

    } catch (error) {
      logger.error('Failed to make AI decision', { decisionId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate an AI strategy
   */
  async generateAIStrategy(objectives, currentState, options = {}) {
    const strategyId = `STR_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const { moduleId, provider, maxTokens } = options;

    try {
      // Build strategy prompt
      const prompt = `You are a strategic planner. Given these objectives and current state, formulate a detailed strategy:

OBJECTIVES:
${Array.isArray(objectives) ? objectives.join('\n') : objectives}

CURRENT STATE:
${JSON.stringify(currentState, null, 2)}

Provide a structured strategy with:
1. Strategic Goals
2. Execution Phases (with timeline)
3. Resource Requirements
4. Success Metrics
5. Risk Mitigation
6. Contingency Plans`;

      const aiResponse = await aiProvider.callAI(prompt, { 
        provider, 
        maxTokens: maxTokens || 3000 
      });

      // Store strategy
      await this.pool.query(
        `INSERT INTO ai_strategies 
         (strategy_id, module_id, strategy_name, objectives, tactics, status, confidence, provider, model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          strategyId,
          moduleId || 'unknown',
          `Strategy_${strategyId}`,
          JSON.stringify(objectives),
          JSON.stringify({ reasoning: aiResponse.content }),
          'created',
          0.8,
          aiResponse.provider,
          aiResponse.model,
        ]
      );

      this.metrics.strategiesCount++;

      const strategy = {
        success: true,
        strategyId,
        moduleId: moduleId || 'unknown',
        objectives,
        strategy: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
      };

      logger.info('AI Strategy generated', { strategyId, moduleId });
      return strategy;

    } catch (error) {
      logger.error('Failed to generate AI strategy', { strategyId, error: error.message });
      throw error;
    }
  }

  /**
   * Make an AI prediction
   */
  async makePrediction(context, modelId, options = {}) {
    const predictionId = `PRED_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const { moduleId, provider, maxTokens } = options;

    try {
      const prompt = `Based on this historical data and context, provide a prediction:

CONTEXT:
${JSON.stringify(context, null, 2)}

MODEL: ${modelId}

Provide a prediction with:
1. Predicted Outcome
2. Confidence Level (0-1)
3. Key Factors
4. Uncertainty Ranges
5. Recommendations`;

      const aiResponse = await aiProvider.callAI(prompt, { 
        provider, 
        maxTokens: maxTokens || 2048 
      });

      // Store prediction
      await this.pool.query(
        `INSERT INTO ai_predictions 
         (prediction_id, module_id, model_id, prediction_data, confidence, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          predictionId,
          moduleId || 'unknown',
          modelId,
          JSON.stringify({ prediction: aiResponse.content, context }),
          0.7,
        ]
      );

      this.metrics.predictionsCount++;

      const prediction = {
        success: true,
        predictionId,
        moduleId: moduleId || 'unknown',
        modelId,
        prediction: aiResponse.content,
        confidence: 0.7,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: new Date().toISOString(),
      };

      logger.info('AI Prediction made', { predictionId, modelId });
      return prediction;

    } catch (error) {
      logger.error('Failed to make AI prediction', { predictionId, error: error.message });
      throw error;
    }
  }

  /**
   * Coordinate multi-agent AI request
   */
  async coordinateAIRequest(request) {
    const executionId = `EXEC_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const { moduleId, capability, input, agents, timeout = 30000 } = request;

    try {
      // Get available agents for capability
      const availableAgents = this.coordinationEngine.getAvailableAgents(capability);
      
      if (availableAgents.length === 0) {
        throw new Error(`No agents available for capability: ${capability}`);
      }

      // Select best agent (round-robin for now)
      const agent = availableAgents[0];
      
      // Execute with timeout
      const startTime = Date.now();
      const execution = {
        executionId,
        agentId: agent.id,
        capability,
        status: 'executing',
        input,
      };

      // Store execution
      await this.pool.query(
        `INSERT INTO ai_agent_executions 
         (execution_id, agent_id, capability, input_data, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          executionId,
          agent.id,
          capability,
          JSON.stringify(input),
          'executing',
        ]
      );

      // Call agent (with AI provider fallback)
      const result = await aiProvider.callAI(
        `Execute capability: ${capability}\n\nInput:\n${JSON.stringify(input)}`,
        { maxTokens: 2048 }
      );

      const duration = Date.now() - startTime;

      // Update execution
      await this.pool.query(
        `UPDATE ai_agent_executions 
         SET output_data = $1, status = $2, duration_ms = $3 
         WHERE execution_id = $4`,
        [
          JSON.stringify(result),
          'completed',
          duration,
          executionId,
        ]
      );

      this.metrics.coordinationEvents++;

      logger.info('AI Request coordinated', { executionId, agentId: agent.id, duration });

      return {
        success: true,
        executionId,
        agentId: agent.id,
        result: result.content,
        duration,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      logger.error('Failed to coordinate AI request', { executionId, error: error.message });
      throw error;
    }
  }

  /**
   * Learn from decision outcomes
   */
  async learnFromData(trainingData) {
    try {
      const { decisionId, outcome, feedback, accuracy } = trainingData;

      // Store feedback
      await this.pool.query(
        `INSERT INTO ai_learning_feedback 
         (decision_id, feedback_type, feedback_data, accuracy_impact)
         VALUES ($1, $2, $3, $4)`,
        [
          decisionId,
          'outcome_feedback',
          JSON.stringify({ outcome, feedback }),
          accuracy || 0,
        ]
      );

      // Update decision with feedback
      if (decisionId) {
        await this.pool.query(
          `UPDATE ai_decisions SET feedback = $1, status = $2 WHERE decision_id = $3`,
          [JSON.stringify({ outcome, feedback }), 'evaluated', decisionId]
        );
      }

      logger.info('Learning data recorded', { decisionId, accuracy });

      return {
        success: true,
        message: 'Learning data recorded',
        decisionId,
      };

    } catch (error) {
      logger.error('Failed to record learning data', { error: error.message });
      throw error;
    }
  }

  /**
   * Build decision prompt
   */
  buildDecisionPrompt(context, data) {
    return `You are an AI decision maker for module: ${context.moduleId}
Capability: ${context.capability}

Context:
${JSON.stringify(context, null, 2)}

Data to analyze:
${JSON.stringify(data, null, 2)}

Provide a decision with:
1. Recommended Action
2. Reasoning
3. Confidence Level (0-1)
4. Alternatives Considered
5. Risks`;
  }

  /**
   * Get backbone metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      modulesRegistered: this.moduleRegistry.size,
      agentsActive: this.coordinationEngine.agentRegistry.size,
      cableConnections: this.cableConnections.size,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const checks = {
      database: false,
      cache: false,
      aiProviders: false,
      engines: {
        decision: !!this.decisionEngine,
        strategy: !!this.strategyEngine,
        learning: !!this.learningEngine,
        prediction: !!this.predictionEngine,
        coordination: !!this.coordinationEngine,
      },
    };

    try {
      await this.pool.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error.message);
    }

    try {
      if (this.redis) {
        await this.redis.ping();
        checks.cache = true;
      }
    } catch (error) {
      logger.error('Cache health check failed:', error.message);
    }

    const providerStatus = aiProvider.getAIProviderStatus?.();
    checks.aiProviders = providerStatus?.availableProviders?.length > 0;

    return {
      moduleId: this.moduleId,
      status: Object.values(checks).every(v => v === true || typeof v === 'object') ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * REQUIRED: Module shutdown
   */
  async shutdown() {
    try {
      logger.info(`Shutting down ${this.moduleId}...`);
      
      if (this.pool) {
        await this.pool.end();
      }
      
      logger.info(`${this.moduleId} shutdown complete`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to shutdown ${this.moduleId}:`, error);
      throw error;
    }
  }
}

// Export singleton
let serviceInstance = null;

module.exports = {
  /**
   * Get service instance (singleton)
   */
  getInstance: () => {
    if (!serviceInstance) {
      serviceInstance = new AIBackboneService();
    }
    return serviceInstance;
  },

  /**
   * Initialize service
   */
  initialize: async (config) => {
    const service = module.exports.getInstance();
    return await service.initialize(config);
  },

  /**
   * Make decision
   */
  makeDecision: async (context, options) => {
    const service = module.exports.getInstance();
    return await service.makeAIDecision(context, options);
  },

  /**
   * Generate strategy
   */
  generateStrategy: async (objectives, state, options) => {
    const service = module.exports.getInstance();
    return await service.generateAIStrategy(objectives, state, options);
  },

  /**
   * Make prediction
   */
  makePrediction: async (context, modelId, options) => {
    const service = module.exports.getInstance();
    return await service.makePrediction(context, modelId, options);
  },

  /**
   * Coordinate request
   */
  coordinateRequest: async (request) => {
    const service = module.exports.getInstance();
    return await service.coordinateAIRequest(request);
  },

  /**
   * Get metrics
   */
  getMetrics: () => {
    const service = module.exports.getInstance();
    return service.getMetrics();
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const service = module.exports.getInstance();
    return await service.healthCheck();
  },

  /**
   * Shutdown
   */
  shutdown: async () => {
    const service = module.exports.getInstance();
    return await service.shutdown();
  },

  // Direct engine access
  decisionEngine: () => module.exports.getInstance().decisionEngine,
  strategyEngine: () => module.exports.getInstance().strategyEngine,
  learningEngine: () => module.exports.getInstance().learningEngine,
  predictionEngine: () => module.exports.getInstance().predictionEngine,
  coordinationEngine: () => module.exports.getInstance().coordinationEngine,
};
