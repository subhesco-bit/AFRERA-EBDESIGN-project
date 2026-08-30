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
const authService = require('./services/dual-use/authService');
const productService = require('./services/legacy/productService');
const orderService = require('./services/legacy/orderService');
const financialService = require('./services/legacy/financialService');
const logisticsService = require('./services/legacy/logisticsService');
const insuranceService = require('./services/legacy/insuranceService');
const aiService = require('./services/legacy/aiService');
const erpService = require('./services/legacy/erpService');
const multilingualService = require('./services/legacy/multilingualService');
const organicTraceabilityService = require('./services/legacy/organicTraceabilityService');
const nutritionIntelligenceService = require('./services/legacy/nutritionIntelligenceService');
const conversationalAIService = require('./services/legacy/conversationalAIService');
const laboratoryERPService = require('./services/legacy/laboratoryERPService');
const giIntelligenceService = require('./services/legacy/giIntelligenceService');
const foodIntelligenceService = require('./services/legacy/foodIntelligenceService');
const valueCommerceService = require('./services/legacy/valueCommerceService');
const consumerHealthService = require('./services/legacy/consumerHealthService');
const voiceAIService = require('./services/legacy/voiceAIService');
const blockchainTraceabilityService = require('./services/legacy/blockchainTraceabilityService');
const knowledgeGraphService = require('./services/legacy/knowledgeGraphService');
// Enterprise Memory ("Hippocampus" — AFRERA_CLAUDE_BUILD_DIRECTIVE.md §2.3):
// case/episode log, real full-text retrieval. Was "missing" in
// core/aiOrchestrator.js before 2026-08-09 — see that file's ENGINES.enterprise_memory
// entry and migration 9997_enterprise_memory_schema.sql for the full rationale.
const enterpriseMemoryService = require('./services/legacy/enterpriseMemoryService');
const predictiveAnalyticsService = require('./services/legacy/predictiveAnalyticsService');
const iotIntegrationService = require('./services/legacy/iotIntegrationService');
const arVrService = require('./services/legacy/arVrService');
const smsAuthService = require('./services/legacy/smsAuthService');
// Real Twilio WhatsApp integration (outbound send + inbound webhook). Mirrors
// smsAuthService's mock-mode-when-unconfigured pattern. See service header.
const whatsappService = require('./services/legacy/whatsappService');
const advancedVoiceAI = require('./services/advancedVoiceAI');
// Escrow service for secure fund holding in transactions
const escrowService = require('./services/legacy/escrowService');
// Custody event service - chain tracking and settlement instructions
const custodyEventRoutes = require('./services/legacy/custodyEventRoutes');
// Health check routes for monitoring
const healthRoutes = require('./routes/healthRoutes');
const offlinePaymentService = require('./services/legacy/offlinePaymentService');
const advancedAIService = require('./services/legacy/advancedAIService');
const offlineSyncService = require('./services/legacy/offlineSyncService');
const formService = require('./services/legacy/formService');
const analyticsService = require('./services/legacy/analyticsService');
const moduleCatalogService = require('./services/legacy/moduleCatalogService');
// User management module (M011)
const userModule = require('./modules/M011');
// System Administration module (M006)
const adminModule = require('./modules/M006');
const indigenousKnowledgeService = require('./services/legacy/indigenousKnowledgeService');
const biodiversityService = require('./services/legacy/biodiversityService');
const aiCopilotService = require('./services/legacy/aiCopilotService');
const omnichannelAIService = require('./services/legacy/omnichannelAIService');
const foodSafetyService = require('./services/legacy/foodSafetyService');
const shelfLifeService = require('./services/legacy/shelfLifeService');
const institutionalProcurementService = require('./services/legacy/institutionalProcurementService');
const millCircuitService = require('./services/legacy/millCircuitService');
const digitalProductPassportService = require('./services/legacy/digitalProductPassportService');
const recipeIntelligenceService = require('./services/legacy/recipeIntelligenceService');
// Business rules recovered from the v43 prototype (see service header).
const decisionSupportService = require('./services/legacy/decisionSupportService');
// Recovered from the pre-v43 ne_harvest lineage (see service header).
const neProductIntelligenceService = require('./services/legacy/neProductIntelligenceService');
const commerceRulesService = require('./services/legacy/commerceRulesService');
const catalogIntelligenceService = require('./services/legacy/catalogIntelligenceService');
const enterpriseControlService = require('./services/legacy/enterpriseControlService');
const v42IntelligenceService = require('./services/legacy/v42IntelligenceService');
// Farmer Value Engine (991): the decision layer above every other module.
const farmerValueService = require('./services/legacy/farmerValueService');
const merchandisingService = require('./services/legacy/merchandisingService');

