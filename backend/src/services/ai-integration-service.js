/**
 * UNIVERSAL AI INTEGRATION SERVICE
 * Connects all ERP modules to AI ecosystem
 * Handles routing, caching, versioning, notifications
 */

'use strict';

const aiBackbone = require('../../../modules/M400_AI_BACKBONE/backend/service');
const aiGateway = require('../../../modules/M401_AI_GATEWAY/backend/service');
const { getPostgreSQL, getMongoDB } = require('../database/connection');
// database/connection.js has no Redis accessor -- `getRedis` was imported from
// it but never existed there, so `await getRedis()` below threw at init.
// The project's Redis client lives in cache/redis.js, whose exported
// getClient() THROWS when Redis is not initialized. It is called defensively
// so this.redis stays null in that case, preserving the `if (this.redis)`
// degradation the caching paths below already rely on.
const { getClient: getRedisClient } = require('../cache/redis');
const { logger } = require('../utils/logger');
const EventEmitter = require('events');
const crypto = require('crypto');

/**
 * AI Integration Context
 * Manages all AI interactions across modules
 */
class AIIntegrationService extends EventEmitter {
  constructor() {
    super();
    this.moduleId = 'AI_INTEGRATION_SERVICE';
    this.pool = null;
    this.redis = null;
    this.mongodb = null;
    
    // Integration tracking
    this.activeDecisions = new Map();
    this.decisionHistory = new Map();
    this.moduleConnections = new Map();
    this.intelligenceSharing = new Map();
    
    // Metrics
    this.metrics = {
      totalDecisions: 0,
      activeDecisions: 0,
      cachedDecisions: 0,
      crossModuleShares: 0,
      batchProcessed: 0,
      notificationsSent: 0,
    };
  }

