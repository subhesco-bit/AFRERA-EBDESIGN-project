/**
 * AFRERA Platform Backend - Main Entry Point
 * Microservices Architecture with API Gateway
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import services
const authService = require('./services/authService');
const productService = require('./services/productService');
const orderService = require('./services/orderService');
const financialService = require('./services/financialService');
const logisticsService = require('./services/logisticsService');
const insuranceService = require('./services/insuranceService');
const aiService = require('./services/aiService');
const erpService = require('./services/erpService');
const multilingualService = require('./services/multilingualService');
const organicTraceabilityService = require('./services/organicTraceabilityService');
const nutritionIntelligenceService = require('./services/nutritionIntelligenceService');
const conversationalAIService = require('./services/conversationalAIService');
const laboratoryERPService = require('./services/laboratoryERPService');
const giIntelligenceService = require('./services/giIntelligenceService');
const foodIntelligenceService = require('./services/foodIntelligenceService');
const valueCommerceService = require('./services/valueCommerceService');
const consumerHealthService = require('./services/consumerHealthService');
const voiceAIService = require('./services/voiceAIService');
const blockchainTraceabilityService = require('./services/blockchainTraceabilityService');
const knowledgeGraphService = require('./services/knowledgeGraphService');
const predictiveAnalyticsService = require('./services/predictiveAnalyticsService');
const iotIntegrationService = require('./services/iotIntegrationService');
const arVrService = require('./services/arVrService');
const smsAuthService = require('./services/smsAuthService');
const advancedVoiceAI = require('./services/advancedVoiceAI');
const offlinePaymentService = require('./services/offlinePaymentService');
const advancedAIService = require('./services/advancedAIService');
const offlineSyncService = require('./services/offlineSyncService');
const formService = require('./services/formService');
const analyticsService = require('./services/analyticsService');
const moduleCatalogService = require('./services/moduleCatalogService');
// User management module (M011)
const userModule = require('./modules/M011');
// System Administration module (M006)
const adminModule = require('./modules/M006');
const indigenousKnowledgeService = require('./services/indigenousKnowledgeService');
const biodiversityService = require('./services/biodiversityService');
const aiCopilotService = require('./services/aiCopilotService');
const omnichannelAIService = require('./services/omnichannelAIService');
const foodSafetyService = require('./services/foodSafetyService');
const shelfLifeService = require('./services/shelfLifeService');
const institutionalProcurementService = require('./services/institutionalProcurementService');
const digitalProductPassportService = require('./services/digitalProductPassportService');
const recipeIntelligenceService = require('./services/recipeIntelligenceService');
// Business rules recovered from the v43 prototype (see service header).
const decisionSupportService = require('./services/decisionSupportService');
// Recovered from the pre-v43 ne_harvest lineage (see service header).
const neProductIntelligenceService = require('./services/neProductIntelligenceService');
const commerceRulesService = require('./services/commerceRulesService');
const catalogIntelligenceService = require('./services/catalogIntelligenceService');
const enterpriseControlService = require('./services/enterpriseControlService');
const v42IntelligenceService = require('./services/v42IntelligenceService');
// Farmer Value Engine (991): the decision layer above every other module.
const farmerValueService = require('./services/farmerValueService');
const merchandisingService = require('./services/merchandisingService');

// Previously-orphaned services: each of these exports its own setupRoutes(app)
// function that was never being called anywhere, so none of them had a live route.
const dynamicPricingService = require('./services/dynamicPricingService');
const farmerTrainingService = require('./services/farmerTrainingService');
const governmentSchemeService = require('./services/governmentSchemeService');
const greenhouseService = require('./services/greenhouseService');
const insuranceClaimsService = require('./services/insuranceClaimsService');
const preSeasonOrderService = require('./services/preSeasonOrderService');
const sharedInfraService = require('./services/sharedInfraService');
const soilTestingService = require('./services/soilTestingService');
const subsidyService = require('./services/subsidyService');

// Import enhancement routes
const marketplaceEnhancements = require('./routes/marketplaceEnhancements');
const insuranceEnhancements = require('./routes/insuranceEnhancements');
const farmerPortalEnhancements = require('./routes/farmerPortalEnhancements');
const governanceModule = require('./routes/governanceModule');
const logisticsEnhancements = require('./routes/logisticsEnhancements');
const advancedFeatures = require('./routes/advancedFeatures');
const enterpriseAIRoutes = require('./routes/enterpriseAIRoutes');
const gstRoutes = require('./routes/gstRoutes');
const logisticsOpsRoutes = require('./routes/logisticsEnhancementRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const auditRoutes = require('./routes/auditRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
// Advance Rate Pricing — forward curves, basis, commitment advice.
// Recovered from afrera_platform_v44.html (migration 051).
const riskPricingRoutes = require('./routes/riskPricingRoutes');
// GST, hash-chained ledger, scheme matching, eNWR, freight, risk (migration 053).
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes');
// Domain D14 Climate & Weather (057) — was completely empty before today.
const weatherRoutes = require('./routes/weatherRoutes');
// TDS, e-invoice IRN, GSTR, RCM (056).
const complianceRoutes = require('./routes/complianceRoutes');
// RFQ sealed bidding, quote outcomes, QC holds, FPO cost centres (056).
const rfqRoutes = require('./routes/rfqRoutes');
// energyRoutes existed but was never mounted, and its service failed to
// parse, so nothing would have noticed. Both fixed 2026-08-05.
const energyRoutes = require('./routes/energyRoutes');
// Agmarknet/e-NAM ingestion + DBT reconciliation (056).
const marketDataRoutes = require('./routes/marketDataRoutes');
// FOLU land use + NE organic schemes (991). Logic lives in
// organicTraceabilityService — these are routes only, no parallel service.
const foluRoutes = require('./routes/foluRoutes');
// Experience Layer / DXP — the 15 engines (migration 060).
const experienceRoutes = require('./routes/experienceRoutes');
const demandRoutes = require('./routes/demandRoutes');
const costRoutes = require('./routes/costRoutes');

// Cross-module nervous system + decision layer.
// Services emit signals; the engine correlates them across module boundaries
// and emits decisions that effectors act on. See src/core/ for the rationale.
const { signalBus, SIGNAL } = require('./core/signalBus');
const { decisionEngine } = require('./core/decisionEngine');
// ERP domain agents: 10 rules across 8 ERP domains. Each PROPOSES only —
// the ai_proposals CHECK constraint makes approval impossible without a
// named human. See src/core/erpAgents.js.
const erpAgents = require('./core/erpAgents');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { authMiddleware } = require('./middleware/auth');
const { logger } = require('./utils/logger');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  const connection = require('./database/connection');
  const redis = require('./cache/redis');

  const healthChecks = {
    auth: typeof authService.isHealthy === 'function' ? authService.isHealthy() : { status: 'ok' },
    database: typeof connection.isHealthy === 'function' ? connection.isHealthy() : { status: 'unknown' },
    redis: typeof redis.isHealthy === 'function' ? redis.isHealthy() : { status: 'disabled' },
    ai: typeof aiService.isHealthy === 'function' ? aiService.isHealthy() : { status: 'ok' }
  };

  // Add optional services if they exist
  if (typeof indigenousKnowledgeService !== 'undefined') {
    healthChecks.indigenous_knowledge = typeof indigenousKnowledgeService.isHealthy === 'function' ? indigenousKnowledgeService.isHealthy() : { status: 'ok' };
  }
  if (typeof biodiversityService !== 'undefined') {
    healthChecks.biodiversity = typeof biodiversityService.isHealthy === 'function' ? biodiversityService.isHealthy() : { status: 'ok' };
  }
  if (typeof aiCopilotService !== 'undefined') {
    healthChecks.ai_copilot = typeof aiCopilotService.isHealthy === 'function' ? aiCopilotService.isHealthy() : { status: 'ok' };
  }
  if (typeof omnichannelAIService !== 'undefined') {
    healthChecks.omnichannel_ai = typeof omnichannelAIService.isHealthy === 'function' ? omnichannelAIService.isHealthy() : { status: 'ok' };
  }
  if (typeof foodSafetyService !== 'undefined') {
    healthChecks.food_safety = typeof foodSafetyService.isHealthy === 'function' ? foodSafetyService.isHealthy() : { status: 'ok' };
  }
  if (typeof shelfLifeService !== 'undefined') {
    healthChecks.shelf_life = typeof shelfLifeService.isHealthy === 'function' ? shelfLifeService.isHealthy() : { status: 'ok' };
  }
  if (typeof institutionalProcurementService !== 'undefined') {
    healthChecks.institutional_procurement = typeof institutionalProcurementService.isHealthy === 'function' ? institutionalProcurementService.isHealthy() : { status: 'ok' };
  }
  if (typeof digitalProductPassportService !== 'undefined') {
    healthChecks.digital_product_passport = typeof digitalProductPassportService.isHealthy === 'function' ? digitalProductPassportService.isHealthy() : { status: 'ok' };
  }
  if (typeof recipeIntelligenceService !== 'undefined') {
    healthChecks.recipe_intelligence = typeof recipeIntelligenceService.isHealthy === 'function' ? recipeIntelligenceService.isHealthy() : { status: 'ok' };
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: healthChecks
  });
});

// API Routes
const mountRoute = (pathPrefix, serviceModule) => {
  if (serviceModule && serviceModule.router) {
    app.use(pathPrefix, serviceModule.router);
    return true;
  }

  logger.warn(`Skipping route mount for ${pathPrefix} because no router was exported.`);
  return false;
};

mountRoute('/api/v1/auth', authService);
mountRoute('/api/v1/products', productService);
mountRoute('/api/v1/orders', orderService);
// NOTE: farmerService and gstService export plain functions, not a .router,
// so mountRoute() silently no-ops for them (see farmerRoutes/gstRoutes mounts below).
mountRoute('/api/v1/financial', financialService);
mountRoute('/api/v1/logistics', logisticsService);
mountRoute('/api/v1/insurance', insuranceService);
mountRoute('/api/v1/ai', aiService);
mountRoute('/api/v1/erp', erpService);
mountRoute('/api/v1/multilingual', multilingualService);
mountRoute('/api/v1/organic-traceability', organicTraceabilityService);
mountRoute('/api/v1/nutrition-intelligence', nutritionIntelligenceService);
mountRoute('/api/v1/conversational-ai', conversationalAIService);
mountRoute('/api/v1/laboratory-erp', laboratoryERPService);
mountRoute('/api/v1/gi-intelligence', giIntelligenceService);
mountRoute('/api/v1/food-intelligence', foodIntelligenceService);
mountRoute('/api/v1/value-commerce', valueCommerceService);
mountRoute('/api/v1/consumer-health', consumerHealthService);
mountRoute('/api/v1/voice-ai', voiceAIService);
mountRoute('/api/v1/blockchain-traceability', blockchainTraceabilityService);
mountRoute('/api/v1/knowledge-graph', knowledgeGraphService);
mountRoute('/api/v1/predictive-analytics', predictiveAnalyticsService);
mountRoute('/api/v1/iot-integration', iotIntegrationService);
mountRoute('/api/v1/ar-vr', arVrService);
mountRoute('/api/v1/sms-auth', smsAuthService);
mountRoute('/api/v1/advanced-voice', advancedVoiceAI);
mountRoute('/api/v1/offline-payment', offlinePaymentService);
mountRoute('/api/v1/advanced-ai', advancedAIService);
mountRoute('/api/v1/offline-sync', offlineSyncService);
mountRoute('/api/v1/indigenous-knowledge', indigenousKnowledgeService);
mountRoute('/api/v1/biodiversity', biodiversityService);
mountRoute('/api/v1/ai-copilot', aiCopilotService);
mountRoute('/api/v1/omnichannel-ai', omnichannelAIService);
mountRoute('/api/v1/food-safety', foodSafetyService);
mountRoute('/api/v1/shelf-life', shelfLifeService);
mountRoute('/api/v1/institutional-procurement', institutionalProcurementService);
mountRoute('/api/v1/digital-product-passport', digitalProductPassportService);
mountRoute('/api/v1/recipe-intelligence', recipeIntelligenceService);
mountRoute('/api/v1/forms', formService);
mountRoute('/api/v1/analytics', analyticsService);
mountRoute('/api/v1/modules', moduleCatalogService);
// decisionSupportService uses setupRoutes instead of mountRoute
decisionSupportService.setupRoutes(app);
mountRoute('/api/v1/ne-intelligence', neProductIntelligenceService);
mountRoute('/api/v1/commerce-rules', commerceRulesService);
mountRoute('/api/v1/catalog-intelligence', catalogIntelligenceService);
// Enterprise control layer (993): workflow, CRM, clients, legal, risk, emergency.
mountRoute('/api/v1/control', enterpriseControlService);
// v42 recovered intelligence (992): crop semantics, freight, promos, engines.
mountRoute('/api/v1/intel', v42IntelligenceService);
mountRoute('/api/v1/value', farmerValueService);
mountRoute('/api/v1/merchandising', merchandisingService);
// Mount User Management (M011)
mountRoute('/api/v1/users', userModule);
// Mount System Administration (M006)
mountRoute('/api/v1/admin', adminModule);

// Mount generated module scaffolds for every M001..M150 module.
const generatedModuleRoot = path.join(__dirname, 'modules');
const generatedModuleNames = fs.readdirSync(generatedModuleRoot)
  .filter(name => /^M\d{3}$/.test(name))
  .sort();

for (const moduleName of generatedModuleNames) {
  const resolvedModule = require(path.join(generatedModuleRoot, moduleName));
  if (resolvedModule && resolvedModule.router) {
    mountRoute(`/api/v1/modules/${moduleName.toLowerCase()}`, resolvedModule);
  }
}

// Enhancement routes
app.use('/api/v1/marketplace', marketplaceEnhancements);
app.use('/api/v1/insurance', insuranceEnhancements);
app.use('/api/v1/farmer-portal', farmerPortalEnhancements);
app.use('/api/v1/governance', governanceModule);
app.use('/api/v1/logistics', logisticsEnhancements);
app.use('/api/v1/advanced', advancedFeatures);
app.use('/api/v1/enterprise-ai', enterpriseAIRoutes);

// Routes that existed but were never mounted anywhere
app.use('/api/v1/gst', gstRoutes);
app.use('/api/v1/logistics-ops', logisticsOpsRoutes);

// Newly created routes covering previously-orphaned services
app.use('/api/v1/farmers', farmerRoutes);
app.use('/api/v1/admin/audit', auditRoutes);
// Vendor-facing routes (corporate buyers, logistics providers, processors, retailers)
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/v1/vendors', vendorRoutes);

// Economic Layer routes (scaffolded)
app.use('/api/v1/revenue', revenueRoutes);
app.use('/api/v1/pricing', riskPricingRoutes);
app.use('/api/v1/finance', recoveredFinanceRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/rfq', rfqRoutes);
app.use('/api/v1/energy', energyRoutes);
app.use('/api/v1/market-data', marketDataRoutes);
app.use('/api/v1/folu', foluRoutes);
app.use('/api/v1/experience', experienceRoutes);
app.use('/api/v1/demand', demandRoutes);
app.use('/api/v1/costs', costRoutes);

// Services that self-register their routes directly on `app`
dynamicPricingService.setupRoutes(app);
farmerTrainingService.setupRoutes(app);
governmentSchemeService.setupRoutes(app);
greenhouseService.setupRoutes(app);
insuranceClaimsService.setupRoutes(app);
preSeasonOrderService.setupRoutes(app);
sharedInfraService.setupRoutes(app);
soilTestingService.setupRoutes(app);
subsidyService.setupRoutes(app);

// GraphQL endpoint (if using GraphQL)
if (process.env.ENABLE_GRAPHQL === 'true') {
  const { graphqlHTTP } = require('express-graphql');
  const schema = require('./graphql/schema');
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: process.env.NODE_ENV === 'development'
  }));
}

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join user-specific room for notifications
  socket.on('join', (userId) => {
    socket.join(`user:${userId}`);
    logger.info(`User ${userId} joined their room`);
  });

  // Real-time order updates
  socket.on('subscribe:orders', (orderId) => {
    socket.join(`order:${orderId}`);
  });

  // Real-time shipment tracking
  socket.on('subscribe:shipment', (shipmentId) => {
    socket.join(`shipment:${shipmentId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in services
app.set('io', io);

// ---------------------------------------------------------------------------
// Activate the decision layer and connect it to the realtime channel.
// ---------------------------------------------------------------------------
function initializeDecisionLayer() {
  decisionEngine.start();

  // Effectors: the efferent (motor) half of the nervous system. Before this,
  // 4 modules emitted signals and NOTHING subscribed — a temperature breach was
  // published to an empty room. See core/effectors.js for why each reaction
  // exists and why most modules are deliberately left unwired.
  const { registerEffectors } = require('./core/effectors');
  registerEffectors();

  // Close the learning loop. effectors.js has always exposed setOutcomeSink();
  // nothing ever supplied one, so every reaction was logged and forgotten —
  // which is why the AI learning loop measured 0%% in every audit. One wire.
  require('./core/outcomeSink').install();

  // Autonomous learning cycle. Resolves predictions against ground truth the
  // platform already holds and re-derives every agent's calibration gate, with
  // no human in the path. Seven of the eight prediction types close themselves
  // this way; only conflict-route risk is marked human_only, because rerouting a
  // truck means the original road was never driven and no data can say what
  // would have happened on it.
  if (process.env.NODE_ENV !== 'test' && process.env.AI_LEARNING_CYCLE !== 'off') {
    const resolver = require('./core/outcomeResolver');
    const everyMinutes = Number(process.env.AI_LEARNING_CYCLE_MINUTES || 60);
    const timer = setInterval(() => {
      resolver.runCycle().catch((error) => {
        logger.warn('learning cycle skipped', { error: error.message });
      });
    }, everyMinutes * 60 * 1000);
    timer.unref();   // never hold the process open for this
    logger.info('autonomous learning cycle scheduled', { everyMinutes });
  }

  // Efferent path: every decision is pushed to connected operators in realtime.
  // Decisions requiring a human go to an explicit escalation room so they are not
  // lost in the general feed.
  signalBus.onSignal(SIGNAL.DECISION_MADE, (signal) => {
    const decision = signal.payload;
    io.to('operations').emit('decision', decision);
    if (decision.requiresHuman) {
      io.to('escalations').emit('escalation', decision);
    }
  });
}

initializeDecisionLayer();

// Observability for the decision layer.
// ERP agent catalogue and evaluation.
app.get('/api/v1/erp-agents', authMiddleware, (req, res) => {
  res.json({ success: true, data: { agents: erpAgents.listAgents(), domains: erpAgents.DOMAIN } });
});

// Run a single agent against a supplied context. Returns a PROPOSAL only.
app.post('/api/v1/erp-agents/:agentId/evaluate', authMiddleware, (req, res) => {
  try {
    const result = erpAgents.runAgent(req.params.agentId, req.body || {});
    res.json({
      success: true,
      data: result,
      note: result
        ? 'Proposal only. Requires a named human approver before any action is taken.'
        : 'Agent had nothing to propose for this context.'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/v1/decisions', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      decisions: decisionEngine.recentDecisions(Number(req.query.limit) || 50),
      rules: decisionEngine.rules.map((r) => ({ id: r.id, description: r.description })),
      signals: signalBus.stats()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

function startServer() {
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    logger.info(`AFRERA Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Gateway: http://localhost:${PORT}/api/v1`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, io };