// Previously-orphaned services: each of these exports its own setupRoutes(app)
// function that was never being called anywhere, so none of them had a live route.
const dynamicPricingService = require('./services/legacy/dynamicPricingService');
const farmerTrainingService = require('./services/legacy/farmerTrainingService');
const governmentSchemeService = require('./services/legacy/governmentSchemeService');
const greenhouseService = require('./services/legacy/greenhouseService');
const insuranceClaimsService = require('./services/legacy/insuranceClaimsService');
const preSeasonOrderService = require('./services/legacy/preSeasonOrderService');
const sharedInfraService = require('./services/legacy/sharedInfraService');
const soilTestingService = require('./services/legacy/soilTestingService');
const subsidyService = require('./services/legacy/subsidyService');

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
const logisticsEnhancementRoutes = require('./routes/logisticsEnhancementRoutes');
const advancedFeatures = require('./routes/advancedFeatures');
const enterpriseAIRoutes = require('./routes/enterpriseAIRoutes');
const gstRoutes = require('./routes/gstRoutes');
// REMOVED: logisticsOpsRoutes - was imported from logisticsEnhancementRoutes but route removed to prevent crash
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
// Enterprise Control — Workflow, CRM, Legal, Risk, Emergency (migration 993).
// enterpriseControlRoutes.js was deleted 2026-08-24: it imported
// createWorkflow/createLegalCase/createRisk/etc from
// services/enterpriseControlService.js, none of which exist there (the real
// exports are startWorkflow/actOnWorkflow/listPendingApprovals/createLead/
// convertLead/assessRisk/raiseIncident/etc) - every route in it would have
// thrown TypeError on first call. Nothing called it (EnterpriseControlPage.jsx
// / enterpriseControlAPI in api.js call /control/* - see the real,
// already-working mountRoute('/api/v1/control', enterpriseControlService)
// below, which exports its own correct router).
// unifiedLedgerRoutes/unifiedLedgerService (migration 998, "One Ledger + 9
// Economies") were deleted here (2026-08-17): the build directive explicitly
// rejects a separate ledger per economy in favor of the canonical
// journal_entries/journal_lines ledger tagged by cost center, this service
// wrote through a signalBus instance disconnected from the real reflex
// engine, and the route was already fully blocked. See
// AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C. UnifiedLedgerPage.jsx now points
// users at the real /ledger page instead of calling this.
// Village Profile Service (REOS Missing Layer 5 - District/Village/Block Economic Database)
const villageProfileService = require('./services/legacy/villageProfileService');
// Procurement Subscription Service (REOS Missing Layer 1.9 - Subscription Commerce)
const procurementSubscriptionService = require('./services/legacy/procurementSubscriptionService');
// Buying Club Service (REOS Missing Layer 1.10-1.11 - Group Buying / Community Buying)
const buyingClubService = require('./services/legacy/buyingClubService');
// Rural Enterprise Service (REOS Rural Life OS - rural_enterprises table)
const ruralEnterpriseService = require('./services/legacy/ruralEnterpriseService');
// Renewable Energy Service (REOS Rural Life OS - renewable_energy_systems table)
const renewableEnergyService = require('./services/legacy/renewableEnergyService');
// Household Economy Service (REOS Rural Life OS - household_economy table)
const householdEconomyService = require('./services/legacy/householdEconomyService');
// Shared Infrastructure Service (REOS Rural Life OS - shared_infrastructure_access table)
const sharedInfrastructureService = require('./services/legacy/sharedInfrastructureService');
// Machinery Access Service (REOS Rural Life OS - machinery_access table)
const machineryAccessService = require('./services/legacy/machineryAccessService');
// Rural Finance Service (REOS Rural Life OS - rural_finance table)
const ruralFinanceService = require('./services/legacy/ruralFinanceService');
// AI Advisory Service (REOS Rural Life OS - ai_advisories table)
const aiAdvisoryService = require('./services/legacy/aiAdvisoryService');
// Market Access Service (REOS Rural Life OS - market_access table)
const marketAccessService = require('./services/legacy/marketAccessService');
// Market Intelligence Service (REOS Rural Life OS - market_intelligence table)
const marketIntelligenceService = require('./services/legacy/marketIntelligenceService');
// Mobility Rides Service (REOS Rural Life OS - mobility_rides table)
const mobilityRidesService = require('./services/legacy/mobilityRidesService');
// Backup and Disaster Recovery Service
const backupService = require('./services/legacy/backupService');
// Analytics and Monitoring Service
const analyticsMonitoringService = require('./services/legacy/analyticsMonitoringService');
// AI Agentic Companion Service
const aiAgenticCompanionService = require('./services/legacy/aiAgenticCompanionService');
// Digital Twin Service
const digitalTwinService = require('./services/legacy/digitalTwinService');
// AI Gateway Service - Real AI Backbone System
const aiGatewayService = require('./services/legacy/aiGatewayService');
// AI Agent Service - Agentic AI Capabilities
const aiAgentService = require('./services/aiAgentService');
// AI Brain Service - Cognitive Processing Layer
const aiBrainService = require('./services/legacy/aiBrainService');
// AI Self-Healing Service - Autonomous Error Recovery Layer
const aiSelfHealingService = require('./services/legacy/aiSelfHealingService');
// AI Operation Intelligence Service - Real-Time Optimization Layer
const aiOperationIntelligenceService = require('./services/legacy/aiOperationIntelligenceService');
// MFA Service - Multi-Factor Authentication
const mfaService = require('./services/dual-use/mfaService');
const mfaRoutes = require('./routes/dual-use/mfaRoutes');
// GDPR Compliance Service
const gdprService = require('./services/dual-use/gdprService');
const gdprRoutes = require('./routes/dual-use/gdprRoutes');
// M001 Platform Core Service
const platformCoreService = require('./services/dual-use/platformCoreService');
const platformCoreRoutes = require('./routes/platformCoreRoutes');
// Unified Claude AI Coordinator - routes/unifiedAIRoutes.js requires
// core/claudeAICoordinator.js directly (Node caches the singleton either
// way), so a second unused require here was dead weight. Removed 2026-08-29.
const unifiedAIRoutes = require('./routes/unifiedAIRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const aiCollaborationRoutes = require('./routes/aiCollaborationRoutes');
// Generic plug-and-play module discovery/load/execute bridge (backend/src/core/moduleRegistry.js)
const moduleRegistryRoutes = require('./routes/claude/moduleRegistryRoutes');
// REST bridge exposing backend/src/modules/M0XX's real functions over HTTP
// (see routes/claude/backendModuleBridge.js for why this exists)
const backendModuleBridge = require('./routes/claude/backendModuleBridge');
// SAP Module Architecture Service - Independent Module Architecture
const sapModuleArchitectureService = require('./services/legacy/sapModuleArchitectureService');
// Advance Rate Pricing — forward curves, basis, commitment advice.
// Recovered from afrera_platform_v44.html (migration 051).
const riskPricingRoutes = require('./routes/riskPricingRoutes');
// GST, hash-chained ledger, scheme matching, eNWR, freight, risk (migration 053).
const recoveredFinanceRoutes = require('./routes/recoveredFinanceRoutes');
// REMOVED: Climate monitoring routes - droughtMonitoringRoutes, floodMonitoringRoutes, diseaseForecastingRoutes, climateRiskRoutes, agroMeteorologyRoutes (missing files - would crash app)
// Farm activities/tasks/contractors/machinery ops/equipment scheduling/input
// consumption/productivity/ops dashboard CRUD - same "shipped frontend form,
// no backend" gap as the climate batch above (2026-08-17).
const {
  farmActivityRoutes, farmTaskRoutes, contractorRoutes, machineryOperationsRoutes,
  equipmentSchedulingRoutes, inputConsumptionRoutes, farmProductivityRoutes,
  farmOperationsDashboardRoutes,
} = require('./routes/operationsManagementRoutes');
// Water budgeting/quality/rainwater-harvesting-structures/watersheds/analytics
// CRUD - same gap as the batches above (2026-08-17). Distinct from
// backend/src/modules/M078's rainwater_harvesting_systems engineering API -
// see waterManagementService.js.
const {
  waterBudgetingRoutes, waterQualityRoutes, rainwaterHarvestingRoutes,
  watershedManagementRoutes, waterAnalyticsRoutes,
} = require('./routes/waterManagementRoutes');
// Soil health cards/nutrient plans/fertility records CRUD - same gap as the
// batches above (2026-08-17). M072 Soil Testing is real and untouched.
const {
  soilHealthRoutes, nutrientManagementRoutes, fertilityManagementRoutes,
} = require('./routes/soilManagementRoutes');
// Block/district/state/producer-group/community-asset/rural-development CRUD
// - same gap as the batches above (2026-08-17). Panchayat/Cooperative are
// real via /api/v1/governance and untouched.
const {
  blockManagementRoutes, districtManagementRoutes, stateManagementRoutes,
  producerGroupRoutes, communityAssetRoutes, ruralDevelopmentRoutes,
} = require('./routes/communityManagementRoutes');
// Biofertilizer/pesticide/bio-pesticide/micronutrient/organic-input/
// input-procurement/input-distribution/input-traceability CRUD - same gap
// as the batches above (2026-08-17).
const {
  biofertilizerRoutes, pesticideInventoryRoutes, bioPesticideRoutes, micronutrientRoutes,
  organicInputRoutes, inputProcurementRoutes, inputDistributionRoutes, inputTraceabilityRoutes,
} = require('./routes/inputSupplyManagementRoutes');
// Cattle registry/feed/analytics CRUD (2026-08-17). Poultry/Goat/Sheep/Pig
// and Breeding deliberately excluded - see livestockManagementService.js
// header for why (real backends already exist at different paths, or need
// investigation before building). M127 Animal Health is real and untouched
// (frontend caller was fixed instead - see LivestockManagementPage.jsx).
const {
  cattleRegistryRoutes, feedManagementRoutes, livestockAnalyticsRoutes,
} = require('./routes/livestockManagementRoutes');
// Farmer family CRUD (2026-08-17).
const farmerFamilyRoutes = require('./routes/farmerFamilyRoutes');
// Land lease/GIS mapping/soil mapping/water resource mapping/geo boundary/
// survey CRUD - same gap as the batches above (2026-08-17).
const {
  landLeaseRoutes, gisLandMappingRoutes, soilMappingRoutes,
  waterResourceMappingRoutes, geoBoundaryRoutes, surveyManagementRoutes,
} = require('./routes/landManagementRoutes');
// Crop registration/variety/seed-planning/nursery/sowing/monitoring CRUD -
// same gap as the batches above (2026-08-17).
const {
  cropRegistrationRoutes, cropVarietyRoutes, seedPlanningRoutes,
  nurseryManagementRoutes, sowingManagementRoutes, cropMonitoringRoutes,
} = require('./routes/cropManagementRoutes');
// Preventive maintenance CRUD (2026-08-17). The other 7
// MachineryManagementPage.jsx tabs (implements/inventory/rental/breakdown/
// fuel/parts/lifecycle) are deliberately not built - see
// preventiveMaintenanceService.js for why (real, differently-shaped
// backends already exist for those at modules M102/M103/M104/M107/M108/
// M109/M110).
const preventiveMaintenanceRoutes = require('./routes/preventiveMaintenanceRoutes');
// Vegetable/floriculture/polyhouse/hydroponics/aeroponics/precision-horticulture/
// protected-cultivation/horticulture-analytics CRUD - same gap as the
// batches above (2026-08-17). M144 Greenhouse is real and untouched.
const {
  vegetableProductionRoutes, floricultureRoutes, polyhouseManagementRoutes,
  hydroponicsRoutes, aeroponicsRoutes, precisionHorticultureRoutes,
  protectedCultivationRoutes, horticultureAnalyticsRoutes,
} = require('./routes/horticultureManagementRoutes');
// Drought/flood/disease-forecast/climate-risk/agro-meteorology CRUD - same
// gap as the batches above (2026-08-21). Real ClimateMonitoringPage.jsx
// tabs shipped with a working form and an honest "backend not built yet"
// note; service/routes already existed but were never mounted.
const {
  droughtMonitoringRoutes, floodMonitoringRoutes, diseaseForecastingRoutes,
  climateRiskRoutes, agroMeteorologyRoutes,
} = require('./routes/climateMonitoringRoutes');
// Biofloc/hatchery/fish-feed/fisheries-water-quality/fish-health/
// fisheries-harvest/fish-processing/cold-fish-chain/aquaculture-analytics
// CRUD - same gap as the batches above (2026-08-21). Pond Management
// (M132) already has a real, incompatibly-shaped backend and is untouched
// - see fisheriesManagementService.js.
const {
  biofloccFarmRoutes, hatcheryManagementRoutes, fishFeedRoutes,
  fisheriesWaterQualityRoutes, fishHealthRoutes, fisheriesHarvestRoutes,
  fishProcessingRoutes, coldFishChainRoutes, aquacultureAnalyticsRoutes,
} = require('./routes/fisheriesManagementRoutes');
// Permission/SSO/MFA/digital-identity/consent CRUD + a real admin view over
// M012's sessions table (2026-08-21). M014 Role Management already real.
const {
  permissionManagementRoutes, ssoRoutes, mfaManagementRoutes,
  digitalIdentityRoutes, consentManagementRoutes, sessionManagementRoutes,
} = require('./routes/identityManagementRoutes');
// Role management (M014) — real service, real frontend caller
// (frontend/src/services/api.js getRoles/createRole/updateRole/deleteRole
// against /roles), but no backend anywhere until now (2026-08-21).
const roleManagementRoutes = require('./routes/roleManagementRoutes');
// Irrigation schedules/water-sources/logs CRUD (2026-08-28) — same gap as
// the batches above. M075 is actually Pig Management, not Irrigation - see
// irrigationManagementService.js header.
const {
  irrigationSchedulesRoutes, irrigationWaterSourcesRoutes, irrigationLogsRoutes,
} = require('./routes/irrigationManagementRoutes');
// realtimeMonitoringService.js had zero callers anywhere in the app
// (confirmed via repo-wide require() audit, 2026-08-28) despite being a
// real, self-contained monitoring/alerting engine. Exposed directly.
const realtimeMonitoringRoutes = require('./routes/realtimeMonitoringRoutes');
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
const decisionSupportRoutes = require('./routes/decisionSupportRoutes');
// Genuinely orphaned services found during the 2026-08-29 gap-index audit -
// real, substantial code, zero prior route/index.js wiring. See .ai/tasks/ACTIVE.md.
// (The 3 insurance-* route files originally added here were themselves a
// duplication mistake, corrected the same day - see the ACTIVE.md
// "duplicate route correction" note. insuranceEnhancements.js, mounted
// below at /api/v1/insurance, already covered this - and is what the
// frontend actually calls.)
const cropPlanningRoutes = require('./routes/cropPlanningRoutes');
const landRecordsRoutes = require('./routes/landRecordsRoutes');
const productReviewRoutes = require('./routes/productReviewRoutes');
// nutritionIntelligenceService.js (1165 lines, real) already defines and
// exports its own `router` - nutrition scoring, personalized recommendations
// by dietary profile, diet-based recipe generation, wellness practices. Zero
// prior mounting - the AI dietitian/naturopath layer the user asked for
// (2026-08-29) is mostly this, already built, just never exposed.
const nutritionIntelligenceRoutes = require('./services/legacy/nutritionIntelligenceService').router;
// custodyEventService.js is NOT orphaned - it was already wired via
// services/legacy/custodyEventRoutes.js's setupRoutes(app) pattern (called
// below), which this session's orphan scan initially missed because it
// only checked routes/. Confirmed and left alone; see the scan note further
// down for what WAS actually found orphaned.
// 6 route files under routes/legacy/ found never mounted during the
// 2026-08-29 sweep - root cause: all 6 imported from
// '../../middleware/authMiddleware', a module that does not exist, so
// mounting them as-is would have crashed the boot. Fixed the import in each
// file (see their own comments) to the real '../../middleware/auth' module.
const apicultureRoutes = require('./routes/legacy/apicultureRoutes');
const legacyFisheriesRoutes = require('./routes/legacy/fisheriesRoutes');
const forestryRoutes = require('./routes/legacy/forestryRoutes');
const mushroomRoutes = require('./routes/legacy/mushroomRoutes');
const sericultureRoutes = require('./routes/legacy/sericultureRoutes');
const vermicompostRoutes = require('./routes/legacy/vermicompostRoutes');
const cooperativeShareRoutes = require('./routes/cooperativeShareRoutes');
const wikipediaRoutes = require('./routes/wikipediaRoutes');
// Found built but with zero HTTP exposure (2026-08-15 junk/orphan sweep) —
// see each route file's header comment for what was verified before wiring.
const agriculturalIntelligenceRoutes = require('./routes/agriculturalIntelligenceRoutes');
const farmerHealthRoutes = require('./routes/farmerHealthRoutes');
const foodRoutes = require('./routes/foodRoutes');
const iotSensorService = require('./services/legacy/iotSensorService');
const regionalVarietyRoutes = require('./routes/regionalVarietyRoutes');
const foluBenchmarkRoutes = require('./routes/foluBenchmarkRoutes');
const civilDisruptionRoutes = require('./routes/civilDisruptionRoutes');
const sellerRankingRoutes = require('./routes/sellerRankingRoutes');
const seedVaultRoutes = require('./routes/seedVaultRoutes');
const freightPoolingRoutes = require('./routes/freightPoolingRoutes');
const returnLoadBoardRoutes = require('./routes/returnLoadBoardRoutes');
const glutWarningRoutes = require('./routes/glutWarningRoutes');
const trackDartRoutes = require('./routes/trackDartRoutes');
const equipmentExchangeRoutes = require('./routes/equipmentExchangeRoutes');
// Vision (sharp) + OCR (tesseract.js) — real image-quality/metadata/
// thumbnail and text-extraction dispatch behind core/aiOrchestrator.js's
// vision_engine / ocr_engine, which were "missing" before 2026-08-09.
const visionRoutes = require('./routes/visionRoutes');
// AI Gateway Routes - Real AI Backbone System
const aiGatewayRoutes = require('./routes/aiGatewayRoutes');
// AI Intelligence Fabric - Professional AI module with unique IDs (EBD-MOD-00000001)
const { initializeAI, handleAIRequest } = require('./core/ai/index');
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
// Research and Development Routes - R&D Management with AI Integration
const researchAndDevelopmentRoutes = require('./routes/researchAndDevelopmentRoutes');
// Information Sharing Routes - Document and Knowledge Sharing with AI Integration
const informationSharingRoutes = require('./routes/informationSharingRoutes');
// Community Routes - Community Management with AI Integration
// Knowledge Routes - Knowledge Management with AI Integration
const knowledgeRoutes = require('./routes/knowledgeRoutes');
// Company lookup — resolves accounting UI gap for companyId/fiscalYear/chart-of-accounts
const companyRoutes = require('./routes/companyRoutes');
// Platform Foundation Routes - AI Enhanced Platform Foundation (D01)
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
const { rateLimiters } = require('./middleware/rateLimit');
const { responseFormatter } = require('./middleware/responseFormatter');
const { requestLogger, errorLogger } = require('./middleware/requestLogger');
const { validateBody, validateQuery, validateParams } = require('./middleware/validation');
const { authMiddleware } = require('./middleware/auth');
const { validateBody: validateBodyOld } = require('./middleware/inputValidation');
const { requestId } = require('./middleware/requestId');
const { securityHeaders, productionSecurityHeaders } = require('./middleware/securityHeaders');
const { routeMonitoring, criticalRouteMonitoring, healthCheckMonitoring } = require('./middleware/routeMonitoring');
const { logger } = require('./utils/logger');

// Database Enhancements Integration
const { initializeDatabaseEnhancements, shutdownDatabaseEnhancements, getDatabaseEnhancements } = require('./database/database_enhancements');

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Trust proxy configuration for rate limiting security
// Rate limiters key on req.ip, which is attacker-controlled via X-Forwarded-For
// behind a reverse proxy without this setting. TRUST_PROXY_HOPS configures how
// many proxy layers to trust (default: 1 for a single load balancer).
const trustProxyHops = process.env.TRUST_PROXY_HOPS ? parseInt(process.env.TRUST_PROXY_HOPS, 10) : 1;
app.set('trust proxy', trustProxyHops);
logger.info(`Trust proxy configured: ${trustProxyHops} hop(s)`);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable default CSP, use our custom securityHeaders
}));

