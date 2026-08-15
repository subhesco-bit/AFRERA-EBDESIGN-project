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
// Enterprise Memory ("Hippocampus" — AFRERA_CLAUDE_BUILD_DIRECTIVE.md §2.3):
// case/episode log, real full-text retrieval. Was "missing" in
// core/aiOrchestrator.js before 2026-08-09 — see that file's ENGINES.enterprise_memory
// entry and migration 9997_enterprise_memory_schema.sql for the full rationale.
const enterpriseMemoryService = require('./services/enterpriseMemoryService');
const predictiveAnalyticsService = require('./services/predictiveAnalyticsService');
const iotIntegrationService = require('./services/iotIntegrationService');
const arVrService = require('./services/arVrService');
const smsAuthService = require('./services/smsAuthService');
// Real Twilio WhatsApp integration (outbound send + inbound webhook). Mirrors
// smsAuthService's mock-mode-when-unconfigured pattern. See service header.
const whatsappService = require('./services/whatsappService');
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
const millCircuitService = require('./services/millCircuitService');
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
const ecommerceRoutes = require('./routes/ecommerceRoutes');
const ecommerceIntegrationRoutes = require('./routes/ecommerceIntegrationRoutes');
const ecommerceAIRoutes = require('./routes/ecommerceAIRoutes');
const ecommerceERPRoutes = require('./routes/ecommerceERPRoutes');
const ecommerceBusinessSalesRoutes = require('./routes/ecommerceBusinessSalesRoutes');
const ecommerceMarketingRoutes = require('./routes/ecommerceMarketingRoutes');
const nutrientValueSalesRoutes = require('./routes/nutrientValueSalesRoutes');
const nervousSystemRoutes = require('./routes/nervousSystemRoutes');
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
// M121 Dairy Management + M112 Fertilizer Inventory (Livestock / Input
// Supply, wave 1) — real backends for two pages that were UI-only until now.
const dairyRoutes = require('./routes/dairyRoutes');
const fertilizerRoutes = require('./routes/fertilizerRoutes');
const revenueRoutes = require('./routes/revenueRoutes');
// M123-M127 Livestock Management — Poultry, Goat, Sheep, Pig, Animal Health
const poultryRoutes = require('./routes/poultryRoutes');
const goatRoutes = require('./routes/goatRoutes');
const sheepRoutes = require('./routes/sheepRoutes');
const pigRoutes = require('./routes/pigRoutes');
const animalHealthRoutes = require('./routes/animalHealthRoutes');
// Enterprise Control — Workflow, CRM, Legal, Risk, Emergency (migration 993)
const enterpriseControlRoutes = require('./routes/enterpriseControlRoutes');
// Unified Ledger with Economy Segmentation (migration 998) - One Ledger + 9 Economies
const unifiedLedgerRoutes = require('./routes/unifiedLedgerRoutes');
// Village Profile Service (REOS Missing Layer 5 - District/Village/Block Economic Database)
const villageProfileService = require('./services/villageProfileService');
// Procurement Subscription Service (REOS Missing Layer 1.9 - Subscription Commerce)
const procurementSubscriptionService = require('./services/procurementSubscriptionService');
// Buying Club Service (REOS Missing Layer 1.10-1.11 - Group Buying / Community Buying)
const buyingClubService = require('./services/buyingClubService');
// Rural Enterprise Service (REOS Rural Life OS - rural_enterprises table)
const ruralEnterpriseService = require('./services/ruralEnterpriseService');
// Renewable Energy Service (REOS Rural Life OS - renewable_energy_systems table)
const renewableEnergyService = require('./services/renewableEnergyService');
// Household Economy Service (REOS Rural Life OS - household_economy table)
const householdEconomyService = require('./services/householdEconomyService');
// Shared Infrastructure Service (REOS Rural Life OS - shared_infrastructure_access table)
const sharedInfrastructureService = require('./services/sharedInfrastructureService');
// Machinery Access Service (REOS Rural Life OS - machinery_access table)
const machineryAccessService = require('./services/machineryAccessService');
// Rural Finance Service (REOS Rural Life OS - rural_finance table)
const ruralFinanceService = require('./services/ruralFinanceService');
// AI Advisory Service (REOS Rural Life OS - ai_advisories table)
const aiAdvisoryService = require('./services/aiAdvisoryService');
// Market Access Service (REOS Rural Life OS - market_access table)
const marketAccessService = require('./services/marketAccessService');
// Market Intelligence Service (REOS Rural Life OS - market_intelligence table)
const marketIntelligenceService = require('./services/marketIntelligenceService');
// Mobility Rides Service (REOS Rural Life OS - mobility_rides table)
const mobilityRidesService = require('./services/mobilityRidesService');
// Backup and Disaster Recovery Service
const backupService = require('./services/backupService');
// Analytics and Monitoring Service
const analyticsMonitoringService = require('./services/analyticsMonitoringService');
// AI Agentic Companion Service
const aiAgenticCompanionService = require('./services/aiAgenticCompanionService');
// Digital Twin Service
const digitalTwinService = require('./services/digitalTwinService');
// AI Gateway Service - Real AI Backbone System
const aiGatewayService = require('./services/aiGatewayService');
// AI Agent Service - Agentic AI Capabilities
const aiAgentService = require('./services/aiAgentService');
// AI Brain Service - Cognitive Processing Layer
const aiBrainService = require('./services/aiBrainService');
// AI Self-Healing Service - Autonomous Error Recovery Layer
const aiSelfHealingService = require('./services/aiSelfHealingService');
// AI Operation Intelligence Service - Real-Time Optimization Layer
const aiOperationIntelligenceService = require('./services/aiOperationIntelligenceService');
// SAP Module Architecture Service - Independent Module Architecture
const sapModuleArchitectureService = require('./services/sapModuleArchitectureService');
// Cloud Management Service - Multi-Cloud Deployment
const cloudManagementService = require('./services/cloudManagementService');
// Server Management Service - Infrastructure Provisioning and Monitoring
const serverManagementService = require('./services/serverManagementService');
// Database Management Service - Distributed Database Operations
const databaseManagementService = require('./services/databaseManagementService');
// Advance Rate Pricing — forward curves, basis, commitment advice.
// Recovered from afrera_platform_v44.html (migration 051).
const riskPricingRoutes = require('./routes/riskPricingRoutes');
// GST, hash-chained ledger, scheme matching, eNWR, freight, risk (migration 053).
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes');
// Domain D14 Climate & Weather (057) — was completely empty before today.
const weatherRoutes = require('./routes/weatherRoutes');
// M083 Climate Advisory (Operations wave 2) — CRUD for agromet_advisories,
// the migration-057 table ClimateAdvisoryPage.jsx has been waiting on.
const climateAdvisoryRoutes = require('./routes/climateAdvisoryRoutes');
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
// Geofencing — circular zone check-ins on top of real mobile GPS (useGeolocation)
// and the existing driver_location pipeline. See services/geofencingService.js.
const geofencingRoutes = require('./routes/geofencingRoutes');
// Experience Layer / DXP — the 15 engines (migration 060).
const experienceRoutes = require('./routes/experienceRoutes');
const demandRoutes = require('./routes/demandRoutes');
const costRoutes = require('./routes/costRoutes');
// AF-AA (Asset Accounting) / AF-CO (Controlling) — named MISSING in
// docs/registry/12_ERP_COVERAGE.md and AFRERA_CLAUDE_BUILD_DIRECTIVE.md §8.6.
// Schema (fixed_assets, depreciation_schedule, cost_centers, budgets) already
// existed in migration 996; these give it a service/route layer for the
// first time.
const assetAccountingRoutes = require('./routes/assetAccountingRoutes');
const costControlRoutes = require('./routes/costControlRoutes');
// AF-PS (Project Systems) — the third domain named MISSING alongside AF-AA/
// AF-CO. Unlike those two, AF-PS had no schema at all; it is created fresh
// in migration 9996_project_systems_schema.sql (see that file's header for
// why it is numbered after 996 rather than in the 060s sequence).
const projectSystemsRoutes = require('./routes/projectSystemsRoutes');
const coldStorageRoutes = require('./routes/coldStorageRoutes');
const dprGenerationRoutes = require('./routes/dprGenerationRoutes');
const cooperativeShareRoutes = require('./routes/cooperativeShareRoutes');
const wikipediaRoutes = require('./routes/wikipediaRoutes');
// Found built but with zero HTTP exposure (2026-08-15 junk/orphan sweep) —
// see each route file's header comment for what was verified before wiring.
const agriculturalIntelligenceRoutes = require('./routes/agriculturalIntelligenceRoutes');
const farmerHealthRoutes = require('./routes/farmerHealthRoutes');
const foodRoutes = require('./routes/foodRoutes');
const iotSensorService = require('./services/iotSensorService');
const regionalVarietyRoutes = require('./routes/regionalVarietyRoutes');
const foluBenchmarkRoutes = require('./routes/foluBenchmarkRoutes');
// Vision (sharp) + OCR (tesseract.js) — real image-quality/metadata/
// thumbnail and text-extraction dispatch behind core/aiOrchestrator.js's
// vision_engine / ocr_engine, which were "missing" before 2026-08-09.
const visionRoutes = require('./routes/visionRoutes');
// AI Gateway Routes - Real AI Backbone System
const aiGatewayRoutes = require('./routes/aiGatewayRoutes');
// AI Agent Routes - Agentic AI Capabilities
const aiAgentRoutes = require('./routes/aiAgentRoutes');
// AI Brain Routes - Cognitive Processing Layer
const aiBrainRoutes = require('./routes/aiBrainRoutes');
// AI Self-Healing Routes - Autonomous Error Recovery Layer
const aiSelfHealingRoutes = require('./routes/aiSelfHealingRoutes');
// AI Operation Intelligence Routes - Real-Time Optimization Layer
const aiOperationIntelligenceRoutes = require('./routes/aiOperationIntelligenceRoutes');
// SAP Module Architecture Routes - Independent Module Architecture
const sapModuleArchitectureRoutes = require('./routes/sapModuleArchitectureRoutes');
// Cloud Management Routes - Multi-Cloud Deployment
const cloudManagementRoutes = require('./routes/cloudManagementRoutes');
// Server Management Routes - Infrastructure Provisioning and Monitoring
const serverManagementRoutes = require('./routes/serverManagementRoutes');
// Database Management Routes - Distributed Database Operations
const databaseManagementRoutes = require('./routes/databaseManagementRoutes');
// Public Domain Data Extraction Routes - Data Extraction and Subsidy Management
const publicDomainDataExtractionRoutes = require('./routes/publicDomainDataExtractionRoutes');
// Research and Development Routes - R&D Management with AI Integration
const researchAndDevelopmentRoutes = require('./routes/researchAndDevelopmentRoutes');
// Module Support Infrastructure Routes - Module Management with AI Integration
const moduleSupportInfrastructureRoutes = require('./routes/moduleSupportInfrastructureRoutes');
// Startup Environment Routes - Startup Management with AI Integration
const startupEnvironmentRoutes = require('./routes/startupEnvironmentRoutes');
// Information Sharing Routes - Document and Knowledge Sharing with AI Integration
const informationSharingRoutes = require('./routes/informationSharingRoutes');
// Community Routes - Community Management with AI Integration
const communityRoutes = require('./routes/communityRoutes');
// Knowledge Routes - Knowledge Management with AI Integration
const knowledgeRoutes = require('./routes/knowledgeRoutes');
// Company lookup — resolves accounting UI gap for companyId/fiscalYear/chart-of-accounts
const companyRoutes = require('./routes/companyRoutes');
// Platform Foundation Routes - AI Enhanced Platform Foundation (D01)
const platformCoreRoutes = require('./routes/platformCoreRoutes');
const platformConfigurationRoutes = require('./routes/platformConfigurationRoutes');
const tenantManagementRoutes = require('./routes/tenantManagementRoutes');
const organizationManagementRoutes = require('./routes/organizationManagementRoutes');
const systemAdministrationRoutes = require('./routes/systemAdministrationRoutes');
// Poultry/Goat/Sheep/Pig/Animal Health (M123-M127) already required above.

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
const { validateBody } = require('./middleware/inputValidation');
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
  if (typeof millCircuitService !== 'undefined') {
    healthChecks.mill_circuit = typeof millCircuitService.isHealthy === 'function' ? millCircuitService.isHealthy() : { status: 'ok' };
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
mountRoute('/api/v1/enterprise-memory', enterpriseMemoryService);
mountRoute('/api/v1/predictive-analytics', predictiveAnalyticsService);
mountRoute('/api/v1/iot-integration', iotIntegrationService);
mountRoute('/api/v1/ar-vr', arVrService);
mountRoute('/api/v1/sms-auth', smsAuthService);
mountRoute('/api/v1/whatsapp', whatsappService);
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
mountRoute('/api/v1/mill-fpo', millCircuitService);
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
app.use('/api/v1/ecommerce', ecommerceRoutes);
app.use('/api/v1/ecommerce-integration', ecommerceIntegrationRoutes);
app.use('/api/v1/ecommerce-ai', ecommerceAIRoutes);
app.use('/api/v1/ecommerce-erp', ecommerceERPRoutes);
app.use('/api/v1/ecommerce-business', ecommerceBusinessSalesRoutes);
app.use('/api/v1/ecommerce-marketing', ecommerceMarketingRoutes);
app.use('/api/v1/nutrient-value', nutrientValueSalesRoutes);
app.use('/api/v1/nervous', nervousSystemRoutes);
// Bulk Order Service - Bulk/wholesale orders for marketplace
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');
app.use('/api/v1/bulk-orders', bulkOrderRoutes);
// Complete ERP Integration - Comprehensive ERP integration with all modules
const completeERPIntegrationRoutes = require('./routes/completeERPIntegrationRoutes');
app.use('/api/v1/complete-erp-integration', completeERPIntegrationRoutes);
// Complete AI Integration - Comprehensive AI integration with all modules
const completeAIIntegrationRoutes = require('./routes/completeAIIntegrationRoutes');
app.use('/api/v1/complete-ai-integration', completeAIIntegrationRoutes);
// Comprehensive ERP - Oracle/SAP standards complete ERP system
const comprehensiveERPRoutes = require('./routes/comprehensiveERPRoutes');
app.use('/api/v1/comprehensive-erp', comprehensiveERPRoutes);
// AI Backbone - Real AI integration (Claude, ChatGPT, Gemini, Azure, Hugging Face)
const aiBackboneRoutes = require('./routes/aiBackboneRoutes');
app.use('/api/v1/ai-backbone', aiBackboneRoutes);
// Farmer Training - Agricultural training and FOLU compliance
const farmerTrainingRoutes = require('./routes/farmerTrainingRoutes');
app.use('/api/v1/training', farmerTrainingRoutes);
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
// M121 Dairy Management + M112 Fertilizer Inventory — see dairyRoutes.js /
// fertilizerRoutes.js. Frontend already calls these exact paths
// (dairyAPI / fertilizerAPI in frontend/src/services/api.js); this is the
// first time either has had a real backend.
app.use('/api/v1/dairy', dairyRoutes);
app.use('/api/v1/fertilizer', fertilizerRoutes);
// M123-M127 Livestock Management — Poultry, Goat, Sheep, Pig, Animal Health
app.use('/api/v1/poultry', poultryRoutes);
app.use('/api/v1/goat', goatRoutes);
app.use('/api/v1/sheep', sheepRoutes);
app.use('/api/v1/pig', pigRoutes);
app.use('/api/v1/animal-health', animalHealthRoutes);
// Enterprise Control — Workflow, CRM, Legal, Risk, Emergency (migration 993)
app.use('/api/v1/enterprise', enterpriseControlRoutes);
// Unified Ledger with Economy Segmentation (migration 998) - One Ledger + 9 Economies
app.use('/api/v1/unified-ledger', unifiedLedgerRoutes);
// Village Profile Service (REOS Missing Layer 5 - District/Village/Block Economic Database)
villageProfileService.setupRoutes(app);
// Procurement Subscription Service (REOS Missing Layer 1.9 - Subscription Commerce)
procurementSubscriptionService.setupRoutes(app);
// Buying Club Service (REOS Missing Layer 1.10-1.11 - Group Buying / Community Buying)
buyingClubService.setupRoutes(app);
// Rural Enterprise Service (REOS Rural Life OS - rural_enterprises table)
ruralEnterpriseService.setupRoutes(app);
// Renewable Energy Service (REOS Rural Life OS - renewable_energy_systems table)
renewableEnergyService.setupRoutes(app);
// Household Economy Service (REOS Rural Life OS - household_economy table)
householdEconomyService.setupRoutes(app);
// Shared Infrastructure Service (REOS Rural Life OS - shared_infrastructure_access table)
sharedInfrastructureService.setupRoutes(app);
// Machinery Access Service (REOS Rural Life OS - machinery_access table)
machineryAccessService.setupRoutes(app);
// Rural Finance Service (REOS Rural Life OS - rural_finance table)
ruralFinanceService.setupRoutes(app);
// AI Advisory Service (REOS Rural Life OS - ai_advisories table)
aiAdvisoryService.setupRoutes(app);
// Market Access Service (REOS Rural Life OS - market_access table)
marketAccessService.setupRoutes(app);
// Market Intelligence Service (REOS Rural Life OS - market_intelligence table)
marketIntelligenceService.setupRoutes(app);
// Mobility Rides Service (REOS Rural Life OS - mobility_rides table)
mobilityRidesService.setupRoutes(app);
// Vendor-facing routes (corporate buyers, logistics providers, processors, retailers)
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/v1/vendors', vendorRoutes);
// HR Module with AI Integration - Complete AI-powered HR management
const hrRoutes = require('./routes/hrRoutes');
app.use('/api/v1/hr', hrRoutes);

// Economic Layer routes (scaffolded)
app.use('/api/v1/revenue', revenueRoutes);
app.use('/api/v1/pricing', riskPricingRoutes);
app.use('/api/v1/finance', recoveredFinanceRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/climate-advisory', climateAdvisoryRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/rfq', rfqRoutes);
app.use('/api/v1/energy', energyRoutes);
app.use('/api/v1/market-data', marketDataRoutes);
app.use('/api/v1/folu', foluRoutes);
app.use('/api/v1/geofencing', geofencingRoutes);
app.use('/api/v1/experience', experienceRoutes);
app.use('/api/v1/demand', demandRoutes);
app.use('/api/v1/costs', costRoutes);
// AF-AA / AF-CO — see require comments above.
app.use('/api/v1/erp/assets', assetAccountingRoutes);
app.use('/api/v1/erp/controlling', costControlRoutes);
app.use('/api/v1/erp/projects', projectSystemsRoutes);
app.use('/api/v1/cold-storage', coldStorageRoutes);
app.use('/api/v1/dpr', dprGenerationRoutes);
app.use('/api/v1/cooperative-shares', cooperativeShareRoutes);
// Real Wikimedia REST API reference lookups (see services/wikipediaService.js).
app.use('/api/v1/wikipedia', wikipediaRoutes);
app.use('/api/v1/agri-intelligence', agriculturalIntelligenceRoutes);
// farmerHealthRoutes has real welfare-program/health-summary endpoints not
// covered by the generic M029 CRUD scaffold at /api/v1/modules/m029 — kept
// distinct rather than merged to avoid touching the generated scaffold.
app.use('/api/v1/farmer-health', farmerHealthRoutes);
app.use('/api/v1/food', foodRoutes);
// iotSensorService.setupRoutes registers full paths directly on `app`
// (not a sub-router) — see services/iotSensorService.js line ~600.
iotSensorService.initialize().catch((error) => logger.warn('iotSensorService initialize failed', { error: error.message }));
iotSensorService.setupRoutes(app);
app.use('/api/v1/variety-directory', regionalVarietyRoutes);
app.use('/api/v1/folu-benchmark', foluBenchmarkRoutes);
// Vision + OCR (real sharp / tesseract.js dispatch, see routes/visionRoutes.js).
app.use('/api/v1/vision', visionRoutes);
// AI Gateway - Real AI Backbone System
app.use('/api/v1/ai-gateway', aiGatewayRoutes);
// AI Agent - Agentic AI Capabilities
app.use('/api/v1/ai-agent', aiAgentRoutes);
// AI Brain - Cognitive Processing Layer
app.use('/api/v1/ai-brain', aiBrainRoutes);
// AI Self-Healing - Autonomous Error Recovery Layer
app.use('/api/v1/ai-self-healing', aiSelfHealingRoutes);
// AI Operation Intelligence - Real-Time Optimization Layer
app.use('/api/v1/ai-operation-intelligence', aiOperationIntelligenceRoutes);
// SAP Module Architecture - Independent Module Architecture
app.use('/api/v1/sap-module-architecture', sapModuleArchitectureRoutes);
// Cloud Management - Multi-Cloud Deployment
app.use('/api/v1/cloud-management', cloudManagementRoutes);
// Server Management - Infrastructure Provisioning and Monitoring
app.use('/api/v1/server-management', serverManagementRoutes);
// Database Management - Distributed Database Operations
app.use('/api/v1/database-management', databaseManagementRoutes);
// Public Domain Data Extraction - Data Extraction and Subsidy Management
app.use('/api/v1/public-domain-data-extraction', publicDomainDataExtractionRoutes);
// Research and Development - R&D Management with AI Integration
app.use('/api/v1/research-and-development', researchAndDevelopmentRoutes);
// Module Support Infrastructure - Module Management with AI Integration
app.use('/api/v1/module-support-infrastructure', moduleSupportInfrastructureRoutes);
// Startup Environment - Startup Management with AI Integration
app.use('/api/v1/startup-environment', startupEnvironmentRoutes);
// Information Sharing - Document and Knowledge Sharing with AI Integration
app.use('/api/v1/information-sharing', informationSharingRoutes);
// Community - Community Management with AI Integration
app.use('/api/v1/community', communityRoutes);
// Knowledge - Knowledge Management with AI Integration
app.use('/api/v1/knowledge', knowledgeRoutes);
// Company lookup — resolves accounting UI gap
app.use('/api/v1/companies', companyRoutes);
// Platform Foundation - AI Enhanced Platform Foundation (D01)
app.use('/api/v1/platform-core', platformCoreRoutes);
app.use('/api/v1/platform-configuration', platformConfigurationRoutes);
app.use('/api/v1/tenant-management', tenantManagementRoutes);
app.use('/api/v1/organization-management', organizationManagementRoutes);
app.use('/api/v1/system-administration', systemAdministrationRoutes);
// Poultry/Goat/Sheep/Pig/Animal Health (M123-M127) already mounted above.

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

  // Enterprise Memory: records a case entry the moment TEMPERATURE_BREACH /
  // RECALL_ISSUED / FRAUD_SUSPECTED fires, then best-effort links it to the
  // ai_outcomes row the effectors above write for the same signal. See
  // services/enterpriseMemoryService.js's module header for why this is a
  // read-only subscriber (signalBus/effectors/outcomeSink are untouched) and
  // why the link is best-effort rather than transactional.
  enterpriseMemoryService.installSignalHooks();

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

  // Daily Agmarknet (data.gov.in) mandi price refresh. jobs/loadMandiPrices.js
  // was built as a standalone CLI script (`node src/jobs/loadMandiPrices.js`)
  // with no in-process scheduling — real and working, but only ever ran
  // manually. Same disable/interval-override convention as the learning
  // cycle above.
  if (process.env.NODE_ENV !== 'test' && process.env.MANDI_PRICE_REFRESH !== 'off') {
    const mandiJob = require('./jobs/loadMandiPrices');
    const everyHours = Number(process.env.MANDI_PRICE_REFRESH_HOURS || 24);
    const runMandiRefresh = () => {
      mandiJob.run({}).then((summary) => {
        logger.info('mandi price refresh complete', { fetched: summary.fetched, neRecords: summary.neRecords, neCoverageNote: summary.neCoverageNote });
      }).catch((error) => {
        logger.warn('mandi price refresh failed', { error: error.message });
      });
    };
    const mandiTimer = setInterval(runMandiRefresh, everyHours * 60 * 60 * 1000);
    mandiTimer.unref();
    logger.info('Agmarknet mandi price refresh scheduled', { everyHours });
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

// Initialize AFRERA Nervous System - Enterprise Route Control
const { initializeNervousSystem, startSensorDataCollection } = require('./core/nervousSystem');
initializeNervousSystem();
startSensorDataCollection();

// Initialize backup and disaster recovery service
backupService.initialize().catch(error => {
  logger.warn('Backup service initialization failed', { error: error.message });
});

// Initialize analytics and monitoring service
analyticsMonitoringService.initialize().catch(error => {
  logger.warn('Analytics monitoring service initialization failed', { error: error.message });
});

// Initialize AI Agentic Companion service
aiAgenticCompanionService.initialize().catch(error => {
  logger.warn('AI Agentic Companion service initialization failed', { error: error.message });
});

// Initialize Digital Twin service
digitalTwinService.initialize().catch(error => {
  logger.warn('Digital Twin service initialization failed', { error: error.message });
});

// Setup analytics monitoring routes
analyticsMonitoringService.setupRoutes(app);

// Setup AI Agentic Companion routes
aiAgenticCompanionService.setupRoutes(app);

// Setup Digital Twin routes
digitalTwinService.setupRoutes(app);

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
