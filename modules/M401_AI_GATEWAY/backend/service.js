/**
 * M401 AI Gateway Service - Governance & Request Routing
 * Enforces AI governance rules, audits requests, and routes to appropriate providers
 */

const aiBackbone = require('../M400_AI_BACKBONE/backend/service');
const { getPostgreSQL, getRedis } = require('../../../backend/src/database/connection');
const { logger } = require('../../../backend/src/utils/logger');
const crypto = require('crypto');

class AIGatewayService {
  constructor() {
    this.moduleId = 'M401_AI_GATEWAY';
    this.pool = null;
    this.redis = null;
    this.governanceRules = new Map();
    this.requestAudit = [];
    this.metrics = {
      requestsProcessed: 0,
      requestsApproved: 0,
      requestsRejected: 0,
      governanceViolations: 0,
    };
  }

  async initialize(config) {
    try {
      logger.info(`Initializing ${this.moduleId}...`);
      
      this.pool = await getPostgreSQL();
      this.redis = await getRedis();
      
      await this.initializeDatabase();
      await this.loadGovernanceRules();
      
      logger.info(`${this.moduleId} initialized successfully`);
      
      return {
        success: true,
        message: 'AI Gateway initialized',
        moduleId: this.moduleId,
        governanceRules: this.governanceRules.size,
      };
    } catch (error) {
      logger.error(`Failed to initialize ${this.moduleId}:`, error);
      throw error;
    }
  }