// Enterprise-grade security headers (replaces default helmet CSP)
app.use(process.env.NODE_ENV === 'production' ? productionSecurityHeaders() : securityHeaders());

// CORS configuration - Production-ready with environment-based origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID', 'X-Correlation-ID'],
  maxAge: 86400 // 24 hours
}));

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for distributed tracing (must come before other middleware)
app.use(requestId);

// Route monitoring middleware
app.use(routeMonitoring);

// Request/response logging
app.use(requestLogger);

// Response formatting
app.use(responseFormatter);

// Rate limiting (use new middleware)
app.use('/api/v1/auth', rateLimiters.auth);
app.use('/api/v1/', rateLimiters.api);

// Error logger middleware (must be before error handler)
app.use(errorLogger);

// API Routes
const mountRoute = (pathPrefix, serviceModule) => {
  if (serviceModule && serviceModule.router) {
    app.use(pathPrefix, serviceModule.router);
    return true;
  }

  logger.warn(`Skipping route mount for ${pathPrefix} because no router was exported.`);
  return false;
};

app.use('/api/v1/auth', criticalRouteMonitoring, authService.router);
mountRoute('/api/v1/products', productService);
app.use('/api/v1/orders', criticalRouteMonitoring, orderService.router);
// NOTE: farmerService and gstService export plain functions, not a .router,
// so mountRoute() silently no-ops for them (see farmerRoutes/gstRoutes mounts below).
app.use('/api/v1/financial', criticalRouteMonitoring, financialService.router);
app.use('/api/v1/logistics', criticalRouteMonitoring, logisticsService.router);
app.use('/api/v1/insurance', criticalRouteMonitoring, insuranceService.router);
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
// analyticsService exports plain aggregation functions, not a .router - it's an
// internal library consumed directly by tenantManagement/systemAdministration/
// platformConfiguration/organizationManagement/roleManagement/agriculturalIntelligence
// services, not a REST endpoint. mountRoute() silently no-ops for it, same as
// farmerService/gstService above.
mountRoute('/api/v1/analytics', analyticsService);
// analyticsService.js has real report-generation logic (buildAgriculturalOverview,
// buildFinancialPerformance, etc.) but no .router, so the mountRoute() call
// above always no-ops - confirmed still true 2026-08-28 via the boot log's
// own warning. Give it a real route instead of leaving it silently unreachable.
app.use('/api/v1/analytics', require('./routes/analyticsReportRoutes'));
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
// engineeringProjectRoutes exports the router directly (not { router }), so it
// bypasses mountRoute()'s .router check - matches every other *Routes.js mount below.
app.use('/api/v1/engineering', require('./routes/engineeringProjectRoutes'));
// Mount User Management (M011)
mountRoute('/api/v1/users', userModule);
// Mount System Administration (M006)
mountRoute('/api/v1/admin', adminModule);

