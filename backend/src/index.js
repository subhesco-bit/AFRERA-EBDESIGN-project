// Load environment variables FIRST, before any other requires
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// 2026-09-15: never mounted anywhere, and had the same silent
// route-registration bug as seedVaultRoutes_merged.js/etc (a lone CR
// where handle()'s closing brace should have been - see that file's own
// header comment) - fixed, and mounted for the first time.
const labourRoutes = require('./routes/labourRoutes.js');

// 2026-09-15: real, 566-line, 23-route server provisioning/monitoring/
// scaling/backup implementation, never mounted anywhere (the only other
// file with this name, routes/platform/serverManagementRoutes.js, is a
// 39-line generic CRUD placeholder, also unmounted). Had no auth middleware
// at all - added authMiddleware + adminMiddleware inside the file itself,
// matching every other admin-infrastructure route in this codebase, before
// mounting it (see that file's own header comment for the full reasoning).
const serverManagementRoutes = require('./routes/serverManagementRoutes_merged.js');

// routes/index.js is a module exporter, not a router (see the "don't mount
// it" comment near the old `app.use('/api/index', index)` line below) - the
// `index` binding here is unused, just still-present dead code.
const index = require('./routes/index.js');
const devinRoutes = require('./routes/devinRoutes');
const yieldManagement = require('./routes/yieldManagement.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. wikipediaRoutes_merged.js
// is a real Wikipedia lookup/summary implementation with its own router.
const wikipediaRoutes = require('./routes/wikipediaRoutes_merged.js');
// 2026-09-16: was require('./routes/weatherRoutes.js'), a 38-line
// 'Route operational' scaffold. weatherRoutes_merged.js is the real
// implementation over services/legacy/weatherService.js (real
// Postgres-backed observations/forecasts/alerts) - it existed all along
// but couldn't be require()'d: it depends on 9 request-validation
// helpers from climateRouteSupport.js that never existed until now
// (that file was itself a 12-line placeholder). Both fixed together;
// swapped to the real router at the same /api/weather mount.
const weatherRoutes = require('./routes/weatherRoutes_merged.js');
const weatherAdvisory = require('./routes/weatherAdvisory.js');
const wearableIntegrationRoutes = require('./routes/wearableIntegrationRoutes.js');
const waterManagementRoutes = require('./routes/waterManagementRoutes.js');
const warehouseManagement = require('./routes/warehouseManagement.js');
const walletRoutes = require('./routes/walletRoutes.js');
const vr = require('./routes/vr.js');
const visionRoutes = require('./routes/visionRoutes_merged.js');
const videoAnalytics = require('./routes/videoAnalytics.js');
const vendorRoutes = require('./routes/vendorRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const unifiedAIRoutes = require('./routes/unifiedAIRoutes_merged.js');
const unifiedAIGateway = require('./routes/unifiedAIGateway.js');
const transactionRoutes = require('./routes/transactionRoutes.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. trackDartRoutes_merged.js
// is a real multi-key shipment-tracking implementation that used to throw a
// missing-brace bug (see that file's own header comment) - now fixed.
const trackDartRoutes = require('./routes/trackDartRoutes_merged.js');
const tenantManagementRoutes = require('./routes/tenantManagementRoutes.js');
const systemAdministrationRoutes = require('./routes/systemAdministrationRoutes.js');
const supplyChainTracking = require('./routes/supplyChainTracking.js');
const supplyChainAnalytics = require('./routes/supplyChainAnalytics.js');
const supplyChainDecisionRoutes = require('./routes/supplyChainDecisionRoutes.js');
const subscriptions = require('./routes/subscriptions.js');
const soilManagementRoutes = require('./routes/soilManagementRoutes.js');
const soilHealth = require('./routes/soilHealth.js');
// 2026-09-15: was a 38-line scaffold. sheepRoutes_merged.js is the real,
// Postgres-backed herd/milk/feed/breeding/vaccination implementation - it
// used to throw "protectLivestockRouter is not a function" at load time
// (see the file itself for the full writeup), now fixed the same way
// goatRoutes.js/animalHealthRoutes.js already fixed the identical bug.
const sheepRoutes = require('./routes/sheepRoutes_merged.js');
const sellerVerifications = require('./routes/sellerVerifications.js');
const sellerRankingRoutes = require('./routes/sellerRankingRoutes.js');
const seedVaultRoutes = require('./routes/seedVaultRoutes_merged.js');
const sapModuleArchitectureRoutes = require('./routes/sapModuleArchitectureRoutes.js');
const roleManagementRoutes = require('./routes/roleManagementRoutes.js');
const riskPricingRoutes = require('./routes/riskPricingRoutes_merged.js');
const riskAssessment = require('./routes/riskAssessment.js');
// 2026-09-15: was a 38-line scaffold. rfqRoutes_merged.js is the real
// RFQ/quote/QC-hold/FPO-cost-centre implementation - same
// protectRouter()-is-not-a-function bug as sheepRoutes_merged.js, now fixed.
const rfqRoutes = require('./routes/rfqRoutes_merged.js');
const revenueRoutes = require('./routes/revenueRoutes.js');
const returnLoadBoardRoutes = require('./routes/returnLoadBoardRoutes.js');
const researchAndDevelopmentRoutes = require('./routes/researchAndDevelopmentRoutes.js');
const regionalVarietyRoutes = require('./routes/regionalVarietyRoutes_merged.js');
const neVarietiesRoutes = require('./routes/neVarietiesRoutes.js');
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes_merged.js');
const realtimeMonitoringRoutes = require('./routes/realtimeMonitoringRoutes.js');
const qualityAssurance = require('./routes/qualityAssurance.js');
const projectSystemsRoutes = require('./routes/projectSystemsRoutes_merged.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. services/legacy/productService.js
// is a real, Postgres-backed product CRUD + search implementation with its own router.
const { router: productRoutes } = require('./services/legacy/productService.js');
const productReviewRoutes = require('./routes/productReviewRoutes.js');
const productMediaAIRoutes = require('./routes/productMediaAIRoutes.js');
const publicDataRoutes = require('./routes/publicDataRoutes.js');
const productCertifications = require('./routes/productCertifications.js');
const priceForecasting = require('./routes/priceForecasting.js');
const preventiveMaintenanceRoutes = require('./routes/preventiveMaintenanceRoutes.js');
const predictiveIntelligenceRoutes = require('./routes/predictiveIntelligenceRoutes.js');
// 2026-09-15: was an explicit 'Placeholder route module' (health check only).
// services/legacy/predictiveAnalyticsService.js is a real predictive-models/
// forecasts/alerts implementation with its own router.
const { router: predictiveAnalytics } = require('./services/legacy/predictiveAnalyticsService.js');
// 2026-09-15: was a 38-line scaffold. poultryRoutes_merged.js is the real
// implementation - same protectLivestockRouter()-is-not-a-function bug as
// sheepRoutes_merged.js, now fixed.
const poultryRoutes = require('./routes/poultryRoutes_merged.js');
const platformTelemetryRoutes = require('./routes/platformTelemetryRoutes.js');
const platformCoreRoutes = require('./routes/platformCoreRoutes_merged.js');
const platformConfigurationRoutes = require('./routes/platformConfigurationRoutes.js');
// 2026-09-15: was a 38-line scaffold. pigRoutes_merged.js is the real
// implementation - same protectLivestockRouter()-is-not-a-function bug as
// sheepRoutes_merged.js, now fixed.
const pigRoutes = require('./routes/pigRoutes_merged.js');
const phase9 = require('./routes/phase9.js');
const phase8 = require('./routes/phase8.js');
const phase12 = require('./routes/phase12.js');
const phase11 = require('./routes/phase11.js');
const phase10 = require('./routes/phase10.js');
const paymentRoutes = require('./routes/paymentRoutes.js');
const paymentGatewayRoutes = require('./routes/paymentGatewayRoutes.js');
const ORPHANED_SERVICES_MOUNT = require('./routes/ORPHANED_SERVICES_MOUNT.js');
// 2026-09-16: was a 38-line 'Route operational' scaffold (POST / + GET
// /health only). routes/platform/organizationManagementRoutes_merged.js
// is a real in-memory CRUD implementation (GET/:id, POST, PUT/:id,
// DELETE/:id) matching organizationManagementAPI's real needs
// (getAllOrganizations/createOrganization/deleteOrganization) - was
// never require()'d anywhere until now.
const organizationManagementRoutes = require('./routes/platform/organizationManagementRoutes_merged.js');
// 2026-09-15: was require('./routes/orderRoutes.js'), a 38-line scaffold
// whose POST / just returned {message: 'Route operational'} with no real
// order ever created. services/legacy/orderService.js is a real,
// Postgres-backed cart/order/payment implementation (real stock checks,
// real per-item GST via gstService) with its own router that was never
// wired to a live mount - swapped to use the real one.
const { router: orderRoutes } = require('./services/legacy/orderService.js');
const operationsRouteSupport = require('./routes/operationsRouteSupport.js');
const operationsManagementRoutes = require('./routes/operationsManagementRoutes.js');
const nutritionIntelligenceRoutes = require('./routes/nutritionIntelligenceRoutes.js');
const nutrientValueSalesRoutes = require('./routes/nutrientValueSalesRoutes_merged.js');
const nlp = require('./routes/nlp.js');
const nervousSystemRoutes = require('./routes/nervousSystemRoutes_merged.js');
const mlOptimization = require('./routes/mlOptimization.js');
// 2026-09-15: was never mounted anywhere. services/legacy/multilingualService.js
// is a real, 821-line, Postgres-backed service (language detection,
// translation, content translations, user language preferences,
// pronunciation guides) with its own router that nothing ever wired in -
// found investigating why MultilingualProvider.jsx's calls all failed.
const { router: multilingualRoutes } = require('./services/legacy/multilingualService.js');
// 2026-09-15: batch-mounted 38 real, previously-unmounted services/legacy/*.js
// implementations discovered via a systematic sweep (each confirmed to load
// cleanly and export a real router before being added here) - see
// .ai/tasks/2026-09-15-nextgen-vision-todo.md for the full investigation.
const { router: advancedAIRoutesNewlyMounted } = require('./services/legacy/advancedAIService.js');
const { router: aiCopilotRoutesNewlyMounted } = require('./services/legacy/aiCopilotService.js');
const { router: arVrRoutesNewlyMounted } = require('./services/legacy/arVrService.js');
const { router: biodiversityRoutesNewlyMounted } = require('./services/legacy/biodiversityService.js');
const { router: blockchainTraceabilityRoutesNewlyMounted } = require('./services/legacy/blockchainTraceabilityService.js');
const { router: catalogIntelligenceRoutesNewlyMounted } = require('./services/legacy/catalogIntelligenceService.js');
const { router: commerceRulesRoutesNewlyMounted } = require('./services/legacy/commerceRulesService.js');
const { router: consumerHealthRoutesNewlyMounted } = require('./services/legacy/consumerHealthService.js');
const { router: conversationalAIRoutesNewlyMounted } = require('./services/legacy/conversationalAIService.js');
// Three more real, unmounted, non-duplicate services found at services/
// root level (not services/legacy/) via the same sweep - none exist under
// legacy/ under any name, so these are genuinely unique, not the
// root/legacy duplication pattern seen elsewhere (e.g. productService.js
// at both levels, where the root copy is a stale duplicate - NOT mounted).
// advancedMedicalCodingService.js has a confirmed real frontend consumer:
// pages/AdvancedMedicalCodingPage.jsx calls api.get('/advanced-medical-coding/...')
// against the /api/v1-based `api` instance.
const { router: advancedMedicalCodingRoutesNewlyMounted } = require('./services/advancedMedicalCodingService.js');
const { router: advancedVoiceAIRoutesNewlyMounted } = require('./services/advancedVoiceAI.js');
const { router: clinicalNutritionRoutesNewlyMounted } = require('./services/clinicalNutritionDecisionSupportService.js');
// custodyEventRoutes.js deliberately NOT added here: unlike the other 40
// services below, its filename matches /Routes\.js$/i, so it's already
// auto-discovered and mounted at runtime by index.js's own
// discoverServiceEmbeddedRoutes() (core/dynamicRouteLoader.js) - adding
// it again here would just create a second, redundant mount.
const { router: digitalProductPassportRoutesNewlyMounted } = require('./services/legacy/digitalProductPassportService.js');
const { router: enterpriseControlRoutesNewlyMounted } = require('./services/legacy/enterpriseControlService.js');
const { router: enterpriseMemoryRoutesNewlyMounted } = require('./services/legacy/enterpriseMemoryService.js');
const { router: erpRoutesNewlyMounted } = require('./services/legacy/erpService.js');
const { router: financialRoutesNewlyMounted } = require('./services/legacy/financialService.js');
const { router: foodIntelligenceRoutesNewlyMounted } = require('./services/legacy/foodIntelligenceService.js');
const { router: foodSafetyRoutesNewlyMounted } = require('./services/legacy/foodSafetyService.js');
const { router: formRoutesNewlyMounted } = require('./services/legacy/formService.js');
const { router: giIntelligenceRoutesNewlyMounted } = require('./services/legacy/giIntelligenceService.js');
const { router: indigenousKnowledgeRoutesNewlyMounted } = require('./services/legacy/indigenousKnowledgeService.js');
const { router: institutionalProcurementRoutesNewlyMounted } = require('./services/legacy/institutionalProcurementService.js');
const { router: insuranceRoutesNewlyMounted } = require('./services/legacy/insuranceService.js');
const { router: knowledgeGraphRoutesNewlyMounted } = require('./services/legacy/knowledgeGraphService.js');
const { router: laboratoryERPRoutesNewlyMounted } = require('./services/legacy/laboratoryERPService.js');
const { router: logisticsRoutesNewlyMounted } = require('./services/legacy/logisticsService.js');
const { router: merchandisingRoutesNewlyMounted } = require('./services/legacy/merchandisingService.js');
const { router: millCircuitRoutesNewlyMounted } = require('./services/legacy/millCircuitService.js');
const { router: moduleCatalogRoutesNewlyMounted } = require('./services/legacy/moduleCatalogService.js');
const { router: neProductIntelligenceRoutesNewlyMounted } = require('./services/legacy/neProductIntelligenceService.js');
const { router: offlinePaymentRoutesNewlyMounted } = require('./services/legacy/offlinePaymentService.js');
const { router: offlineSyncRoutesNewlyMounted } = require('./services/legacy/offlineSyncService.js');
const { router: omnichannelAIRoutesNewlyMounted } = require('./services/legacy/omnichannelAIService.js');
const { router: organicTraceabilityRoutesNewlyMounted } = require('./services/legacy/organicTraceabilityService.js');
const { router: recipeIntelligenceRoutesNewlyMounted } = require('./services/legacy/recipeIntelligenceService.js');
const { router: shelfLifeRoutesNewlyMounted } = require('./services/legacy/shelfLifeService.js');
const { router: smsAuthRoutesNewlyMounted } = require('./services/legacy/smsAuthService.js');
const { router: v42IntelligenceRoutesNewlyMounted } = require('./services/legacy/v42IntelligenceService.js');
const { router: valueCommerceRoutesNewlyMounted } = require('./services/legacy/valueCommerceService.js');
const { router: voiceAIRoutesNewlyMounted } = require('./services/legacy/voiceAIService.js');
const { router: whatsappRoutesNewlyMounted } = require('./services/legacy/whatsappService.js');
const marketplaceEnhancements = require('./routes/marketplaceEnhancements_merged.js');
const marketDataRoutes = require('./routes/marketDataRoutes.js');
const marketAnalytics = require('./routes/marketAnalytics.js');
const m400AiBackboneRoutes = require('./routes/m400AiBackboneRoutes.js');
const logisticsEnhancements = require('./routes/logisticsEnhancements_merged.js');
const logisticsEnhancementRoutes = require('./routes/logisticsEnhancementRoutes.js');
const loanManagement = require('./routes/loanManagement.js');
const livestockRouteSupport = require('./routes/livestockRouteSupport.js');
const livestockManagementRoutes = require('./routes/livestockManagementRoutes.js');
const livestock = require('./routes/livestock.js');
const libraryRoutes = require('./routes/libraryRoutes_merged.js');
const landRecordsRoutes = require('./routes/landRecordsRoutes.js');
const landManagementRoutes = require('./routes/landManagementRoutes.js');
const knowledgeRoutes = require('./routes/knowledgeRoutes.js');
const irrigationManagementRoutes = require('./routes/irrigationManagementRoutes.js');
const iotSensors = require('./routes/iotSensors.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. services/legacy/iotIntegrationService.js
// is a real device/sensor/alert implementation with its own router.
const { router: iotIntegrationRoutes } = require('./services/legacy/iotIntegrationService.js');
const insuranceEnhancements = require('./routes/insuranceEnhancements_merged.js');
const inputSupplyManagementRoutes = require('./routes/inputSupplyManagementRoutes.js');
const informationSharingRoutes = require('./routes/informationSharingRoutes.js');
const identityManagementRoutes = require('./routes/identityManagementRoutes.js');
const hrRoutes = require('./routes/hrRoutes.js');
const horticultureManagementRoutes = require('./routes/horticultureManagementRoutes.js');
const horticulture = require('./routes/horticulture.js');
const gstRoutes = require('./routes/gstRoutes.js');
const greenhouse = require('./routes/greenhouse.js');
// 2026-09-15: was a 20-line 'Placeholder route module' scaffold.
// platform/governanceModule_merged.js is a real 245-line, 24-route village/
// panchayat/CSR/compliance/cooperative implementation that used to throw
// "Route.post() requires a callback function but got a [object Undefined]"
// (an authRateLimit import that middleware/rateLimiter.js never exported -
// see that file's own header comment) - now fixed.
const governanceModule = require('./routes/platform/governanceModule_merged.js');
const goatRoutes = require('./routes/goatRoutes.js');
// 2026-09-16: new route file wrapping 3 createCrudService(...) objects in
// services/legacy/livestockManagementService.js that had real DB-backed
// CRUD logic but no Express router at all - see that file's own header
// comment.
const livestockRegistryRoutes = require('./routes/livestockRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/fisheriesManagementService.js
// had 9 real createCrudService(...) objects with no router at all.
const fisheriesRegistryRoutes = require('./routes/fisheriesRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/operationsManagementService.js
// had 8 real createCrudService(...) objects with no router at all.
const operationsRegistryRoutes = require('./routes/operationsRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/horticultureManagementService.js
// had 8 real createCrudService(...) objects with no router at all.
const horticultureRegistryRoutes = require('./routes/horticultureRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/inputSupplyManagementService.js
// had 8 real createCrudService(...) objects with no router at all.
const inputSupplyRegistryRoutes = require('./routes/inputSupplyRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/cropManagementService.js had
// 6 real createCrudService(...) objects with no router at all.
const cropRegistryRoutes = require('./routes/cropRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/landManagementService.js had
// 6 real createCrudService(...) objects with no router at all.
const landRegistryRoutes = require('./routes/landRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/soilManagementService.js had
// 3 real createCrudService(...) objects with no router at all.
const soilRegistryRoutes = require('./routes/soilRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/identityManagementService.js
// (a pre-existing file from before this whole session, "Phase 2
// Auto-Implementation", 2026-09-04) had 6 real resources with no router.
const identityRegistryRoutes = require('./routes/identityRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/climateMonitoringService.js
// had 5 real createCrudService(...) objects with no router at all.
const climateRegistryRoutes = require('./routes/climateRegistryRoutes.js');
// 2026-09-16: services/legacy/informationSharingService.js is a real,
// complete in-memory service (documents/folders/permissions/sharing-links/
// collaboration/AI-recommendations/activity-logs/analytics/health) that
// was never routed at all - neither routes/informationSharingRoutes.js
// (dead stub) nor routes/platform/informationSharingRoutes_merged.js
// (generic CRUD, doesn't match this page's real needs) connect to it.
const informationSharingRegistryRoutes = require('./routes/informationSharingRegistryRoutes.js');
// 2026-09-16: same pattern - services/legacy/waterManagementService.js
// had 5 real createCrudService(...) objects. Confirmed regression (not a
// fresh gap): waterManagementRoutes.js used to require() this service
// and was overwritten with a stub by a later batch-fix commit - see this
// file's own header comment.
const waterRecordsRegistryRoutes = require('./routes/waterRecordsRegistryRoutes.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. glutWarningRoutes_merged.js
// is a real glut-risk check/scan implementation with its own router.
const glutWarningRoutes = require('./routes/glutWarningRoutes_merged.js');
const geofencingRoutes = require('./routes/geofencingRoutes.js');
const freightPoolingRoutes = require('./routes/freightPoolingRoutes.js');
const freightPooling = require('./routes/freightPooling.js');
const foodRoutes = require('./routes/foodRoutes.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. foluRoutes_merged.js
// is a real FOLU land-use/carbon/scheme-status implementation (built on
// organicTraceabilityService.js) with its own router.
const foluRoutes = require('./routes/foluRoutes_merged.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. foluBenchmarkRoutes_merged.js
// is a real FOLU (forest/land-use) transitions/benchmark-report implementation
// with its own router.
const foluBenchmarkRoutes = require('./routes/foluBenchmarkRoutes_merged.js');
const fisheriesManagementRoutes = require('./routes/fisheriesManagementRoutes.js');
const financialAnalytics = require('./routes/financialAnalytics.js');
const fertilizerRoutes = require('./routes/fertilizerRoutes.js');
const farmerValueRoutes = require('./routes/farmerValueRoutes.js');
// 2026-09-15: was a 38-line 'Route operational' scaffold. farmerTrainingRoutes_merged.js
// is a real training-program/carbon-footprint/FOLU-compliance implementation
// with its own router (routes/agriculture/farmerTrainingRoutes.js is a third,
// separate generic-CRUD file with none of that - left alone, not this one).
const farmerTrainingRoutes = require('./routes/farmerTrainingRoutes_merged.js');
// 2026-09-15: was routes/farmerRoutes.js, a 38-line "Route operational"
// scaffold. routes/farmerRoutes_merged.js is a real, complete,
// already-debugged (own "FIXED 2026-08-15" comments) implementation of
// the exact same directory/profile/FDI/certification/FPO endpoints,
// calling the real services/legacy/farmerService.js - was sitting next
// to the scaffold, never mounted anywhere.
const farmerRoutes = require('./routes/farmerRoutes_merged.js');
const farmerPortalEnhancements = require('./routes/farmerPortalEnhancements_merged.js');
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
const ecommerceRoutes = require('./routes/ecommerceRoutes_merged.js');
const ecommerceMarketingRoutes = require('./routes/ecommerceMarketingRoutes_merged.js');
const ecommerceIntegrationRoutes = require('./routes/ecommerceIntegrationRoutes_merged.js');
const ecommerceERPRoutes = require('./routes/ecommerceERPRoutes_merged.js');
const ecommerceBusinessSalesRoutes = require('./routes/ecommerceBusinessSalesRoutes_merged.js');
const ecommerceAIRoutes = require('./routes/ecommerceAIRoutes_merged.js');
const dprGenerationRoutes = require('./routes/dprGenerationRoutes_merged.js');
const digitalTwinRoutes = require('./routes/digitalTwinRoutes.js');
const dietTherapyRoutes = require('./routes/dietTherapyRoutes.js');
const demandRoutes = require('./routes/demandRoutes.js');
const defenseFitnessPrepRoutes = require('./routes/defenseFitnessPrepRoutes.js');
// 2026-09-15: was a 38-line scaffold. decisionSupportRoutes_merged.js exposes
// 8 real pricing/logistics/finance/governance decision functions - same
// protectRouter()-is-not-a-function bug as rfqRoutes_merged.js, now fixed.
const decisionSupportRoutes = require('./routes/decisionSupportRoutes_merged.js');
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
const completeAIIntegrationRoutes = require('./routes/completeAIIntegrationRoutes_merged.js');
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
// routes/authRoutes.js is a mock (in-memory Map, plaintext password compare,
// fabricated `jwt_<id>_<timestamp>` tokens) left over from early scaffolding.
// It was mounted at /api/auth while middleware/auth.js verifies tokens via
// services/dual-use/authService.js's real jsonwebtoken-based verifyToken() -
// so a token minted by the live login endpoint would fail real verification
// on every subsequent protected request. authService.js already has a
// complete real implementation (bcrypt, real JWT, rate limiting, JSON-file
// fallback store when Postgres is unavailable, 2FA, OAuth) with its own
// router that was built but never mounted. Swapping the mount below to that
// real router is the fix, not a new implementation.
const { router: authRoutes } = require('./services/dual-use/authService.js');
const auditTrail = require('./routes/auditTrail.js');
const auditRoutes = require('./routes/auditRoutes.js');
const assetAccountingRoutes = require('./routes/assetAccountingRoutes.js');
const ar = require('./routes/ar.js');
const apiCompatibilityRoutes = require('./routes/apiCompatibilityRoutes.js');
const animalHealthRoutes = require('./routes/animalHealthRoutes.js');
const analyticsReportRoutes = require('./routes/analyticsReportRoutes.js');
const aiSelfHealingRoutes = require('./routes/aiSelfHealingRoutes_merged.js');
const aiOperationIntelligenceRoutes = require('./routes/aiOperationIntelligenceRoutes_merged.js');
const aiGatewayRoutes = require('./routes/aiGatewayRoutes.js');
const aiCollaborationRoutes = require('./routes/aiCollaborationRoutes.js');
const aiBrainRoutes = require('./routes/aiBrainRoutes_merged.js');
const aiBackboneRoutes = require('./routes/aiBackboneRoutes.js');
const aiApprovalRoutes = require('./routes/aiApprovalRoutes.js');
const aiAgentRoutes = require('./routes/aiAgentRoutes.js');
const agriculturalIntelligenceRoutes = require('./routes/agriculturalIntelligenceRoutes.js');
const advancedSearchRoutes = require('./routes/advancedSearchRoutes.js');
const advancedFeatures = require('./routes/advancedFeatures.js');
const advancedAnalyticsRoutes = require('./routes/advancedAnalyticsRoutes.js');
const apiWarningRoutes = require('./routes/apiWarningRoutes.js');
const aiModelsRoutes = require('./routes/aiModelsRoutes.js');
const aiTrainingEvaluationRoutes = require('./routes/aiTrainingEvaluationRoutes.js');
const infrastructureMonitoringRoutes = require('./routes/infrastructureMonitoringRoutes.js');
const gdprComplianceRoutes = require('./routes/gdprComplianceRoutes.js');
const productImageAutoGenerationRoutes = require('./routes/productImageAutoGenerationRoutes');
const aiImageGenerationEnhancedRoutes = require('./routes/aiImageGenerationEnhancedRoutes');
const ecommerceImageIntegrationRoutes = require('./routes/ecommerceImageIntegrationRoutes');
const farmerImagePortalRoutes = require('./routes/farmerImagePortalRoutes');
const integrationStatusRoutes = require('./routes/integrationStatusRoutes');
const endpointMismatchFixer = require('./routes/ENDPOINT_MISMATCH_FIXER');
const stripeWebhookRoutes = require('./routes/stripeWebhookRoutes');

/**
 * EBDESIGN Platform Backend - Main Entry Point
 * Auto-Discovery Architecture: Supports 200K+ services & routes
 *
 * Replaces manual imports with dynamic service/route discovery
 * Enables lazy loading, scales to enterprise requirements
 */

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
const { autoGenerateOnPageViewMiddleware, triggerAutoGenAfterCreateMiddleware } = require('./middleware/productImageAutoGenerationHooks');
const loggingService = require('./services/loggingService');
const productImageAutoGenerationService = require('./services/productImageAutoGenerationService');
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

// Store on app for access in route handlers
app.io = io;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  credentials: true,
}));

// Parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());

// Logging middleware
app.use(morgan('combined'));
app.use(correlationId());
app.use(contentNegotiation());
app.use(addStandardHeaders());
app.use(trackResponseTime());
app.use(requestId);
app.use(responseFormatter);
app.use(routeMonitoring);

// Security enhancements
app.use(securityHeaders);
app.use(rateLimit);

// Auto Image Generation Middleware
if (process.env.AUTO_IMAGE_GENERATION === 'true') {
  app.use(autoGenerateOnPageViewMiddleware);
  app.use(triggerAutoGenAfterCreateMiddleware);
  logger.info('🎨 Auto-generation middleware enabled');
}

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
    logger.info('✅ Service discovery complete', discoveryStats);

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

    // Index the project library before AI requests are accepted. The service
    // remains usable in memory when PostgreSQL is unavailable and reports sync
    // failures without blocking backend startup.
    try {
      await libraryKnowledgeService.initialize({ syncDatabase: Boolean(db) });
      app.locals.libraryKnowledgeService = libraryKnowledgeService;
      logger.info('✅ Library knowledge service initialized', libraryKnowledgeService.getStatistics());
    } catch (error) {
      logger.warn('⚠️  Library knowledge initialization deferred', { error: error.message });
      app.locals.libraryKnowledgeService = libraryKnowledgeService;
    }

    // Step 5: Load critical services (fast boot)
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

    // Step 6: Initialize route loader
    logger.info('🛣️  Initializing route auto-discovery...');
    const routeLoader = new DynamicRouteLoader(app);
    const routesDir = path.join(__dirname, 'routes');

    const routeStats = await routeLoader.discoverAndMountRoutes(
      routesDir,
      '/api/v1',
    );
    await routeLoader.discoverServiceEmbeddedRoutes(servicesDir, '/api/v1');
    const serviceRouteStats = await serviceLoader.mountServiceRoutes(app);
    logger.info('✅ Routes mounted', { ...routeStats, serviceSetupRoutes: serviceRouteStats.mounted });

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
        res.json({
          status: db && infrastructure.cache === 'connected' && infrastructure.jobs === 'connected' ?
            'operational' :
            'degraded',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({ status: 'unhealthy', error: error.message });
      }
    });

    // Step 9: Status/stats endpoint
    app.get('/api/v1/system/stats', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
      try {
        res.json({
          services: serviceLoader.getStats(),
          routes: routeLoader.getStats(),
          config: configRegistry.getStats(),
          locator: serviceLocator.getStats(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Step 10: Service discovery API (for debugging)
    app.get('/api/v1/system/services', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
      try {
        const { limit = 50, offset = 0, category, subfolder } = req.query;
        const result = serviceLoader.listServices({
          limit: parseInt(limit),
          offset: parseInt(offset),
          category,
          subfolder,
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Step 11: Route discovery API (for debugging)
    app.get('/api/v1/system/routes', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
      try {
        const result = routeLoader.getMountedRoutes();
        res.json({
          total: result.length,
          routes: result.slice(0, 100),
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // WebSocket handlers are registered by websocketService.attach(io)

    // Mount health check routes
    logger.info('🏥 Mounting health check routes...');
    const healthRoutes = require('./routes/healthRoutes');
    app.use('/api/yieldmanagement', yieldManagement);
    // 2026-09-15: never mounted anywhere. Unlike most services/legacy/*.js
    // files, this one doesn't export a plain router - it exports a
    // setupRoutes(app) function that mounts itself at the hardcoded path
    // /api/v1/market-intelligence, so it's called directly here rather
    // than via app.use() like the others.
    require('./services/legacy/marketIntelligenceService.js').setupRoutes(app);
    // 2026-09-15: same setupRoutes(app) pattern, also never mounted.
    // Also found and fixed a real route-shadowing bug in this file: GET
    // /villages/search was registered after GET /villages/:villageId, so
    // every search request was swallowed by the param route instead
    // (villageId literally "search") - see the file's own comment.
    require('./services/legacy/villageProfileService.js').setupRoutes(app);
    // 2026-09-16: duplicate-service-filename shadowing bug fix (documented
    // across this whole session, see .ai/tasks/AGENT_ASSIGNMENTS.md) - each
    // of these 5 legacy/*.js files has real endpoints
    // (advisories/statistics, subscriptions/statistics, systems/statistics,
    // enterprises/statistics, schemes/registry) that a DIFFERENT file
    // sharing the same base filename wins in core/dynamicServiceLoader.js's
    // Map, silently shadowing them. Rather than change the loader's global
    // keying behavior (a much larger, riskier change affecting all 313
    // discovered services), each of these mounts additively at its own
    // path/prefix - verified via each file's own app.use(...) call that
    // none collides with what the Map-winning file already serves (either
    // a distinct prefix entirely, e.g. /ai-advisories vs /ai-advisory, or
    // the same prefix with non-overlapping sub-paths, e.g.
    // /renewable-energy/systems/* vs the winner's bare GET/POST /).
    require('./services/legacy/aiAdvisoryService.js').setupRoutes(app);
    require('./services/legacy/procurementSubscriptionService.js').setupRoutes(app);
    require('./services/legacy/renewableEnergyService.js').setupRoutes(app);
    require('./services/legacy/ruralEnterpriseService.js').setupRoutes(app);
    require('./services/legacy/governmentSchemeService.js').setupRoutes(app);
    // 2026-09-16: same setupRoutes(app) pattern as the block above - real,
    // DB-backed escrow logic (create/release/refund/list, escrow_transactions
    // table confirmed migrated), never mounted. The only live consumer,
    // EscrowPage.jsx, was crashing (escrowAPI.list/.release/.refund didn't
    // exist on the frontend client) since nothing real was ever wired up to
    // it. Mounted at /api/v1/escrow - distinct from the pre-existing dead
    // /api/escrow scaffold mount below, no collision.
    require('./services/legacy/escrowService.js').setupRoutes(app);
    // 2026-09-16: same setupRoutes(app) pattern again - real, DB-backed
    // digital twin logic (create/update/ingest-sensor-data/simulate/get/
    // list, digital_twins table), never mounted. Mounted at
    // /api/v1/digital-twin - distinct from the pre-existing dead
    // /api/digitaltwin scaffold mount below, no collision. The frontend's
    // digitalTwinAPI already pointed at this exact path (added in an
    // earlier pass, correctly anticipating it, before this real backend
    // was found) - no frontend client changes needed, only DigitalTwinPage.jsx
    // itself now calls it. Deliberately NOT calling .initialize() here:
    // it starts two un-refed setInterval timers (5min/15min background
    // sync) with no cleanup path, which would leak and could hang tests/
    // short-lived processes; list()/get() read from an in-memory Map that
    // create() already keeps in sync directly, so basic create-then-list
    // works correctly within a running process even without the boot-time
    // DB preload - twins created before the current process started just
    // won't appear until a restart. Pre-existing limitation in this file,
    // not something this fix changes.
    require('./services/legacy/digitalTwinService.js').setupRoutes(app);
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
    app.use('/api/ai', unifiedAIRoutes);
    app.use('/api/v1/ai', unifiedAIRoutes);
    app.use('/api/ai/models', aiModelsRoutes);
    app.use('/api/ai/training', aiTrainingEvaluationRoutes);
    app.use('/api/v1/ai/models', aiModelsRoutes);
    app.use('/api/v1/ai/training', aiTrainingEvaluationRoutes);
    app.use('/api/monitoring', infrastructureMonitoringRoutes);
    app.use('/api/v1/monitoring', infrastructureMonitoringRoutes);
    app.use('/api/gdpr', gdprComplianceRoutes);
    app.use('/api/v1/gdpr', gdprComplianceRoutes);
    app.use('/api/unifiedaigateway', unifiedAIGateway);
    app.use('/api/transaction', transactionRoutes);
    app.use('/api/trackdart', trackDartRoutes);
    app.use('/api/tenantmanagement', tenantManagementRoutes);
    app.use('/api/systemadministration', systemAdministrationRoutes);
    app.use('/api/servermanagement', serverManagementRoutes);
    app.use('/api/supplychaintracking', supplyChainTracking);
    app.use('/api/supplychainanalytics', supplyChainAnalytics);
    app.use('/api/supply-chain', supplyChainDecisionRoutes);
    app.use('/api/v1/supply-chain', supplyChainDecisionRoutes);
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
    app.use('/api/v1/varieties', neVarietiesRoutes);
    app.use('/api/recoveredfinance', recoveredFinanceRoutes);
    app.use('/api/realtimemonitoring', realtimeMonitoringRoutes);
    app.use('/api/qualityassurance', qualityAssurance);
    app.use('/api/projectsystems', projectSystemsRoutes);
    app.use('/api/product', productRoutes);
    app.use('/api/productreview', productReviewRoutes);
    app.use('/api/productmediaai', productMediaAIRoutes);
    app.use('/api/publicdata', publicDataRoutes);
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
    app.use('/api/operationsroutesupport', operationsRouteSupport.router);
    app.use('/api/operationsmanagement', operationsManagementRoutes);
    app.use('/api/nutritionintelligence', nutritionIntelligenceRoutes);
    app.use('/api/nutrientvaluesales', nutrientValueSalesRoutes);
    app.use('/api/nlp', nlp);
    app.use('/api/nervoussystem', nervousSystemRoutes);
    app.use('/api/mloptimization', mlOptimization);
    app.use('/api/multilingual', multilingualRoutes);
    app.use('/api/marketplaceenhancements', marketplaceEnhancements);
    app.use('/api/marketdata', marketDataRoutes);
    app.use('/api/marketanalytics', marketAnalytics);
    app.use('/api/m400aibackbone', m400AiBackboneRoutes);
    app.use('/api/logisticsenhancements', logisticsEnhancements);
    app.use('/api/logisticsenhancement', logisticsEnhancementRoutes);
    app.use('/api/loanmanagement', loanManagement);
    app.use('/api/livestockroutesupport', livestockRouteSupport.router);
    app.use('/api/livestockmanagement', livestockManagementRoutes);
    app.use('/api/labour', labourRoutes);
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
    app.use('/api/livestock-registry', livestockRegistryRoutes);
    app.use('/api/fisheries-registry', fisheriesRegistryRoutes);
    app.use('/api/operations-registry', operationsRegistryRoutes);
    app.use('/api/horticulture-registry', horticultureRegistryRoutes);
    app.use('/api/input-supply-registry', inputSupplyRegistryRoutes);
    app.use('/api/crop-registry', cropRegistryRoutes);
    app.use('/api/land-registry', landRegistryRoutes);
    app.use('/api/soil-registry', soilRegistryRoutes);
    app.use('/api/identity-registry', identityRegistryRoutes);
    app.use('/api/climate-registry', climateRegistryRoutes);
    app.use('/api/information-sharing-registry', informationSharingRegistryRoutes);
    app.use('/api/water-records-registry', waterRecordsRegistryRoutes);
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
    app.use('/api/enterpriseroutesupport', enterpriseRouteSupport.router);
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
    app.use('/api/climateroutesupport', climateRouteSupport.router);
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
    app.use('/api/devin', devinRoutes);
    app.use('/api/aibrain', aiBrainRoutes);
    app.use('/api/aibackbone', aiBackboneRoutes);
    app.use('/api/aiapproval', aiApprovalRoutes);
    app.use('/api/aiagent', aiAgentRoutes);
    // 2026-09-16: routes/claude/ is a 16-file directory the dynamic route
    // loader explicitly skips with a comment claiming "manually mounted" -
    // that claim was already found false for the whole directory earlier
    // this session (nothing mounts any of it). Mounting just this one file
    // now, found while wiring CreditScorePage.jsx's already-flagged gap:
    // real demand/price/credit-risk/fraud/recommend logic, Claude-AI-enhanced
    // with an honest fallback to the plain original service when
    // CLAUDE_AI_ENABLED isn't set or the AI call fails (verified directly -
    // no fabricated AI content or hardcoded confidence). The other 15 files
    // in routes/claude/ are NOT part of this fix - flagged, not audited.
    app.use('/api/aidecisions', require('./routes/claude/aiDecisionRoutes.js'));
    app.use('/api/agriculturalintelligence', agriculturalIntelligenceRoutes);
    app.use('/api/advancedsearch', advancedSearchRoutes);
    app.use('/api/advancedfeatures', advancedFeatures);
    app.use('/api/advancedanalytics', advancedAnalyticsRoutes);
    app.use('/api/v1/warnings', apiWarningRoutes);

    // Routes index is a module exporter, not a router - don't mount it
    // app.use('/api/index', index);

    app.use('/health', healthRoutes);
    logger.info('✅ Health check routes mounted at /health');

    // Auto Image Generation Routes
    app.use('/api/auto-generation', productImageAutoGenerationRoutes);
    app.use('/api/ai/images', aiImageGenerationEnhancedRoutes);
    app.use('/api/commerce/images', ecommerceImageIntegrationRoutes);
    app.use('/api/farmer/images', farmerImagePortalRoutes);
    logger.info('🎨 Auto image generation routes mounted');

    // Integration Status Dashboard - Project Visibility
    app.use('/api/status', integrationStatusRoutes);
    logger.info('📊 Integration status routes mounted at /api/status');

    // BLOCKER FIXES
    // Blocker 3: Endpoint Mismatch Fixer
    app.use('/api/debug', endpointMismatchFixer);
    logger.info('🔧 Endpoint mismatch fixer mounted at /api/debug');

    // Blocker 4: Stripe Webhook Handler
    app.use('/api', stripeWebhookRoutes);
    logger.info('💳 Stripe webhook handler mounted at /api/stripe-webhook');

    // Batch-mounted previously-unmounted real services (2026-09-15)
    app.use('/api/advancedai', advancedAIRoutesNewlyMounted);
    app.use('/api/aicopilot', aiCopilotRoutesNewlyMounted);
    app.use('/api/arvr', arVrRoutesNewlyMounted);
    app.use('/api/biodiversity', biodiversityRoutesNewlyMounted);
    app.use('/api/blockchaintraceability', blockchainTraceabilityRoutesNewlyMounted);
    app.use('/api/catalogintelligence', catalogIntelligenceRoutesNewlyMounted);
    app.use('/api/commercerules', commerceRulesRoutesNewlyMounted);
    app.use('/api/consumerhealth', consumerHealthRoutesNewlyMounted);
    // Hyphenated path (not /api/conversationalai like the rest of this batch):
    // components/Layout.jsx already documented this exact path from a prior
    // investigation ("authMiddleware on /conversational-ai/sessions"), and
    // ChatInterface.jsx's real calls (getDomains/createSession/respond/
    // endSession) match this service's real routes exactly - matching that
    // existing expectation instead of introducing a third path convention.
    app.use('/api/conversational-ai', conversationalAIRoutesNewlyMounted);
    // Matches the real frontend consumer exactly (see require comment above).
    app.use('/api/v1/advanced-medical-coding', advancedMedicalCodingRoutesNewlyMounted);
    app.use('/api/advanced-voice-ai', advancedVoiceAIRoutesNewlyMounted);
    app.use('/api/clinical-nutrition', clinicalNutritionRoutesNewlyMounted);
    app.use('/api/digitalproductpassport', digitalProductPassportRoutesNewlyMounted);
    app.use('/api/enterprisecontrol', enterpriseControlRoutesNewlyMounted);
    app.use('/api/enterprisememory', enterpriseMemoryRoutesNewlyMounted);
    app.use('/api/erp', erpRoutesNewlyMounted);
    app.use('/api/financial', financialRoutesNewlyMounted);
    app.use('/api/foodintelligence', foodIntelligenceRoutesNewlyMounted);
    app.use('/api/foodsafety', foodSafetyRoutesNewlyMounted);
    app.use('/api/form', formRoutesNewlyMounted);
    app.use('/api/giintelligence', giIntelligenceRoutesNewlyMounted);
    app.use('/api/indigenousknowledge', indigenousKnowledgeRoutesNewlyMounted);
    app.use('/api/institutionalprocurement', institutionalProcurementRoutesNewlyMounted);
    app.use('/api/insurance', insuranceRoutesNewlyMounted);
    app.use('/api/knowledgegraph', knowledgeGraphRoutesNewlyMounted);
    app.use('/api/laboratoryerp', laboratoryERPRoutesNewlyMounted);
    app.use('/api/logistics', logisticsRoutesNewlyMounted);
    app.use('/api/merchandising', merchandisingRoutesNewlyMounted);
    app.use('/api/millcircuit', millCircuitRoutesNewlyMounted);
    app.use('/api/modulecatalog', moduleCatalogRoutesNewlyMounted);
    app.use('/api/neproductintelligence', neProductIntelligenceRoutesNewlyMounted);
    app.use('/api/offlinepayment', offlinePaymentRoutesNewlyMounted);
    app.use('/api/offlinesync', offlineSyncRoutesNewlyMounted);
    app.use('/api/omnichannelai', omnichannelAIRoutesNewlyMounted);
    app.use('/api/organictraceability', organicTraceabilityRoutesNewlyMounted);
    app.use('/api/recipeintelligence', recipeIntelligenceRoutesNewlyMounted);
    app.use('/api/shelflife', shelfLifeRoutesNewlyMounted);
    app.use('/api/smsauth', smsAuthRoutesNewlyMounted);
    app.use('/api/v42intelligence', v42IntelligenceRoutesNewlyMounted);
    app.use('/api/valuecommerce', valueCommerceRoutesNewlyMounted);
    // Hyphenated path, same reasoning as /api/conversational-ai above:
    // Layout.jsx documents "/voice-ai/voice-sessions", and VoiceAssistant.jsx's
    // real calls match this service's real routes exactly.
    app.use('/api/voice-ai', voiceAIRoutesNewlyMounted);
    app.use('/api/whatsapp', whatsappRoutesNewlyMounted);

    // 2026-09-16: audited the other 15 files in routes/claude/ (flagged
    // alongside aiDecisionRoutes.js above as excluded-by-dynamicRouteLoader
    // with the same false "manually mounted" comment). 11 were left alone -
    // 8 are the generic "Route operational" scaffold (aiAgentRoutes,
    // aiCoordinationRoutes, aiProviderRoutes, insuranceAIRoutes,
    // logisticsAIRoutes, orderAIRoutes, productAIRoutes, unifiedAIRoutes),
    // backendModuleBridge.js says "Placeholder route module" outright,
    // aiCollaborationRoutes_merged.js duplicates the already-mounted
    // /api/aicollaboration (routes/aiCollaborationRoutes.js - same
    // services/claude/aiCollaborationService.js, same endpoints, plus its
    // own Claude-API-configured check and handoff rate limiting), and
    // aiStrategyRoutes.js calls originalService.generateStrategy() on
    // services/legacy/aiBrainService.js, which does not export that
    // function under any name (only executeCognitiveCycle/perception/
    // attention/reasoning/decision/planning) - both its /ai-enhanced and
    // plain endpoints throw unconditionally, aiEnabled true or false; only
    // /ai-capability (a status stub) works, so nothing real to mount.
    // The 4 below are real and mounted:
    //  - aiCopilotRoutes.js: Claude-AI-enhanced wrapper (honest fallback to
    //    the original when CLAUDE_AI_ENABLED isn't set, same pattern as
    //    aiDecisionRoutes.js) around services/legacy/aiCopilotService.js's
    //    real generateCopilotResponse() (DB-backed per-copilot-type lookups
    //    against real tables, with an honest "I don't have a general-purpose
    //    AI model configured" fallback when there's no match - not
    //    fabricated). Mounted at /api/aicopilotenhanced, not /api/aicopilot -
    //    that path is already taken (this same session, elsewhere) by the
    //    legacy service's own router (session/message endpoints); this file
    //    adds different endpoints (/ai-enhanced/generate-copilot-response,
    //    /ai-context/copilot, /ai-capability, /generate-copilot-response),
    //    not a duplicate of what's already there. Its /ai-context/copilot
    //    endpoint calls service.getAIContext(), a method that doesn't exist
    //    anywhere in this codebase (same bug independently found on all 5
    //    of aiDecisionRoutes.js's /ai-context/* endpoints above - a
    //    pre-existing, secondary-endpoint-only bug, not fabrication).
    //  - financialAIRoutes.js: same honest-fallback wrapper around
    //    services/legacy/financialService.js's real applyForLoan() (real
    //    INSERT into loans). Mounted at /api/financialai. Its
    //    /ai-enhanced/assess-credit endpoint is broken the same way as
    //    aiStrategyRoutes.js above - it calls originalService.
    //    assessCreditRisk(), which financialService.js does not export
    //    (only farmerCreditRiskScore/getCreditScore/generateCreditScore) -
    //    always throws. Left mounted for its two working endpoints
    //    (process-loan, apply-loan) and /ai-capability; assess-credit is
    //    flagged broken, not fixed (no invented implementation), and no
    //    frontend page is wired to it.
    //  - libraryRoutes.js: real file-backed catalog search over
    //    services/legacy/libraryKnowledgeService.js (reads actual .md cards
    //    under _EBDESIGN_LIBRARY/, computes real SHA256 content hashes, real
    //    keyword search/relevance scoring) - not the same object as the
    //    already-initialized services/libraryKnowledgeService.js (the
    //    M645100_LIBRARYKNOWLEDGE module wrapper used internally), so this
    //    is a second, self-contained, genuinely-real implementation, not
    //    fake data. Mounted at /api/libraryknowledge, not /api/library -
    //    that path is already taken by routes/libraryRoutes_merged.js,
    //    itself a "Resources retrieved" CRUD scaffold returning data: []
    //    (pre-existing, not this file, not touched here).
    //  - moduleRegistryRoutes.js: real fs.readdirSync/module.json reads
    //    over backend/src/modules/, no fabrication. Mounted at
    //    /api/moduleregistry (unused prefix, verified against the full
    //    mount list).
    app.use('/api/aicopilotenhanced', require('./routes/claude/aiCopilotRoutes.js'));
    app.use('/api/financialai', require('./routes/claude/financialAIRoutes.js'));
    app.use('/api/libraryknowledge', require('./routes/claude/libraryRoutes.js'));
    app.use('/api/moduleregistry', require('./routes/claude/moduleRegistryRoutes.js'));

    // Standardized error handling must follow every route registration.
    app.use(standardizeErrorResponse);
    app.use(errorHandler);

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
          startup: elapsed,
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