  /**
   * Initialize integration service
   */
  async initialize(config) {
    try {
      logger.info('Initializing AI Integration Service...');
      
      this.pool = await getPostgreSQL();
      try {
        this.redis = getRedisClient();
      } catch {
        this.redis = null; // Redis unavailable: caching is skipped, not fatal.
      }
      this.mongodb = await getMongoDB();
      
      await this.initializeDatabase();
      await this.registerModuleConnections();
      await this.setupEventListeners();
      
      logger.info('AI Integration Service initialized successfully');
      
      return {
        success: true,
        moduleId: this.moduleId,
        status: 'ready',
      };
    } catch (error) {
      logger.error('Failed to initialize AI Integration Service:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema for integration
   */
  async initializeDatabase() {
    try {
      // AI Decisions with module context
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_decisions_extended (
          id SERIAL PRIMARY KEY,
          decision_id VARCHAR(100) UNIQUE NOT NULL,
          source_module VARCHAR(100) NOT NULL,
          target_module VARCHAR(100),
          capability VARCHAR(100) NOT NULL,
          request_context JSONB,
          ai_response JSONB,
          confidence NUMERIC,
          version INT DEFAULT 1,
          parent_decision_id VARCHAR(100),
          status VARCHAR(20) DEFAULT 'created',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (source_module, created_at),
          INDEX (target_module, created_at),
          INDEX (status)
        )
      `);

      // Cross-module intelligence cache
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS cross_module_intelligence (
          id SERIAL PRIMARY KEY,
          intelligence_id VARCHAR(100) UNIQUE NOT NULL,
          source_module VARCHAR(100) NOT NULL,
          target_modules TEXT[] NOT NULL,
          intelligence_data JSONB NOT NULL,
          relevance_score NUMERIC,
          shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          INDEX (source_module),
          INDEX (shared_at)
        )
      `);

      // Batch AI processing jobs
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_batch_jobs (
          id SERIAL PRIMARY KEY,
          job_id VARCHAR(100) UNIQUE NOT NULL,
          source_module VARCHAR(100),
          batch_requests JSONB,
          batch_results JSONB,
          status VARCHAR(20) DEFAULT 'pending',
          started_at TIMESTAMP,
          completed_at TIMESTAMP,
          INDEX (source_module, status)
        )
      `);

      // AI notifications log
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_notifications (
          id SERIAL PRIMARY KEY,
          notification_id VARCHAR(100) UNIQUE NOT NULL,
          decision_id VARCHAR(100),
          source_module VARCHAR(100),
          target_modules TEXT[],
          notification_type VARCHAR(50),
          payload JSONB,
          delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (source_module, delivered_at)
        )
      `);

      // Decision versioning
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ai_decision_versions (
          id SERIAL PRIMARY KEY,
          decision_id VARCHAR(100) NOT NULL,
          version INT NOT NULL,
          decision_data JSONB,
          change_reason TEXT,
          changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(decision_id, version),
          INDEX (decision_id)
        )
      `);

      logger.info('AI Integration database schema initialized');
    } catch (error) {
      logger.error('Failed to initialize AI Integration database:', error);
      throw error;
    }
  }

  /**
   * Process AI request from any ERP module
   */
  async processModuleAIRequest(request) {
    const decisionId = `INTEG_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const {
      sourceModule,
      capability,
      data,
      priority = 'normal',
      batch = false,
      context = {},
    } = request;

    this.metrics.totalDecisions++;

    try {
      // Validate request
      if (!sourceModule || !capability || !data) {
        throw new Error('Missing required fields: sourceModule, capability, data');
      }

      // Route through gateway
      const gatewayRequest = await aiGateway.processRequest({
        moduleId: sourceModule,
        capability,
        data,
        userId: context.userId,
      });

      if (!gatewayRequest.success) {
        throw new Error(`Gateway rejected request: ${gatewayRequest.error}`);
      }

      // Process decision
      const decision = await aiBackbone.makeDecision(
        { confidence: 0.85 },
        {
          moduleId: sourceModule,
          capability,
          data,
        }
      );

      // Store with module context
      await this.pool.query(
        `INSERT INTO ai_decisions_extended 
         (decision_id, source_module, capability, request_context, ai_response, confidence, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          decisionId,
          sourceModule,
          capability,
          JSON.stringify(context),
          JSON.stringify(decision),
          decision.confidence || 0.85,
          'completed',
        ]
      );

      // Cache decision
      if (this.redis) {
        const cacheKey = `decision:${sourceModule}:${capability}:${JSON.stringify(data).slice(0, 50)}`;
        await this.redis.setex(cacheKey, 3600, JSON.stringify(decision));
        this.metrics.cachedDecisions++;
      }

      this.metrics.activeDecisions++;
      this.activeDecisions.set(decisionId, decision);

      // Emit event for cross-module sharing
      this.emit('decision_made', {
        decisionId,
        sourceModule,
        capability,
        decision,
      });

      // Send notifications
      await this.notifyModules(decisionId, sourceModule, capability, decision);

      return {
        success: true,
        decisionId,
        decision,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to process module AI request:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple AI requests
   */
  async processBatchRequests(sourceModule, requests) {
    const jobId = `BATCH_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    try {
      // Store batch job
      await this.pool.query(
        `INSERT INTO ai_batch_jobs (job_id, source_module, batch_requests, status, started_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [jobId, sourceModule, JSON.stringify(requests), 'processing']
      );

      // Process each request
      const results = [];
      for (const req of requests) {
        try {
          const result = await this.processModuleAIRequest({
            sourceModule,
            ...req,
          });
          results.push(result);
        } catch (error) {
          logger.error(`Batch request failed for ${req.capability}:`, error);
          results.push({ success: false, error: error.message });
        }
      }

      // Update batch job
      await this.pool.query(
        `UPDATE ai_batch_jobs SET batch_results = $1, status = $2, completed_at = CURRENT_TIMESTAMP
         WHERE job_id = $3`,
        [JSON.stringify(results), 'completed', jobId]
      );

      this.metrics.batchProcessed += requests.length;

      return {
        success: true,
        jobId,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to process batch requests:', error);
      throw error;
    }
  }

  /**
   * Share intelligence across modules
   */
  async shareIntelligence(sourceModule, targetModules, intelligence) {
    const shareId = `SHARE_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    try {
      // Store shared intelligence
      await this.pool.query(
        `INSERT INTO cross_module_intelligence 
         (intelligence_id, source_module, target_modules, intelligence_data, relevance_score)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          shareId,
          sourceModule,
          targetModules,
          JSON.stringify(intelligence),
          intelligence.relevanceScore || 0.8,
        ]
      );

      // Cache in Redis
      if (this.redis) {
        const cacheKey = `intelligence:${sourceModule}:${shareId}`;
        await this.redis.setex(cacheKey, 7200, JSON.stringify(intelligence));
      }

      this.metrics.crossModuleShares++;
      this.intelligenceSharing.set(shareId, intelligence);

      // Notify target modules
      for (const targetModule of targetModules) {
        await this.notifyIntelligenceShare(sourceModule, targetModule, intelligence);
      }

      return {
        success: true,
        shareId,
        sharedWith: targetModules,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to share intelligence:', error);
      throw error;
    }
  }

  /**
   * Get decision history for module
   */
  async getDecisionHistory(moduleId, limit = 50) {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ai_decisions_extended 
         WHERE source_module = $1 OR target_module = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [moduleId, limit]
      );

      return {
        success: true,
        moduleId,
        decisions: result.rows,
        total: result.rows.length,
      };
    } catch (error) {
      logger.error('Failed to get decision history:', error);
      throw error;
    }
  }

  /**
   * Version decision (track changes)
   */
  async versionDecision(decisionId, newData, reason) {
    try {
      // Get current version
      const current = await this.pool.query(
        'SELECT version FROM ai_decision_versions WHERE decision_id = $1 ORDER BY version DESC LIMIT 1',
        [decisionId]
      );

      const nextVersion = current.rows.length > 0 ? current.rows[0].version + 1 : 1;

      // Store new version
      await this.pool.query(
        `INSERT INTO ai_decision_versions (decision_id, version, decision_data, change_reason)
         VALUES ($1, $2, $3, $4)`,
        [decisionId, nextVersion, JSON.stringify(newData), reason]
      );

      // Update main decision
      await this.pool.query(
        `UPDATE ai_decisions_extended SET version = $1, updated_at = CURRENT_TIMESTAMP WHERE decision_id = $2`,
        [nextVersion, decisionId]
      );

      return {
        success: true,
        decisionId,
        version: nextVersion,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to version decision:', error);
      throw error;
    }
  }

  /**
   * Send real-time notifications
   */
  async notifyModules(decisionId, sourceModule, capability, decision) {
    try {
      const notificationId = `NOTIF_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Determine relevant target modules based on capability
      const targetModules = this.determineRelevantModules(capability, sourceModule);

      // Store notification
      await this.pool.query(
        `INSERT INTO ai_notifications (notification_id, decision_id, source_module, target_modules, notification_type, payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          notificationId,
          decisionId,
          sourceModule,
          targetModules,
          'decision_available',
          JSON.stringify(decision),
        ]
      );

      // Emit events for real-time delivery
      for (const target of targetModules) {
        this.emit(`notification:${target}`, {
          type: 'decision_available',
          decisionId,
          source: sourceModule,
          capability,
          data: decision,
        });
      }

      this.metrics.notificationsSent += targetModules.length;

      return {
        success: true,
        notificationId,
        targetModules,
      };
    } catch (error) {
      logger.error('Failed to notify modules:', error);
    }
  }

  /**
   * Determine relevant modules for notification
   */
  determineRelevantModules(capability, sourceModule) {
    const capabilityModuleMap = {
      'crop_recommendation': ['M100', 'M101', 'M102', 'M103', 'M104', 'M105'],
      'livestock_management': ['M101', 'M102', 'M103', 'M105'],
      'disease_detection': ['M100', 'M101', 'M782'],
      'financial_analysis': ['M301', 'M302', 'M303', 'M304', 'M305'],
      'market_trends': ['M251', 'M220', 'M206'],
      'hr_optimization': ['M306'],
      'prediction': ['M405', 'M100', 'M101', 'M301'],
    };

    for (const [key, modules] of Object.entries(capabilityModuleMap)) {
      if (capability.includes(key)) {
        return modules.filter(m => m !== sourceModule);
      }
    }

    return [];
  }

  /**
   * Notify intelligence share
   */
  async notifyIntelligenceShare(sourceModule, targetModule, intelligence) {
    this.emit(`intelligence_share:${targetModule}`, {
      from: sourceModule,
      intelligence,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.on('decision_made', (data) => {
      logger.info('Decision made:', data);
    });

    this.on('intelligence_share', (data) => {
      logger.info('Intelligence shared:', data);
    });
  }

  /**
   * Register module connections
   */
  async registerModuleConnections() {
    const connections = [
      { source: 'M001_PLATFORM_CORE', target: 'M400_AI_BACKBONE', type: 'orchestration' },
      { source: 'M100_CROP_MANAGEMENT', target: 'M403_AGRICULTURAL_AI', type: 'capability' },
      { source: 'M101_LIVESTOCK_MANAGEMENT', target: 'M777_VETERINARY_AI', type: 'capability' },
      { source: 'M102_DAIRY_MANAGEMENT', target: 'M779_NUTRITION_AI', type: 'capability' },
      { source: 'M301_FINANCIAL_MANAGEMENT', target: 'M405_PREDICTIVE_ANALYTICS', type: 'capability' },
      { source: 'M306_HUMAN_RESOURCES', target: 'M404_DECISION_SUPPORT', type: 'capability' },
      { source: 'M251_ECOMMERCE_ERP', target: 'M220_ECOMMERCE_MARKETING', type: 'peer' },
    ];

    for (const conn of connections) {
      this.moduleConnections.set(`${conn.source}:${conn.target}`, conn);
    }

    logger.info(`Registered ${connections.length} module connections`);
  }

  /**
   * Get integration metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.pool.query('SELECT 1');
      const dbHealth = true;
      const cacheHealth = this.redis ? await this.redis.ping().then(() => true).catch(() => false) : false;
      const mongoHealth = this.mongodb ? true : false;

      return {
        moduleId: this.moduleId,
        status: dbHealth && cacheHealth ? 'healthy' : 'degraded',
        checks: {
          database: dbHealth,
          cache: cacheHealth,
          mongodb: mongoHealth,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Shutdown
   */
  async shutdown() {
    try {
      if (this.pool) await this.pool.end();
      logger.info('AI Integration Service shutdown complete');
      return { success: true };
    } catch (error) {
      logger.error('Shutdown error:', error);
      throw error;
    }
  }
}

let serviceInstance = null;

module.exports = {
  getInstance: () => {
    if (!serviceInstance) {
      serviceInstance = new AIIntegrationService();
    }
    return serviceInstance;
  },

  initialize: async (config) => {
    const service = module.exports.getInstance();
    return await service.initialize(config);
  },

  processModuleAIRequest: async (request) => {
    const service = module.exports.getInstance();
    return await service.processModuleAIRequest(request);
  },

  processBatchRequests: async (sourceModule, requests) => {
    const service = module.exports.getInstance();
    return await service.processBatchRequests(sourceModule, requests);
  },

  shareIntelligence: async (sourceModule, targetModules, intelligence) => {
    const service = module.exports.getInstance();
    return await service.shareIntelligence(sourceModule, targetModules, intelligence);
  },

  getDecisionHistory: async (moduleId, limit) => {
    const service = module.exports.getInstance();
    return await service.getDecisionHistory(moduleId, limit);
  },

  versionDecision: async (decisionId, newData, reason) => {
    const service = module.exports.getInstance();
    return await service.versionDecision(decisionId, newData, reason);
  },

  getMetrics: () => {
    const service = module.exports.getInstance();
    return service.getMetrics();
  },

  healthCheck: async () => {
    const service = module.exports.getInstance();
    return await service.healthCheck();
  },

  shutdown: async () => {
    const service = module.exports.getInstance();
    return await service.shutdown();
  },

  getEventEmitter: () => {
    const service = module.exports.getInstance();
    return service;
  },
};
