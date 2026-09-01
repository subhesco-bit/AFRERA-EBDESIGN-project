# Per-Module Deep Audit

**Generated:** 2026-08-30 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

**Modules:** 329 · **Endpoints:** 1794 · **AI applications:** 268

## Control matrix

Auth · Adm(in) · Txn · Val(idation) · Err · Log · RL(rate limit). Score is out of 7.

| Module | Lines | Rts | ERP | AI | Emit | Sub | Auth | Adm | Txn | Val | Err | Log | RL | Score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| comprehensiveERPRoutes | 138 | 46 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| logisticsEnhancementRoutes | 333 | 26 | AF-TM | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| digitalProductPassportService | 1060 | 25 | AF-MDM | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| governanceModule | 247 | 24 | AF-SEC | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| marketplaceEnhancements | 252 | 23 | AF-SD | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| researchAndDevelopmentRoutes | 502 | 23 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| informationSharingRoutes | 473 | 22 | AF-MDM | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| knowledgeRoutes | 478 | 22 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| nervousSystemRoutes | 210 | 22 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| foodSafetyService | 958 | 21 | AF-QM | 2 | 1 | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| logisticsEnhancements | 225 | 21 | AF-TM | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| pigRoutes | 400 | 21 | — | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| sheepRoutes | 380 | 21 | — | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| farmerPortalEnhancements | 254 | 20 | — | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| goatRoutes | 427 | 20 | — | 1 | 4 | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| indigenousKnowledgeService | 826 | 19 | AF-AGRI | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| institutionalProcurementService | 921 | 19 | AF-MM | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| animalHealthRoutes | 395 | 19 | AF-HCM | · | 4 | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| insuranceEnhancements | 206 | 19 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| poultryRoutes | 327 | 19 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| sapModuleArchitectureRoutes | 458 | 19 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| biodiversityService | 897 | 17 | AF-AGRI | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| recipeIntelligenceService | 907 | 17 | AF-PP | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | ✓ | **4/7** |
| shelfLifeService | 881 | 16 | AF-WM | 3 | 2 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| gstRoutes | 452 | 16 | AF-FI | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| consumerHealthService | 899 | 15 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| nutritionIntelligenceService | 1166 | 15 | AF-AGRI | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| omnichannelAIService | 790 | 15 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| completeAIIntegrationRoutes | 123 | 15 | — | 1 | · | · | · | · | · | · | · | · | · | **0/7** |
| completeERPIntegrationRoutes | 123 | 15 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| costControlRoutes | 158 | 15 | — | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| platformCoreRoutes | 152 | 15 | AF-MDM | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| aiBrainRoutes | 382 | 14 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| experienceRoutes | 75 | 14 | — | · | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| projectSystemsRoutes | 153 | 14 | AF-PS | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| enterpriseControlService | 565 | 13 | AF-SEC AF-CRM | 1 | 2 | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| laboratoryERPService | 603 | 13 | AF-QM | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| logisticsService | 700 | 13 | AF-TM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| organicTraceabilityService | 848 | 13 | AF-AGRI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| aiOperationIntelligenceRoutes | 342 | 13 | — | 2 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| enterpriseAIRoutes | 296 | 13 | — | 4 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| multilingualService | 821 | 12 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| dairyRoutes | 153 | 12 | — | 1 | 1 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| aiCopilotService | 675 | 11 | — | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| giIntelligenceService | 708 | 11 | AF-AGRI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| insuranceService | 688 | 11 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| iotIntegrationService | 621 | 11 | — | 2 | 2 | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| productService | 635 | 11 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| v42IntelligenceService | 467 | 11 | AF-TM | · | · | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| aiSelfHealingRoutes | 308 | 11 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| ecommerceRoutes | 112 | 11 | — | 1 | · | · | ✓ | ✓ | · | · | · | · | ✓ | **3/7** |
| riskPricingRoutes | 181 | 11 | — | · | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| vendorRoutes | 298 | 11 | AF-MM | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| weatherRoutes | 57 | 11 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| authService | 1316 | 10 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | ✓ | **5/7** |
| arVrService | 567 | 10 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| blockchainTraceabilityService | 744 | 10 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| conversationalAIService | 557 | 10 | AF-CS | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| financialService | 805 | 10 | AF-FI | 2 | · | · | ✓ | · | ✓ | ✓ | ✓ | ✓ | · | **5/7** |
| foodIntelligenceService | 791 | 10 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| merchandisingService | 461 | 10 | AF-SD | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| offlinePaymentService | 717 | 10 | AF-FI | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| orderService | 882 | 10 | AF-SD | · | 1 | · | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | · | **6/7** |
| sharedInfrastructureService | 505 | 10 | AF-PM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| voiceAIService | 495 | 10 | — | 1 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| aiAgentRoutes | 271 | 10 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| aiCollaborationRoutes | 118 | 10 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| aiCollaborationRoutes | 244 | 10 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| ecommerceIntegrationRoutes | 113 | 10 | — | 2 | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| ecommerceMarketingRoutes | 113 | 10 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| organizationManagementRoutes | 157 | 10 | — | 1 | 2 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| platformConfigurationRoutes | 139 | 10 | AF-MDM | 1 | 1 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| recoveredFinanceRoutes | 134 | 10 | — | · | · | · | ✓ | · | · | ✓ | ✓ | · | · | **3/7** |
| buyingClubService | 426 | 9 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| predictiveAnalyticsService | 500 | 9 | — | 2 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| advancedFeatures | 105 | 9 | — | 2 | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| agriculturalIntelligenceRoutes | 99 | 9 | AF-AGRI | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| assetAccountingRoutes | 101 | 9 | AF-FI AF-PM AF-AA | · | · | · | ✓ | ✓ | · | · | ✓ | · | ✓ | **4/7** |
| bulkOrderRoutes | 65 | 9 | AF-SD | · | · | · | · | · | · | · | · | · | · | **0/7** |
| backendModuleBridge | 93 | 9 | — | · | · | · | ✓ | · | · | · | ✓ | · | ✓ | **3/7** |
| decisionSupportRoutes | 196 | 9 | AF-CS | 1 | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| farmerTrainingRoutes | 35 | 9 | AF-HCM | 1 | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| nutrientValueSalesRoutes | 121 | 9 | AF-SD | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| productReviewRoutes | 101 | 9 | AF-MDM | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| rfqRoutes | 49 | 9 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| roleManagementRoutes | 111 | 9 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| tenantManagementRoutes | 156 | 9 | — | 1 | 3 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| advancedAIService | 1607 | 8 | — | 8 | 2 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| catalogIntelligenceService | 904 | 8 | AF-MDM | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| formService | 444 | 8 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| offlineSyncService | 871 | 8 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | ✓ | **5/7** |
| procurementSubscriptionService | 383 | 8 | AF-MM | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| valueCommerceService | 511 | 8 | AF-SD | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| auditRoutes | 98 | 8 | AF-SEC | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| coldStorageRoutes | 91 | 8 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| complianceRoutes | 37 | 8 | AF-SEC | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| cropPlanningRoutes | 94 | 8 | AF-AGRI | 2 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| ecommerceAIRoutes | 109 | 8 | — | 2 | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| ecommerceBusinessSalesRoutes | 95 | 8 | AF-SD | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| farmerHealthRoutes | 104 | 8 | AF-HCM | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| hrRoutes | 161 | 8 | AF-HCM | 4 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| landRecordsRoutes | 94 | 8 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| systemAdministrationRoutes | 151 | 8 | — | 2 | 3 | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| aiAdvisoryService | 326 | 7 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| erpService | 944 | 7 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| knowledgeGraphService | 412 | 7 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| ruralEnterpriseService | 403 | 7 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| aiGatewayRoutes | 32 | 7 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| libraryRoutes | 190 | 7 | — | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| unifiedAIRoutes | 311 | 7 | — | 2 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| cooperativeShareRoutes | 82 | 7 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| gdprRoutes | 242 | 7 | AF-PS | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| farmerRoutes | 114 | 7 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| fertilizerRoutes | 81 | 7 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| foodRoutes | 292 | 7 | — | 2 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| unifiedAIRoutes | 104 | 7 | — | 2 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| wearableIntegrationRoutes | 26 | 7 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| advancedVoiceAI | 760 | 6 | — | 3 | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| commerceRulesService | 359 | 6 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| custodyEventRoutes | 227 | 6 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| millCircuitService | 217 | 6 | — | · | · | · | ✓ | · | ✓ | · | ✓ | ✓ | · | **4/7** |
| mobilityRidesService | 288 | 6 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| neProductIntelligenceService | 347 | 6 | AF-MDM | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| renewableEnergyService | 319 | 6 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| villageProfileService | 370 | 6 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| aiBackboneRoutes | 34 | 6 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| moduleRegistryRoutes | 96 | 6 | — | · | · | · | ✓ | · | · | · | ✓ | · | ✓ | **3/7** |
| ecommerceERPRoutes | 80 | 6 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| energyRoutes | 258 | 6 | — | 2 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| engineeringProjectRoutes | 72 | 6 | AF-PS | · | · | · | ✓ | · | · | · | ✓ | · | ✓ | **3/7** |
| equipmentExchangeRoutes | 68 | 6 | AF-PM | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| freightPoolingRoutes | 69 | 6 | AF-TM | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| geofencingRoutes | 86 | 6 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| healthRoutes | 454 | 6 | AF-HCM | · | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| fisheriesRoutes | 79 | 6 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| marketDataRoutes | 39 | 6 | — | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| seedVaultRoutes | 84 | 6 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| aiService | 717 | 5 | — | 5 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| farmerValueService | 462 | 5 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| machineryAccessService | 244 | 5 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| marketAccessService | 233 | 5 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| marketIntelligenceService | 205 | 5 | — | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| ruralFinanceService | 235 | 5 | — | · | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| smsAuthService | 596 | 5 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | ✓ | **4/7** |
| civilDisruptionRoutes | 59 | 5 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| climateMonitoringRoutes | 61 | 5 | — | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| communityManagementRoutes | 60 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| cropManagementRoutes | 59 | 5 | AF-AGRI | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| dprGenerationRoutes | 69 | 5 | AF-PS | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| mfaRoutes | 188 | 5 | — | · | · | · | ✓ | ✓ | · | · | ✓ | · | · | **3/7** |
| farmerFamilyRoutes | 47 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| fisheriesManagementRoutes | 64 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| foluRoutes | 31 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| horticultureManagementRoutes | 62 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| identityManagementRoutes | 90 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| inputSupplyManagementRoutes | 62 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| irrigationManagementRoutes | 57 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| landManagementRoutes | 59 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| apicultureRoutes | 71 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| forestryRoutes | 69 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| mushroomRoutes | 69 | 5 | AF-HCM | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| sericultureRoutes | 69 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| vermicompostRoutes | 69 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| livestockManagementRoutes | 55 | 5 | AF-WM | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| operationsManagementRoutes | 62 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| preventiveMaintenanceRoutes | 47 | 5 | AF-PM | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| realtimeMonitoringRoutes | 66 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| regionalVarietyRoutes | 63 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| soilManagementRoutes | 54 | 5 | AF-AGRI | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| waterManagementRoutes | 58 | 5 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| householdEconomyService | 220 | 4 | — | 1 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| moduleCatalogService | 237 | 4 | AF-MDM | 1 | · | · | · | · | · | · | ✓ | ✓ | ✓ | **3/7** |
| climateAdvisoryRoutes | 56 | 4 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| companyRoutes | 78 | 4 | — | · | · | · | ✓ | · | · | · | ✓ | ✓ | · | **3/7** |
| cropValueResearchRoutes | 24 | 4 | AF-HCM AF-AGRI | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| defenseFitnessPrepRoutes | 22 | 4 | — | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| productMediaAIRoutes | 22 | 4 | AF-MDM | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| returnLoadBoardRoutes | 48 | 4 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| visionRoutes | 129 | 4 | — | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| enterpriseMemoryService | 382 | 3 | — | · | · | 1 | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| demandRoutes | 28 | 3 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| analyticsReportRoutes | 43 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| costRoutes | 28 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| foluBenchmarkRoutes | 26 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| glutWarningRoutes | 34 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| platformTelemetryRoutes | 22 | 2 | AF-MDM | · | · | · | ✓ | · | · | · | · | · | ✓ | **2/7** |
| revenueRoutes | 28 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| sellerRankingRoutes | 37 | 2 | — | 1 | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| wikipediaRoutes | 39 | 2 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| whatsappService | 423 | 1 | — | 1 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| trackDartRoutes | 56 | 1 | — | · | · | · | ✓ | · | · | · | ✓ | · | · | **2/7** |
| aiAgentService | 483 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| aiCollaborationService | 8 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| aiCollaborationService | 389 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| enhancedLibraryKnowledgeService | 777 | 0 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| unifiedConfigService | 303 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | ✓ | **3/7** |
| gdprService | 264 | 0 | AF-PS | · | · | · | · | · | ✓ | ✓ | ✓ | · | · | **3/7** |
| mfaService | 149 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| platformCoreService | 172 | 0 | AF-MDM | 1 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| EnergyCostCalculator | 299 | 0 | — | 2 | · | · | · | · | · | · | · | · | · | **0/7** |
| FoodIntelligenceEngine | 446 | 0 | — | 2 | · | · | · | · | · | · | · | · | · | **0/7** |
| advancedFeaturesService | 528 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| agriculturalIntelligenceService | 469 | 0 | AF-AGRI | 3 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| aiAgenticCompanionService | 861 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| aiBackboneService | 902 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| aiBrainService | 506 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| aiGatewayService | 428 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| aiOperationIntelligenceService | 607 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| aiOrchestrationService | 118 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| aiSelfHealingService | 685 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| analyticsMonitoringService | 430 | 0 | — | · | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| analyticsService | 644 | 0 | — | 5 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| animalHealthService | 544 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| apicultureService | 146 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| assetAccountingService | 397 | 0 | AF-FI AF-PM AF-AA | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| auditService | 370 | 0 | AF-SEC | · | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| backupService | 335 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| bulkOrderService | 535 | 0 | AF-SD | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| civilDisruptionService | 134 | 0 | — | · | 2 | · | · | · | · | ✓ | · | ✓ | · | **2/7** |
| climateMonitoringService | 45 | 0 | — | 2 | · | · | · | · | · | · | · | · | · | **0/7** |
| coldStorageService | 305 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| communityManagementService | 52 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| companyService | 76 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| completeAIIntegrationService | 1355 | 0 | — | 3 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| completeERPIntegrationService | 934 | 0 | — | 1 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| complianceService | 287 | 0 | AF-SEC | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| comprehensiveERPService | 1751 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| cooperativeShareService | 201 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| costControlService | 437 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| costService | 91 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| cropManagementService | 66 | 0 | AF-AGRI | · | · | · | · | · | · | · | · | · | · | **0/7** |
| cropPlanningService | 534 | 0 | AF-AGRI | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| cropValueResearchService | 171 | 0 | AF-AGRI | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| custodyEventService | 421 | 0 | — | · | · | · | · | · | ✓ | ✓ | ✓ | ✓ | · | **4/7** |
| dairyService | 689 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| decisionSupportService | 416 | 0 | AF-CS | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| defenseFitnessPrepService | 93 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| demandService | 156 | 0 | — | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| digitalTwinService | 834 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| dprGenerationService | 452 | 0 | AF-PS | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| dynamicPricingService | 1092 | 0 | AF-SD | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| ecommerceAIService | 884 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ecommerceBusinessSalesService | 667 | 0 | AF-SD | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ecommerceERPService | 633 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ecommerceIntegrationService | 850 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ecommerceMarketingService | 776 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ecommerceService | 715 | 0 | — | 2 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| engineeringProjectService | 259 | 0 | AF-PS | · | · | · | · | · | · | ✓ | · | ✓ | · | **2/7** |
| equipmentExchangeService | 101 | 0 | AF-PM | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| escrowService | 339 | 0 | AF-TR | · | · | · | · | · | ✓ | ✓ | ✓ | ✓ | · | **4/7** |
| experienceLayerService | 442 | 0 | — | 1 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| farmerFamilyService | 20 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| farmerService | 694 | 0 | — | 1 | · | · | ✓ | · | ✓ | ✓ | ✓ | ✓ | · | **5/7** |
| farmerTrainingService | 793 | 0 | AF-HCM | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| fertilizerInventoryService | 263 | 0 | AF-WM | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| fisheriesManagementService | 76 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| fisheriesService | 173 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| foluBenchmarkService | 190 | 0 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| forestryService | 147 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| freightPoolingService | 168 | 0 | AF-TM | · | · | · | · | · | · | ✓ | · | ✓ | · | **2/7** |
| geofencingService | 308 | 0 | — | · | 1 | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| glutWarningService | 90 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| goatService | 1059 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| governanceService | 622 | 0 | AF-SEC | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| governmentSchemeService | 948 | 0 | — | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| greenhouseService | 543 | 0 | AF-PM | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| gstService | 656 | 0 | AF-FI | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| horticultureManagementService | 64 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| hrService | 913 | 0 | AF-HCM | 7 | 4 | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| identityManagementService | 129 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| informationSharingService | 623 | 0 | AF-MDM | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| inputSupplyManagementService | 62 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| insuranceClaimsService | 607 | 0 | — | 2 | 1 | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| insuranceFraudDetectionService | 594 | 0 | — | 3 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| insurancePolicyIssuanceService | 527 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| insurancePremiumService | 417 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| iotSensorService | 722 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| irrigationManagementService | 34 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| knowledgeService | 835 | 0 | — | 3 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| landManagementService | 50 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| landRecordsService | 490 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| libraryKnowledgeService | 347 | 0 | — | 1 | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| livestockManagementService | 64 | 0 | AF-WM | · | · | · | · | · | · | · | · | · | · | **0/7** |
| logisticsEnhancementService | 807 | 0 | AF-TM | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| marketDataService | 393 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| mushroomService | 147 | 0 | AF-HCM | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| nutrientValueSalesService | 891 | 0 | AF-SD | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| ocrService | 139 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| operationsManagementService | 62 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| organizationManagementService | 543 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| pigService | 1061 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| platformConfigurationService | 537 | 0 | AF-MDM | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| platformTelemetryService | 91 | 0 | AF-MDM | · | · | · | · | · | · | · | ✓ | · | · | **1/7** |
| poultryService | 951 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| preSeasonOrderService | 793 | 0 | AF-SD | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| preventiveMaintenanceService | 43 | 0 | AF-PM | · | · | · | · | · | · | · | · | · | · | **0/7** |
| productMediaAIService | 195 | 0 | AF-MDM | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| productReviewService | 451 | 0 | AF-MDM | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| projectSystemsService | 526 | 0 | AF-PS | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| realtimeMonitoringService | 572 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| recoveredFinanceService | 307 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| regionalVarietyService | 117 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| researchAndDevelopmentService | 705 | 0 | — | 4 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| resourceCrudFactory | 106 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| returnLoadBoardService | 65 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| revenueService | 116 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| rfqService | 240 | 0 | — | 1 | 1 | · | · | · | · | ✓ | · | · | · | **1/7** |
| riskPricingService | 407 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| roleManagementService | 378 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| sapModuleArchitectureService | 500 | 0 | — | 2 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| seedVaultService | 104 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| sellerRankingService | 130 | 0 | — | 1 | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| sericultureService | 146 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| sharedInfraService | 880 | 0 | AF-PM | 3 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| sheepService | 1073 | 0 | — | 1 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| soilManagementService | 32 | 0 | AF-AGRI | 1 | · | · | · | · | · | · | · | · | · | **0/7** |
| soilTestingService | 689 | 0 | AF-AGRI | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| subsidyService | 592 | 0 | AF-TR | 2 | · | · | ✓ | · | · | ✓ | ✓ | ✓ | · | **4/7** |
| systemAdministrationService | 554 | 0 | — | 3 | · | · | · | · | · | · | ✓ | ✓ | · | **2/7** |
| tenantManagementService | 605 | 0 | — | 2 | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| vermicompostService | 147 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | · | · | **2/7** |
| visionService | 149 | 0 | — | · | · | · | · | · | · | ✓ | · | · | · | **1/7** |
| waterManagementService | 51 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| wearableIntegrationService | 247 | 0 | — | · | · | · | · | · | · | ✓ | · | ✓ | · | **2/7** |
| weatherService | 460 | 0 | — | 4 | 1 | · | · | · | · | ✓ | · | · | · | **1/7** |
| wikipediaService | 137 | 0 | — | · | · | · | · | · | · | ✓ | ✓ | ✓ | · | **3/7** |
| libraryKnowledgeService | 24 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| unifiedConfigService | 8 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |
| libraryRoutes | 11 | 0 | — | · | · | · | · | · | · | · | · | · | · | **0/7** |

