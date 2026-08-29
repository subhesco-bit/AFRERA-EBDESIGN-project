# AI Application Map — applications WITHIN each module

**Generated:** 2026-08-28 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

The question is not how many modules exist, but how many AI applications
operate inside each one.

- Modules with at least one AI application: **142 / 327**
- Total AI applications: **265**
- Modules with routes and NO AI: **118**

## Randomness review list — NOT a verdict

An earlier audit reported 37 `Math.random()` calls as "fabricated AI".
That was wrong three times over: most are legitimate ID generation, one was
a COMMENT documenting a past fix, and one was a padded policy serial.

**Automated classification of random() intent is unreliable.** This section
lists calls for HUMAN REVIEW with the source line shown, rather than
asserting fabrication. Judge each on the line, not on the count.

| Use | Count |
|---|---|
| Matches ID/code/hash/serial patterns (likely fine) | 60 |
| **Needs review** | **1** |

### For review — file, line, and the actual code

**backend/src/services/legacy/researchAndDevelopmentService.js**

- L564: `return responses[Math.floor(Math.random() * responses.length)];`

## AI applications per module

| Module | Count | Applications |
|---|---|---|
| advancedAIService | 8 | Forecasting, Scoring / ranking, Statistics (tested), Anomaly / outlier, Recommendation, Classification, NLP / language, Vision |
| hrService | 7 | Forecasting, Scoring / ranking, Statistics (tested), Anomaly / outlier, Recommendation, Classification, NLP / language |
| aiService | 5 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation, Classification |
| analyticsService | 5 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation, Classification |
| enterpriseAIRoutes | 4 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation |
| hrRoutes | 4 | Forecasting, Anomaly / outlier, Recommendation, NLP / language |
| researchAndDevelopmentService | 4 | Anomaly / outlier, Recommendation, Classification, Vision |
| weatherService | 4 | Forecasting, Scoring / ranking, Recommendation, Classification |
| shelfLifeService | 3 | Scoring / ranking, Anomaly / outlier, Recommendation |
| nutritionIntelligenceService | 3 | Scoring / ranking, Recommendation, Classification |
| catalogIntelligenceService | 3 | Forecasting, Scoring / ranking, Recommendation |
| advancedVoiceAI | 3 | Scoring / ranking, Recommendation, NLP / language |
| advancedFeaturesService | 3 | Forecasting, Scoring / ranking, Recommendation |
| agriculturalIntelligenceService | 3 | Forecasting, Scoring / ranking, Recommendation |
| aiBackboneService | 3 | Forecasting, Scoring / ranking, Recommendation |
| aiGatewayService | 3 | Forecasting, Scoring / ranking, Recommendation |
| aiOperationIntelligenceService | 3 | Forecasting, Anomaly / outlier, Recommendation |
| completeAIIntegrationService | 3 | Forecasting, Scoring / ranking, Recommendation |
| cropPlanningService | 3 | Forecasting, Scoring / ranking, Recommendation |
| digitalTwinService | 3 | Forecasting, Scoring / ranking, Recommendation |
| dynamicPricingService | 3 | Scoring / ranking, MCDA decision, Recommendation |
| ecommerceAIService | 3 | Forecasting, Scoring / ranking, Recommendation |
| farmerTrainingService | 3 | Forecasting, Scoring / ranking, Recommendation |
| governmentSchemeService | 3 | Forecasting, Scoring / ranking, Recommendation |
| insuranceFraudDetectionService | 3 | Scoring / ranking, Anomaly / outlier, Recommendation |
| knowledgeService | 3 | Scoring / ranking, Recommendation, Classification |
| preSeasonOrderService | 3 | Forecasting, Scoring / ranking, Recommendation |
| sharedInfraService | 3 | Forecasting, Scoring / ranking, Recommendation |
| systemAdministrationService | 3 | Forecasting, Scoring / ranking, Recommendation |
| foodSafetyService | 2 | Scoring / ranking, Recommendation |
| institutionalProcurementService | 2 | Forecasting, Scoring / ranking |
| biodiversityService | 2 | Scoring / ranking, Recommendation |
| aiOperationIntelligenceRoutes | 2 | Anomaly / outlier, Recommendation |
| multilingualService | 2 | Scoring / ranking, NLP / language |
| iotIntegrationService | 2 | Scoring / ranking, Anomaly / outlier |
| weatherRoutes | 2 | Forecasting, Scoring / ranking |
| conversationalAIService | 2 | Scoring / ranking, Recommendation |
| financialService | 2 | Scoring / ranking, MCDA decision |
| foodIntelligenceService | 2 | Scoring / ranking, Recommendation |
| ecommerceIntegrationRoutes | 2 | Scoring / ranking, Recommendation |
| predictiveAnalyticsService | 2 | Forecasting, Scoring / ranking |
| advancedFeatures | 2 | Forecasting, Recommendation |
| valueCommerceService | 2 | Scoring / ranking, Recommendation |
| ecommerceAIRoutes | 2 | Forecasting, Recommendation |
| systemAdministrationRoutes | 2 | Forecasting, Recommendation |
| aiAdvisoryService | 2 | Scoring / ranking, Recommendation |
| erpService | 2 | Classification, Vision |
| unifiedAIRoutes | 2 | Forecasting, Recommendation |
| foodRoutes | 2 | Scoring / ranking, Recommendation |
| unifiedAIRoutes | 2 | Registered agent, Forecasting |
| energyRoutes | 2 | Forecasting, Recommendation |
| farmerValueService | 2 | Scoring / ranking, MCDA decision |
| marketIntelligenceService | 2 | Forecasting, Recommendation |
| aiAgentService | 2 | Anomaly / outlier, Recommendation |
| EnergyCostCalculator | 2 | Scoring / ranking, Recommendation |
| FoodIntelligenceEngine | 2 | Scoring / ranking, Recommendation |
| aiAgenticCompanionService | 2 | Forecasting, Recommendation |
| aiBrainService | 2 | Scoring / ranking, Recommendation |
| aiSelfHealingService | 2 | Recommendation, Classification |
| climateMonitoringService | 2 | Forecasting, Scoring / ranking |
| comprehensiveERPService | 2 | Scoring / ranking, Vision |
| decisionSupportService | 2 | Scoring / ranking, Recommendation |
| demandService | 2 | Forecasting, Scoring / ranking |
| ecommerceIntegrationService | 2 | Scoring / ranking, Recommendation |
| ecommerceService | 2 | Scoring / ranking, Recommendation |
| greenhouseService | 2 | Forecasting, Recommendation |
| informationSharingService | 2 | Scoring / ranking, Recommendation |
| insuranceClaimsService | 2 | Scoring / ranking, Recommendation |
| marketDataService | 2 | Forecasting, Recommendation |
| organizationManagementService | 2 | Scoring / ranking, Recommendation |
| pigService | 2 | Scoring / ranking, Recommendation |
| platformConfigurationService | 2 | Scoring / ranking, Recommendation |
| realtimeMonitoringService | 2 | Scoring / ranking, Anomaly / outlier |
| sapModuleArchitectureService | 2 | NLP / language, Vision |
| soilTestingService | 2 | Scoring / ranking, Recommendation |
| subsidyService | 2 | Scoring / ranking, Recommendation |
| tenantManagementService | 2 | Scoring / ranking, Recommendation |
| digitalProductPassportService | 1 | Scoring / ranking |
| informationSharingRoutes | 1 | Recommendation |
| knowledgeRoutes | 1 | Recommendation |
| sheepRoutes | 1 | Recommendation |
| goatRoutes | 1 | Recommendation |
| pigRoutes | 1 | Recommendation |
| farmerPortalEnhancements | 1 | Recommendation |
| recipeIntelligenceService | 1 | Recommendation |
| consumerHealthService | 1 | Recommendation |
| completeAIIntegrationRoutes | 1 | Recommendation |
| costControlRoutes | 1 | Recommendation |
| enterpriseControlService | 1 | Scoring / ranking |
| logisticsService | 1 | Scoring / ranking |
| dairyRoutes | 1 | Recommendation |
| aiCopilotService | 1 | Recommendation |
| insuranceService | 1 | Scoring / ranking |
| productService | 1 | Scoring / ranking |
| aiSelfHealingRoutes | 1 | Classification |
| ecommerceRoutes | 1 | Recommendation |
| sharedInfrastructureService | 1 | Recommendation |
| voiceAIService | 1 | Scoring / ranking |
| organizationManagementRoutes | 1 | Recommendation |
| platformConfigurationRoutes | 1 | Recommendation |
| agriculturalIntelligenceRoutes | 1 | Recommendation |
| decisionSupportRoutes | 1 | Scoring / ranking |
| farmerTrainingRoutes | 1 | Recommendation |
| tenantManagementRoutes | 1 | Recommendation |
| formService | 1 | Scoring / ranking |
| knowledgeGraphService | 1 | Scoring / ranking |
| neProductIntelligenceService | 1 | Classification |
| marketDataRoutes | 1 | Forecasting |
| climateMonitoringRoutes | 1 | Forecasting |
| householdEconomyService | 1 | Scoring / ranking |
| moduleCatalogService | 1 | Recommendation |
| visionRoutes | 1 | Vision |
| demandRoutes | 1 | Forecasting |
| sellerRankingRoutes | 1 | Scoring / ranking |
| whatsappService | 1 | Classification |
| aiCollaborationService | 1 | Recommendation |
| enhancedLibraryKnowledgeService | 1 | Scoring / ranking |
| platformCoreService | 1 | Recommendation |
| completeERPIntegrationService | 1 | Vision |
| costControlService | 1 | Recommendation |
| dairyService | 1 | Recommendation |
| dprGenerationService | 1 | Scoring / ranking |
| experienceLayerService | 1 | Vision |
| farmerService | 1 | Scoring / ranking |
| foluBenchmarkService | 1 | Scoring / ranking |
| goatService | 1 | Recommendation |
| governanceService | 1 | Recommendation |
| gstService | 1 | Classification |
| iotSensorService | 1 | Anomaly / outlier |
| landRecordsService | 1 | Scoring / ranking |
| libraryKnowledgeService | 1 | Scoring / ranking |
| nutrientValueSalesService | 1 | Scoring / ranking |
| poultryService | 1 | Recommendation |
| productReviewService | 1 | Scoring / ranking |
| projectSystemsService | 1 | Classification |
| recoveredFinanceService | 1 | Scoring / ranking |
| rfqService | 1 | Anomaly / outlier |
| riskPricingService | 1 | Recommendation |
| roleManagementService | 1 | Recommendation |
| sellerRankingService | 1 | Scoring / ranking |
| sheepService | 1 | Recommendation |
| soilManagementService | 1 | Recommendation |