// Mount generated module scaffolds for every M001..M150 module.
const generatedModuleRoot = path.join(__dirname, 'modules');
const generatedModuleNames = fs.readdirSync(generatedModuleRoot)
  .filter(name => /^M\d{3}$/.test(name))
  .sort(); // Note: Synchronous I/O at module load is acceptable for one-time initialization

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
// AI Backbone - Real AI integration (Claude, ChatGPT, Gemini, Azure, Hugging Face, Ollama)
const aiBackboneRoutes = require('./routes/aiBackboneRoutes');
app.use('/api/v1/ai-backbone', aiBackboneRoutes);
// Devin integration removed 2026-08-29 at explicit user request (real live
// Cognition Devin API - user did not want this surface reachable). Was
// routes/devinRoutes.js -> controllers/devinController.js ->
// services/devinService.js, all deleted together; nothing else depended on
// any of the three.
// Product Media AI - AI product-image generation, nutrient-comparison video generation
const productMediaAIRoutes = require('./routes/productMediaAIRoutes');
app.use('/api/v1/product-media-ai', productMediaAIRoutes);
// Wearable Integration - Fitbit (real OAuth2 API), Apple Health / Samsung Health (device-push)
const wearableIntegrationRoutes = require('./routes/wearableIntegrationRoutes');
app.use('/api/v1/wearable-integration', wearableIntegrationRoutes);
// Defense/Police/BSF Fitness Prep - self-prep comparison against real, cited published standards
const defenseFitnessPrepRoutes = require('./routes/defenseFitnessPrepRoutes');
app.use('/api/v1/defense-fitness-prep', defenseFitnessPrepRoutes);
// Crop Value-Compound Research - AI-assisted, human-reviewed published reference data
const cropValueResearchRoutes = require('./routes/cropValueResearchRoutes');
app.use('/api/v1/crop-value-research', cropValueResearchRoutes);
// Platform Telemetry - real system/business metrics for admin dashboard
const platformTelemetryRoutes = require('./routes/platformTelemetryRoutes');
app.use('/api/v1/platform-telemetry', platformTelemetryRoutes);
// Farmer Training - Agricultural training and FOLU compliance
const farmerTrainingRoutes = require('./routes/farmerTrainingRoutes');
app.use('/api/v1/training', farmerTrainingRoutes);
app.use('/api/v1/insurance', insuranceEnhancements);
app.use('/api/v1/farmer-portal', farmerPortalEnhancements);
app.use('/api/v1/governance', governanceModule);
app.use('/api/v1/logistics', logisticsEnhancements);
app.use('/api/v1/logistics-enhancement', logisticsEnhancementRoutes);
app.use('/api/v1/mfa', mfaRoutes);
app.use('/api/v1/privacy', gdprRoutes);
app.use('/api/v1/platform', platformCoreRoutes);
app.use('/api/v1/ai', unifiedAIRoutes);
app.use('/api/v1/ai/modules', moduleRegistryRoutes);
app.use('/api/v1/backend-modules', backendModuleBridge);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/ai-collaboration', aiCollaborationRoutes);
app.use('/api/v1/advanced', advancedFeatures);
app.use('/api/v1/enterprise-ai', enterpriseAIRoutes);

