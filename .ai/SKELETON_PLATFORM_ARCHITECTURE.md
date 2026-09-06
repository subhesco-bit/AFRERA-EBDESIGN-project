# EBDESIGN PLATFORM SKELETON ARCHITECTURE
**Core Infrastructure Layer - Foundation for all 96 business components**

---

## PLATFORM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LAYER (96 Components)               │
│        (Farmers, Cold Storage, Marketplace, Finance, etc)       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   PLATFORM SERVICES LAYER                        │
│  (This skeleton - Core infrastructure for all business logic)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## PLATFORM SKELETON STRUCTURE

### `backend/src/platform/` Directory Structure

```
backend/src/platform/
├── index.js                           # Platform initialization
├── core/
│   ├── platformCore.js               # Core platform orchestrator
│   ├── constants.js                  # Platform-wide constants
│   └── utils.js                      # Utility functions
│
├── iam/                              # Identity & Access Management
│   ├── authService.js                # Authentication
│   ├── authorizationService.js       # Authorization/RBAC
│   ├── sessionService.js             # Session management
│   ├── mfaService.js                 # Multi-factor authentication
│   └── auditService.js               # Audit logging
│
├── masterData/                       # Master Data Management
│   ├── masterDataService.js          # MDM orchestrator
│   ├── deduplicationService.js       # Deduplication rules
│   ├── dataQualityService.js         # Data quality checks
│   └── entityRegistry.js             # Entity identity registry
│
├── workflow/                         # Workflow Engine
│   ├── workflowEngine.js             # Workflow orchestration
│   ├── stateManager.js               # State management
│   ├── approvalEngine.js             # Approval routing
│   └── escalationEngine.js           # Escalation logic
│
├── rules/                            # Rules Engine
│   ├── rulesEngine.js                # Rule evaluation
│   ├── ruleParser.js                 # Rule parsing
│   ├── ruleExecutor.js               # Rule execution
│   └── ruleRegistry.js               # Rule registry
│
├── config/                           # Configuration Management
│   ├── configService.js              # Configuration retrieval
│   ├── multiLevelConfig.js           # State/district/cluster overrides
│   ├── featureFlags.js               # Feature flag management
│   └── configValidator.js            # Configuration validation
│
├── events/                           # Event Bus & Messaging
│   ├── eventBus.js                   # Central event bus
│   ├── eventPublisher.js             # Event publishing
│   ├── eventSubscriber.js            # Event subscription
│   ├── eventStore.js                 # Event sourcing
│   └── messageQueue.js               # Message queue integration
│
├── data/                             # Data Platform
│   ├── dataPipeline.js               # ETL pipeline
│   ├── dataValidator.js              # Data validation
│   ├── dataTransformer.js            # Data transformation
│   └── analyticsSync.js              # Analytics synchronization
│
├── ai/                               # AI Coordination Layer
│   ├── aiCoordinator.js              # Claude AI orchestration
│   ├── claudeService.js              # Claude API integration
│   ├── promptBuilder.js              # Prompt construction
│   ├── responseParser.js             # Response parsing
│   └── aiGovernance.js               # AI governance & approval
│
├── integration/                      # External System Integrations
│   ├── integrationHub.js             # Integration orchestrator
│   ├── gisService.js                 # GIS/Maps integration
│   ├── iotService.js                 # IoT device integration
│   ├── weatherService.js             # Weather API integration
│   ├── paymentGateway.js             # Payment processor integration
│   └── smsService.js                 # SMS/WhatsApp integration
│
├── monitoring/                       # Observability
│   ├── metricsCollector.js           # Metrics collection
│   ├── loggerService.js              # Centralized logging
│   ├── healthCheck.js                # System health monitoring
│   └── performanceMonitor.js         # Performance tracking
│
├── cache/                            # Caching Layer
│   ├── cacheManager.js               # Cache orchestration
│   ├── redisCache.js                 # Redis integration
│   ├── cacheStrategy.js              # Cache strategies
│   └── cacheInvalidation.js          # Cache invalidation
│
├── security/                         # Security Layer
│   ├── encryptionService.js          # Encryption/decryption
│   ├── secretsManager.js             # Secrets management
│   ├── dataProtection.js             # Data protection (GDPR)
│   └── vulnerabilityScanner.js       # Security scanning
│
└── middleware/                       # Platform Middleware
    ├── errorHandler.js               # Global error handling
    ├── requestValidator.js           # Request validation
    ├── corsHandler.js                # CORS configuration
    ├── rateLimiter.js                # Rate limiting
    ├── requestLogger.js              # Request logging
    └── responseFormatter.js          # Standard response formatting
```

