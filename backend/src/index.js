const index = require('./routes/index.js');
const yieldManagement = require('./routes/yieldManagement.js');
const wikipediaRoutes = require('./routes/wikipediaRoutes.js');
const weatherRoutes = require('./routes/weatherRoutes.js');
const weatherAdvisory = require('./routes/weatherAdvisory.js');
const wearableIntegrationRoutes = require('./routes/wearableIntegrationRoutes.js');
const waterManagementRoutes = require('./routes/waterManagementRoutes.js');
const warehouseManagement = require('./routes/warehouseManagement.js');
const walletRoutes = require('./routes/walletRoutes.js');
const vr = require('./routes/vr.js');
const visionRoutes = require('./routes/visionRoutes.js');
const videoAnalytics = require('./routes/videoAnalytics.js');
const vendorRoutes = require('./routes/vendorRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const unifiedAIRoutes = require('./routes/unifiedAIRoutes.js');
const unifiedAIGateway = require('./routes/unifiedAIGateway.js');
const transactionRoutes = require('./routes/transactionRoutes.js');
const trackDartRoutes = require('./routes/trackDartRoutes.js');
const tenantManagementRoutes = require('./routes/tenantManagementRoutes.js');
const systemAdministrationRoutes = require('./routes/systemAdministrationRoutes.js');
const supplyChainTracking = require('./routes/supplyChainTracking.js');
const supplyChainAnalytics = require('./routes/supplyChainAnalytics.js');
const supplyChainDecisionRoutes = require('./routes/supplyChainDecisionRoutes.js');
const subscriptions = require('./routes/subscriptions.js');
const soilManagementRoutes = require('./routes/soilManagementRoutes.js');
const soilHealth = require('./routes/soilHealth.js');
const sheepRoutes = require('./routes/sheepRoutes.js');
const sellerVerifications = require('./routes/sellerVerifications.js');
const sellerRankingRoutes = require('./routes/sellerRankingRoutes.js');
const seedVaultRoutes = require('./routes/seedVaultRoutes.js');
const sapModuleArchitectureRoutes = require('./routes/sapModuleArchitectureRoutes.js');
const roleManagementRoutes = require('./routes/roleManagementRoutes.js');
const riskPricingRoutes = require('./routes/riskPricingRoutes.js');
const riskAssessment = require('./routes/riskAssessment.js');
const rfqRoutes = require('./routes/rfqRoutes.js');
const revenueRoutes = require('./routes/revenueRoutes.js');
const returnLoadBoardRoutes = require('./routes/returnLoadBoardRoutes.js');
const researchAndDevelopmentRoutes = require('./routes/researchAndDevelopmentRoutes.js');
const regionalVarietyRoutes = require('./routes/regionalVarietyRoutes.js');
const neVarietiesRoutes = require('./routes/neVarietiesRoutes.js');
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes.js');
const realtimeMonitoringRoutes = require('./routes/realtimeMonitoringRoutes.js');
const qualityAssurance = require('./routes/qualityAssurance.js');
const projectSystemsRoutes = require('./routes/projectSystemsRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const productReviewRoutes = require('./routes/productReviewRoutes.js');
const productMediaAIRoutes = require('./routes/productMediaAIRoutes.js');
const publicDataRoutes = require('./routes/publicDataRoutes.js');
const productCertifications = require('./routes/productCertifications.js');
const priceForecasting = require('./routes/priceForecasting.js');
const preventiveMaintenanceRoutes = require('./routes/preventiveMaintenanceRoutes.js');
const predictiveIntelligenceRoutes = require('./routes/predictiveIntelligenceRoutes.js');
const predictiveAnalytics = require('./routes/predictiveAnalytics.js');
const poultryRoutes = require('./routes/poultryRoutes.js');
const platformTelemetryRoutes = require('./routes/platformTelemetryRoutes.js');
const platformCoreRoutes = require('./routes/platformCoreRoutes.js');
const platformConfigurationRoutes = require('./routes/platformConfigurationRoutes.js');
const pigRoutes = require('./routes/pigRoutes.js');
const phase9 = require('./routes/phase9.js');
const phase8 = require('./routes/phase8.js');
const phase12 = require('./routes/phase12.js');
const phase11 = require('./routes/phase11.js');
const phase10 = require('./routes/phase10.js');
const paymentRoutes = require('./routes/paymentRoutes.js');
const paymentGatewayRoutes = require('./routes/paymentGatewayRoutes.js');
const ORPHANED_SERVICES_MOUNT = require('./routes/ORPHANED_SERVICES_MOUNT.js');
const organizationManagementRoutes = require('./routes/organizationManagementRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const operationsRouteSupport = require('./routes/operationsRouteSupport.js');
const operationsManagementRoutes = require('./routes/operationsManagementRoutes.js');
const nutritionIntelligenceRoutes = require('./routes/nutritionIntelligenceRoutes.js');
const nutrientValueSalesRoutes = require('./routes/nutrientValueSalesRoutes.js');
const nlp = require('./routes/nlp.js');
const nervousSystemRoutes = require('./routes/nervousSystemRoutes.js');
const mlOptimization = require('./routes/mlOptimization.js');
const marketplaceEnhancements = require('./routes/marketplaceEnhancements.js');
const marketDataRoutes = require('./routes/marketDataRoutes.js');
const marketAnalytics = require('./routes/marketAnalytics.js');
const m400AiBackboneRoutes = require('./routes/m400AiBackboneRoutes.js');
const logisticsEnhancements = require('./routes/logisticsEnhancements.js');
const logisticsEnhancementRoutes = require('./routes/logisticsEnhancementRoutes.js');
const loanManagement = require('./routes/loanManagement.js');
const livestockRouteSupport = require('./routes/livestockRouteSupport.js');
const livestockManagementRoutes = require('./routes/livestockManagementRoutes.js');
const livestock = require('./routes/livestock.js');
const libraryRoutes = require('./routes/libraryRoutes.js');
const landRecordsRoutes = require('./routes/landRecordsRoutes.js');
const landManagementRoutes = require('./routes/landManagementRoutes.js');
const knowledgeRoutes = require('./routes/knowledgeRoutes.js');
const irrigationManagementRoutes = require('./routes/irrigationManagementRoutes.js');
const iotSensors = require('./routes/iotSensors.js');
const iotIntegrationRoutes = require('./routes/iotIntegrationRoutes.js');
const insuranceEnhancements = require('./routes/insuranceEnhancements.js');
const inputSupplyManagementRoutes = require('./routes/inputSupplyManagementRoutes.js');
const informationSharingRoutes = require('./routes/informationSharingRoutes.js');
const identityManagementRoutes = require('./routes/identityManagementRoutes.js');
const hrRoutes = require('./routes/hrRoutes.js');
const horticultureManagementRoutes = require('./routes/horticultureManagementRoutes.js');
const horticulture = require('./routes/horticulture.js');
const gstRoutes = require('./routes/gstRoutes.js');
const greenhouse = require('./routes/greenhouse.js');
const governanceModule = require('./routes/governanceModule.js');
const goatRoutes = require('./routes/goatRoutes.js');
const glutWarningRoutes = require('./routes/glutWarningRoutes.js');
const geofencingRoutes = require('./routes/geofencingRoutes.js');
const freightPoolingRoutes = require('./routes/freightPoolingRoutes.js');
const freightPooling = require('./routes/freightPooling.js');
const foodRoutes = require('./routes/foodRoutes.js');
const foluRoutes = require('./routes/foluRoutes.js');
const foluBenchmarkRoutes = require('./routes/foluBenchmarkRoutes.js');
const fisheriesManagementRoutes = require('./routes/fisheriesManagementRoutes.js');
const financialAnalytics = require('./routes/financialAnalytics.js');
const fertilizerRoutes = require('./routes/fertilizerRoutes.js');
const farmerValueRoutes = require('./routes/farmerValueRoutes.js');
const farmerTrainingRoutes = require('./routes/farmerTrainingRoutes.js');
const farmerRoutes = require('./routes/farmerRoutes.js');
const farmerPortalEnhancements = require('./routes/farmerPortalEnhancements.js');
const farmerHealthRoutes = require('./routes/farmerHealthRoutes.js');
const farmerFamilyRoutes = require('./routes/farmerFamilyRoutes.js');
const farmCosting = require('./routes/farmCosting.js');
const farmAnalytics = require('./routes/farmAnalytics.js');
const experienceRoutes = require('./routes/experienceRoutes.js');
const escrowRoutes = require('./routes/escrowRoutes.js');
const equipmentExchangeRoutes = require('./routes/equipmentExchangeRoutes.js');
const enterpriseRouteSupport = require('./routes/enterpriseRouteSupport.js');
const enterpriseIntegrationRoutes = require('./routes/enterpriseIntegrationRoutes.js');
const enterpriseAIRoutes = require('./routes/enterpriseAIRoutes.js');
const engineeringProjectRoutes = require('./routes/engineeringProjectRoutes.js');
const energyRoutes = require('./routes/energyRoutes.js');
const ecommerceRoutes = require('./routes/ecommerceRoutes.js');
const ecommerceMarketingRoutes = require('./routes/ecommerceMarketingRoutes.js');
const ecommerceIntegrationRoutes = require('./routes/ecommerceIntegrationRoutes.js');
const ecommerceERPRoutes = require('./routes/ecommerceERPRoutes.js');
const ecommerceBusinessSalesRoutes = require('./routes/ecommerceBusinessSalesRoutes.js');
const ecommerceAIRoutes = require('./routes/ecommerceAIRoutes.js');
const dprGenerationRoutes = require('./routes/dprGenerationRoutes.js');
const digitalTwinRoutes = require('./routes/digitalTwinRoutes.js');
const dietTherapyRoutes = require('./routes/dietTherapyRoutes.js');
const demandRoutes = require('./routes/demandRoutes.js');
const defenseFitnessPrepRoutes = require('./routes/defenseFitnessPrepRoutes.js');
const decisionSupportRoutes = require('./routes/decisionSupportRoutes.js');
const dataVisualization = require('./routes/dataVisualization.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const dairyRoutes = require('./routes/dairyRoutes.js');
const cropValueResearchRoutes = require('./routes/cropValueResearchRoutes.js');
const cropRecommendations = require('./routes/cropRecommendations.js');
const cropPlanningRoutes = require('./routes/cropPlanningRoutes.js');
const cropManagementRoutes = require('./routes/cropManagementRoutes.js');
const costRoutes = require('./routes/costRoutes.js');
const costControlRoutes = require('./routes/costControlRoutes.js');
const cooperativeShareRoutes = require('./routes/cooperativeShareRoutes.js');
const comprehensiveERPRoutes = require('./routes/comprehensiveERPRoutes.js');
const complianceTracking = require('./routes/complianceTracking.js');
const complianceRoutes = require('./routes/complianceRoutes.js');
const completeERPIntegrationRoutes = require('./routes/completeERPIntegrationRoutes.js');
const completeAIIntegrationRoutes = require('./routes/completeAIIntegrationRoutes.js');
const companyRoutes = require('./routes/companyRoutes.js');
const communityManagementRoutes = require('./routes/communityManagementRoutes.js');
const coldStorageRoutes = require('./routes/coldStorageRoutes.js');
const coldChainMonitoring = require('./routes/coldChainMonitoring.js');
const climateRouteSupport = require('./routes/climateRouteSupport.js');
const climateMonitoringRoutes = require('./routes/climateMonitoringRoutes.js');
const climateAdvisoryRoutes = require('./routes/climateAdvisoryRoutes.js');
const climateAdvisory = require('./routes/climateAdvisory.js');
const civilDisruptionRoutes = require('./routes/civilDisruptionRoutes.js');
const certificationManagement = require('./routes/certificationManagement.js');
const buyerTrust = require('./routes/buyerTrust.js');
const bulkOrders = require('./routes/bulkOrders.js');
const bulkOrderRoutes = require('./routes/bulkOrderRoutes.js');
const blockchainVerificationRoutes = require('./routes/blockchainVerificationRoutes.js');
const blockchainTrace = require('./routes/blockchainTrace.js');
const biometric = require('./routes/biometric.js');
const automation = require('./routes/automation.js');
const authRoutes = require('./routes/authRoutes.js');
const auditTrail = require('./routes/auditTrail.js');
const auditRoutes = require('./routes/auditRoutes.js');
const assetAccountingRoutes = require('./routes/assetAccountingRoutes.js');
const ar = require('./routes/ar.js');
const apiCompatibilityRoutes = require('./routes/apiCompatibilityRoutes.js');
const animalHealthRoutes = require('./routes/animalHealthRoutes.js');
const analyticsReportRoutes = require('./routes/analyticsReportRoutes.js');
const aiSelfHealingRoutes = require('./routes/aiSelfHealingRoutes.js');
const aiOperationIntelligenceRoutes = require('./routes/aiOperationIntelligenceRoutes.js');
const aiGatewayRoutes = require('./routes/aiGatewayRoutes.js');
const aiCollaborationRoutes = require('./routes/aiCollaborationRoutes.js');
const aiBrainRoutes = require('./routes/aiBrainRoutes.js');
const aiBackboneRoutes = require('./routes/aiBackboneRoutes.js');
const aiApprovalRoutes = require('./routes/aiApprovalRoutes.js');
const aiAgentRoutes = require('./routes/aiAgentRoutes.js');
const agriculturalIntelligenceRoutes = require('./routes/agriculturalIntelligenceRoutes.js');
const advancedSearchRoutes = require('./routes/advancedSearchRoutes.js');
const advancedFeatures = require('./routes/advancedFeatures.js');
const advancedAnalyticsRoutes = require('./routes/advancedAnalyticsRoutes.js');
const apiWarningRoutes = require('./routes/apiWarningRoutes.js');
const operationalModuleRoutes = require('./routes/operationalModuleRoutes.js');

/**
 * EBDESIGN Platform Backend - Main Entry Point
 * Auto-Discovery Architecture: Supports 200K+ services & routes
 *
 * Replaces manual imports with dynamic service/route discovery
 * Enables lazy loading, scales to enterprise requirements
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Core auto-discovery modules
const DynamicServiceLoader = require('./core/dynamicServiceLoader');
const DynamicRouteLoader = require('./core/dynamicRouteLoader');
const ServiceLocator = require('./core/serviceLocator');
const ConfigRegistry = require('./core/configRegistry');

// Core infrastructure
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders, rateLimit } = require('./middleware/securityMiddleware');
const { requestId } = require('./middleware/requestId');
const { responseFormatter } = require('./middleware/responseFormatter');
const { routeMonitoring } = require('./middleware/routeMonitoring');
const {
  standardizeResponse,
  standardizeErrorResponse,
  addStandardHeaders,
  trackResponseTime,
  correlationId,
  contentNegotiation
} = require('./middleware/apiResponseStandardizer');
const mfaMiddleware = require('./middleware/dual-use/mfaMiddleware');
const loggingService = require('./services/loggingService');
const libraryKnowledgeService = require('./services/libraryKnowledgeService');
const websocketService = require('./services/websocketService');
const { initializeAI } = require('./core/ai');
const disruptionRoutingAgent = require('./core/disruptionRoutingAgent');

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' },
});

app.io = io;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());
app.use(morgan('combined'));
app.use(correlationId());
app.use(contentNegotiation());
app.use(addStandardHeaders());
app.use(trackResponseTime());
app.use(requestId);
app.use(responseFormatter);
app.use(routeMonitoring);
app.use(securityHeaders);
app.use(rateLimit);

// Canonical operational ERP reconciliation surface. The dynamic loader also
// discovers this route, but this explicit mount keeps the contract stable even
// when directory discovery is running in degraded mode.
app.use('/api/v1/operational-modules', operationalModuleRoutes);

async function startup() {
  try {
    const startTime = Date.now();
    logger.info('🚀 EBDESIGN Platform Starting...');

    logger.info('📦 Connecting to database...');
    let db = null;
    try {
      const { initialize, getPostgreSQL } = require('./database/connection');
      await initialize();
      db = getPostgreSQL();
      if (!db) throw new Error('PostgreSQL is not connected');
      logger.info('✅ Database connected');
    } catch (error) {
      logger.warn('⚠️  Database connection deferred (will retry on first use)');
    }

    logger.info('🔍 Initializing service auto-discovery...');
    const serviceLoader = new DynamicServiceLoader(db);
    const servicesDir = path.join(__dirname, 'services');
    const discoveryStats = await serviceLoader.discoverServicesFromDirectory(servicesDir);
    logger.info('✅ Service discovery complete', discoveryStats);

    const serviceLocator = new ServiceLocator(serviceLoader);
    app.locals.serviceLocator = serviceLocator;

    logger.info('⚙️  Initializing configuration registry...');
    const configRegistry = new ConfigRegistry(db);
    try {
      await configRegistry.initialize();
      await configRegistry.loadAllConfigs();
      await configRegistry.loadAllFeatureFlags();
      configRegistry.startAutoSync();
      app.locals.configRegistry = configRegistry;
      logger.info('✅ Configuration registry initialized');
    } catch (error) {
      logger.warn('⚠️  Config registry initialization deferred (in-memory only)');
      app.locals.configRegistry = configRegistry;
    }

    try {
      await libraryKnowledgeService.initialize({ syncDatabase: Boolean(db) });
      app.locals.libraryKnowledgeService = libraryKnowledgeService;
      logger.info('✅ Library knowledge service initialized', libraryKnowledgeService.getStatistics());
    } catch (error) {
      logger.warn('⚠️  Library knowledge initialization deferred', { error: error.message });
      app.locals.libraryKnowledgeService = libraryKnowledgeService;
    }

    logger.info('⚡ Loading critical services...');
    const criticalServices = [
      'authService',
      'userService',
      'errorHandlerService',
      'monitoringService',
      'cacheService',
    ];

    try {
      await serviceLocator.preload(criticalServices);
      logger.info('✅ Critical services loaded');
    } catch (error) {
      logger.warn('⚠️  Some critical services failed to load (continuing with partial startup)');
    }

    const cacheService = require('./services/cacheService');
    const jobService = require('./services/jobService');
    const infrastructure = { cache: 'disabled', jobs: 'disabled' };
    try {
      await cacheService.init();
      infrastructure.cache = 'connected';
    } catch (error) {
      logger.warn('⚠️  Redis cache unavailable; continuing in degraded mode');
    }
    try {
      await jobService.init();
      infrastructure.jobs = 'connected';
    } catch (error) {
      logger.warn('⚠️  Background jobs unavailable; continuing in degraded mode');
    }
    app.locals.infrastructure = infrastructure;

    logger.info('🛣️  Initializing route auto-discovery...');
    const routeLoader = new DynamicRouteLoader(app);
    const routesDir = path.join(__dirname, 'routes');
    const routeStats = await routeLoader.discoverAndMountRoutes(routesDir, '/api/v1');
    await routeLoader.discoverServiceEmbeddedRoutes(servicesDir, '/api/v1');
    const serviceRouteStats = await serviceLoader.mountServiceRoutes(app);
    logger.info('✅ Routes mounted', { ...routeStats, serviceSetupRoutes: serviceRouteStats.mounted });

    app.locals.serviceLoader = serviceLoader;
    app.locals.routeLoader = routeLoader;
    app.locals.db = db;
    app.locals.mfaMiddleware = mfaMiddleware;
    app.locals.loggingService = loggingService;

    try {
      websocketService.attach(io);
      app.locals.websocketService = websocketService;
      logger.info('✅ WebSocket service attached');
    } catch (error) {
      logger.warn('⚠️  WebSocket service attach skipped', { error: error.message });
    }

    try {
      await initializeAI();
      logger.info('✅ AI intelligence fabric initialized');
    } catch (error) {
      logger.warn('⚠️  AI fabric initialization deferred', { error: error.message });
    }

    try {
      if (typeof disruptionRoutingAgent.initialize === 'function') {
        disruptionRoutingAgent.initialize();
      }
    } catch (error) {
      logger.warn('⚠️  Disruption routing agent initialization deferred', { error: error.message });
    }

    app.use(errorHandler);

    logger.info('✅ Startup completed', { elapsedMs: Date.now() - startTime });
    return { app, server, io };
  } catch (error) {
    logger.error('Startup failed', error);
    throw error;
  }
}

if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  startup().then(() => {
    server.listen(port, () => logger.info(`🚀 Backend listening on ${port}`));
  }).catch(error => {
    logger.error('Fatal startup error', error);
    process.exitCode = 1;
  });
}

module.exports = { app, server, io, startup };