// Tier 1 Advanced Modules (M025-M030) - Production-level services
const advancedAnalyticsRoutes = require('./routes/advancedAnalyticsRoutes');
const predictiveIntelligenceRoutes = require('./routes/predictiveIntelligenceRoutes');
const iotIntegrationRoutes = require('./routes/iotIntegrationRoutes');
const blockchainVerificationRoutes = require('./routes/blockchainVerificationRoutes');
const digitalTwinRoutes = require('./routes/digitalTwinRoutes');
const enterpriseIntegrationRoutes = require('./routes/enterpriseIntegrationRoutes');

app.use('/api/analytics', advancedAnalyticsRoutes);
app.use('/api/predictive', predictiveIntelligenceRoutes);
app.use('/api/iot', iotIntegrationRoutes);
app.use('/api/blockchain', blockchainVerificationRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);
app.use('/api/enterprise', enterpriseIntegrationRoutes);

// Routes that existed but were never mounted anywhere
app.use('/api/v1/gst', gstRoutes);
// REMOVED: logisticsOpsRoutes - missing file, will crash app
// app.use('/api/v1/logistics-ops', logisticsOpsRoutes);

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

// Economic Layer routes (scaffolded) - RESTORED: These routes ARE exported from existing aggregate files
app.use('/api/v1/revenue', revenueRoutes);
app.use('/api/v1/pricing', riskPricingRoutes);
app.use('/api/v1/finance', recoveredFinanceRoutes);
// Climate monitoring routes - REMOVED: droughtMonitoringRoutes, floodMonitoringRoutes, diseaseForecastingRoutes, climateRiskRoutes, agroMeteorologyRoutes (missing files)
// Farm operations routes - RESTORED: Exported from operationsManagementRoutes.js
app.use('/api/v1/farm-activities', farmActivityRoutes);
app.use('/api/v1/farm-tasks', farmTaskRoutes);
app.use('/api/v1/contractors', contractorRoutes);
app.use('/api/v1/machinery-operations', machineryOperationsRoutes);
app.use('/api/v1/equipment-scheduling', equipmentSchedulingRoutes);
app.use('/api/v1/input-consumption', inputConsumptionRoutes);
app.use('/api/v1/farm-productivity', farmProductivityRoutes);
app.use('/api/v1/farm-operations-dashboard', farmOperationsDashboardRoutes);
// Water management routes - RESTORED: Exported from waterManagementRoutes.js
app.use('/api/v1/water-budgeting/budgets', waterBudgetingRoutes);
app.use('/api/v1/water-quality/readings', waterQualityRoutes);
app.use('/api/v1/rainwater-harvesting/structures', rainwaterHarvestingRoutes);
app.use('/api/v1/watersheds', watershedManagementRoutes);
app.use('/api/v1/water-analytics/records', waterAnalyticsRoutes);
// Soil management routes - RESTORED: Exported from soilManagementRoutes.js
app.use('/api/v1/soil-health/cards', soilHealthRoutes);
app.use('/api/v1/nutrient-management/plans', nutrientManagementRoutes);
app.use('/api/v1/fertility-management/records', fertilityManagementRoutes);
// Community management routes - RESTORED: Exported from communityManagementRoutes.js
app.use('/api/v1/blocks', blockManagementRoutes);
app.use('/api/v1/districts', districtManagementRoutes);
app.use('/api/v1/states', stateManagementRoutes);
app.use('/api/v1/producer-groups', producerGroupRoutes);
app.use('/api/v1/community-assets', communityAssetRoutes);
app.use('/api/v1/rural-development/projects', ruralDevelopmentRoutes);
// Input supply routes - RESTORED: Exported from inputSupplyManagementRoutes.js
app.use('/api/v1/biofertilizers', biofertilizerRoutes);
app.use('/api/v1/pesticide-inventory', pesticideInventoryRoutes);
app.use('/api/v1/bio-pesticides', bioPesticideRoutes);
app.use('/api/v1/micronutrients', micronutrientRoutes);
app.use('/api/v1/organic-inputs', organicInputRoutes);
app.use('/api/v1/input-procurement/orders', inputProcurementRoutes);
app.use('/api/v1/input-distribution/records', inputDistributionRoutes);
app.use('/api/v1/input-traceability/records', inputTraceabilityRoutes);
// Livestock routes - RESTORED: Exported from livestockManagementRoutes.js
app.use('/api/v1/cattle-registry/animals', cattleRegistryRoutes);
app.use('/api/v1/livestock-feed/records', feedManagementRoutes);
app.use('/api/v1/livestock-analytics/records', livestockAnalyticsRoutes);
// Other routes - RESTORED: Exported from existing files
app.use('/api/v1/farmer-family/members', farmerFamilyRoutes);
app.use('/api/v1/land-leases', landLeaseRoutes);
app.use('/api/v1/gis-land-mapping/parcels', gisLandMappingRoutes);
app.use('/api/v1/soil-mapping/zones', soilMappingRoutes);
app.use('/api/v1/water-resource-mapping/resources', waterResourceMappingRoutes);
app.use('/api/v1/geo-boundaries', geoBoundaryRoutes);
app.use('/api/v1/land-surveys', surveyManagementRoutes);
app.use('/api/v1/crop-registration/crops', cropRegistrationRoutes);
app.use('/api/v1/crop-varieties', cropVarietyRoutes);
app.use('/api/v1/seed-planning/plans', seedPlanningRoutes);
app.use('/api/v1/nurseries', nurseryManagementRoutes);
app.use('/api/v1/sowing/records', sowingManagementRoutes);
app.use('/api/v1/crop-monitoring/observations', cropMonitoringRoutes);
app.use('/api/v1/preventive-maintenance', preventiveMaintenanceRoutes);
app.use('/api/v1/vegetable-production', vegetableProductionRoutes);
app.use('/api/v1/floriculture', floricultureRoutes);
app.use('/api/v1/polyhouse-management', polyhouseManagementRoutes);
app.use('/api/v1/hydroponics', hydroponicsRoutes);
app.use('/api/v1/aeroponics', aeroponicsRoutes);
app.use('/api/v1/precision-horticulture', precisionHorticultureRoutes);
app.use('/api/v1/protected-cultivation', protectedCultivationRoutes);
app.use('/api/v1/horticulture-analytics', horticultureAnalyticsRoutes);
app.use('/api/v1/drought-monitoring', droughtMonitoringRoutes);
app.use('/api/v1/flood-monitoring', floodMonitoringRoutes);
app.use('/api/v1/disease-forecasting', diseaseForecastingRoutes);
app.use('/api/v1/climate-risk', climateRiskRoutes);
app.use('/api/v1/agro-meteorology', agroMeteorologyRoutes);
app.use('/api/v1/biofloc-farms', biofloccFarmRoutes);
app.use('/api/v1/hatchery-management', hatcheryManagementRoutes);
app.use('/api/v1/fish-feed', fishFeedRoutes);
app.use('/api/v1/fisheries-water-quality', fisheriesWaterQualityRoutes);
app.use('/api/v1/fish-health', fishHealthRoutes);
app.use('/api/v1/fisheries-harvest', fisheriesHarvestRoutes);
app.use('/api/v1/fish-processing', fishProcessingRoutes);
app.use('/api/v1/cold-fish-chain', coldFishChainRoutes);
app.use('/api/v1/aquaculture-analytics', aquacultureAnalyticsRoutes);
app.use('/api/v1/permissions', permissionManagementRoutes);
app.use('/api/v1/sso-providers', ssoRoutes);
app.use('/api/v1/mfa-devices', mfaManagementRoutes);
app.use('/api/v1/digital-identities', digitalIdentityRoutes);
app.use('/api/v1/consent-records', consentManagementRoutes);
app.use('/api/v1/sessions', sessionManagementRoutes);
app.use('/api/v1/roles', roleManagementRoutes);
app.use('/api/v1/irrigation/schedules', irrigationSchedulesRoutes);
app.use('/api/v1/irrigation/water-sources', irrigationWaterSourcesRoutes);
app.use('/api/v1/irrigation/logs', irrigationLogsRoutes);
app.use('/api/v1/realtime-monitoring', realtimeMonitoringRoutes);
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
app.use('/api/v1/decision-support', decisionSupportRoutes);
app.use('/api/v1/crop-planning', cropPlanningRoutes);
app.use('/api/v1/land-records', landRecordsRoutes);
app.use('/api/v1/nutrition-intelligence', nutritionIntelligenceRoutes);
app.use('/api/v1/apiculture', apicultureRoutes);
app.use('/api/v1/fisheries', legacyFisheriesRoutes);
app.use('/api/v1/forestry', forestryRoutes);
app.use('/api/v1/mushroom', mushroomRoutes);
app.use('/api/v1/sericulture', sericultureRoutes);
app.use('/api/v1/vermicompost', vermicompostRoutes);
app.use('/api/v1/product-reviews', productReviewRoutes);
app.use('/api/v1/cooperative-shares', cooperativeShareRoutes);
// Real Wikimedia REST API reference lookups (see services/wikipediaService.js).
app.use('/api/v1/wikipedia', wikipediaRoutes);
app.use('/api/v1/agri-intelligence', agriculturalIntelligenceRoutes);
// farmerHealthRoutes has real welfare-program/health-summary endpoints not
// covered by the generic M029 CRUD scaffold at /api/v1/modules/m029 — kept
// distinct rather than merged to avoid touching the generated scaffold.
app.use('/api/v1/farmer-health', farmerHealthRoutes);
app.use('/api/v1/food', foodRoutes);
app.use('/api/v1/variety-directory', regionalVarietyRoutes);
app.use('/api/v1/folu-benchmark', foluBenchmarkRoutes);
app.use('/api/v1/civil-disruptions', civilDisruptionRoutes);
app.use('/api/v1/seller-ranking', sellerRankingRoutes);
app.use('/api/v1/seed-vault', seedVaultRoutes);
app.use('/api/v1/freight-pooling', freightPoolingRoutes);
app.use('/api/v1/return-load-board', returnLoadBoardRoutes);
app.use('/api/v1/glut-warning', glutWarningRoutes);
app.use('/api/v1/track', trackDartRoutes);
app.use('/api/v1/equipment-exchange', equipmentExchangeRoutes);
// Vision + OCR (real sharp / tesseract.js dispatch, see routes/visionRoutes.js).
app.use('/api/v1/vision', visionRoutes);
// AI Gateway - Real AI Backbone System
app.use('/api/v1/ai-gateway', aiGatewayRoutes);
// AI Intelligence Fabric Routes (EBD-MOD-00000001)
// (2026-08-29) These were mounted with no authMiddleware, so req.user was
// always undefined and handleAIRequest's checkAuthorization(undefined, ...)
// crashed on `user.role` with a 500 on EVERY call, authenticated or not -
// this endpoint never worked for anyone. Fixed alongside the executeEngine()
// placeholder fix (see core/ai/aiOrchestratorCore.js) since both blocked the
// same route from ever returning a real result.
app.post('/api/v1/ai/orchestrate', authMiddleware, handleAIRequest);
app.post('/api/v1/ai/classify', authMiddleware, handleAIRequest);
app.get('/api/v1/ai/capabilities', (req, res) => {
  const { getAIStatus } = require('./core/ai/index');
  res.json({ success: true, data: getAIStatus() });
});
app.get('/api/v1/ai/audit', (req, res) => {
  const { getAIStatus } = require('./core/ai/index');
  res.json({ success: true, data: getAIStatus() });
});
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
// Research and Development - R&D Management with AI Integration
app.use('/api/v1/research-and-development', researchAndDevelopmentRoutes);
// Information Sharing - Document and Knowledge Sharing with AI Integration
app.use('/api/v1/information-sharing', informationSharingRoutes);
// Community - Community Management with AI Integration
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
// Escrow service - secure fund holding for transactions
escrowService.setupRoutes(app);
// Custody event service - chain tracking and settlement instructions
custodyEventRoutes.setupRoutes(app);
// Health check endpoints for monitoring with specialized monitoring
app.use('/health', healthCheckMonitoring, healthRoutes);
// iotSensorService.setupRoutes registers full paths directly on `app`
// (not a sub-router) — see services/iotSensorService.js line ~600.
iotSensorService.initialize().catch((error) => logger.warn('iotSensorService initialize failed', { error: error.message }));
iotSensorService.setupRoutes(app);
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

