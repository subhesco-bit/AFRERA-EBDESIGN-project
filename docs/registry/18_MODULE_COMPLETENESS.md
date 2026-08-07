# Module Completeness — missing, partial, complete

**Generated:** 2026-08-04 by `tools/wireframe-boundaries.js`
**Status:** DESCRIPTIVE — measured from source, comments stripped.
**Do not edit by hand.**

---

| Status | Count |
|---|---|
| Complete | **55** |
| Complete with gaps | **47** |
| Dead code (marked) | **7** |
| **Total** | 109 |

## Complete (55)

| Module | Layer | Lines | Rts | Why |
|---|---|---|---|---|
| consumerHealthService | services | 658 | 14 | — |
| laboratoryERPService | services | 602 | 13 | — |
| organicTraceabilityService | services | 675 | 13 | — |
| giIntelligenceService | services | 587 | 11 | — |
| iotIntegrationService | services | 579 | 11 | — |
| multilingualService | services | 722 | 11 | — |
| arVrService | services | 503 | 10 | — |
| blockchainTraceabilityService | services | 533 | 10 | — |
| conversationalAIService | services | 557 | 10 | — |
| nutritionIntelligenceService | services | 579 | 10 | — |
| formService | services | 435 | 8 | — |
| valueCommerceService | services | 457 | 8 | — |
| knowledgeGraphService | services | 391 | 7 | — |
| analyticsService | services | 126 | 2 | — |
| advancedFeaturesService | services | 515 | 0 | — |
| auditService | services | 350 | 0 | — |
| bulkOrderService | services | 511 | 0 | — |
| cropPlanningService | services | 520 | 0 | — |
| decisionSupportService | services | 323 | 0 | — |
| dynamicPricingService | services | 476 | 0 | — |
| enterpriseAIService | services | 458 | 0 | — |
| farmerService | services | 581 | 0 | — |
| farmerTrainingService | services | 735 | 0 | — |
| governanceService | services | 571 | 0 | — |
| governmentSchemeService | services | 706 | 0 | — |
| greenhouseService | services | 536 | 0 | — |
| gstService | services | 226 | 0 | — |
| insuranceClaimsService | services | 587 | 0 | — |
| insuranceFraudDetectionService | services | 594 | 0 | — |
| insurancePolicyIssuanceService | services | 523 | 0 | — |
| insurancePremiumService | services | 417 | 0 | — |
| landRecordsService | services | 462 | 0 | — |
| logisticsEnhancementService | services | 590 | 0 | — |
| preSeasonOrderService | services | 751 | 0 | — |
| productReviewService | services | 426 | 0 | — |
| sharedInfraService | services | 606 | 0 | — |
| soilTestingService | services | 613 | 0 | — |
| subsidyService | services | 592 | 0 | — |
| decisionEngine | core | 360 | 0 | — |
| effectors | core | 292 | 0 | — |
| erpAgents | core | 826 | 0 | — |
| mcda | core | 138 | 0 | — |
| outcomeSink | core | 198 | 0 | — |
| signalBus | core | 210 | 0 | — |
| geo | utils | 200 | 0 | — |
| logger | utils | 139 | 0 | — |
| statistics | utils | 336 | 0 | — |
| admin | middleware | 28 | 0 | — |
| auth | middleware | 179 | 0 | — |
| compliance | middleware | 229 | 0 | — |
| errorHandler | middleware | 174 | 0 | — |
| rateLimiter | middleware | 118 | 0 | — |
| security | middleware | 298 | 0 | — |
| connection | database | 169 | 0 | — |
| pool | database | 66 | 0 | — |

## Complete with gaps (47)

| Module | Layer | Lines | Rts | Why |
|---|---|---|---|---|
| digitalProductPassportService | services | 1059 | 25 | writes without validation; no test file |
| logisticsEnhancementRoutes | routes | 377 | 23 | writes without validation; no test file |
| marketplaceEnhancements | routes | 252 | 23 | writes without validation; no test file |
| governanceModule | routes | 227 | 22 | writes without validation; no test file |
| foodSafetyService | services | 936 | 21 | writes without validation; no test file |
| farmerPortalEnhancements | routes | 210 | 20 | writes without validation; no test file |
| logisticsEnhancements | routes | 213 | 20 | writes without validation; no test file |
| indigenousKnowledgeService | services | 825 | 19 | writes without validation; no test file |
| insuranceEnhancements | routes | 192 | 18 | writes without validation; no test file |
| biodiversityService | services | 896 | 17 | writes without validation; no test file |
| recipeIntelligenceService | services | 907 | 17 | writes without validation; no test file |
| institutionalProcurementService | services | 785 | 16 | writes without validation; no test file |
| shelfLifeService | services | 881 | 16 | writes without validation; no test file |
| gstRoutes | routes | 451 | 16 | writes without validation; no test file |
| omnichannelAIService | services | 789 | 15 | writes without validation; no test file |
| enterpriseControlService | services | 565 | 13 | no test file |
| aiCopilotService | services | 592 | 11 | writes without validation; no test file |
| insuranceService | services | 687 | 11 | no test file |
| logisticsService | services | 598 | 11 | no test file |
| v42IntelligenceService | services | 467 | 11 | no test file |
| vendorRoutes | routes | 298 | 11 | writes without validation; no test file |
| authService | services | 1183 | 10 | no test file |
| foodIntelligenceService | services | 587 | 10 | writes without validation |
| merchandisingService | services | 461 | 10 | no test file |
| offlinePaymentService | services | 699 | 10 | no test file |
| orderService | services | 777 | 10 | no test file |
| voiceAIService | services | 495 | 10 | writes without validation |
| predictiveAnalyticsService | services | 480 | 9 | writes without validation |
| advancedFeatures | routes | 105 | 9 | writes without validation; no test file |
| decisionSupportRoutes | routes | 196 | 9 | no test file |
| advancedAIService | services | 1543 | 8 | writes without validation; no test file |
| catalogIntelligenceService | services | 904 | 8 | no test file |
| financialService | services | 527 | 8 | no test file |
| offlineSyncService | services | 834 | 8 | no test file |
| productService | services | 549 | 8 | no test file |
| erpService | services | 943 | 7 | no test file |
| auditRoutes | routes | 87 | 7 | writes without validation; no test file |
| advancedVoiceAI | services | 758 | 6 | writes without validation; no test file |
| neProductIntelligenceService | services | 347 | 6 | no test file |
| farmerRoutes | routes | 85 | 6 | writes without validation; no test file |
| aiService | services | 663 | 5 | writes without validation; no test file |
| commerceRulesService | services | 275 | 5 | no test file |
| farmerValueService | services | 462 | 5 | no test file |
| smsAuthService | services | 583 | 5 | no test file |
| moduleCatalogService | services | 237 | 4 | writes without validation |
| migrate | database | 143 | 0 | no routes and no exports |
| seed | database | 79 | 0 | no routes and no exports |

## Dead code (marked) (7)

| Module | Layer | Lines | Rts | Why |
|---|---|---|---|---|
| Order | database | 142 | 0 | explicitly marked; do not complete |
| Product | database | 174 | 0 | explicitly marked; do not complete |
| User | database | 114 | 0 | explicitly marked; do not complete |
| index | database | 52 | 0 | explicitly marked; do not complete |
| mongodb | database | 7 | 0 | explicitly marked; do not complete |
| postgres | database | 7 | 0 | explicitly marked; do not complete |
| redis | database | 7 | 0 | explicitly marked; do not complete |