---

## CORE PLATFORM SERVICES (STUBS)

### 1. **Identity & Access Management (IAM)**

#### `backend/src/platform/iam/authService.js`
```javascript
/**
 * Authentication Service (Section 21: Identity & Access Management)
 * Handles user login, token generation, session management
 */
class AuthService {
  /**
   * User login with email/password
   * @param {string} email
   * @param {string} password
   * @returns {object} {accessToken, refreshToken, user}
   * TODO: Implement JWT token generation
   */
  async login(email, password) {
    // Stub
    return {
      accessToken: 'stub_token',
      refreshToken: 'stub_refresh',
      user: {}
    };
  }

  /**
   * Verify JWT token
   * @param {string} token
   * @returns {object} decoded token payload
   * TODO: Implement token verification
   */
  async verifyToken(token) {
    // Stub
    return { userId: 'stub' };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {object} new access token
   * TODO: Implement refresh logic
   */
  async refreshToken(refreshToken) {
    // Stub
    return { accessToken: 'new_stub_token' };
  }
}

module.exports = new AuthService();
```

#### `backend/src/platform/iam/authorizationService.js`
```javascript
/**
 * Authorization Service (RBAC/ABAC)
 * Checks user permissions and role-based access
 */
class AuthorizationService {
  /**
   * Check if user has permission
   * @param {UUID} userId
   * @param {string} resource
   * @param {string} action
   * @returns {boolean}
   * TODO: Implement RBAC evaluation
   */
  async hasPermission(userId, resource, action) {
    // Stub
    return true;
  }

  /**
   * Get user roles and permissions
   * @param {UUID} userId
   * @returns {object} {roles, permissions}
   * TODO: Implement role/permission retrieval
   */
  async getUserAccess(userId) {
    // Stub
    return { roles: [], permissions: [] };
  }

  /**
   * Check data-level access (state/district/village)
   * @param {UUID} userId
   * @param {string} dataType
   * @param {UUID} dataId
   * @returns {boolean}
   * TODO: Implement hierarchical access control
   */
  async hasDataAccess(userId, dataType, dataId) {
    // Stub
    return true;
  }
}

module.exports = new AuthorizationService();
```

#### `backend/src/platform/iam/auditService.js`
```javascript
/**
 * Audit Service (Section 21: Audit Trail)
 * Logs all user actions for compliance
 */
class AuditService {
  /**
   * Log user action
   * @param {UUID} userId
   * @param {string} action
   * @param {string} entityType
   * @param {UUID} entityId
   * @param {object} changes
   * TODO: Implement audit logging to database
   */
  async logAction(userId, action, entityType, entityId, changes) {
    // Stub
    return { auditId: 'stub' };
  }

  /**
   * Get audit history for entity
   * @param {string} entityType
   * @param {UUID} entityId
   * @returns {array} audit logs
   * TODO: Implement audit retrieval
   */
  async getEntityAudit(entityType, entityId) {
    // Stub
    return [];
  }
}

module.exports = new AuditService();
```

---

### 2. **Master Data Management**

#### `backend/src/platform/masterData/masterDataService.js`
```javascript
/**
 * Master Data Management Service (Section 20: MDM)
 * Single source of truth for core entities:
 * - Farmers, Farms, Crops, Products, Buyers
 * Prevents duplicates, manages deduplication
 */
class MasterDataService {
  /**
   * Get master farmer record
   * @param {UUID} farmerId
   * @returns {object} complete farmer master data
   * TODO: Implement master data retrieval with deduplication
   */
  async getMasterFarmer(farmerId) {
    // Stub
    return {};
  }

  /**
   * Detect and merge duplicates
   * @param {string} entityType
   * @param {object} criteria
   * @returns {object} deduplication result
   * TODO: Implement duplicate detection algorithm
   */
  async detectDuplicates(entityType, criteria) {
    // Stub
    return { duplicates: [], merged: false };
  }

  /**
   * Validate data quality
   * @param {string} entityType
   * @param {object} entity
   * @returns {object} validation result
   * TODO: Implement data quality rules
   */
  async validateDataQuality(entityType, entity) {
    // Stub
    return { isValid: true, errors: [] };
  }
}

module.exports = new MasterDataService();
```

---

### 3. **Workflow Engine**

