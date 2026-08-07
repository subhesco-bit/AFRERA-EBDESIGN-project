# Per-Module Deep Audit

**Generated:** 2026-08-07 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

**Modules:** 112 · **Endpoints:** 799 · **AI applications:** 138

## Control matrix

Auth · Adm(in) · Txn · Val(idation) · Err · Log · RL(rate limit). Score is out of 7.

| Module | Lines | Rts | ERP | AI | Emit | Sub | Auth | Adm | Txn | Val | Err | Log | RL | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| logisticsEnhancementRoutes | 411 | 26 | AF-TM | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| digitalProductPassportService | 1060 | 25 | AF-MDM | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| marketplaceEnhancements | 252 | 23 | AF-SD | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| governanceModule | 227 | 22 | AF-SEC | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| foodSafetyService | 936 | 21 | AF-QM | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| farmerPortalEnhancements | 210 | 20 | — | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| logisticsEnhancements | 213 | 20 | AF-TM | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| indigenousKnowledgeService | 825 | 19 | AF-AGRI | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| insuranceEnhancements | 192 | 18 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| biodiversityService | 896 | 17 | AF-AGRI | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| recipeIntelligenceService | 907 | 17 | AF-PP | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| institutionalProcurementService | 785 | 16 | AF-MM | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| shelfLifeService | 881 | 16 | AF-WM | 3 | 2 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| gstRoutes | 451 | 16 | AF-FI | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| omnichannelAIService | 789 | 15 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| consumerHealthService | 750 | 14 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| experienceRoutes | 75 | 14 | — | · | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| enterpriseControlService | 565 | 13 | AF-SEC AF-CRM | 1 | 2 | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| laboratoryERPService | 602 | 13 | AF-QM | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| organicTraceabilityService | 848 | 13 | AF-AGRI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| enterpriseAIRoutes | 137 | 13 | — | 4 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| multilingualService | 816 | 12 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| recoveredFinanceRoutes | 130 | 12 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| aiCopilotService | 592 | 11 | — | 3 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| giIntelligenceService | 715 | 11 | AF-AGRI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| insuranceService | 687 | 11 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| iotIntegrationService | 594 | 11 | — | 2 | 1 | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| logisticsService | 598 | 11 | AF-TM | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| v42IntelligenceService | 467 | 11 | AF-TM | · | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| riskPricingRoutes | 181 | 11 | — | · | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| vendorRoutes | 298 | 11 | AF-MM | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| arVrService | 557 | 10 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| authService | 1216 | 10 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| blockchainTraceabilityService | 716 | 10 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| conversationalAIService | 557 | 10 | AF-CS | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| foodIntelligenceService | 728 | 10 | — | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| merchandisingService | 461 | 10 | AF-SD | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| nutritionIntelligenceService | 644 | 10 | AF-AGRI | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| offlinePaymentService | 700 | 10 | AF-FI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| orderService | 814 | 10 | AF-SD | · | 1 | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| voiceAIService | 495 | 10 | — | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| weatherRoutes | 51 | 10 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| predictiveAnalyticsService | 491 | 9 | — | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| advancedFeatures | 105 | 9 | — | 2 | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| decisionSupportRoutes | 196 | 9 | AF-CS | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| rfqRoutes | 49 | 9 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| advancedAIService | 1543 | 8 | — | 8 | 2 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| catalogIntelligenceService | 904 | 8 | AF-MDM | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| financialService | 567 | 8 | AF-FI | 1 | · | · | ✓ | · | ✓ | ✓ | ✓ | ✓ | · | **5/7** |
| formService | 435 | 8 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| offlineSyncService | 834 | 8 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | ✓ | **5/7** |
| productService | 549 | 8 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| valueCommerceService | 502 | 8 | AF-SD | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| auditRoutes | 97 | 8 | AF-SEC | · | · | · | · | ✓ | · | · | ✓ | · | · | **2/7** |
| complianceRoutes | 37 | 8 | AF-SEC | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| erpService | 943 | 7 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| knowledgeGraphService | 407 | 7 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| erpRoutes | 272 | 7 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| farmerRoutes | 100 | 7 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| foodRoutes | 292 | 7 | — | 2 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| advancedVoiceAI | 758 | 6 | — | 3 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| neProductIntelligenceService | 347 | 6 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| energyRoutes | 258 | 6 | — | 2 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| marketDataRoutes | 39 | 6 | — | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| aiService | 663 | 5 | — | 5 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| commerceRulesService | 275 | 5 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| farmerValueService | 462 | 5 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| smsAuthService | 596 | 5 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | ✓ | **4/7** |
| foluRoutes | 31 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| moduleCatalogService | 237 | 4 | AF-MDM | 1 | · | · | · | · | · | · | ✓ | ✓ | ✓ | **3/7** |
| analyticsService | 145 | 3 | — | 1 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| demandRoutes | 28 | 3 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| costRoutes | 28 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| revenueRoutes | 28 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| advancedFeaturesService | 515 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| aiOrchestrationService | 118 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| auditService | 370 | 0 | AF-SEC | · | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| bulkOrderService | 511 | 0 | AF-SD | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| complianceService | 273 | 0 | AF-SEC | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| costService | 91 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| cropPlanningService | 520 | 0 | AF-AGRI | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| decisionSupportService | 416 | 0 | AF-CS | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| demandService | 156 | 0 | — | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| dynamicPricingService | 696 | 0 | AF-SD | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| EnergyCostCalculator | 299 | 0 | — | 2 | · | · | · | · | · | · | · | · | · | **0/7** |
| enterpriseAIService | 458 | 0 | — | 4 | · | · | · | · | · | · | · | · | · | **0/7** |
| CostControlModule | 395 | 0 | — | 3 | · | · | · | · | · | · | · | · | · | **0/7** |
| experienceLayerService | 442 | 0 | — | 1 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| farmerService | 618 | 0 | — | 1 | · | · | ✓ | · | ✓ | ✓ | ✓ | ✓ | · | **5/7** |
| farmerTrainingService | 735 | 0 | AF-HCM | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| FoodIntelligenceEngine | 446 | 0 | — | 2 | · | · | · | · | · | · | · | · | · | **0/7** |
| governanceService | 571 | 0 | AF-SEC | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| governmentSchemeService | 706 | 0 | — | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| greenhouseService | 536 | 0 | AF-PM | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| gstService | 226 | 0 | AF-FI | · | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| insuranceClaimsService | 587 | 0 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| insuranceFraudDetectionService | 594 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| insurancePolicyIssuanceService | 523 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| insurancePremiumService | 417 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| landRecordsService | 462 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| logisticsEnhancementService | 698 | 0 | AF-TM | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| marketDataService | 393 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| preSeasonOrderService | 751 | 0 | AF-SD | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| productReviewService | 426 | 0 | AF-MDM | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| recoveredFinanceService | 424 | 0 | — | 1 | · | · | · | · | ✓ | ✓ | ✓ | ✓ | · | **4/7** |
| revenueService | 109 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| rfqService | 217 | 0 | — | 1 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| riskPricingService | 407 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| sharedInfraService | 606 | 0 | AF-PM | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| soilTestingService | 613 | 0 | AF-AGRI | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| subsidyService | 592 | 0 | AF-TR | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| weatherService | 252 | 0 | — | 3 | · | · | · | · | · | ✓ | · | · | · | **1/7** |

