# Codex Production Hardening Audit

Generated: 2026-09-12T03:32:04.404Z

## Executive Summary

- Total repository files in map: 4,22,873
- Core/runtime files audited: 9,280
- Junk/quarantine candidates identified: 3,79,127
- Review-required support files: 34,466
- Core files with at least one hardening finding: 5,387

## Severity Counts

- critical: 0
- high: 587
- medium: 1,507
- low: 5,597

## Top Finding Types

- missing_adjacent_test: 4,885
- placeholder_or_todo: 1,448
- sql_interpolation_risk: 491
- console_logging: 476
- unreadable_file: 236
- route_auth_not_obvious: 95
- localhost_reference: 43
- test_secret_fixture: 15
- unsafe_dynamic_execution: 1
- large_core_file: 1

## Highest Priority Files

| Severity | Issues | Path |
| --- | ---: | --- |
| high | 4 | `backend/src/modules/M001_PLATFORM_CORE/backend/service.js` |
| high | 4 | `backend/src/modules/TEMPLATES/MODULE_TEMPLATE/backend/service.js` |
| high | 3 | `backend/src/core/aiOrchestrator.js` |
| high | 3 | `backend/src/modules/M400_AI_BACKBONE/backend/service.js` |
| high | 3 | `backend/src/routes/aiBrainRoutes_merged.js` |
| high | 3 | `backend/src/routes/aiGatewayRoutes_merged.js` |
| high | 3 | `backend/src/routes/aiOperationIntelligenceRoutes_merged.js` |
| high | 3 | `backend/src/routes/aiSelfHealingRoutes_merged.js` |
| high | 3 | `backend/src/routes/ar.js` |
| high | 3 | `backend/src/routes/auditTrail.js` |
| high | 3 | `backend/src/routes/automation.js` |
| high | 3 | `backend/src/routes/biometric.js` |
| high | 3 | `backend/src/routes/blockchainTrace.js` |
| high | 3 | `backend/src/routes/bulkOrders.js` |
| high | 3 | `backend/src/routes/certificationManagement.js` |
| high | 3 | `backend/src/routes/claude/backendModuleBridge.js` |
| high | 3 | `backend/src/routes/claude/moduleRegistryRoutes.js` |
| high | 3 | `backend/src/routes/climateAdvisory.js` |
| high | 3 | `backend/src/routes/climateAdvisoryRoutes_merged.js` |
| high | 3 | `backend/src/routes/cloudManagementRoutes.js` |
| high | 3 | `backend/src/routes/coldChainMonitoring.js` |
| high | 3 | `backend/src/routes/complianceTracking.js` |
| high | 3 | `backend/src/routes/databaseManagementRoutes.js` |
| high | 3 | `backend/src/routes/dataVisualization.js` |
| high | 3 | `backend/src/routes/ENDPOINT_MISMATCH_FIXER.js` |
| high | 3 | `backend/src/routes/ENDPOINT_MISMATCH_FIXER_COMPLETE.js` |
| high | 3 | `backend/src/routes/energyRoutes_merged.js` |
| high | 3 | `backend/src/routes/enterpriseAIRoutes_merged.js` |
| high | 3 | `backend/src/routes/equipmentExchangeRoutes_merged.js` |
| high | 3 | `backend/src/routes/farmAnalytics.js` |
| high | 3 | `backend/src/routes/farmerHealthRoutes_merged.js` |
| high | 3 | `backend/src/routes/fertilizerRoutes_merged.js` |
| high | 3 | `backend/src/routes/financialAnalytics.js` |
| high | 3 | `backend/src/routes/foodRoutes_merged.js` |
| high | 3 | `backend/src/routes/freightPooling.js` |
| high | 3 | `backend/src/routes/governanceModule.js` |
| high | 3 | `backend/src/routes/greenhouse.js` |
| high | 3 | `backend/src/routes/gstRoutes_merged.js` |
| high | 3 | `backend/src/routes/horticulture.js` |
| high | 3 | `backend/src/routes/iotSensors.js` |
| high | 3 | `backend/src/routes/livestock.js` |
| high | 3 | `backend/src/routes/loanManagement.js` |
| high | 3 | `backend/src/routes/logistics/coldStorageRoutes_merged.js` |
| high | 3 | `backend/src/routes/logistics/geofencingRoutes_merged.js` |
| high | 3 | `backend/src/routes/logisticsEnhancementRoutes_merged.js` |
| high | 3 | `backend/src/routes/M041VillageERP.js` |
| high | 3 | `backend/src/routes/marketAnalytics.js` |
| high | 3 | `backend/src/routes/mlOptimization.js` |
| high | 3 | `backend/src/routes/nlp.js` |
| high | 3 | `backend/src/routes/phase10.js` |
| high | 3 | `backend/src/routes/phase11.js` |
| high | 3 | `backend/src/routes/phase12.js` |
| high | 3 | `backend/src/routes/phase8.js` |
| high | 3 | `backend/src/routes/phase9.js` |
| high | 3 | `backend/src/routes/platformConfigurationRoutes_merged.js` |
| high | 3 | `backend/src/routes/predictiveAnalytics.js` |
| high | 3 | `backend/src/routes/productCertifications.js` |
| high | 3 | `backend/src/routes/publicDomainDataExtractionRoutes_merged.js` |
| high | 3 | `backend/src/routes/qualityAssurance.js` |
| high | 3 | `backend/src/routes/researchAndDevelopmentRoutes_merged.js` |
| high | 3 | `backend/src/routes/resourceRouteFactory.js` |
| high | 3 | `backend/src/routes/riskAssessment.js` |
| high | 3 | `backend/src/routes/sapModuleArchitectureRoutes_merged.js` |
| high | 3 | `backend/src/routes/sellerVerifications.js` |
| high | 3 | `backend/src/routes/serverManagementRoutes_merged.js` |
| high | 3 | `backend/src/routes/soilHealth.js` |
| high | 3 | `backend/src/routes/startupEnvironmentRoutes_merged.js` |
| high | 3 | `backend/src/routes/supplyChainAnalytics.js` |
| high | 3 | `backend/src/routes/supplyChainTracking.js` |
| high | 3 | `backend/src/routes/systemAdministrationRoutes_merged.js` |
| high | 3 | `backend/src/routes/tenantManagementRoutes_merged.js` |
| high | 3 | `backend/src/routes/unifiedAIGateway.js` |
| high | 3 | `backend/src/routes/unifiedLedgerRoutes_merged.js` |
| high | 3 | `backend/src/routes/vendorRoutes_merged.js` |
| high | 3 | `backend/src/routes/videoAnalytics.js` |
| high | 3 | `backend/src/routes/vr.js` |
| high | 3 | `backend/src/routes/warehouseManagement.js` |
| high | 3 | `backend/src/routes/yieldManagement.js` |
| high | 3 | `backend/src/services/claude/aiCollaborationService.js` |
| high | 3 | `backend/src/services/claude/enhancedLibraryKnowledgeService.js` |
| high | 3 | `backend/src/services/commerce/arVrService.js` |
| high | 3 | `backend/src/services/commerce/orderService.js` |
| high | 3 | `backend/src/services/dual-use/gdprService.js` |
| high | 3 | `backend/src/services/finance/revenueService.js` |
| high | 3 | `backend/src/services/food/nutritionIntelligenceService.js` |
| high | 3 | `backend/src/services/legacy/arVrService.js` |
| high | 3 | `backend/src/services/legacy/costService.js` |
| high | 3 | `backend/src/services/legacy/demandService.js` |
| high | 3 | `backend/src/services/legacy/multilingualService.js` |
| high | 3 | `backend/src/services/legacy/nutritionIntelligenceService.js` |
| high | 3 | `backend/src/services/legacy/revenueService.js` |
| high | 3 | `backend/src/services/legacy/weatherService.js` |
| high | 3 | `backend/src/services/machineryVillageOpsService.js` |
| high | 3 | `backend/src/services/platform/multilingualService.js` |
| high | 3 | `backend/src/services/soilNutrientLandService.js` |
| high | 3 | `backend/src/services/strategic/contractFarmingService.js` |
| high | 3 | `backend/src/services/strategic/governmentSubsidyService.js` |
| high | 3 | `backend/src/services/strategic/preSeasonPurchaseService.js` |
| high | 3 | `backend/src/services/vendorProcurementService.js` |
| high | 3 | `backend/src/services/waterIrrigationService.js` |

## Immediate Production Rules

- Critical findings must block release until secrets/dynamic execution risks are removed.
- High findings need owner review before production exposure, especially route authorization and SQL interpolation risks.
- Medium findings should be folded into the next hardening sprint.
- Low findings are mostly test and logging quality debt; track them continuously instead of treating them as release blockers.

Detailed machine-readable data is in `docs/codex-production-hardening-audit.json` and `docs/codex-production-hardening-audit.csv`.
