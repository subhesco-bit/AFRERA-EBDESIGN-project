# AI Application Map — applications WITHIN each module

**Generated:** 2026-08-07 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

The question is not how many modules exist, but how many AI applications
operate inside each one.

- Modules with at least one AI application: **70 / 112**
- Total AI applications: **138**
- Modules with routes and NO AI: **32**

## Randomness review list — NOT a verdict

An earlier audit reported 37 `Math.random()` calls as "fabricated AI".
That was wrong three times over: most are legitimate ID generation, one was
a COMMENT documenting a past fix, and one was a padded policy serial.

**Automated classification of random() intent is unreliable.** This section
lists calls for HUMAN REVIEW with the source line shown, rather than
asserting fabrication. Judge each on the line, not on the count.

| Use | Count |
|---|---|
| Matches ID/code/hash/serial patterns (likely fine) | 34 |
| **Needs review** | **2** |

### For review — file, line, and the actual code

**backend/src/services/erp/CostControlModule.js**

- L317: `return Math.random() * amount * 0.1;`
- L337: `return Math.random() * 1000;`

## AI applications per module

| Module | Count | Applications |
|---|---|---|
| advancedAIService | 8 | Forecasting, Scoring / ranking, Statistics (tested), Anomaly / outlier, Recommendation, Classification, NLP / language, Vision |
| aiService | 5 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation, Classification |
| enterpriseAIRoutes | 4 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation |
| enterpriseAIService | 4 | Forecasting, Scoring / ranking, Anomaly / outlier, Recommendation |
| shelfLifeService | 3 | Scoring / ranking, Anomaly / outlier, Recommendation |
| aiCopilotService | 3 | Forecasting, Scoring / ranking, Recommendation |
| catalogIntelligenceService | 3 | Forecasting, Scoring / ranking, Recommendation |
| advancedVoiceAI | 3 | Scoring / ranking, Recommendation, NLP / language |
| advancedFeaturesService | 3 | Forecasting, Scoring / ranking, Recommendation |
| cropPlanningService | 3 | Forecasting, Scoring / ranking, Recommendation |
| CostControlModule | 3 | Forecasting, Recommendation, Vision |
| farmerTrainingService | 3 | Forecasting, Scoring / ranking, Recommendation |
| governmentSchemeService | 3 | Forecasting, Scoring / ranking, Recommendation |
| insuranceFraudDetectionService | 3 | Scoring / ranking, Anomaly / outlier, Recommendation |
| preSeasonOrderService | 3 | Forecasting, Scoring / ranking, Recommendation |
| sharedInfraService | 3 | Forecasting, Scoring / ranking, Recommendation |
| weatherService | 3 | Forecasting, Scoring / ranking, Recommendation |
| foodSafetyService | 2 | Scoring / ranking, Recommendation |
| biodiversityService | 2 | Scoring / ranking, Recommendation |
| institutionalProcurementService | 2 | Forecasting, Scoring / ranking |
| multilingualService | 2 | Scoring / ranking, NLP / language |
| iotIntegrationService | 2 | Scoring / ranking, Anomaly / outlier |
| conversationalAIService | 2 | Scoring / ranking, Recommendation |
| foodIntelligenceService | 2 | Scoring / ranking, Recommendation |
| weatherRoutes | 2 | Forecasting, Scoring / ranking |
| predictiveAnalyticsService | 2 | Forecasting, Scoring / ranking |
| advancedFeatures | 2 | Forecasting, Recommendation |
| valueCommerceService | 2 | Scoring / ranking, Recommendation |
| erpService | 2 | Classification, Vision |
| foodRoutes | 2 | Scoring / ranking, Recommendation |
| energyRoutes | 2 | Forecasting, Recommendation |
| farmerValueService | 2 | Scoring / ranking, MCDA decision |
| decisionSupportService | 2 | Scoring / ranking, Recommendation |
| demandService | 2 | Forecasting, Scoring / ranking |
| dynamicPricingService | 2 | Scoring / ranking, Recommendation |
| EnergyCostCalculator | 2 | Scoring / ranking, Recommendation |
| FoodIntelligenceEngine | 2 | Scoring / ranking, Recommendation |
| greenhouseService | 2 | Forecasting, Recommendation |
| insuranceClaimsService | 2 | Scoring / ranking, Recommendation |
| marketDataService | 2 | Forecasting, Recommendation |
| soilTestingService | 2 | Scoring / ranking, Recommendation |
| subsidyService | 2 | Scoring / ranking, Recommendation |
| digitalProductPassportService | 1 | Scoring / ranking |
| farmerPortalEnhancements | 1 | Recommendation |
| recipeIntelligenceService | 1 | Recommendation |
| consumerHealthService | 1 | Recommendation |
| enterpriseControlService | 1 | Scoring / ranking |
| recoveredFinanceRoutes | 1 | Classification |
| insuranceService | 1 | Scoring / ranking |
| nutritionIntelligenceService | 1 | Scoring / ranking |
| voiceAIService | 1 | Scoring / ranking |
| decisionSupportRoutes | 1 | Scoring / ranking |
| financialService | 1 | Scoring / ranking |
| formService | 1 | Scoring / ranking |
| productService | 1 | Scoring / ranking |
| knowledgeGraphService | 1 | Scoring / ranking |
| erpRoutes | 1 | Forecasting |
| neProductIntelligenceService | 1 | Classification |
| marketDataRoutes | 1 | Forecasting |
| moduleCatalogService | 1 | Recommendation |
| analyticsService | 1 | Recommendation |
| demandRoutes | 1 | Forecasting |
| experienceLayerService | 1 | Vision |
| farmerService | 1 | Scoring / ranking |
| governanceService | 1 | Recommendation |
| landRecordsService | 1 | Scoring / ranking |
| productReviewService | 1 | Scoring / ranking |
| recoveredFinanceService | 1 | Scoring / ranking |
| rfqService | 1 | Anomaly / outlier |
| riskPricingService | 1 | Recommendation |

## Modules with endpoints but no AI

- logisticsEnhancementRoutes (26 routes)
- marketplaceEnhancements (23 routes)
- governanceModule (22 routes)
- logisticsEnhancements (20 routes)
- indigenousKnowledgeService (19 routes)
- insuranceEnhancements (18 routes)
- gstRoutes (16 routes)
- omnichannelAIService (15 routes)
- experienceRoutes (14 routes)
- laboratoryERPService (13 routes)
- organicTraceabilityService (13 routes)
- giIntelligenceService (11 routes)
- logisticsService (11 routes)
- v42IntelligenceService (11 routes)
- riskPricingRoutes (11 routes)
- vendorRoutes (11 routes)
- arVrService (10 routes)
- authService (10 routes)
- blockchainTraceabilityService (10 routes)
- merchandisingService (10 routes)
- offlinePaymentService (10 routes)
- orderService (10 routes)
- rfqRoutes (9 routes)
- offlineSyncService (8 routes)
- auditRoutes (8 routes)
- complianceRoutes (8 routes)
- farmerRoutes (7 routes)
- commerceRulesService (5 routes)
- smsAuthService (5 routes)
- foluRoutes (5 routes)
- costRoutes (2 routes)
- revenueRoutes (2 routes)