  async initializeDatabase() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ai_gateway_requests (
        id SERIAL PRIMARY KEY,
        request_id VARCHAR(100) UNIQUE NOT NULL,
        module_id VARCHAR(50),
        capability VARCHAR(100),
        request_data JSONB,
        governance_status VARCHAR(20),
        risk_level VARCHAR(20),
        provider_selected VARCHAR(50),
        approval_status VARCHAR(20),
        audit_log JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (module_id, created_at)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ai_governance_rules (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(100) UNIQUE NOT NULL,
        rule_name VARCHAR(100),
        capability VARCHAR(100),
        rules JSONB,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async loadGovernanceRules() {
    const rules = [
      {
        id: 'GOV_HEALTHCARE',
        name: 'Healthcare AI Governance',
        capability: 'medical_diagnosis',
        rules: {
          requiresHumanReview: true,
          confidenceThreshold: 0.95,
          sensitivityLevel: 'high',
          allowedProviders: ['claude', 'gpt'],
          disclaimerRequired: 'Medical diagnosis should be verified by qualified professionals',
        },
      },
      {
        id: 'GOV_FINANCIAL',
        name: 'Financial AI Governance',
        capability: 'financial_analysis',
        rules: {
          requiresHumanReview: true,
          confidenceThreshold: 0.85,
          sensitivityLevel: 'high',
          auditLogging: true,
          disclaimerRequired: 'Financial advice should be reviewed by qualified advisors',
        },
      },
      {
        id: 'GOV_AGRICULTURAL',
        name: 'Agricultural AI Governance',
        capability: 'crop_recommendation',
        rules: {
          requiresHumanReview: false,
          confidenceThreshold: 0.7,
          sensitivityLevel: 'medium',
          auditLogging: true,
        },
      },
    ];

    for (const rule of rules) {
      this.governanceRules.set(rule.id, rule);
    }
  }

  async processRequest(request) {
    const requestId = `GWR_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const { moduleId, capability, data, preferredProvider, userId } = request;

    this.metrics.requestsProcessed++;

    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        this.metrics.requestsRejected++;
        await this.auditRequest(requestId, request, 'REJECTED', validation.reason);
        return {
          success: false,
          error: validation.reason,
          requestId,
        };
      }

      // Check governance rules
      const governance = await this.checkGovernance(moduleId, capability, data);
      if (!governance.approved) {
        this.metrics.requestsRejected++;
        this.metrics.governanceViolations++;
        await this.auditRequest(requestId, request, 'GOVERNANCE_VIOLATION', governance.reason);
        return {
          success: false,
          error: `Governance violation: ${governance.reason}`,
          requestId,
          requiresApproval: true,
        };
      }

      // Select provider
      const provider = this.selectProvider(capability, preferredProvider);

      // Route to backbone
      const response = await aiBackbone.makeDecision(
        {
          confidence: governance.confidenceThreshold,
          businessContext: capability,
        },
        {
          moduleId,
          capability,
          data,
          provider,
        }
      );

      this.metrics.requestsApproved++;

      // Audit successful request
      await this.auditRequest(requestId, request, 'APPROVED', null, {
        provider,
        decision: response.decisionId,
      });

      // Add governance metadata
      response.governanceId = requestId;
      response.disclaimers = governance.disclaimers || [];

      return response;

    } catch (error) {
      logger.error('AI Gateway error:', error);
      this.metrics.requestsRejected++;
      await this.auditRequest(requestId, request, 'ERROR', error.message);
      throw error;
    }
  }

  validateRequest(request) {
    const { moduleId, capability, data } = request;

    if (!moduleId || !capability || !data) {
      return { valid: false, reason: 'Missing required fields' };
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, reason: 'Data must be a JSON object' };
    }

    if (JSON.stringify(data).length > 50000) {
      return { valid: false, reason: 'Request payload too large' };
    }

    return { valid: true };
  }

  async checkGovernance(moduleId, capability, data) {
    // Find applicable governance rules
    let applicableRule = null;
    for (const rule of this.governanceRules.values()) {
      if (rule.capability === capability || capability.includes(rule.capability)) {
        applicableRule = rule;
        break;
      }
    }

    if (!applicableRule) {
      return {
        approved: true,
        confidenceThreshold: 0.7,
        disclaimers: [],
      };
    }

    const rules = applicableRule.rules;

    // Check for sensitive content
    const hasSensitiveContent = this.checkSensitiveContent(data);
    if (hasSensitiveContent && rules.sensitivityLevel === 'high') {
      return {
        approved: false,
        reason: 'Request contains sensitive content requiring manual review',
      };
    }

    return {
      approved: true,
      confidenceThreshold: rules.confidenceThreshold || 0.7,
      requiresHumanReview: rules.requiresHumanReview || false,
      disclaimers: rules.disclaimerRequired ? [rules.disclaimerRequired] : [],
    };
  }

  checkSensitiveContent(data) {
    const sensitiveKeywords = ['medical', 'diagnosis', 'disease', 'financial', 'trading', 'legal'];
    const dataStr = JSON.stringify(data).toLowerCase();
    return sensitiveKeywords.some(keyword => dataStr.includes(keyword));
  }

  selectProvider(capability, preferredProvider) {
    // Priority: preferred > capability-specific > default
    if (preferredProvider && this.isProviderAvailable(preferredProvider)) {
      return preferredProvider;
    }

    const providerMap = {
      'medical': 'claude',
      'financial': 'claude',
      'agricultural': 'claude',
      'image': 'openai',
      'text': 'openai',
      'default': 'claude',
    };

    for (const [key, provider] of Object.entries(providerMap)) {
      if (capability.includes(key) && this.isProviderAvailable(provider)) {
        return provider;
      }
    }

    return 'claude'; // Default fallback
  }

  isProviderAvailable(provider) {
    const available = ['claude', 'openai', 'gemini', 'azure', 'huggingface', 'ollama'];
    return available.includes(provider);
  }

  async auditRequest(requestId, request, status, reason, metadata = {}) {
    try {
      await this.pool.query(
        `INSERT INTO ai_gateway_requests 
         (request_id, module_id, capability, request_data, governance_status, approval_status, audit_log)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          requestId,
          request.moduleId,
          request.capability,
          JSON.stringify(request.data || {}),
          'reviewed',
          status,
          JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: request.userId,
            reason,
            ...metadata,
          }),
        ]
      );
    } catch (error) {
      logger.error('Failed to audit request:', error);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown() {
    if (this.pool) await this.pool.end();
    return { success: true };
  }
}

let serviceInstance = null;

module.exports = {
  getInstance: () => {
    if (!serviceInstance) {
      serviceInstance = new AIGatewayService();
    }
    return serviceInstance;
  },

  initialize: async (config) => {
    const service = module.exports.getInstance();
    return await service.initialize(config);
  },

  processRequest: async (request) => {
    const service = module.exports.getInstance();
    return await service.processRequest(request);
  },

  getMetrics: () => {
    const service = module.exports.getInstance();
    return service.getMetrics();
  },

  shutdown: async () => {
    const service = module.exports.getInstance();
    return await service.shutdown();
  },
};
