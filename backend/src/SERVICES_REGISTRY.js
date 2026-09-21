/**
 * SERVICES REGISTRY -- regenerated 2026-09-20 from a real filesystem scan, not
 * hand-typed. Lists every .js file under backend/src/services/ that exists on
 * disk right now, with its size in bytes. A file existing here is NOT a claim
 * that it is wired to a route, that it is live vs. dead code, or that its
 * logic is real vs. a stub -- cross-reference against ROUTES_REGISTRY.js's
 * mounted paths and the actual require() graph to determine liveness (see the
 * FINAL_CONSOLIDATION_REPORT.md methodology note: "assume nothing about which
 * copy is live without tracing every require() from a mounted route").
 * Total service files found: 735.
 */
const serviceFiles = [
  {
    "path": "services/advancedAIService/creditScoring.js",
    "sizeBytes": 11148
  },
  {
    "path": "services/advancedAIService/cropDisease.js",
    "sizeBytes": 4637
  },
  {
    "path": "services/advancedAIService/demandForecasting.js",
    "sizeBytes": 12374
  },
  {
    "path": "services/advancedAIService/fraudDetection.js",
    "sizeBytes": 7468
  },
  {
    "path": "services/advancedAIService/index.js",
    "sizeBytes": 2697
  },
  {
    "path": "services/advancedAIService/models.js",
    "sizeBytes": 2899
  },
  {
    "path": "services/advancedAIService/priceOptimization.js",
    "sizeBytes": 10410
  },
  {
    "path": "services/advancedAIService/recommendations.js",
    "sizeBytes": 5736
  },
  {
    "path": "services/advancedAIService/router.js",
    "sizeBytes": 4711
  },
  {
    "path": "services/advancedAIService/shared.js",
    "sizeBytes": 1079
  },
  {
    "path": "services/advancedAIService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/advancedAnalyticsService.js",
    "sizeBytes": 11171
  },
  {
    "path": "services/advancedFeaturesService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/advancedSearchService.js",
    "sizeBytes": 9387
  },
  {
    "path": "services/advancedServiceGenerator.js",
    "sizeBytes": 19536
  },
  {
    "path": "services/advancedVoiceAI.js",
    "sizeBytes": 23702
  },
  {
    "path": "services/agriculturalIntelligenceService.js",
    "sizeBytes": 1153
  },
  {
    "path": "services/agriculture/agriculturalIntelligenceService.js",
    "sizeBytes": 14368
  },
  {
    "path": "services/agriculture/biodiversityService.js",
    "sizeBytes": 30404
  },
  {
    "path": "services/agriculture/cropPlanningService.js",
    "sizeBytes": 15186
  },
  {
    "path": "services/agriculture/farmerService.js",
    "sizeBytes": 18731
  },
  {
    "path": "services/agriculture/farmerTrainingService.js",
    "sizeBytes": 22438
  },
  {
    "path": "services/agriculture/greenhouseService.js",
    "sizeBytes": 16205
  },
  {
    "path": "services/agriculture/householdEconomyService.js",
    "sizeBytes": 1224
  },
  {
    "path": "services/agriculture/indigenousKnowledgeService.js",
    "sizeBytes": 26283
  },
  {
    "path": "services/agriculture/landRecordsService.js",
    "sizeBytes": 13749
  },
  {
    "path": "services/agriculture/millCircuitService.js",
    "sizeBytes": 349
  },
  {
    "path": "services/agriculture/regionalVarietyService.js",
    "sizeBytes": 4910
  },
  {
    "path": "services/agriculture/renewableEnergyService.js",
    "sizeBytes": 1221
  },
  {
    "path": "services/agriculture/ruralEnterpriseService.js",
    "sizeBytes": 1221
  },
  {
    "path": "services/agriculture/seedVaultService.js",
    "sizeBytes": 4112
  },
  {
    "path": "services/agriculture/soilTestingService.js",
    "sizeBytes": 19799
  },
  {
    "path": "services/agriculture/villageProfileService.js",
    "sizeBytes": 1218
  },
  {
    "path": "services/agriculture/warningSources.js",
    "sizeBytes": 33489
  },
  {
    "path": "services/agriculture/weatherService.js",
    "sizeBytes": 10742
  },
  {
    "path": "services/ai/advancedVoiceAI.js",
    "sizeBytes": 23810
  },
  {
    "path": "services/ai/aiAdvisoryService.js",
    "sizeBytes": 1206
  },
  {
    "path": "services/ai/aiAgenticCompanionService.js",
    "sizeBytes": 510
  },
  {
    "path": "services/ai/aiAgentService.js",
    "sizeBytes": 4364
  },
  {
    "path": "services/ai/aiBrainService.js",
    "sizeBytes": 2091
  },
  {
    "path": "services/ai/aiCopilotService.js",
    "sizeBytes": 28288
  },
  {
    "path": "services/ai/aiGatewayService.js",
    "sizeBytes": 15504
  },
  {
    "path": "services/ai/aiOperationIntelligenceService.js",
    "sizeBytes": 3232
  },
  {
    "path": "services/ai/aiSelfHealingService.js",
    "sizeBytes": 194
  },
  {
    "path": "services/ai/decisionSupportService.js",
    "sizeBytes": 14952
  },
  {
    "path": "services/ai/enterpriseAIService.js",
    "sizeBytes": 17545
  },
  {
    "path": "services/ai/knowledgeGraphService.js",
    "sizeBytes": 12274
  },
  {
    "path": "services/ai/omnichannelAIService.js",
    "sizeBytes": 24800
  },
  {
    "path": "services/ai/optimizationJobService.js",
    "sizeBytes": 5376
  },
  {
    "path": "services/ai/predictiveAnalyticsService.js",
    "sizeBytes": 14829
  },
  {
    "path": "services/aiAdvisoryService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/aiAgenticCompanionService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/aiAgentService.js",
    "sizeBytes": 18211
  },
  {
    "path": "services/aiApprovalService.js",
    "sizeBytes": 3389
  },
  {
    "path": "services/aiBackboneService.js",
    "sizeBytes": 1665
  },
  {
    "path": "services/aiBrainService.js",
    "sizeBytes": 15675
  },
  {
    "path": "services/aiCollaborationService.js",
    "sizeBytes": 1185
  },
  {
    "path": "services/aiCopilotService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/aiDomainAdapterService.js",
    "sizeBytes": 2392
  },
  {
    "path": "services/aiEvaluationService.js",
    "sizeBytes": 10608
  },
  {
    "path": "services/aiEventOrchestratorService.js",
    "sizeBytes": 2409
  },
  {
    "path": "services/aiFeedbackService.js",
    "sizeBytes": 6067
  },
  {
    "path": "services/aiGatewayService.js",
    "sizeBytes": 4287
  },
  {
    "path": "services/aiGenerationRunStore.js",
    "sizeBytes": 1633
  },
  {
    "path": "services/aiGovernanceService.js",
    "sizeBytes": 2623
  },
  {
    "path": "services/aiImageGenerationEnhancedService.js",
    "sizeBytes": 16942
  },
  {
    "path": "services/aiImageGenerationService.js",
    "sizeBytes": 8229
  },
  {
    "path": "services/aiModelsService.js",
    "sizeBytes": 21780
  },
  {
    "path": "services/aiOperationIntelligenceService.js",
    "sizeBytes": 1150
  },
  {
    "path": "services/aiOrchestrationService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/aiSelfHealingResilienceService.js",
    "sizeBytes": 3179
  },
  {
    "path": "services/aiSelfHealingService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/aiService/creditRisk.js",
    "sizeBytes": 5149
  },
  {
    "path": "services/aiService/demandForecasting.js",
    "sizeBytes": 3806
  },
  {
    "path": "services/aiService/fraudDetection.js",
    "sizeBytes": 3783
  },
  {
    "path": "services/aiService/index.js",
    "sizeBytes": 2157
  },
  {
    "path": "services/aiService/models.js",
    "sizeBytes": 1199
  },
  {
    "path": "services/aiService/priceOptimization.js",
    "sizeBytes": 4450
  },
  {
    "path": "services/aiService/recommendationBuilders.js",
    "sizeBytes": 27851
  },
  {
    "path": "services/aiService/recommendationEngine.js",
    "sizeBytes": 3123
  },
  {
    "path": "services/aiService/router.js",
    "sizeBytes": 2028
  },
  {
    "path": "services/aiService/__tests__/creditRisk.test.js",
    "sizeBytes": 2940
  },
  {
    "path": "services/aiService/__tests__/fraudDetection.test.js",
    "sizeBytes": 1895
  },
  {
    "path": "services/aiService/__tests__/priceOptimization.test.js",
    "sizeBytes": 3379
  },
  {
    "path": "services/aiService/__tests__/recommendationEngine.test.js",
    "sizeBytes": 2157
  },
  {
    "path": "services/aiService.js",
    "sizeBytes": 23587
  },
  {
    "path": "services/aiTrainingService.js",
    "sizeBytes": 9613
  },
  {
    "path": "services/analyticsMonitoringService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/analyticsService.js",
    "sizeBytes": 1218
  },
  {
    "path": "services/animalHealthService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/apiWarningService.js",
    "sizeBytes": 10332
  },
  {
    "path": "services/arService.js",
    "sizeBytes": 564
  },
  {
    "path": "services/arVrService.js",
    "sizeBytes": 1093
  },
  {
    "path": "services/assetAccountingService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/AuditLoggingService.js",
    "sizeBytes": 573
  },
  {
    "path": "services/auditService.js",
    "sizeBytes": 10386
  },
  {
    "path": "services/auditTrailService.js",
    "sizeBytes": 627
  },
  {
    "path": "services/authService/config.js",
    "sizeBytes": 2387
  },
  {
    "path": "services/authService/index.js",
    "sizeBytes": 2098
  },
  {
    "path": "services/authService/oauth.js",
    "sizeBytes": 5299
  },
  {
    "path": "services/authService/passwordUtils.js",
    "sizeBytes": 497
  },
  {
    "path": "services/authService/permissions.js",
    "sizeBytes": 1798
  },
  {
    "path": "services/authService/router.js",
    "sizeBytes": 5436
  },
  {
    "path": "services/authService/store.js",
    "sizeBytes": 1909
  },
  {
    "path": "services/authService/tokens.js",
    "sizeBytes": 3584
  },
  {
    "path": "services/authService/totp.js",
    "sizeBytes": 4180
  },
  {
    "path": "services/authService/twoFactor.js",
    "sizeBytes": 3268
  },
  {
    "path": "services/authService/userAuth.js",
    "sizeBytes": 12275
  },
  {
    "path": "services/authService.js",
    "sizeBytes": 36463
  },
  {
    "path": "services/automationService.js",
    "sizeBytes": 677
  },
  {
    "path": "services/backupService.js",
    "sizeBytes": 1099
  },
  {
    "path": "services/batchProcessingService.js",
    "sizeBytes": 10266
  },
  {
    "path": "services/biodiversityService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/biometricService.js",
    "sizeBytes": 656
  },
  {
    "path": "services/blockchainTraceabilityService.js",
    "sizeBytes": 1147
  },
  {
    "path": "services/blockchainTraceService.js",
    "sizeBytes": 702
  },
  {
    "path": "services/blockchainVerificationService.js",
    "sizeBytes": 16109
  },
  {
    "path": "services/boundedAutonomyService.js",
    "sizeBytes": 3998
  },
  {
    "path": "services/BulkOperationServiceService.js",
    "sizeBytes": 635
  },
  {
    "path": "services/bulkOrderService.js",
    "sizeBytes": 936
  },
  {
    "path": "services/buyerTrustService.js",
    "sizeBytes": 4894
  },
  {
    "path": "services/buyingClubService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/CacheManagementService.js",
    "sizeBytes": 586
  },
  {
    "path": "services/cacheService.js",
    "sizeBytes": 4347
  },
  {
    "path": "services/catalogIntelligenceService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/certificationManagementService.js",
    "sizeBytes": 787
  },
  {
    "path": "services/civilDisruptionService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/claude/aiAgentService.js",
    "sizeBytes": 10106
  },
  {
    "path": "services/claude/aiCollaborationService.js",
    "sizeBytes": 11236
  },
  {
    "path": "services/claude/aiCoordinationService.js",
    "sizeBytes": 10013
  },
  {
    "path": "services/claude/aiCopilotService.js",
    "sizeBytes": 7231
  },
  {
    "path": "services/claude/aiDecisionService.js",
    "sizeBytes": 20248
  },
  {
    "path": "services/claude/aiOptimizationService.js",
    "sizeBytes": 9512
  },
  {
    "path": "services/claude/aiProviderService.js",
    "sizeBytes": 14215
  },
  {
    "path": "services/claude/aiRecoveryService.js",
    "sizeBytes": 9183
  },
  {
    "path": "services/claude/aiStrategyService.js",
    "sizeBytes": 5637
  },
  {
    "path": "services/claude/enhancedLibraryKnowledgeService.js",
    "sizeBytes": 27063
  },
  {
    "path": "services/claude/financialAIService.js",
    "sizeBytes": 9369
  },
  {
    "path": "services/claude/insuranceAIService.js",
    "sizeBytes": 5826
  },
  {
    "path": "services/claude/logisticsAIService.js",
    "sizeBytes": 5980
  },
  {
    "path": "services/claude/orderAIService.js",
    "sizeBytes": 2680
  },
  {
    "path": "services/claude/productAIService.js",
    "sizeBytes": 6163
  },
  {
    "path": "services/claude/unifiedConfigService.js",
    "sizeBytes": 9012
  },
  {
    "path": "services/climateAdvisoryService.js",
    "sizeBytes": 614
  },
  {
    "path": "services/clinicalNutritionDecisionSupportService.js",
    "sizeBytes": 7144
  },
  {
    "path": "services/clinicalNutritionDecisionSupportService.test.js",
    "sizeBytes": 1964
  },
  {
    "path": "services/cloneGapClosureService.js",
    "sizeBytes": 2981
  },
  {
    "path": "services/cloudManagementService.js",
    "sizeBytes": 16475
  },
  {
    "path": "services/coldChainMonitoringService.js",
    "sizeBytes": 1263
  },
  {
    "path": "services/coldStorageService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/commerce/arVrService.js",
    "sizeBytes": 19331
  },
  {
    "path": "services/commerce/bulkOrderService.js",
    "sizeBytes": 15767
  },
  {
    "path": "services/commerce/buyingClubService.js",
    "sizeBytes": 9289
  },
  {
    "path": "services/commerce/commerceRulesService.js",
    "sizeBytes": 11201
  },
  {
    "path": "services/commerce/dprGenerationService.js",
    "sizeBytes": 22214
  },
  {
    "path": "services/commerce/equipmentExchangeService.js",
    "sizeBytes": 4102
  },
  {
    "path": "services/commerce/farmerProcurementQuoteService.js",
    "sizeBytes": 10675
  },
  {
    "path": "services/commerce/giIntelligenceService.js",
    "sizeBytes": 23203
  },
  {
    "path": "services/commerce/institutionalProcurementService.js",
    "sizeBytes": 26584
  },
  {
    "path": "services/commerce/institutionalVillageCommerceService.js",
    "sizeBytes": 3848
  },
  {
    "path": "services/commerce/machineryAccessService.js",
    "sizeBytes": 10938
  },
  {
    "path": "services/commerce/marketAccessService.js",
    "sizeBytes": 1212
  },
  {
    "path": "services/commerce/marketIntelligenceService.js",
    "sizeBytes": 8819
  },
  {
    "path": "services/commerce/nutritionCommerceIntelligenceService.js",
    "sizeBytes": 4739
  },
  {
    "path": "services/commerce/nutritionCommerceIntelligenceService.test.js",
    "sizeBytes": 2842
  },
  {
    "path": "services/commerce/orderService.js",
    "sizeBytes": 26145
  },
  {
    "path": "services/commerce/preSeasonOrderService.js",
    "sizeBytes": 23121
  },
  {
    "path": "services/commerce/procurementSubscriptionService.js",
    "sizeBytes": 1245
  },
  {
    "path": "services/commerce/productMediaAIService.js",
    "sizeBytes": 574
  },
  {
    "path": "services/commerce/productReviewService.js",
    "sizeBytes": 777
  },
  {
    "path": "services/commerce/productService.js",
    "sizeBytes": 18185
  },
  {
    "path": "services/commerce/rfqService.js",
    "sizeBytes": 9540
  },
  {
    "path": "services/commerce/valueCommerceService.js",
    "sizeBytes": 17381
  },
  {
    "path": "services/commerce/__tests__/farmerProcurementQuoteService.test.js",
    "sizeBytes": 2181
  },
  {
    "path": "services/commerce/__tests__/institutionalVillageCommerceService.test.js",
    "sizeBytes": 1439
  },
  {
    "path": "services/commerceOrderOrchestrationService.js",
    "sizeBytes": 4211
  },
  {
    "path": "services/commerceRulesService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/commercialErpReconciliationService.js",
    "sizeBytes": 2983
  },
  {
    "path": "services/commercialReconciliationService.js",
    "sizeBytes": 2378
  },
  {
    "path": "services/commercialSettlementFlowService.js",
    "sizeBytes": 2484
  },
  {
    "path": "services/commercialSettlementService.js",
    "sizeBytes": 4040
  },
  {
    "path": "services/communityService.js",
    "sizeBytes": 25378
  },
  {
    "path": "services/companyService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/completeAIIntegrationService.js",
    "sizeBytes": 41887
  },
  {
    "path": "services/completeERPIntegrationService.js",
    "sizeBytes": 941
  },
  {
    "path": "services/complianceService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/complianceTrackingService.js",
    "sizeBytes": 684
  },
  {
    "path": "services/comprehensiveERPService.js",
    "sizeBytes": 917
  },
  {
    "path": "services/consumerHealthService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/conversationalAIService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/cooperativeShareService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/costControlService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/costService.js",
    "sizeBytes": 1093
  },
  {
    "path": "services/cropManagementService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/cropPlanningService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/cropRecommendationService.js",
    "sizeBytes": 1834
  },
  {
    "path": "services/cropValueResearchService.js",
    "sizeBytes": 1132
  },
  {
    "path": "services/custodyEventRoutes.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/custodyEventService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/dairyService.js",
    "sizeBytes": 1096
  },
  {
    "path": "services/databaseManagementService.js",
    "sizeBytes": 18070
  },
  {
    "path": "services/DataExportServiceService.js",
    "sizeBytes": 605
  },
  {
    "path": "services/dataValidationService.js",
    "sizeBytes": 10804
  },
  {
    "path": "services/dataVisualizationService.js",
    "sizeBytes": 514
  },
  {
    "path": "services/decisionSupportService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/defenseFitnessPrepService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/demandService.js",
    "sizeBytes": 1099
  },
  {
    "path": "services/devinService.js",
    "sizeBytes": 0
  },
  {
    "path": "services/dietTherapyService.js",
    "sizeBytes": 3416
  },
  {
    "path": "services/digitalProductPassportService/coreIdentity.js",
    "sizeBytes": 5728
  },
  {
    "path": "services/digitalProductPassportService/impact.js",
    "sizeBytes": 5544
  },
  {
    "path": "services/digitalProductPassportService/index.js",
    "sizeBytes": 2079
  },
  {
    "path": "services/digitalProductPassportService/lifecycle.js",
    "sizeBytes": 5975
  },
  {
    "path": "services/digitalProductPassportService/provenance.js",
    "sizeBytes": 8851
  },
  {
    "path": "services/digitalProductPassportService/qrAndPassport.js",
    "sizeBytes": 5534
  },
  {
    "path": "services/digitalProductPassportService/quality.js",
    "sizeBytes": 5550
  },
  {
    "path": "services/digitalProductPassportService.js",
    "sizeBytes": 1147
  },
  {
    "path": "services/digitalTwinService.js",
    "sizeBytes": 22340
  },
  {
    "path": "services/dprGenerationService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/dual-use/authService.js",
    "sizeBytes": 40583
  },
  {
    "path": "services/dual-use/gdprService.js",
    "sizeBytes": 8616
  },
  {
    "path": "services/dual-use/mfaService.js",
    "sizeBytes": 3256
  },
  {
    "path": "services/dual-use/platformCoreService.js",
    "sizeBytes": 5687
  },
  {
    "path": "services/dynamicPricingService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/e2eVerificationService.js",
    "sizeBytes": 1099
  },
  {
    "path": "services/ecommerceAIService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/ecommerceBusinessSalesService.js",
    "sizeBytes": 941
  },
  {
    "path": "services/ecommerceERPService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/ecommerceImageIntegrationService.js",
    "sizeBytes": 11950
  },
  {
    "path": "services/ecommerceIntegrationService.js",
    "sizeBytes": 933
  },
  {
    "path": "services/ecommerceMarketingService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/ecommerceService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/emailService.js",
    "sizeBytes": 7946
  },
  {
    "path": "services/endToEndFlowService.js",
    "sizeBytes": 2131
  },
  {
    "path": "services/energy/EnergyCostCalculator.js",
    "sizeBytes": 10040
  },
  {
    "path": "services/engineeringProjectService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/enterpriseAIService.js",
    "sizeBytes": 17545
  },
  {
    "path": "services/enterpriseControlService.js",
    "sizeBytes": 1132
  },
  {
    "path": "services/enterpriseIntegrationService.js",
    "sizeBytes": 24006
  },
  {
    "path": "services/enterpriseMemoryService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/enterpriseModule550RuntimeService.js",
    "sizeBytes": 10480
  },
  {
    "path": "services/enterprisePromotion541Service.js",
    "sizeBytes": 11887
  },
  {
    "path": "services/equipmentExchangeService.js",
    "sizeBytes": 1132
  },
  {
    "path": "services/erp/CostControlModule.js",
    "sizeBytes": 11504
  },
  {
    "path": "services/erp/unifiedERPRegistry.js",
    "sizeBytes": 6300
  },
  {
    "path": "services/erp/__tests__/unifiedERPRegistry.test.js",
    "sizeBytes": 1963
  },
  {
    "path": "services/erpControlPlaneService.js",
    "sizeBytes": 1819
  },
  {
    "path": "services/erpService.js",
    "sizeBytes": 1090
  },
  {
    "path": "services/errorHandlerService.js",
    "sizeBytes": 632
  },
  {
    "path": "services/escrowService.js",
    "sizeBytes": 1099
  },
  {
    "path": "services/etlService.js",
    "sizeBytes": 12329
  },
  {
    "path": "services/experienceLayerService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/farmAnalyticsService.js",
    "sizeBytes": 1561
  },
  {
    "path": "services/farmCostingService.js",
    "sizeBytes": 1025
  },
  {
    "path": "services/farmerHealthService.js",
    "sizeBytes": 7489
  },
  {
    "path": "services/farmerImagePortalService.js",
    "sizeBytes": 14440
  },
  {
    "path": "services/farmerKycService.js",
    "sizeBytes": 1429
  },
  {
    "path": "services/farmerService.js",
    "sizeBytes": 1099
  },
  {
    "path": "services/farmerTrainingService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/farmerValueService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/farmerVerificationService.js",
    "sizeBytes": 1362
  },
  {
    "path": "services/fertilizerInventoryService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/finance/dynamicPricingService.js",
    "sizeBytes": 24375
  },
  {
    "path": "services/finance/enterpriseAccountingService.js",
    "sizeBytes": 19386
  },
  {
    "path": "services/finance/financialService.js",
    "sizeBytes": 17282
  },
  {
    "path": "services/finance/governmentSchemeService.js",
    "sizeBytes": 20230
  },
  {
    "path": "services/finance/gstService.js",
    "sizeBytes": 6423
  },
  {
    "path": "services/finance/insuranceClaimsService.js",
    "sizeBytes": 19357
  },
  {
    "path": "services/finance/insurancePolicyIssuanceService.js",
    "sizeBytes": 15120
  },
  {
    "path": "services/finance/insuranceService.js",
    "sizeBytes": 19171
  },
  {
    "path": "services/finance/offlinePaymentService.js",
    "sizeBytes": 22879
  },
  {
    "path": "services/finance/recoveredFinanceService.js",
    "sizeBytes": 17192
  },
  {
    "path": "services/finance/revenueService.js",
    "sizeBytes": 4453
  },
  {
    "path": "services/finance/ruralFinanceService.js",
    "sizeBytes": 15402
  },
  {
    "path": "services/finance/ruralInsuranceService.js",
    "sizeBytes": 4273
  },
  {
    "path": "services/finance/subsidyService.js",
    "sizeBytes": 19265
  },
  {
    "path": "services/finance/__tests__/enterpriseAccountingService.test.js",
    "sizeBytes": 4429
  },
  {
    "path": "services/finance/__tests__/ruralInsuranceService.test.js",
    "sizeBytes": 883
  },
  {
    "path": "services/financialAnalyticsService.js",
    "sizeBytes": 1092
  },
  {
    "path": "services/financialService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/foluBenchmarkService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/food/consumerHealthService.js",
    "sizeBytes": 24271
  },
  {
    "path": "services/food/FoodIntelligenceEngine.js",
    "sizeBytes": 13336
  },
  {
    "path": "services/food/foodIntelligenceService.js",
    "sizeBytes": 22602
  },
  {
    "path": "services/food/foodSafetyService.js",
    "sizeBytes": 30547
  },
  {
    "path": "services/food/nutritionIntelligenceService.js",
    "sizeBytes": 22899
  },
  {
    "path": "services/foodIntelligenceService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/foodSafetyService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/formService.js",
    "sizeBytes": 15225
  },
  {
    "path": "services/freightPoolingService.js",
    "sizeBytes": 1176
  },
  {
    "path": "services/fulfillmentOrchestrationService.js",
    "sizeBytes": 3856
  },
  {
    "path": "services/gapClosureOperationalService.js",
    "sizeBytes": 3040
  },
  {
    "path": "services/gdprComplianceService.js",
    "sizeBytes": 3749
  },
  {
    "path": "services/gdprService.js",
    "sizeBytes": 3051
  },
  {
    "path": "services/geofencingService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/giIntelligenceService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/glutWarningService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/goatService.js",
    "sizeBytes": 1093
  },
  {
    "path": "services/governanceService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/governmentSchemeService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/greenhouseService.js",
    "sizeBytes": 700
  },
  {
    "path": "services/gstService.js",
    "sizeBytes": 1090
  },
  {
    "path": "services/HealthCheckService.js",
    "sizeBytes": 560
  },
  {
    "path": "services/horticultureService.js",
    "sizeBytes": 749
  },
  {
    "path": "services/householdEconomyService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/hrService.js",
    "sizeBytes": 1087
  },
  {
    "path": "services/identityManagementService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/index.js",
    "sizeBytes": 25103
  },
  {
    "path": "services/indiaErpAccountingService.js",
    "sizeBytes": 11462
  },
  {
    "path": "services/indigenousKnowledgeService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/infrastructureMonitoringService.js",
    "sizeBytes": 2944
  },
  {
    "path": "services/institutionalProcurementService.js",
    "sizeBytes": 1153
  },
  {
    "path": "services/insuranceClaimsService.js",
    "sizeBytes": 17762
  },
  {
    "path": "services/insuranceFraudDetectionService.js",
    "sizeBytes": 1150
  },
  {
    "path": "services/insurancePolicyIssuanceService.js",
    "sizeBytes": 1150
  },
  {
    "path": "services/insurancePremiumService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/insuranceService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/IntegrationService.js",
    "sizeBytes": 987
  },
  {
    "path": "services/invoiceService.js",
    "sizeBytes": 1914
  },
  {
    "path": "services/iotIntegrationService.js",
    "sizeBytes": 14406
  },
  {
    "path": "services/iotSensorService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/iotSensorsService.js",
    "sizeBytes": 716
  },
  {
    "path": "services/iotService.js",
    "sizeBytes": 2036
  },
  {
    "path": "services/jobQueueService.js",
    "sizeBytes": 11809
  },
  {
    "path": "services/jobService.js",
    "sizeBytes": 2604
  },
  {
    "path": "services/knowledgeGraphService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/laboratoryERPService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/labourService.js",
    "sizeBytes": 2972
  },
  {
    "path": "services/landRecordsService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/legacy/advancedAIService.js",
    "sizeBytes": 61256
  },
  {
    "path": "services/legacy/advancedFeaturesService.js",
    "sizeBytes": 16828
  },
  {
    "path": "services/legacy/agriculturalIntelligenceService.js",
    "sizeBytes": 14293
  },
  {
    "path": "services/legacy/aiAdvisoryService.js",
    "sizeBytes": 9858
  },
  {
    "path": "services/legacy/aiAgenticCompanionService.js",
    "sizeBytes": 26444
  },
  {
    "path": "services/legacy/aiBackboneService.js",
    "sizeBytes": 30033
  },
  {
    "path": "services/legacy/aiBrainService.js",
    "sizeBytes": 4287
  },
  {
    "path": "services/legacy/aiCopilotService.js",
    "sizeBytes": 28311
  },
  {
    "path": "services/legacy/aiGatewayService.js",
    "sizeBytes": 16531
  },
  {
    "path": "services/legacy/aiOperationIntelligenceService.js",
    "sizeBytes": 19537
  },
  {
    "path": "services/legacy/aiOrchestrationService.js",
    "sizeBytes": 3094
  },
  {
    "path": "services/legacy/aiSelfHealingService.js",
    "sizeBytes": 20211
  },
  {
    "path": "services/legacy/aiService.js",
    "sizeBytes": 192
  },
  {
    "path": "services/legacy/analyticsMonitoringService.js",
    "sizeBytes": 13719
  },
  {
    "path": "services/legacy/analyticsService.js",
    "sizeBytes": 21301
  },
  {
    "path": "services/legacy/animalHealthService.js",
    "sizeBytes": 21315
  },
  {
    "path": "services/legacy/apicultureService.js",
    "sizeBytes": 3753
  },
  {
    "path": "services/legacy/arVrService.js",
    "sizeBytes": 19307
  },
  {
    "path": "services/legacy/assetAccountingService.js",
    "sizeBytes": 16843
  },
  {
    "path": "services/legacy/auditService.js",
    "sizeBytes": 9966
  },
  {
    "path": "services/legacy/backupService.js",
    "sizeBytes": 10555
  },
  {
    "path": "services/legacy/biodiversityService.js",
    "sizeBytes": 30533
  },
  {
    "path": "services/legacy/blockchainTraceabilityService.js",
    "sizeBytes": 24839
  },
  {
    "path": "services/legacy/bulkOrderService.js",
    "sizeBytes": 16618
  },
  {
    "path": "services/legacy/buyingClubService.js",
    "sizeBytes": 12070
  },
  {
    "path": "services/legacy/catalogIntelligenceService.js",
    "sizeBytes": 22105
  },
  {
    "path": "services/legacy/civilDisruptionService.js",
    "sizeBytes": 6164
  },
  {
    "path": "services/legacy/climateMonitoringService.js",
    "sizeBytes": 2025
  },
  {
    "path": "services/legacy/coldStorageService.js",
    "sizeBytes": 27612
  },
  {
    "path": "services/legacy/commerceRulesService.js",
    "sizeBytes": 14340
  },
  {
    "path": "services/legacy/communityManagementService.js",
    "sizeBytes": 1899
  },
  {
    "path": "services/legacy/companyService.js",
    "sizeBytes": 2013
  },
  {
    "path": "services/legacy/completeAIIntegrationService.js",
    "sizeBytes": 43361
  },
  {
    "path": "services/legacy/completeERPIntegrationService.js",
    "sizeBytes": 38824
  },
  {
    "path": "services/legacy/complianceService.js",
    "sizeBytes": 11686
  },
  {
    "path": "services/legacy/comprehensiveERPService.js",
    "sizeBytes": 65626
  },
  {
    "path": "services/legacy/consumerHealthService.js",
    "sizeBytes": 29399
  },
  {
    "path": "services/legacy/conversationalAIService.js",
    "sizeBytes": 18589
  },
  {
    "path": "services/legacy/cooperativeShareService.js",
    "sizeBytes": 8175
  },
  {
    "path": "services/legacy/costControlService.js",
    "sizeBytes": 17345
  },
  {
    "path": "services/legacy/costService.js",
    "sizeBytes": 3516
  },
  {
    "path": "services/legacy/cropManagementService.js",
    "sizeBytes": 2638
  },
  {
    "path": "services/legacy/cropPlanningService.js",
    "sizeBytes": 15481
  },
  {
    "path": "services/legacy/cropValueResearchService.js",
    "sizeBytes": 7754
  },
  {
    "path": "services/legacy/custodyEventRoutes.js",
    "sizeBytes": 6093
  },
  {
    "path": "services/legacy/custodyEventService.js",
    "sizeBytes": 14051
  },
  {
    "path": "services/legacy/dairyService.js",
    "sizeBytes": 24204
  },
  {
    "path": "services/legacy/decisionSupportService.js",
    "sizeBytes": 14693
  },
  {
    "path": "services/legacy/defenseFitnessPrepService.js",
    "sizeBytes": 3595
  },
  {
    "path": "services/legacy/demandService.js",
    "sizeBytes": 6645
  },
  {
    "path": "services/legacy/digitalProductPassportService.js",
    "sizeBytes": 35078
  },
  {
    "path": "services/legacy/digitalTwinService.js",
    "sizeBytes": 27192
  },
  {
    "path": "services/legacy/dprGenerationService.js",
    "sizeBytes": 21519
  },
  {
    "path": "services/legacy/dynamicPricingService.js",
    "sizeBytes": 43119
  },
  {
    "path": "services/legacy/ecommerceAIService.js",
    "sizeBytes": 29655
  },
  {
    "path": "services/legacy/ecommerceBusinessSalesService.js",
    "sizeBytes": 20596
  },
  {
    "path": "services/legacy/ecommerceERPService.js",
    "sizeBytes": 20284
  },
  {
    "path": "services/legacy/ecommerceIntegrationService.js",
    "sizeBytes": 26430
  },
  {
    "path": "services/legacy/ecommerceMarketingService.js",
    "sizeBytes": 23590
  },
  {
    "path": "services/legacy/ecommerceService.js",
    "sizeBytes": 20560
  },
  {
    "path": "services/legacy/engineeringProjectService.js",
    "sizeBytes": 11734
  },
  {
    "path": "services/legacy/enterpriseControlService.js",
    "sizeBytes": 22688
  },
  {
    "path": "services/legacy/enterpriseMemoryService.js",
    "sizeBytes": 16034
  },
  {
    "path": "services/legacy/equipmentExchangeService.js",
    "sizeBytes": 4919
  },
  {
    "path": "services/legacy/erpService.js",
    "sizeBytes": 29307
  },
  {
    "path": "services/legacy/escrowService.js",
    "sizeBytes": 9427
  },
  {
    "path": "services/legacy/experienceLayerService.js",
    "sizeBytes": 17884
  },
  {
    "path": "services/legacy/farmerFamilyService.js",
    "sizeBytes": 1172
  },
  {
    "path": "services/legacy/farmerService.js",
    "sizeBytes": 22875
  },
  {
    "path": "services/legacy/farmerTrainingService.js",
    "sizeBytes": 23882
  },
  {
    "path": "services/legacy/farmerValueService.js",
    "sizeBytes": 18845
  },
  {
    "path": "services/legacy/fertilizerInventoryService.js",
    "sizeBytes": 11173
  },
  {
    "path": "services/legacy/financialService.js",
    "sizeBytes": 27270
  },
  {
    "path": "services/legacy/fisheriesManagementService.js",
    "sizeBytes": 3459
  },
  {
    "path": "services/legacy/fisheriesService.js",
    "sizeBytes": 4364
  },
  {
    "path": "services/legacy/foluBenchmarkService.js",
    "sizeBytes": 8575
  },
  {
    "path": "services/legacy/foodIntelligenceService.js",
    "sizeBytes": 25495
  },
  {
    "path": "services/legacy/foodSafetyService.js",
    "sizeBytes": 31805
  },
  {
    "path": "services/legacy/forestryService.js",
    "sizeBytes": 3728
  },
  {
    "path": "services/legacy/formService.js",
    "sizeBytes": 14555
  },
  {
    "path": "services/legacy/freightPoolingService.js",
    "sizeBytes": 7861
  },
  {
    "path": "services/legacy/geofencingService.js",
    "sizeBytes": 13736
  },
  {
    "path": "services/legacy/giIntelligenceService.js",
    "sizeBytes": 23046
  },
  {
    "path": "services/legacy/glutWarningService.js",
    "sizeBytes": 4298
  },
  {
    "path": "services/legacy/goatService.js",
    "sizeBytes": 39156
  },
  {
    "path": "services/legacy/governanceService.js",
    "sizeBytes": 19055
  },
  {
    "path": "services/legacy/governmentSchemeService.js",
    "sizeBytes": 29690
  },
  {
    "path": "services/legacy/greenhouseService.js",
    "sizeBytes": 16424
  },
  {
    "path": "services/legacy/gstService.js",
    "sizeBytes": 27476
  },
  {
    "path": "services/legacy/horticultureManagementService.js",
    "sizeBytes": 2749
  },
  {
    "path": "services/legacy/householdEconomyService.js",
    "sizeBytes": 7059
  },
  {
    "path": "services/legacy/hrService.js",
    "sizeBytes": 31585
  },
  {
    "path": "services/legacy/identityManagementService.js",
    "sizeBytes": 5217
  },
  {
    "path": "services/legacy/indigenousKnowledgeService.js",
    "sizeBytes": 26447
  },
  {
    "path": "services/legacy/informationSharingService.js",
    "sizeBytes": 17633
  },
  {
    "path": "services/legacy/inputSupplyManagementService.js",
    "sizeBytes": 2676
  },
  {
    "path": "services/legacy/institutionalProcurementService.js",
    "sizeBytes": 32703
  },
  {
    "path": "services/legacy/insuranceClaimsService.js",
    "sizeBytes": 18695
  },
  {
    "path": "services/legacy/insuranceFraudDetectionService.js",
    "sizeBytes": 19324
  },
  {
    "path": "services/legacy/insurancePolicyIssuanceService.js",
    "sizeBytes": 14697
  },
  {
    "path": "services/legacy/insurancePremiumService.js",
    "sizeBytes": 12256
  },
  {
    "path": "services/legacy/insuranceService.js",
    "sizeBytes": 19000
  },
  {
    "path": "services/legacy/iotIntegrationService.js",
    "sizeBytes": 19587
  },
  {
    "path": "services/legacy/iotSensorService.js",
    "sizeBytes": 21847
  },
  {
    "path": "services/legacy/irrigationManagementService.js",
    "sizeBytes": 1388
  },
  {
    "path": "services/legacy/knowledgeGraphService.js",
    "sizeBytes": 12589
  },
  {
    "path": "services/legacy/knowledgeService.js",
    "sizeBytes": 23589
  },
  {
    "path": "services/legacy/laboratoryERPService.js",
    "sizeBytes": 17841
  },
  {
    "path": "services/legacy/landManagementService.js",
    "sizeBytes": 2137
  },
  {
    "path": "services/legacy/landRecordsService.js",
    "sizeBytes": 14787
  },
  {
    "path": "services/legacy/libraryKnowledgeService.js",
    "sizeBytes": 10289
  },
  {
    "path": "services/legacy/livestockManagementService.js",
    "sizeBytes": 3085
  },
  {
    "path": "services/legacy/logisticsEnhancementService.js",
    "sizeBytes": 28101
  },
  {
    "path": "services/legacy/logisticsService.js",
    "sizeBytes": 20477
  },
  {
    "path": "services/legacy/machineryAccessService.js",
    "sizeBytes": 7695
  },
  {
    "path": "services/legacy/marketAccessService.js",
    "sizeBytes": 6978
  },
  {
    "path": "services/legacy/marketDataService.js",
    "sizeBytes": 17658
  },
  {
    "path": "services/legacy/marketIntelligenceService.js",
    "sizeBytes": 6244
  },
  {
    "path": "services/legacy/merchandisingService.js",
    "sizeBytes": 16892
  },
  {
    "path": "services/legacy/millCircuitService.js",
    "sizeBytes": 9008
  },
  {
    "path": "services/legacy/mobilityRidesService.js",
    "sizeBytes": 8091
  },
  {
    "path": "services/legacy/moduleCatalogService.js",
    "sizeBytes": 9101
  },
  {
    "path": "services/legacy/multilingualService.js",
    "sizeBytes": 27980
  },
  {
    "path": "services/legacy/mushroomService.js",
    "sizeBytes": 3984
  },
  {
    "path": "services/legacy/neProductIntelligenceService.js",
    "sizeBytes": 15020
  },
  {
    "path": "services/legacy/nutrientValueSalesService.js",
    "sizeBytes": 28866
  },
  {
    "path": "services/legacy/nutritionIntelligenceService.js",
    "sizeBytes": 45447
  },
  {
    "path": "services/legacy/ocrService.js",
    "sizeBytes": 6011
  },
  {
    "path": "services/legacy/offlinePaymentService.js",
    "sizeBytes": 23205
  },
  {
    "path": "services/legacy/offlineSyncService.js",
    "sizeBytes": 27407
  },
  {
    "path": "services/legacy/omnichannelAIService.js",
    "sizeBytes": 24991
  },
  {
    "path": "services/legacy/operationsManagementService.js",
    "sizeBytes": 2664
  },
  {
    "path": "services/legacy/orderService.js",
    "sizeBytes": 28369
  },
  {
    "path": "services/legacy/organicTraceabilityService.js",
    "sizeBytes": 27993
  },
  {
    "path": "services/legacy/organizationManagementService.js",
    "sizeBytes": 16103
  },
  {
    "path": "services/legacy/pigService.js",
    "sizeBytes": 39118
  },
  {
    "path": "services/legacy/platformConfigurationService.js",
    "sizeBytes": 16406
  },
  {
    "path": "services/legacy/platformTelemetryService.js",
    "sizeBytes": 3793
  },
  {
    "path": "services/legacy/poultryService.js",
    "sizeBytes": 37102
  },
  {
    "path": "services/legacy/predictiveAnalyticsService.js",
    "sizeBytes": 15383
  },
  {
    "path": "services/legacy/preSeasonOrderService.js",
    "sizeBytes": 23036
  },
  {
    "path": "services/legacy/preventiveMaintenanceService.js",
    "sizeBytes": 1837
  },
  {
    "path": "services/legacy/procurementSubscriptionService.js",
    "sizeBytes": 11703
  },
  {
    "path": "services/legacy/productMediaAIService.js",
    "sizeBytes": 11399
  },
  {
    "path": "services/legacy/productReviewService.js",
    "sizeBytes": 13198
  },
  {
    "path": "services/legacy/productService.js",
    "sizeBytes": 19533
  },
  {
    "path": "services/legacy/projectSystemsService.js",
    "sizeBytes": 20615
  },
  {
    "path": "services/legacy/realtimeMonitoringService.js",
    "sizeBytes": 15589
  },
  {
    "path": "services/legacy/recipeIntelligenceService.js",
    "sizeBytes": 29932
  },
  {
    "path": "services/legacy/recoveredFinanceService.js",
    "sizeBytes": 12193
  },
  {
    "path": "services/legacy/regionalVarietyService.js",
    "sizeBytes": 5493
  },
  {
    "path": "services/legacy/renewableEnergyService.js",
    "sizeBytes": 9972
  },
  {
    "path": "services/legacy/researchAndDevelopmentService.js",
    "sizeBytes": 22126
  },
  {
    "path": "services/legacy/resourceCrudFactory.js",
    "sizeBytes": 4146
  },
  {
    "path": "services/legacy/returnLoadBoardService.js",
    "sizeBytes": 3139
  },
  {
    "path": "services/legacy/revenueService.js",
    "sizeBytes": 4630
  },
  {
    "path": "services/legacy/rfqService.js",
    "sizeBytes": 10745
  },
  {
    "path": "services/legacy/riskPricingService.js",
    "sizeBytes": 18231
  },
  {
    "path": "services/legacy/roboticsService.js",
    "sizeBytes": 166
  },
  {
    "path": "services/legacy/roleManagementService.js",
    "sizeBytes": 9885
  },
  {
    "path": "services/legacy/ruralEnterpriseService.js",
    "sizeBytes": 11909
  },
  {
    "path": "services/legacy/ruralFinanceService.js",
    "sizeBytes": 7360
  },
  {
    "path": "services/legacy/sapModuleArchitectureService.js",
    "sizeBytes": 13098
  },
  {
    "path": "services/legacy/seedVaultService.js",
    "sizeBytes": 4293
  },
  {
    "path": "services/legacy/sellerRankingService.js",
    "sizeBytes": 5652
  },
  {
    "path": "services/legacy/sericultureService.js",
    "sizeBytes": 3856
  },
  {
    "path": "services/legacy/sharedInfraService.js",
    "sizeBytes": 29881
  },
  {
    "path": "services/legacy/sharedInfrastructureService.js",
    "sizeBytes": 17479
  },
  {
    "path": "services/legacy/sheepService.js",
    "sizeBytes": 40714
  },
  {
    "path": "services/legacy/shelfLifeService.js",
    "sizeBytes": 29434
  },
  {
    "path": "services/legacy/smsAuthService.js",
    "sizeBytes": 19857
  },
  {
    "path": "services/legacy/soilManagementService.js",
    "sizeBytes": 1307
  },
  {
    "path": "services/legacy/soilTestingService.js",
    "sizeBytes": 22968
  },
  {
    "path": "services/legacy/subsidyService.js",
    "sizeBytes": 19180
  },
  {
    "path": "services/legacy/systemAdministrationService.js",
    "sizeBytes": 15767
  },
  {
    "path": "services/legacy/tenantManagementService.js",
    "sizeBytes": 17211
  },
  {
    "path": "services/legacy/v42IntelligenceService.js",
    "sizeBytes": 17435
  },
  {
    "path": "services/legacy/valueCommerceService.js",
    "sizeBytes": 17375
  },
  {
    "path": "services/legacy/vermicompostService.js",
    "sizeBytes": 3914
  },
  {
    "path": "services/legacy/villageInitiativesService.js",
    "sizeBytes": 12891
  },
  {
    "path": "services/legacy/villageIssuesService.js",
    "sizeBytes": 13579
  },
  {
    "path": "services/legacy/villageProfileService.js",
    "sizeBytes": 11430
  },
  {
    "path": "services/legacy/visionService.js",
    "sizeBytes": 6267
  },
  {
    "path": "services/legacy/voiceAIService.js",
    "sizeBytes": 15768
  },
  {
    "path": "services/legacy/waterManagementService.js",
    "sizeBytes": 2206
  },
  {
    "path": "services/legacy/wearableIntegrationService.js",
    "sizeBytes": 10488
  },
  {
    "path": "services/legacy/weatherService.js",
    "sizeBytes": 20446
  },
  {
    "path": "services/legacy/whatsappService.js",
    "sizeBytes": 18759
  },
  {
    "path": "services/legacy/wikipediaService.js",
    "sizeBytes": 4679
  },
  {
    "path": "services/legacy/__tests__/aiAgenticCompanionService.test.js",
    "sizeBytes": 3170
  },
  {
    "path": "services/legacy/__tests__/erpService.test.js",
    "sizeBytes": 1544
  },
  {
    "path": "services/legacy/__tests__/farmerService.test.js",
    "sizeBytes": 4410
  },
  {
    "path": "services/legacy/__tests__/orderService.test.js",
    "sizeBytes": 4527
  },
  {
    "path": "services/legacy/__tests__/productService.test.js",
    "sizeBytes": 3061
  },
  {
    "path": "services/libraryAIWorkspaceService.js",
    "sizeBytes": 16763
  },
  {
    "path": "services/libraryKnowledgeService.js",
    "sizeBytes": 769
  },
  {
    "path": "services/livestockManagementService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/livestockService.js",
    "sizeBytes": 695
  },
  {
    "path": "services/loanManagementService.js",
    "sizeBytes": 4513
  },
  {
    "path": "services/loggingService.js",
    "sizeBytes": 2200
  },
  {
    "path": "services/logistics/blockchainTraceabilityService.js",
    "sizeBytes": 23036
  },
  {
    "path": "services/logistics/freightPoolingService.js",
    "sizeBytes": 6757
  },
  {
    "path": "services/logistics/iotIntegrationService.js",
    "sizeBytes": 18218
  },
  {
    "path": "services/logistics/logisticsEnhancementService.js",
    "sizeBytes": 24537
  },
  {
    "path": "services/logistics/logisticsService.js",
    "sizeBytes": 16044
  },
  {
    "path": "services/logistics/mobilityRidesService.js",
    "sizeBytes": 1215
  },
  {
    "path": "services/logisticsEnhancementService.js",
    "sizeBytes": 1141
  },
  {
    "path": "services/logisticsService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/m001m050EnterpriseProductService.js",
    "sizeBytes": 12011
  },
  {
    "path": "services/m001m050HighestStandardEnhancementService.js",
    "sizeBytes": 14802
  },
  {
    "path": "services/m001m050OperationalExperienceService.js",
    "sizeBytes": 3772
  },
  {
    "path": "services/m001m050ProductionIntegrationService.js",
    "sizeBytes": 1546
  },
  {
    "path": "services/m001m050ProductionRuntimeService.js",
    "sizeBytes": 4775
  },
  {
    "path": "services/m001m050WorkflowOrchestrationService.js",
    "sizeBytes": 4125
  },
  {
    "path": "services/m051m100AgricultureProductionService.js",
    "sizeBytes": 2026
  },
  {
    "path": "services/m051m100DomainIntelligenceService.js",
    "sizeBytes": 4922
  },
  {
    "path": "services/m051m100ModuleWiringService.js",
    "sizeBytes": 2603
  },
  {
    "path": "services/m051m100ProductionHardeningService.js",
    "sizeBytes": 13987
  },
  {
    "path": "services/m051m150EnterprisePromotionService.js",
    "sizeBytes": 10461
  },
  {
    "path": "services/machineryAccessService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/machineryVillageOpsService.js",
    "sizeBytes": 14906
  },
  {
    "path": "services/marketAccessService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/marketAnalyticsService.js",
    "sizeBytes": 1206
  },
  {
    "path": "services/marketDataService.js",
    "sizeBytes": 1111
  },
  {
    "path": "services/marketIntelligenceService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/masterDataIntelligenceService.js",
    "sizeBytes": 2716
  },
  {
    "path": "services/masterDataReconciliationService.js",
    "sizeBytes": 763
  },
  {
    "path": "services/merchandisingService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/mfaService.js",
    "sizeBytes": 3361
  },
  {
    "path": "services/millCircuitService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/mlOptimizationService.js",
    "sizeBytes": 634
  },
  {
    "path": "services/mlService.js",
    "sizeBytes": 1558
  },
  {
    "path": "services/mobilityRidesService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/moduleCatalogService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/moduleEventService.js",
    "sizeBytes": 998
  },
  {
    "path": "services/moduleProductionAssuranceService.js",
    "sizeBytes": 16467
  },
  {
    "path": "services/moduleSupportInfrastructureService.js",
    "sizeBytes": 18661
  },
  {
    "path": "services/monitoringService.js",
    "sizeBytes": 593
  },
  {
    "path": "services/multilingualService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/neProductIntelligenceService.js",
    "sizeBytes": 1144
  },
  {
    "path": "services/nlpService.js",
    "sizeBytes": 573
  },
  {
    "path": "services/notificationService.js",
    "sizeBytes": 12899
  },
  {
    "path": "services/NotificationSystemService.js",
    "sizeBytes": 620
  },
  {
    "path": "services/nutrientValueSalesService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/nutritionIntelligenceService.js",
    "sizeBytes": 1144
  },
  {
    "path": "services/ocrService.js",
    "sizeBytes": 1090
  },
  {
    "path": "services/offlinePaymentService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/offlineSyncService.js",
    "sizeBytes": 26280
  },
  {
    "path": "services/omnichannelAIService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/operationalModuleService.js",
    "sizeBytes": 4597
  },
  {
    "path": "services/operations/sharedCapacityService.js",
    "sizeBytes": 8046
  },
  {
    "path": "services/operations/__tests__/sharedCapacityService.test.js",
    "sizeBytes": 2509
  },
  {
    "path": "services/orderService.js",
    "sizeBytes": 1096
  },
  {
    "path": "services/organicTraceabilityService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/organizationManagementService.js",
    "sizeBytes": 1147
  },
  {
    "path": "services/paymentGatewayService.js",
    "sizeBytes": 6929
  },
  {
    "path": "services/paymentService.js",
    "sizeBytes": 8253
  },
  {
    "path": "services/PermissionManagementService.js",
    "sizeBytes": 633
  },
  {
    "path": "services/phase10.js",
    "sizeBytes": 2563
  },
  {
    "path": "services/phase11.js",
    "sizeBytes": 2444
  },
  {
    "path": "services/phase12.js",
    "sizeBytes": 2929
  },
  {
    "path": "services/phase8.js",
    "sizeBytes": 2225
  },
  {
    "path": "services/phase9.js",
    "sizeBytes": 2914
  },
  {
    "path": "services/pigService.js",
    "sizeBytes": 1090
  },
  {
    "path": "services/platform/advancedFeaturesService.js",
    "sizeBytes": 16777
  },
  {
    "path": "services/platform/analyticsMonitoringService.js",
    "sizeBytes": 7387
  },
  {
    "path": "services/platform/analyticsService.js",
    "sizeBytes": 7461
  },
  {
    "path": "services/platform/auditService.js",
    "sizeBytes": 9959
  },
  {
    "path": "services/platform/backupService.js",
    "sizeBytes": 4992
  },
  {
    "path": "services/platform/cloudManagementService.js",
    "sizeBytes": 196
  },
  {
    "path": "services/platform/complianceService.js",
    "sizeBytes": 11337
  },
  {
    "path": "services/platform/databaseManagementService.js",
    "sizeBytes": 18070
  },
  {
    "path": "services/platform/enterpriseMemoryService.js",
    "sizeBytes": 12543
  },
  {
    "path": "services/platform/erpService.js",
    "sizeBytes": 28921
  },
  {
    "path": "services/platform/experienceLayerService.js",
    "sizeBytes": 17864
  },
  {
    "path": "services/platform/formService.js",
    "sizeBytes": 14187
  },
  {
    "path": "services/platform/governanceService.js",
    "sizeBytes": 17186
  },
  {
    "path": "services/platform/indiaCoverageService.js",
    "sizeBytes": 3179
  },
  {
    "path": "services/platform/indiaLanguageService.js",
    "sizeBytes": 1704
  },
  {
    "path": "services/platform/indiaLanguageService.test.js",
    "sizeBytes": 1729
  },
  {
    "path": "services/platform/laboratoryERPService.js",
    "sizeBytes": 17692
  },
  {
    "path": "services/platform/moduleSupportInfrastructureService.js",
    "sizeBytes": 18661
  },
  {
    "path": "services/platform/multilingualService.js",
    "sizeBytes": 27850
  },
  {
    "path": "services/platform/offlineSyncService.js",
    "sizeBytes": 25408
  },
  {
    "path": "services/platform/publicDomainDataExtractionService.js",
    "sizeBytes": 25259
  },
  {
    "path": "services/platform/realtimeMonitoringService.js",
    "sizeBytes": 15348
  },
  {
    "path": "services/platform/researchAndDevelopmentService.js",
    "sizeBytes": 22124
  },
  {
    "path": "services/platform/sapModuleArchitectureService.js",
    "sizeBytes": 6848
  },
  {
    "path": "services/platform/serverManagementService.js",
    "sizeBytes": 15710
  },
  {
    "path": "services/platform/sharedInfraService.js",
    "sizeBytes": 17510
  },
  {
    "path": "services/platform/sharedInfrastructureService.js",
    "sizeBytes": 17498
  },
  {
    "path": "services/platform/smsAuthService.js",
    "sizeBytes": 19867
  },
  {
    "path": "services/platform/startupEnvironmentService.js",
    "sizeBytes": 21892
  },
  {
    "path": "services/platform/whatsappService.js",
    "sizeBytes": 13062
  },
  {
    "path": "services/platform/wikipediaService.js",
    "sizeBytes": 4662
  },
  {
    "path": "services/platformConfigurationService.js",
    "sizeBytes": 1144
  },
  {
    "path": "services/platformCoreService.js",
    "sizeBytes": 9028
  },
  {
    "path": "services/platformTelemetryService.js",
    "sizeBytes": 1132
  },
  {
    "path": "services/poultryService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/predictiveAnalyticsService.js",
    "sizeBytes": 1049
  },
  {
    "path": "services/predictiveIntelligenceService.js",
    "sizeBytes": 15378
  },
  {
    "path": "services/predictiveOptimizationService.js",
    "sizeBytes": 2186
  },
  {
    "path": "services/preSeasonOrderService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/preventiveMaintenanceService.js",
    "sizeBytes": 1144
  },
  {
    "path": "services/priceForecastingService.js",
    "sizeBytes": 2223
  },
  {
    "path": "services/procurementSubscriptionService.js",
    "sizeBytes": 1150
  },
  {
    "path": "services/productCertificationService.js",
    "sizeBytes": 4651
  },
  {
    "path": "services/productImageAutoGenerationService.js",
    "sizeBytes": 12017
  },
  {
    "path": "services/productionExampleService.js",
    "sizeBytes": 6994
  },
  {
    "path": "services/productionSupplyBridgeService.js",
    "sizeBytes": 5334
  },
  {
    "path": "services/productMediaAIService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/productReviewService.js",
    "sizeBytes": 774
  },
  {
    "path": "services/productService.js",
    "sizeBytes": 19775
  },
  {
    "path": "services/projectSystemsService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/publicDataExtractorService.js",
    "sizeBytes": 5590
  },
  {
    "path": "services/publicDomainDataExtractionService.js",
    "sizeBytes": 25902
  },
  {
    "path": "services/qualityAssuranceService.js",
    "sizeBytes": 849
  },
  {
    "path": "services/razorpayService.js",
    "sizeBytes": 2473
  },
  {
    "path": "services/realtimeMonitoringService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/recipeIntelligenceService.js",
    "sizeBytes": 1135
  },
  {
    "path": "services/recoveredFinanceService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/redisCacheService.js",
    "sizeBytes": 8853
  },
  {
    "path": "services/refundService.js",
    "sizeBytes": 1925
  },
  {
    "path": "services/regionalVarietyService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/renewableEnergyService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/research/artificialScientistService.js",
    "sizeBytes": 19577
  },
  {
    "path": "services/research/__tests__/artificialScientistService.test.js",
    "sizeBytes": 5073
  },
  {
    "path": "services/researchAndDevelopmentService.js",
    "sizeBytes": 1147
  },
  {
    "path": "services/resourceCrudFactory.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/returnLoadBoardService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/returnService.js",
    "sizeBytes": 1719
  },
  {
    "path": "services/revenueService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/rfqService.js",
    "sizeBytes": 1090
  },
  {
    "path": "services/riskAssessmentService.js",
    "sizeBytes": 929
  },
  {
    "path": "services/riskPricingService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/roboticFarmingService.js",
    "sizeBytes": 160
  },
  {
    "path": "services/robotics/roboticsOrchestrationService.js",
    "sizeBytes": 16590
  },
  {
    "path": "services/robotics/__tests__/roboticsOrchestrationService.test.js",
    "sizeBytes": 3859
  },
  {
    "path": "services/roleManagementService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/ruralEnterpriseService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/ruralFinanceService.js",
    "sizeBytes": 1117
  },
  {
    "path": "services/sapModuleArchitectureService.js",
    "sizeBytes": 13159
  },
  {
    "path": "services/SearchFilterServiceService.js",
    "sizeBytes": 631
  },
  {
    "path": "services/seedVaultService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/sellerRankingService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/sellerVerificationService.js",
    "sizeBytes": 8258
  },
  {
    "path": "services/serverManagementService.js",
    "sizeBytes": 15710
  },
  {
    "path": "services/sharedInfraService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/sharedInfrastructureService.js",
    "sizeBytes": 1141
  },
  {
    "path": "services/sheepService.js",
    "sizeBytes": 1096
  },
  {
    "path": "services/shelfLifeService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/smsAuthService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/soilHealthService.js",
    "sizeBytes": 735
  },
  {
    "path": "services/soilNutrientLandService.js",
    "sizeBytes": 15289
  },
  {
    "path": "services/soilTestingService.js",
    "sizeBytes": 1114
  },
  {
    "path": "services/startupEnvironmentService.js",
    "sizeBytes": 21892
  },
  {
    "path": "services/strategic/contractFarmingService.js",
    "sizeBytes": 27450
  },
  {
    "path": "services/strategic/governmentSubsidyService.js",
    "sizeBytes": 36014
  },
  {
    "path": "services/strategic/householdProcurementService.js",
    "sizeBytes": 24749
  },
  {
    "path": "services/strategic/preSeasonPurchaseService.js",
    "sizeBytes": 26968
  },
  {
    "path": "services/strategic/__tests__/householdProcurementAccess.test.js",
    "sizeBytes": 1007
  },
  {
    "path": "services/subscriptionService.js",
    "sizeBytes": 2894
  },
  {
    "path": "services/subsidyService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/supplyChainAnalyticsService.js",
    "sizeBytes": 1158
  },
  {
    "path": "services/supplyChainDecisionService.js",
    "sizeBytes": 4490
  },
  {
    "path": "services/supplyChainTrackingService.js",
    "sizeBytes": 2204
  },
  {
    "path": "services/systemAdministrationService.js",
    "sizeBytes": 1141
  },
  {
    "path": "services/tenantManagementService.js",
    "sizeBytes": 1129
  },
  {
    "path": "services/trackingService.js",
    "sizeBytes": 1215
  },
  {
    "path": "services/transactionService.js",
    "sizeBytes": 12178
  },
  {
    "path": "services/unifiedConfigService.js",
    "sizeBytes": 2086
  },
  {
    "path": "services/unifiedLedgerService.js",
    "sizeBytes": 16380
  },
  {
    "path": "services/UserAuthenticationService.js",
    "sizeBytes": 627
  },
  {
    "path": "services/UserAuthorizationService.js",
    "sizeBytes": 620
  },
  {
    "path": "services/userManagementService.js",
    "sizeBytes": 10734
  },
  {
    "path": "services/userService.js",
    "sizeBytes": 686
  },
  {
    "path": "services/v42IntelligenceService.js",
    "sizeBytes": 1126
  },
  {
    "path": "services/valueCommerceService.js",
    "sizeBytes": 1120
  },
  {
    "path": "services/vendorProcurementService.js",
    "sizeBytes": 15676
  },
  {
    "path": "services/videoAnalyticsService.js",
    "sizeBytes": 757
  },
  {
    "path": "services/villageGovernanceService.js",
    "sizeBytes": 9043
  },
  {
    "path": "services/villageProfileService.js",
    "sizeBytes": 1123
  },
  {
    "path": "services/villageSupplyService.js",
    "sizeBytes": 5554
  },
  {
    "path": "services/voiceAIService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/vrService.js",
    "sizeBytes": 593
  },
  {
    "path": "services/walletService.js",
    "sizeBytes": 10064
  },
  {
    "path": "services/warehouseManagementService.js",
    "sizeBytes": 1684
  },
  {
    "path": "services/waterIrrigationService.js",
    "sizeBytes": 17611
  },
  {
    "path": "services/wearableIntegrationService.js",
    "sizeBytes": 1138
  },
  {
    "path": "services/weatherAdvisoryService.js",
    "sizeBytes": 1530
  },
  {
    "path": "services/weatherService.js",
    "sizeBytes": 1102
  },
  {
    "path": "services/websocketService.js",
    "sizeBytes": 5939
  },
  {
    "path": "services/whatsappService.js",
    "sizeBytes": 1105
  },
  {
    "path": "services/wikipediaService.js",
    "sizeBytes": 1108
  },
  {
    "path": "services/yieldManagementService.js",
    "sizeBytes": 976
  },
  {
    "path": "services/__tests__/authService.security.test.js",
    "sizeBytes": 2646
  },
  {
    "path": "services/__tests__/authService.test.js",
    "sizeBytes": 3429
  },
  {
    "path": "services/__tests__/commerceFulfillmentPhases.test.js",
    "sizeBytes": 1391
  },
  {
    "path": "services/__tests__/cropRecommendationService.test.js",
    "sizeBytes": 4453
  },
  {
    "path": "services/__tests__/operationalModuleService.test.js",
    "sizeBytes": 2239
  },
  {
    "path": "services/__tests__/orphanedServiceRoutes.test.js",
    "sizeBytes": 6257
  },
  {
    "path": "services/__tests__/productionSupplyBridgeService.test.js",
    "sizeBytes": 2081
  },
  {
    "path": "services/__tests__/villageSupplyService.test.js",
    "sizeBytes": 2075
  },
  {
    "path": "services/__tests__/weatherAdvisoryService.test.js",
    "sizeBytes": 2958
  }
];

module.exports = { serviceFiles, generatedAt: '2026-09-20', source: 'filesystem-scan', totalFiles: serviceFiles.length };