// GraphQL endpoint — disabled by default (ENABLE_GRAPHQL unset). Never actually
// built: no schema file exists under src/graphql/ and express-graphql isn't in
// package.json, so this throws MODULE_NOT_FOUND if ever enabled. Left as a
// clearly-failing stub rather than silently no-op-ing.
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

// Module-scoped so gracefulShutdown() (inside startServer(), a separate
// function declared later) can still clear them - they used to be `let`
// inside initializeDecisionLayer() only, out of scope the moment that
// function returned, so shutdown itself threw ReferenceError instead of
// clearing the timers and exiting cleanly.
let learningTimer = null;
let mandiTimer = null;

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
    learningTimer = setInterval(() => {
      resolver.runCycle().catch((error) => {
        logger.warn('learning cycle skipped', { error: error.message });
      });
    }, everyMinutes * 60 * 1000);
    learningTimer.unref();   // never hold the process open for this
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
    mandiTimer = setInterval(runMandiRefresh, everyHours * 60 * 60 * 1000);
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

async function startServer() {
  try {
    // Initialize Database Enhancements
    logger.info('Initializing database enhancements...');
    await initializeDatabaseEnhancements({
      enableAdvancedPooling: true,
      enableCaching: true,
      enableTransactions: true,
      enableMonitoring: true,
      enableSecurity: true,
      enableBackup: process.env.NODE_ENV === 'production',
      enableOptimization: true,
      environment: process.env.NODE_ENV || 'development',
      poolConfig: {
        min: parseInt(process.env.DATABASE_POOL_MIN) || 10,
        max: parseInt(process.env.DATABASE_POOL_MAX) || 20,
        idleTimeoutMillis: parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT) || 30000
      },
      cacheConfig: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        defaultTTL: 3600
      },
      monitoringConfig: {
        slowQueryThreshold: 1000,
        enableAlerting: true
      },
      securityConfig: {
        enableColumnEncryption: true,
        encryptionKey: process.env.ENCRYPTION_KEY,
        enableRowLevelSecurity: true,
        enableAuditLogging: true
      },
      backupConfig: {
        backupInterval: 86400000,
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
        enableCloudStorage: !!process.env.AWS_S3_BUCKET,
        enableEncryption: true
      }
    });
    logger.info('Database enhancements initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database enhancements', { error: error.message });
    logger.warn('Continuing without database enhancements...');
  }

  const PORT = process.env.PORT || 3001;
  
  // Initialize AI Intelligence Fabric (EBD-MOD-00000001)
  try {
    await initializeAI();
    logger.info('AI Intelligence Fabric initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize AI Intelligence Fabric', { error: error.message });
    logger.warn('Continuing without AI Intelligence Fabric...');
  }
  
  httpServer.listen(PORT, async () => {
    logger.info(`AFRERA Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API Gateway: http://localhost:${PORT}/api/v1`);
    
    // Log database enhancements status
    try {
      const enhancements = getDatabaseEnhancements();
      const health = await enhancements.getHealthStatus();
      logger.info('Database enhancements health status', { healthy: health.healthy });
    } catch (error) {
      logger.warn('Could not get database enhancements health status');
    }
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} signal received: starting graceful shutdown`);
    
    // Clear timers
    if (learningTimer) clearInterval(learningTimer);
    if (mandiTimer) clearInterval(mandiTimer);
    
    // Shutdown database enhancements
    try {
      logger.info('Shutting down database enhancements...');
      await shutdownDatabaseEnhancements();
      logger.info('Database enhancements shutdown complete');
    } catch (error) {
      logger.error('Error shutting down database enhancements', { error: error.message });
    }
    
    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force exit after timeout
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // A single missed .catch() outside a route handler would otherwise take down
  // the whole process with no log line explaining why. Log first, then shut
  // down through the same graceful path so in-flight requests aren't severed.
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {
      error: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined
    });
  });

  process.on('uncaughtException', (error) => {
    // The process is in an undefined state after this point; log and restart.
    logger.error('Uncaught exception - shutting down', {
      error: error.message,
      stack: error.stack
    });
    gracefulShutdown('uncaughtException');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, io };