#### `backend/src/platform/workflow/workflowEngine.js`
```javascript
/**
 * Workflow Engine (Section 23: Workflow Engine)
 * Orchestrates multi-step processes:
 * - Approvals, Rejections, Escalations
 * - Used by: Subsidy applications, Credit approvals, etc.
 */
class WorkflowEngine {
  /**
   * Start workflow instance
   * @param {string} workflowCode
   * @param {string} entityType
   * @param {UUID} entityId
   * @returns {UUID} workflowInstanceId
   * TODO: Implement workflow initiation
   */
  async startWorkflow(workflowCode, entityType, entityId) {
    // Stub
    return { workflowInstanceId: 'stub' };
  }

  /**
   * Move to next step
   * @param {UUID} workflowInstanceId
   * @param {string} nextStep
   * @param {object} data
   * @returns {object} new step details
   * TODO: Implement step transition
   */
  async transitionStep(workflowInstanceId, nextStep, data) {
    // Stub
    return { currentStep: nextStep, status: 'in_progress' };
  }

  /**
   * Approve workflow step
   * @param {UUID} workflowInstanceId
   * @param {UUID} approverId
   * TODO: Implement approval
   */
  async approve(workflowInstanceId, approverId) {
    // Stub
    return { status: 'approved' };
  }

  /**
   * Reject workflow
   * @param {UUID} workflowInstanceId
   * @param {UUID} approverId
   * @param {string} reason
   * TODO: Implement rejection
   */
  async reject(workflowInstanceId, approverId, reason) {
    // Stub
    return { status: 'rejected' };
  }
}

module.exports = new WorkflowEngine();
```

---

### 4. **Rules Engine**

#### `backend/src/platform/rules/rulesEngine.js`
```javascript
/**
 * Rules Engine (Section 23: Rules Engine)
 * Evaluates business rules dynamically
 * 
 * Used for:
 * - Subsidy eligibility
 * - Dynamic pricing
 * - Approval routing
 * - Quality thresholds
 * - State-specific overrides
 */
class RulesEngine {
  /**
   * Evaluate rule
   * @param {string} ruleCode
   * @param {object} context
   * @returns {object} evaluation result
   * TODO: Implement rule evaluation engine
   */
  async evaluateRule(ruleCode, context) {
    // Stub
    return { passed: true, reason: '' };
  }

  /**
   * Get applicable rules for context
   * @param {string} ruleCategory
   * @param {object} context
   * @returns {array} applicable rules
   * TODO: Implement rule matching
   */
  async getApplicableRules(ruleCategory, context) {
    // Stub
    return [];
  }

  /**
   * Execute rule actions
   * @param {object} rule
   * @param {object} context
   * @returns {object} execution result
   * TODO: Implement rule action execution
   */
  async executeRuleActions(rule, context) {
    // Stub
    return { executed: true };
  }
}

module.exports = new RulesEngine();
```

---

### 5. **Configuration Management**

#### `backend/src/platform/config/configService.js`
```javascript
/**
 * Configuration Service (Section 23: Configuration)
 * Manages system configuration with multi-level overrides
 * 
 * Hierarchy:
 * 1. Global defaults
 * 2. State-level overrides
 * 3. District-level overrides
 * 4. Cluster-level overrides
 */
class ConfigService {
  /**
   * Get configuration value
   * @param {string} configKey
   * @param {object} context {stateCode, districtCode, clusterCode}
   * @returns {any} configuration value
   * TODO: Implement multi-level config retrieval
   */
  async getConfig(configKey, context) {
    // Stub
    return null;
  }

  /**
   * Get all configurations for location
   * @param {string} stateCode
   * @param {string} districtCode
   * @returns {object} all applicable configurations
   * TODO: Implement config aggregation
   */
  async getLocationConfig(stateCode, districtCode) {
    // Stub
    return {};
  }

  /**
   * Set configuration (admin)
   * @param {string} configKey
   * @param {any} value
   * @param {object} level {state, district, cluster}
   * TODO: Implement config update
   */
  async setConfig(configKey, value, level) {
    // Stub
    return { success: true };
  }
}

module.exports = new ConfigService();
```

---

### 6. **Event Bus & Messaging**