## Modules with routes but weak controls (score < 4)

- **comprehensiveERPRoutes** — 46 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **logisticsEnhancementRoutes** — 26 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **researchAndDevelopmentRoutes** — 23 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **informationSharingRoutes** — 22 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **knowledgeRoutes** — 22 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **nervousSystemRoutes** — 22 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **indigenousKnowledgeService** — 19 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **sapModuleArchitectureRoutes** — 19 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **biodiversityService** — 17 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **shelfLifeService** — 16 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **gstRoutes** — 16 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **omnichannelAIService** — 15 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **completeAIIntegrationRoutes** — 15 routes, 0/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Error handling, Logging, Rate limiting
- **completeERPIntegrationRoutes** — 15 routes, 0/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Error handling, Logging, Rate limiting
- **costControlRoutes** — 15 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **platformCoreRoutes** — 15 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **aiBrainRoutes** — 14 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **experienceRoutes** — 14 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **projectSystemsRoutes** — 14 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **aiOperationIntelligenceRoutes** — 13 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **enterpriseAIRoutes** — 13 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **dairyRoutes** — 12 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **aiCopilotService** — 11 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **aiSelfHealingRoutes** — 11 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **ecommerceRoutes** — 11 routes, 3/7 controls, missing: Transactions, Input validation, Error handling, Logging
- **riskPricingRoutes** — 11 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **vendorRoutes** — 11 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **weatherRoutes** — 11 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **arVrService** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **merchandisingService** — 10 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Rate limiting
- **voiceAIService** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **aiAgentRoutes** — 10 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **aiCollaborationRoutes** — 10 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **aiCollaborationRoutes** — 10 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **ecommerceIntegrationRoutes** — 10 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **ecommerceMarketingRoutes** — 10 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **organizationManagementRoutes** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **platformConfigurationRoutes** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **recoveredFinanceRoutes** — 10 routes, 3/7 controls, missing: Admin gate, Transactions, Logging, Rate limiting
- **predictiveAnalyticsService** — 9 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **agriculturalIntelligenceRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **bulkOrderRoutes** — 9 routes, 0/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Error handling, Logging, Rate limiting
- **backendModuleBridge** — 9 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Logging
- **decisionSupportRoutes** — 9 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **farmerTrainingRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **nutrientValueSalesRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **productReviewRoutes** — 9 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **rfqRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **roleManagementRoutes** — 9 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **tenantManagementRoutes** — 9 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **advancedAIService** — 8 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **catalogIntelligenceService** — 8 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Rate limiting
- **auditRoutes** — 8 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **coldStorageRoutes** — 8 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **complianceRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **cropPlanningRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **ecommerceAIRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **ecommerceBusinessSalesRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **farmerHealthRoutes** — 8 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **hrRoutes** — 8 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **landRecordsRoutes** — 8 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **systemAdministrationRoutes** — 8 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **aiGatewayRoutes** — 7 routes, 0/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Error handling, Logging, Rate limiting
- **libraryRoutes** — 7 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **unifiedAIRoutes** — 7 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **cooperativeShareRoutes** — 7 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **gdprRoutes** — 7 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **farmerRoutes** — 7 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **fertilizerRoutes** — 7 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **foodRoutes** — 7 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **unifiedAIRoutes** — 7 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **wearableIntegrationRoutes** — 7 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **advancedVoiceAI** — 6 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **custodyEventRoutes** — 6 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **aiBackboneRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **moduleRegistryRoutes** — 6 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Logging
- **ecommerceERPRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **energyRoutes** — 6 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **engineeringProjectRoutes** — 6 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Logging
- **equipmentExchangeRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **freightPoolingRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **geofencingRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **healthRoutes** — 6 routes, 2/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Rate limiting
- **fisheriesRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **marketDataRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **seedVaultRoutes** — 6 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **civilDisruptionRoutes** — 5 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **climateMonitoringRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **communityManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **cropManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **dprGenerationRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **mfaRoutes** — 5 routes, 3/7 controls, missing: Transactions, Input validation, Logging, Rate limiting
- **farmerFamilyRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **fisheriesManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **foluRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **horticultureManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **identityManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **inputSupplyManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **irrigationManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **landManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **apicultureRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **forestryRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **mushroomRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **sericultureRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **vermicompostRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **livestockManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **operationsManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **preventiveMaintenanceRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **realtimeMonitoringRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **regionalVarietyRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **soilManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **waterManagementRoutes** — 5 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **moduleCatalogService** — 4 routes, 3/7 controls, missing: Authentication, Admin gate, Transactions, Input validation
- **climateAdvisoryRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **companyRoutes** — 4 routes, 3/7 controls, missing: Admin gate, Transactions, Input validation, Rate limiting
- **cropValueResearchRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **defenseFitnessPrepRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **productMediaAIRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **returnLoadBoardRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **visionRoutes** — 4 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **demandRoutes** — 3 routes, 1/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Logging, Rate limiting
- **analyticsReportRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **costRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **foluBenchmarkRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **glutWarningRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **platformTelemetryRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Error handling, Logging
- **revenueRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **sellerRankingRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **wikipediaRoutes** — 2 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
- **whatsappService** — 1 routes, 2/7 controls, missing: Authentication, Admin gate, Transactions, Input validation, Rate limiting
- **trackDartRoutes** — 1 routes, 2/7 controls, missing: Admin gate, Transactions, Input validation, Logging, Rate limiting