## Modules with routes but weak controls (score < 4)

- **logisticsEnhancementRoutes** — 26 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **indigenousKnowledgeService** — 19 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **biodiversityService** — 17 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **shelfLifeService** — 16 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **gstRoutes** — 16 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **omnichannelAIService** — 15 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **experienceRoutes** — 14 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **enterpriseAIRoutes** — 13 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **recoveredFinanceRoutes** — 12 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **aiCopilotService** — 11 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **riskPricingRoutes** — 11 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **vendorRoutes** — 11 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **arVrService** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **foodIntelligenceService** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **merchandisingService** — 10 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Rate limiting
- **voiceAIService** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **weatherRoutes** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **predictiveAnalyticsService** — 9 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **decisionSupportRoutes** — 9 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **rfqRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **advancedAIService** — 8 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **catalogIntelligenceService** — 8 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Rate limiting
- **auditRoutes** — 8 routes, 2/7 controls, missing: Authentication, Transactions, Input validation, Logging, Rate limiting
- **complianceRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **erpRoutes** — 7 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **farmerRoutes** — 7 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **foodRoutes** — 7 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **advancedVoiceAI** — 6 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **energyRoutes** — 6 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **marketDataRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **aiService** — 5 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **foluRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **moduleCatalogService** — 4 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Input validation
- **analyticsService** — 3 routes, 2/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Rate limiting
- **demandRoutes** — 3 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **costRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **revenueRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