#### `backend/src/platform/events/eventBus.js`
```javascript
/**
 * Event Bus (Section 23: Event Bus)
 * Central event publishing/subscription system
 * 
 * Used for:
 * - Loose coupling between services
 * - Asynchronous processing
 * - Real-time updates (Socket.IO)
 * - Analytics data pipeline
 */
class EventBus {
  /**
   * Publish event
   * @param {string} eventType
   * @param {object} eventData
   * @param {object} context
   * TODO: Implement event publishing to message queue
   */
  async publishEvent(eventType, eventData, context) {
    // Stub
    return { eventId: 'stub' };
  }

  /**
   * Subscribe to event type
   * @param {string} eventType
   * @param {function} handler
   * TODO: Implement subscription
   */
  async subscribe(eventType, handler) {
    // Stub
    return { subscriptionId: 'stub' };
  }

  /**
   * Get event history
   * @param {string} eventType
   * @param {object} filters
   * @returns {array} events
   * TODO: Implement event sourcing
   */
  async getEventHistory(eventType, filters) {
    // Stub
    return [];
  }
}

module.exports = new EventBus();
```

---

### 7. **AI Coordination**

#### `backend/src/platform/ai/aiCoordinator.js`
```javascript
/**
 * AI Coordinator (Claude AI Integration)
 * Orchestrates Claude AI calls with governance
 * 
 * Ensures:
 * - All AI decisions are logged
 * - Decisions are explainable
 * - High-stakes decisions have human approval
 * - Consistent prompt engineering
 */
class AICoordinator {
  /**
   * Request Claude decision
   * @param {string} decisionType
   * @param {object} context
   * @param {string} agentType
   * @returns {object} {decision, confidence, reasoning}
   * TODO: Implement Claude API call
   */
  async requestDecision(decisionType, context, agentType) {
    // Stub
    return {
      decision: null,
      confidence: 0,
      reasoning: 'Stub response',
      decisionId: 'stub'
    };
  }

  /**
   * Evaluate if human approval needed
   * @param {string} decisionType
   * @param {object} decision
   * @returns {boolean}
   * TODO: Implement approval rule
   */
  async needsHumanApproval(decisionType, decision) {
    // Stub
    return false;
  }

  /**
   * Log AI decision for audit
   * @param {string} decisionId
   * @param {object} decision
   * @param {UUID} userId
   * TODO: Implement decision logging
   */
  async logDecision(decisionId, decision, userId) {
    // Stub
    return { logged: true };
  }
}

module.exports = new AICoordinator();
```

---

### 8. **Data Platform**

#### `backend/src/platform/data/dataPipeline.js`
```javascript
/**
 * Data Pipeline (Section 22: Data Platform)
 * ETL pipeline from operational data to analytics
 * 
 * Flow:
 * Operational DB → Events → Pipeline → Analytics Storage → Analytics
 */
class DataPipeline {
  /**
   * Publish event to data pipeline
   * @param {string} entityType
   * @param {string} eventType
   * @param {object} data
   * TODO: Implement data ingestion
   */
  async publishToAnalytics(entityType, eventType, data) {
    // Stub
    return { ingested: true };
  }

  /**
   * Transform operational data for analytics
   * @param {object} sourceData
   * @param {string} targetSchema
   * @returns {object} transformed data
   * TODO: Implement transformation rules
   */
  async transformData(sourceData, targetSchema) {
    // Stub
    return {};
  }

  /**
   * Query analytics data
   * @param {string} metric
   * @param {object} filters
   * @returns {array} results
   * TODO: Implement analytics queries
   */
  async queryAnalytics(metric, filters) {
    // Stub
    return [];
  }
}

module.exports = new DataPipeline();
```

---

### 9. **Integrations Hub**

#### `backend/src/platform/integration/integrationHub.js`
```javascript
/**
 * Integration Hub (External System Integration)
 * Orchestrates integrations with external systems
 * 
 * Integrations:
 * - GIS/Maps
 * - IoT devices
 * - Weather APIs
 * - Payment gateways
 * - SMS/WhatsApp
 * - Government APIs
 */
class IntegrationHub {
  /**
   * Call external service
   * @param {string} serviceName
   * @param {string} operation
   * @param {object} data
   * @returns {object} response
   * TODO: Implement service calls
   */
  async callService(serviceName, operation, data) {
    // Stub
    return {};
  }

  /**
   * Handle webhook from external service
   * @param {string} serviceName
   * @param {object} webhookData
   * TODO: Implement webhook handling
   */
  async handleWebhook(serviceName, webhookData) {
    // Stub
    return { processed: true };
  }
}

module.exports = new IntegrationHub();
```

---

### 10. **Platform Middleware Stack**