## Modules with endpoints but no AI

- comprehensiveERPRoutes (46 routes)
- logisticsEnhancementRoutes (26 routes)
- governanceModule (24 routes)
- marketplaceEnhancements (23 routes)
- researchAndDevelopmentRoutes (23 routes)
- nervousSystemRoutes (22 routes)
- logisticsEnhancements (21 routes)
- indigenousKnowledgeService (19 routes)
- poultryRoutes (19 routes)
- sapModuleArchitectureRoutes (19 routes)
- insuranceEnhancements (18 routes)
- gstRoutes (16 routes)
- omnichannelAIService (15 routes)
- completeERPIntegrationRoutes (15 routes)
- aiBrainRoutes (14 routes)
- animalHealthRoutes (14 routes)
- experienceRoutes (14 routes)
- projectSystemsRoutes (14 routes)
- laboratoryERPService (13 routes)
- organicTraceabilityService (13 routes)
- giIntelligenceService (11 routes)
- v42IntelligenceService (11 routes)
- riskPricingRoutes (11 routes)
- vendorRoutes (11 routes)
- authService (10 routes)
- arVrService (10 routes)
- blockchainTraceabilityService (10 routes)
- merchandisingService (10 routes)
- offlinePaymentService (10 routes)
- orderService (10 routes)
- aiAgentRoutes (10 routes)
- aiCollaborationRoutes (10 routes)
- aiCollaborationRoutes (10 routes)
- ecommerceMarketingRoutes (10 routes)
- recoveredFinanceRoutes (10 routes)
- buyingClubService (9 routes)
- assetAccountingRoutes (9 routes)
- bulkOrderRoutes (9 routes)
- backendModuleBridge (9 routes)
- nutrientValueSalesRoutes (9 routes)
- rfqRoutes (9 routes)
- roleManagementRoutes (9 routes)
- offlineSyncService (8 routes)
- procurementSubscriptionService (8 routes)
- auditRoutes (8 routes)
- coldStorageRoutes (8 routes)
- complianceRoutes (8 routes)
- ecommerceBusinessSalesRoutes (8 routes)
- farmerHealthRoutes (8 routes)
- ruralEnterpriseService (7 routes)
- aiGatewayRoutes (7 routes)
- libraryRoutes (7 routes)
- cooperativeShareRoutes (7 routes)
- gdprRoutes (7 routes)
- farmerRoutes (7 routes)
- fertilizerRoutes (7 routes)
- wearableIntegrationRoutes (7 routes)
- commerceRulesService (6 routes)
- custodyEventRoutes (6 routes)
- millCircuitService (6 routes)
- mobilityRidesService (6 routes)
- renewableEnergyService (6 routes)
- villageProfileService (6 routes)
- aiBackboneRoutes (6 routes)
- moduleRegistryRoutes (6 routes)
- ecommerceERPRoutes (6 routes)
- engineeringProjectRoutes (6 routes)
- equipmentExchangeRoutes (6 routes)
- freightPoolingRoutes (6 routes)
- geofencingRoutes (6 routes)
- healthRoutes (6 routes)
- fisheriesRoutes (6 routes)
- seedVaultRoutes (6 routes)
- machineryAccessService (5 routes)
- marketAccessService (5 routes)
- ruralFinanceService (5 routes)
- smsAuthService (5 routes)
- civilDisruptionRoutes (5 routes)
- communityManagementRoutes (5 routes)
- cropManagementRoutes (5 routes)
- dprGenerationRoutes (5 routes)
- mfaRoutes (5 routes)
- farmerFamilyRoutes (5 routes)
- fisheriesManagementRoutes (5 routes)
- foluRoutes (5 routes)
- horticultureManagementRoutes (5 routes)
- identityManagementRoutes (5 routes)
- inputSupplyManagementRoutes (5 routes)
- irrigationManagementRoutes (5 routes)
- landManagementRoutes (5 routes)
- apicultureRoutes (5 routes)
- forestryRoutes (5 routes)
- mushroomRoutes (5 routes)
- sericultureRoutes (5 routes)
- vermicompostRoutes (5 routes)
- livestockManagementRoutes (5 routes)
- operationsManagementRoutes (5 routes)
- platformCoreRoutes (5 routes)
- preventiveMaintenanceRoutes (5 routes)
- realtimeMonitoringRoutes (5 routes)
- regionalVarietyRoutes (5 routes)
- soilManagementRoutes (5 routes)
- waterManagementRoutes (5 routes)
- climateAdvisoryRoutes (4 routes)
- companyRoutes (4 routes)
- cropValueResearchRoutes (4 routes)
- defenseFitnessPrepRoutes (4 routes)
- devinRoutes (4 routes)
- productMediaAIRoutes (4 routes)
- returnLoadBoardRoutes (4 routes)
- enterpriseMemoryService (3 routes)
- costRoutes (2 routes)
- foluBenchmarkRoutes (2 routes)
- glutWarningRoutes (2 routes)
- platformTelemetryRoutes (2 routes)
- revenueRoutes (2 routes)
- wikipediaRoutes (2 routes)
- trackDartRoutes (1 routes)
