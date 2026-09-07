/**
 * Platform Core Initialization
 * Initializes all platform services on startup
 */
const authService = require('./iam/authService');
const authorizationService = require('./iam/authorizationService');
const sessionService = require('./iam/sessionService');
const mfaService = require('./iam/mfaService');
const auditService = require('./iam/auditService');
const masterDataService = require('./masterData/masterDataService');
const workflowEngine = require('./workflow/workflowEngine');
const rulesEngine = require('./rules/rulesEngine');
const configService = require('./config/configService');
const eventBus = require('./events/eventBus');
const dataPipeline = require('./data/dataPipeline');
const aiCoordinator = require('./ai/aiCoordinator');
const integrationHub = require('./integration/integrationHub');

class PlatformCore {
  constructor() {
    this.services = {
      auth: authService,
      authorization: authorizationService,
      session: sessionService,
      mfa: mfaService,
      audit: auditService,
      masterData: masterDataService,
      workflow: workflowEngine,
      rules: rulesEngine,
      config: configService,
      events: eventBus,
      data: dataPipeline,
      ai: aiCoordinator,
      integration: integrationHub,
    };
  }

  /**
   * Initialize all platform services
   * @param {object} dependencies - Database connections, etc.
   * @returns {Promise<boolean>}
   */
  async initialize(dependencies = {}) {
    try {
      console.log('🔧 Initializing Platform Core Services...');

      // Initialize IAM services
      await this.services.auth.initialize?.(dependencies);
      await this.services.authorization.initialize?.(dependencies);
      await this.services.session.initialize?.(dependencies);
      await this.services.mfa.initialize?.(dependencies);
      await this.services.audit.initialize?.(dependencies);

      // Initialize master data
      await this.services.masterData.initialize?.(dependencies);

      // Initialize workflow and rules
      await this.services.workflow.initialize?.(dependencies);
      await this.services.rules.initialize?.(dependencies);

      // Initialize configuration
      await this.services.config.initialize?.(dependencies);

      // Initialize event bus
      await this.services.events.initialize?.(dependencies);

      // Initialize data pipeline
      await this.services.data.initialize?.(dependencies);

      // Initialize AI coordinator
      await this.services.ai.initialize?.(dependencies);

      // Initialize integration hub
      await this.services.integration.initialize?.(dependencies);

      console.log('✅ Platform Core Services Initialized');
      return true;
    } catch (error) {
      console.error('❌ Platform Core Initialization Failed:', error);
      throw error;
    }
  }

  /**
   * Get a platform service by name
   * @param {string} serviceName
   * @returns {object}
   */
  getService(serviceName) {
    return this.services[serviceName];
  }

  /**
   * Get all platform services
   * @returns {object}
   */
  getAllServices() {
    return this.services;
  }
}

// Export singleton
module.exports = new PlatformCore();