#### `backend/src/platform/middleware/errorHandler.js`
```javascript
/**
 * Global Error Handler (Section 23: Middleware)
 * Catches and formats all errors consistently
 */
function errorHandler(err, req, res, next) {
  // TODO: Implement error categorization and formatting
  res.status(500).json({
    success: false,
    error: err.message,
    errorId: 'stub'
  });
}

module.exports = errorHandler;
```

#### `backend/src/platform/middleware/requestValidator.js`
```javascript
/**
 * Request Validator (Section 23: Middleware)
 * Validates incoming requests against schemas
 */
function requestValidator(schema) {
  return (req, res, next) => {
    // TODO: Implement request validation
    next();
  };
}

module.exports = requestValidator;
```

---

## PLATFORM INITIALIZATION

#### `backend/src/platform/index.js`
```javascript
/**
 * Platform Core Initialization
 * Initializes all platform services on startup
 */
const authService = require('./iam/authService');
const masterDataService = require('./masterData/masterDataService');
const workflowEngine = require('./workflow/workflowEngine');
const rulesEngine = require('./rules/rulesEngine');
const configService = require('./config/configService');
const eventBus = require('./events/eventBus');
const dataPipeline = require('./data/dataPipeline');
const aiCoordinator = require('./ai/aiCoordinator');
const integrationHub = require('./integration/integrationHub');

class PlatformCore {
  /**
   * Initialize all platform services
   * TODO: Call service initialization methods
   */
  async initialize() {
    console.log('Initializing Platform Core...');
    
    // Initialize each service
    // await authService.init();
    // await masterDataService.init();
    // await workflowEngine.init();
    // ... etc
    
    console.log('Platform Core initialized');
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      services: {
        auth: 'ok',
        masterData: 'ok',
        workflow: 'ok',
        rules: 'ok',
        config: 'ok',
        events: 'ok',
        data: 'ok',
        ai: 'ok',
        integration: 'ok'
      }
    };
  }
}

module.exports = new PlatformCore();
```

---

## PLATFORM SERVICES INTEGRATION WITH BUSINESS LAYER

```
Business Services (140+)
        ↓
   Use Platform Services:
        ↓
┌──────────────────────────┐
│  farmer Service          │
├──────────────────────────┤
│ Uses:                    │
│ - authService (check     │
│   authorization)         │
│ - masterDataService      │
│   (get/update farmer)    │
│ - auditService (log      │
│   changes)               │
│ - eventBus (publish      │
│   farmer_created event)  │
│ - workflowEngine (KYC    │
│   approval workflow)     │
│ - aiCoordinator (FDI     │
│   scoring)               │
│ - dataPipeline (sync     │
│   to analytics)          │
└──────────────────────────┘
```

---

## PLATFORM SKELETON CHECKLIST

### Core Services (10 services)
- [ ] `authService.js` - Authentication
- [ ] `authorizationService.js` - RBAC/ABAC
- [ ] `auditService.js` - Audit logging
- [ ] `masterDataService.js` - Master data management
- [ ] `workflowEngine.js` - Workflow orchestration
- [ ] `rulesEngine.js` - Business rules
- [ ] `configService.js` - Configuration management
- [ ] `eventBus.js` - Event publishing/subscription
- [ ] `aiCoordinator.js` - Claude AI orchestration
- [ ] `integrationHub.js` - External system integration
- [ ] `dataPipeline.js` - Analytics data pipeline

### Middleware (6 middleware)
- [ ] `errorHandler.js`
- [ ] `requestValidator.js`
- [ ] `corsHandler.js`
- [ ] `rateLimiter.js`
- [ ] `requestLogger.js`
- [ ] `responseFormatter.js`

### Platform Routes (`/api/v1/platform`)
- [ ] `/platform/health` - Health check
- [ ] `/platform/config/:key` - Get configuration
- [ ] `/platform/status` - Platform status

---

## KEY DESIGN PRINCIPLES

1. **Single Responsibility:** Each platform service does ONE thing well
2. **Loose Coupling:** Services communicate via events, not direct calls
3. **Reusability:** Every business service uses platform services
4. **Auditability:** Every action is logged
5. **Configurability:** Rules and config are data, not code
6. **Explainability:** AI decisions are logged with reasoning
7. **Scalability:** Stateless design, event-driven

---

## NEXT STEPS FOR DEVIN

1. Create all 10 core platform service stubs
2. Create all 6 middleware stubs
3. Wire platform services into `backend/src/index.js`
4. Initialize platform on server startup
5. Export platform services for use by business services

All 96 business components will depend on these platform services for core functionality.

