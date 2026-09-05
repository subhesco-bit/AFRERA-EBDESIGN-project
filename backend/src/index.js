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
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes.js');
const realtimeMonitoringRoutes = require('./routes/realtimeMonitoringRoutes.js');
const qualityAssurance = require('./routes/qualityAssurance.js');
const projectSystemsRoutes = require('./routes/projectSystemsRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const productReviewRoutes = require('./routes/productReviewRoutes.js');
const productMediaAIRoutes = require('./routes/productMediaAIRoutes.js');
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
const mfaMiddleware = require('./middleware/dual-use/mfaMiddleware');
const loggingService = require('./services/loggingService');
const websocketService = require('./services/websocketService');
const { initializeAI } = require('./core/ai');
const disruptionRoutingAgent = require('./core/disruptionRoutingAgent');

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*' }
});

// Store on app for access in route handlers
app.io = io;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());

// Logging middleware
app.use(morgan('combined'));
app.use(requestId);
app.use(responseFormatter);
app.use(routeMonitoring);

// Security enhancements
app.use(securityHeaders);
app.use(rateLimit);

// ============================================================================
// STARTUP SEQUENCE
// ============================================================================

async function startup() {
  try {
    const startTime = Date.now();

    logger.info('🚀 EBDESIGN Platform Starting...');

    // Step 1: Initialize database connection (required for ConfigRegistry)
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

    // Step 2: Initialize service loader
    logger.info('🔍 Initializing service auto-discovery...');
    const serviceLoader = new DynamicServiceLoader(db);
    const servicesDir = path.join(__dirname, 'services');

    const discoveryStats = await serviceLoader.discoverServicesFromDirectory(servicesDir);
    logger.info(`✅ Service discovery complete`, discoveryStats);

    // Step 3: Create service locator
    const serviceLocator = new ServiceLocator(serviceLoader);
    app.locals.serviceLocator = serviceLocator;

    // Step 4: Initialize configuration registry
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

    // Step 5: Load critical services (fast boot)
    logger.info('⚡ Loading critical services...');
    const criticalServices = [
      'AuthService',
      'UserService',
      'ErrorHandlerService',
      'MonitoringService',
      'CacheService'
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

    // Step 6: Initialize route loader
    logger.info('🛣️  Initializing route auto-discovery...');
    const routeLoader = new DynamicRouteLoader(app);
    const routesDir = path.join(__dirname, 'routes');

    const routeStats = await routeLoader.discoverAndMountRoutes(
      routesDir,
      '/api/v1'
    );
    await routeLoader.discoverServiceEmbeddedRoutes(servicesDir, '/api/v1');
    const serviceRouteStats = await serviceLoader.mountServiceRoutes(app);
    logger.info(`✅ Routes mounted`, { ...routeStats, serviceSetupRoutes: serviceRouteStats.mounted });

    // Step 7: Make loaders available to middleware/handlers
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
      app.locals.disruptionRoutingAgent = disruptionRoutingAgent;
      logger.info('✅ Disruption routing agent initialized');
    } catch (error) {
      logger.warn('⚠️  Disruption routing agent deferred', { error: error.message });
    }

    // Step 8: Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const health = {
          status: db && infrastructure.cache === 'connected' && infrastructure.jobs === 'connected'
            ? 'operational'
            : 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          services: {
            discovered: serviceLoader.discoveredCount,
            loaded: serviceLoader.loadedCount,
            failed: serviceLoader.failedCount
          },
          routes: {
            discovered: routeLoader.discoveredCount,
            mounted: routeLoader.mountedCount,
            failed: routeLoader.failedCount
          },
          infrastructure,
          config: configRegistry.getStats(),
          performance: {
            serviceLocatorStats: serviceLocator.getStats(),
            memory: process.memoryUsage()
          }
        };

        // Check if critical services are healthy
        if (db) {
          try {
            await db.query('SELECT 1');
            health.database = 'connected';
          } catch (error) {
            health.database = 'disconnected';
          }
        }

        res.json(health);
      } catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({ status: 'unhealthy', error: error.message });
      }
    });

    // Step 9: Status/stats endpoint
    app.get('/api/v1/system/stats', async (req, res) => {
      try {
        res.json({
          services: serviceLoader.getStats(),
          routes: routeLoader.getStats(),
          config: configRegistry.getStats(),
          locator: serviceLocator.getStats(),
          memory: process.memoryUsage(),
          uptime: process.uptime()
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Step 10: Service discovery API (for debugging)
    app.get('/api/v1/system/services', async (req, res) => {
      try {
        const { limit = 50, offset = 0, category, subfolder } = req.query;
        const result = serviceLoader.listServices({
          limit: parseInt(limit),
          offset: parseInt(offset),
          category,
          subfolder
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Step 11: Route discovery API (for debugging)
    app.get('/api/v1/system/routes', async (req, res) => {
      try {
        let result = routeLoader.getMountedRoutes();
        res.json({
          total: result.length,
          routes: result.slice(0, 100)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Step 12: Global error handler (must be last)
    app.use(errorHandler);

    // Step 13: WebSocket handlers are registered by websocketService.attach(io)

    // Step 14: Mount orphaned services with setupRoutes()
    logger.info('🔌 Mounting previously-orphaned services with setupRoutes()...');
    if (app.locals.serviceLoader) {
      try {
        const orphanedMountStats = await app.locals.serviceLoader.mountServiceRoutes(app);
        logger.info(`✅ Orphaned services mount completed`, orphanedMountStats);
      } catch (error) {
        logger.warn('⚠️  Orphaned services mount encountered issues', { error: error.message });
      }
    }

    // Step 15: Mount health check routes
    logger.info('🏥 Mounting health check routes...');
    const healthRoutes = require('./routes/healthRoutes');
    app.use('/api/yieldmanagement', yieldManagement);
app.use('/api/wikipedia', wikipediaRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/weatheradvisory', weatherAdvisory);
app.use('/api/wearableintegration', wearableIntegrationRoutes);
app.use('/api/watermanagement', waterManagementRoutes);
app.use('/api/warehousemanagement', warehouseManagement);
app.use('/api/wallet', walletRoutes);
app.use('/api/vr', vr);
app.use('/api/vision', visionRoutes);
app.use('/api/videoanalytics', videoAnalytics);
app.use('/api/vendor', vendorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/unifiedai', unifiedAIRoutes);
app.use('/api/unifiedaigateway', unifiedAIGateway);
app.use('/api/transaction', transactionRoutes);
app.use('/api/trackdart', trackDartRoutes);
app.use('/api/tenantmanagement', tenantManagementRoutes);
app.use('/api/systemadministration', systemAdministrationRoutes);
app.use('/api/supplychaintracking', supplyChainTracking);
app.use('/api/supplychainanalytics', supplyChainAnalytics);
app.use('/api/subscriptions', subscriptions);
app.use('/api/soilmanagement', soilManagementRoutes);
app.use('/api/soilhealth', soilHealth);
app.use('/api/sheep', sheepRoutes);
app.use('/api/sellerverifications', sellerVerifications);
app.use('/api/sellerranking', sellerRankingRoutes);
app.use('/api/seedvault', seedVaultRoutes);
app.use('/api/sapmodulearchitecture', sapModuleArchitectureRoutes);
app.use('/api/rolemanagement', roleManagementRoutes);
app.use('/api/riskpricing', riskPricingRoutes);
app.use('/api/riskassessment', riskAssessment);
app.use('/api/rfq', rfqRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/returnloadboard', returnLoadBoardRoutes);
app.use('/api/researchanddevelopment', researchAndDevelopmentRoutes);
app.use('/api/regionalvariety', regionalVarietyRoutes);
app.use('/api/recoveredfinance', recoveredFinanceRoutes);
app.use('/api/realtimemonitoring', realtimeMonitoringRoutes);
app.use('/api/qualityassurance', qualityAssurance);
app.use('/api/projectsystems', projectSystemsRoutes);
app.use('/api/product', productRoutes);
app.use('/api/productreview', productReviewRoutes);
app.use('/api/productmediaai', productMediaAIRoutes);
app.use('/api/productcertifications', productCertifications);
app.use('/api/priceforecasting', priceForecasting);
app.use('/api/preventivemaintenance', preventiveMaintenanceRoutes);
app.use('/api/predictiveintelligence', predictiveIntelligenceRoutes);
app.use('/api/predictiveanalytics', predictiveAnalytics);
app.use('/api/poultry', poultryRoutes);
app.use('/api/platformtelemetry', platformTelemetryRoutes);
app.use('/api/platformcore', platformCoreRoutes);
app.use('/api/platformconfiguration', platformConfigurationRoutes);
app.use('/api/pig', pigRoutes);
app.use('/api/phase9', phase9);
app.use('/api/phase8', phase8);
app.use('/api/phase12', phase12);
app.use('/api/phase11', phase11);
app.use('/api/phase10', phase10);
app.use('/api/payment', paymentRoutes);
app.use('/api/paymentgateway', paymentGatewayRoutes);
app.use('/api/orphaned_services_mount', ORPHANED_SERVICES_MOUNT);
app.use('/api/organizationmanagement', organizationManagementRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/operationsroutesupport', operationsRouteSupport);
app.use('/api/operationsmanagement', operationsManagementRoutes);
app.use('/api/nutritionintelligence', nutritionIntelligenceRoutes);
app.use('/api/nutrientvaluesales', nutrientValueSalesRoutes);
app.use('/api/nlp', nlp);
app.use('/api/nervoussystem', nervousSystemRoutes);
app.use('/api/mloptimization', mlOptimization);
app.use('/api/marketplaceenhancements', marketplaceEnhancements);
app.use('/api/marketdata', marketDataRoutes);
app.use('/api/marketanalytics', marketAnalytics);
app.use('/api/m400aibackbone', m400AiBackboneRoutes);
app.use('/api/logisticsenhancements', logisticsEnhancements);
app.use('/api/logisticsenhancement', logisticsEnhancementRoutes);
app.use('/api/loanmanagement', loanManagement);
app.use('/api/livestockroutesupport', livestockRouteSupport);
app.use('/api/livestockmanagement', livestockManagementRoutes);
app.use('/api/livestock', livestock);
app.use('/api/library', libraryRoutes);
app.use('/api/landrecords', landRecordsRoutes);
app.use('/api/landmanagement', landManagementRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/irrigationmanagement', irrigationManagementRoutes);
app.use('/api/iotsensors', iotSensors);
app.use('/api/iotintegration', iotIntegrationRoutes);
app.use('/api/insuranceenhancements', insuranceEnhancements);
app.use('/api/inputsupplymanagement', inputSupplyManagementRoutes);
app.use('/api/informationsharing', informationSharingRoutes);
app.use('/api/identitymanagement', identityManagementRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/horticulturemanagement', horticultureManagementRoutes);
app.use('/api/horticulture', horticulture);
app.use('/api/gst', gstRoutes);
app.use('/api/greenhouse', greenhouse);
app.use('/api/governancemodule', governanceModule);
app.use('/api/goat', goatRoutes);
app.use('/api/glutwarning', glutWarningRoutes);
app.use('/api/geofencing', geofencingRoutes);
app.use('/api/freightpooling', freightPoolingRoutes);
app.use('/api/freightpooling', freightPooling);
app.use('/api/food', foodRoutes);
app.use('/api/folu', foluRoutes);
app.use('/api/folubenchmark', foluBenchmarkRoutes);
app.use('/api/fisheriesmanagement', fisheriesManagementRoutes);
app.use('/api/financialanalytics', financialAnalytics);
app.use('/api/fertilizer', fertilizerRoutes);
app.use('/api/farmervalue', farmerValueRoutes);
app.use('/api/farmertraining', farmerTrainingRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/farmerportalenhancements', farmerPortalEnhancements);
app.use('/api/farmerhealth', farmerHealthRoutes);
app.use('/api/farmerfamily', farmerFamilyRoutes);
app.use('/api/farmcosting', farmCosting);
app.use('/api/farmanalytics', farmAnalytics);
app.use('/api/experience', experienceRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/equipmentexchange', equipmentExchangeRoutes);
app.use('/api/enterpriseroutesupport', enterpriseRouteSupport);
app.use('/api/enterpriseintegration', enterpriseIntegrationRoutes);
app.use('/api/enterpriseai', enterpriseAIRoutes);
app.use('/api/engineeringproject', engineeringProjectRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/ecommerce', ecommerceRoutes);
app.use('/api/ecommercemarketing', ecommerceMarketingRoutes);
app.use('/api/ecommerceintegration', ecommerceIntegrationRoutes);
app.use('/api/ecommerceerp', ecommerceERPRoutes);
app.use('/api/ecommercebusinesssales', ecommerceBusinessSalesRoutes);
app.use('/api/ecommerceai', ecommerceAIRoutes);
app.use('/api/dprgeneration', dprGenerationRoutes);
app.use('/api/digitaltwin', digitalTwinRoutes);
app.use('/api/diettherapy', dietTherapyRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/defensefitnessprep', defenseFitnessPrepRoutes);
app.use('/api/decisionsupport', decisionSupportRoutes);
app.use('/api/datavisualization', dataVisualization);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dairy', dairyRoutes);
app.use('/api/cropvalueresearch', cropValueResearchRoutes);
app.use('/api/croprecommendations', cropRecommendations);
app.use('/api/cropplanning', cropPlanningRoutes);
app.use('/api/cropmanagement', cropManagementRoutes);
app.use('/api/cost', costRoutes);
app.use('/api/costcontrol', costControlRoutes);
app.use('/api/cooperativeshare', cooperativeShareRoutes);
app.use('/api/comprehensiveerp', comprehensiveERPRoutes);
app.use('/api/compliancetracking', complianceTracking);
app.use('/api/compliance', complianceRoutes);
app.use('/api/completeerpintegration', completeERPIntegrationRoutes);
app.use('/api/completeaiintegration', completeAIIntegrationRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/communitymanagement', communityManagementRoutes);
app.use('/api/coldstorage', coldStorageRoutes);
app.use('/api/coldchainmonitoring', coldChainMonitoring);
app.use('/api/climateroutesupport', climateRouteSupport);
app.use('/api/climatemonitoring', climateMonitoringRoutes);
app.use('/api/climateadvisory', climateAdvisoryRoutes);
app.use('/api/climateadvisory', climateAdvisory);
app.use('/api/civildisruption', civilDisruptionRoutes);
app.use('/api/certificationmanagement', certificationManagement);
app.use('/api/buyertrust', buyerTrust);
app.use('/api/bulkorders', bulkOrders);
app.use('/api/bulkorder', bulkOrderRoutes);
app.use('/api/blockchainverification', blockchainVerificationRoutes);
app.use('/api/blockchaintrace', blockchainTrace);
app.use('/api/biometric', biometric);
app.use('/api/automation', automation);
app.use('/api/auth', authRoutes);
app.use('/api/audittrail', auditTrail);
app.use('/api/audit', auditRoutes);
app.use('/api/assetaccounting', assetAccountingRoutes);
app.use('/api/ar', ar);
app.use('/api/apicompatibility', apiCompatibilityRoutes);
app.use('/api/animalhealth', animalHealthRoutes);
app.use('/api/analyticsreport', analyticsReportRoutes);
app.use('/api/aiselfhealing', aiSelfHealingRoutes);
app.use('/api/aioperationintelligence', aiOperationIntelligenceRoutes);
app.use('/api/aigateway', aiGatewayRoutes);
app.use('/api/aicollaboration', aiCollaborationRoutes);
app.use('/api/aibrain', aiBrainRoutes);
app.use('/api/aibackbone', aiBackboneRoutes);
app.use('/api/aiapproval', aiApprovalRoutes);
app.use('/api/aiagent', aiAgentRoutes);
app.use('/api/agriculturalintelligence', agriculturalIntelligenceRoutes);
app.use('/api/advancedsearch', advancedSearchRoutes);
app.use('/api/advancedfeatures', advancedFeatures);
app.use('/api/advancedanalytics', advancedAnalyticsRoutes);

app.use('/api/index', index);

app.use('/health', healthRoutes);
    logger.info('✅ Health check routes mounted at /health');

    // ========================================================================
    // START SERVER
    // ========================================================================

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      const elapsed = Date.now() - startTime;

      logger.info(`
        ╔══════════════════════════════════════════╗
        ║     EBDESIGN Platform Running 🌱        ║
        ║                                          ║
        ║  Server:     http://localhost:${PORT}      ║
        ║  Services:   ${serviceLoader.discoveredCount} discovered, ${serviceLoader.loadedCount} loaded    ║
        ║  Routes:     ${routeLoader.mountedCount} mounted              ║
        ║  Startup:    ${elapsed}ms                 ║
        ║                                          ║
        ║  🔗 Health:  /health                     ║
        ║  📊 Stats:   /api/v1/system/stats        ║
        ║  🔍 Services: /api/v1/system/services    ║
        ║  🛣️  Routes:  /api/v1/system/routes      ║
        ╚══════════════════════════════════════════╝
      `);

      // Emit startup event
      if (global.eventBus) {
        global.eventBus.emit('platform:started', {
          services: serviceLoader.discoveredCount,
          routes: routeLoader.mountedCount,
          startup: elapsed
        });
      }
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN
    // ========================================================================

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');

      server.close(async () => {
        logger.info('HTTP server closed');

        if (db) {
          try {
            await db.end();
            logger.info('Database connection closed');
          } catch (error) {
            logger.error('Error closing database', error);
          }
        }

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 30 second timeout');
        process.exit(1);
      }, 30000);
    });

    return { app, server, serviceLocator, configRegistry };
  } catch (error) {
    logger.error('Failed to start platform', error);
    process.exit(1);
  }
}

// ============================================================================
// START PLATFORM
// ============================================================================

if (require.main === module) {
  startup().catch(error => {
    logger.error('Fatal startup error', error);
    process.exit(1);
  });
}

module.exports = { app, startup };
