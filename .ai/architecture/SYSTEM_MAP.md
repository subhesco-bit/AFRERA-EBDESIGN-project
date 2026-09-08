# SYSTEM MAP — EBDESIGN Platform Reorganized by Business Domain

**Generated:** 8 September 2026
**Method:** Evidence-based grouping from `backend/src/index.js` route mounts (207 `app.use('/api/v1/...')` calls), `backend/src/services/legacy/*` (183 confirmed-live service files) plus `backend/src/services/{agriculture,ai,claude,commerce,dual-use,energy,erp,finance,food,logistics,platform,strategic}/*` (126 files), `backend/src/routes/{agriculture,ai,claude,commerce,dual-use,finance,livestock,logistics,platform,strategic}/*` (115 files) plus 95 top-level route files, `backend/src/modules/M0XX_*/module.json` (192 modules with name/category), and `frontend/src/pages/**/*.jsx` (387 page files) cross-referenced with `frontend/src/config/routes.js`.

This is a **documentation-only file** under `.ai/` (safe to modify per CLAUDE.md). No source code was changed to produce it.

**Total systems identified: 29**

---

## Summary Table

| # | System | Frontend pages | Backend routes | Backend services | AI component | Est. files |
|---|--------|----------------|-----------------|-------------------|:---:|---:|
| 1 | Identity, Auth & Security | 10 | 9 | 6 | N | ~30 |
| 2 | Platform Core, Multi-Tenancy & Org Admin | 9 | 12 | 8 | N | ~35 |
| 3 | AI Orchestration & Copilot Layer | 20 | 35 | 32 | Y (is the AI layer) | ~110 |
| 4 | Marketplace & E-Commerce | 22 | 20 | 18 | Y (product/order AI) | ~90 |
| 5 | Finance, Payments & Ledger | 16 | 12 | 9 | Y (financialAI) | ~55 |
| 6 | Insurance | 2 | 2 | 5 | Y (insuranceAI) | ~14 |
| 7 | Rural Finance, Govt Schemes & Cooperative | 21 | 6 | 8 | N | ~45 |
| 8 | Logistics & Cold Chain | 8 | 11 | 8 | Y (logisticsAI) | ~35 |
| 9 | Crop & Agronomy Advisory | 14 | 15 | 6 | Y (crop AI/agri intelligence) | ~50 |
| 10 | Soil, Nutrient & Land Mapping | 5 | 11 | 3 | N | ~25 |
| 11 | Water & Irrigation Management | 3 | 8 | 1 | N | ~15 |
| 12 | Climate, Weather & Risk Intelligence | 7 | 10 | 3 | Y (climateAdvisory) | ~25 |
| 13 | Crop Inputs Supply Chain | 0 | 7 | 1 | N | ~12 |
| 14 | Livestock & Dairy | 8 | 8 | 6 | N | ~28 |
| 15 | Fisheries & Aquaculture | 2 | 9 | 2 | N | ~16 |
| 16 | Horticulture & Protected Cultivation | 3 | 9 | 1 | N | ~15 |
| 17 | Forestry, Sericulture & Minor Produce | 5 | 6 | 3 | N | ~18 |
| 18 | Nutrition, Food & Consumer Health | 4 | 3 | 5 | Y (nutritionIntelligence) | ~20 |
| 19 | ERP Integration (SAP-style) | 8 | 10 | 6 | N | ~35 |
| 20 | HR & Labour Management | 2 | 2 | 1 | N | ~8 |
| 21 | Farmer Identity, Portal & Household | 15 | 4 | 4 | N | ~30 |
| 22 | Analytics, BI & Reporting | 22 | 6 | 4 | Y (predictive/market analytics) | ~35 |
| 23 | Compliance, Governance & Audit | 6 | 6 | 4 | N | ~20 |
| 24 | IoT, Sensors, Realtime & Digital Twin | 3 | 5 | 2 | N | ~15 |
| 25 | Mobile Experience Layer | 10 | 1 | 1 | N | ~14 |
| 26 | Engineering, R&D & Enterprise Knowledge | 4 | 4 | 2 | N | ~14 |
| 27 | Enterprise Admin & DevOps Console | 0 | 7 | 6 | N | ~18 |
| 28 | Vendor, Procurement & Supply Chain Ops | 2 | 3 | 2 | N | ~12 |
| 29 | Machinery, Equipment & Village Ops | 12 | 4 | 2 | N | ~25 |

*(Est. files counts are rough — they sum frontend pages + backend route files + backend service files + directly-named migrations/tests/module.json entries for that system; some files legitimately touch two systems and are counted once, under their primary domain.)*

---

## 1. Identity, Auth & Security
**Purpose:** Authentication, authorization, MFA/SSO, sessions, roles/permissions, GDPR consent, and farmer identity verification (KYC).

- **Frontend:** `LoginPage.jsx`, `RegisterPage.jsx`, `MFASetupPage.jsx`, `GDPRConsentPage.jsx`, `AuthorizationPage.jsx`, `IdentityManagementPage.jsx`, `RolePermissionPage.jsx`, `FarmerVerificationPage.jsx`, `FarmerKycPage.jsx`, `admin/RolePermissions.jsx`, `admin/SecuritySettings.jsx`
- **Backend routes:** `authService.router` (`/api/v1/auth`), `mfaRoutes` (`/api/v1/mfa`), `dual-use/mfaRoutes`, `gdprRoutes` / `dual-use/gdprRoutes` (`/api/v1/privacy`), `permissionManagementRoutes` (`/api/v1/permissions`), `ssoRoutes` (`/api/v1/sso-providers`), `mfaManagementRoutes` (`/api/v1/mfa-devices`), `digitalIdentityRoutes` (`/api/v1/digital-identities`), `consentManagementRoutes` (`/api/v1/consent-records`), `sessionManagementRoutes` (`/api/v1/sessions`), `roleManagementRoutes` (`/api/v1/roles`), `identityManagementRoutes`, `farmerVerificationRoutes`, `farmerKycRoutes`
- **Backend services:** `services/dual-use/authService.js`, `services/dual-use/mfaService.js`, `services/dual-use/gdprService.js`, `roleManagementService.js`, `identityManagementService.js`, `smsAuthService.js`
- **AI component:** None — plain CRUD/security domain.
- **Modules:** M002_USER_MANAGEMENT, M004_ROLE_MANAGEMENT, M005_PERMISSION_MANAGEMENT, M501100_IDENTITYMANAGEMENT, M209100_ROLEMANAGEMENT, M415100_SMSAUTH
- **Est. files:** ~30

## 2. Platform Core, Multi-Tenancy & Org Admin
**Purpose:** Core platform bootstrap, tenant/org lifecycle, system configuration, and company registry.

- **Frontend:** `PlatformFoundationPage.jsx`, `PlatformManagementPage.jsx`, `OrganizationTenantManagementPage.jsx`, `SystemAdministrationPage.jsx`, `admin/SystemConfiguration.jsx`, `admin/APIManagement.jsx`, `admin/IntegrationSettings.jsx`, `admin/NotificationPreferences.jsx`, `admin/UserManagement.jsx`
- **Backend routes:** `platformCoreRoutes` (`/api/v1/platform`, `/api/v1/platform-core`), `platform/platformCoreRoutes`, `platformConfigurationRoutes`/`platform/platformConfigurationRoutes`, `tenantManagementRoutes`/`platform/tenantManagementRoutes`, `organizationManagementRoutes`/`platform/organizationManagementRoutes`, `systemAdministrationRoutes`/`platform/systemAdministrationRoutes`, `companyRoutes`/`platform/companyRoutes`, `platformFoundationRoutes`
- **Backend services:** `services/dual-use/platformCoreService.js`, `platformConfigurationService.js`, `tenantManagementService.js`, `organizationManagementService.js`, `systemAdministrationService.js`, `companyService.js`, `platformTelemetryService.js`, `moduleCatalogService.js`
- **AI component:** None.
- **Modules:** M001_PLATFORM_CORE, M003_ORGANIZATION, M200_ORGANIZATION_MANAGEMENT, M152100_PLATFORMCONFIGURATION, M652100_TENANTMANAGEMENT, M840100_SYSTEMADMINISTRATION, M570100_COMPANY, M522100_PLATFORMTELEMETRY, M144100_MODULECATALOG
- **Est. files:** ~35

## 3. AI Orchestration & Copilot Layer
**Purpose:** The genuine cross-cutting AI system — Claude coordination, unified AI gateway, module registry/library knowledge, decision support, self-healing, vision/voice, and per-domain AI adapters (financial/logistics/insurance/product/order AI) that plug into this backbone.

- **Frontend:** `AIAgentPage.jsx`, `AIBackbonePage.jsx`, `AIBrainPage.jsx`, `AIChatPage.jsx`, `AICollaborationPage.jsx`, `AIDashboard.jsx`, `AIOperationIntelligencePage.jsx`, `AIProductStudioPage.jsx`, `AISelfHealingPage.jsx`, `CopilotHubPage.jsx`, `DecisionEngineDashboardPage.jsx`, `DecisionSupportPage.jsx`, `EnterpriseAIPage.jsx`, `EnterpriseMemoryDashboardPage.jsx`, `KnowledgeBasePage.jsx`, `KnowledgeReferencePage.jsx`, `LibraryBrowserPage.jsx`, `ModuleHubPage.jsx`, `PredictiveIntelligencePage.jsx`, `CompleteAIIntegrationPage.jsx`, `NervousSystemPage.jsx`
- **Backend routes:** all of `routes/ai/*` (11 files), all of `routes/claude/*` (16 files: aiCoordinationRoutes, aiDecisionRoutes, aiProviderRoutes, aiStrategyRoutes, financialAIRoutes, insuranceAIRoutes, logisticsAIRoutes, orderAIRoutes, productAIRoutes, unifiedAIRoutes, backendModuleBridge, libraryRoutes, moduleRegistryRoutes, aiCollaborationRoutes), plus top-level `aiBackboneRoutes`, `aiBrainRoutes`, `aiGatewayRoutes`, `aiAgentRoutes`, `aiApprovalRoutes`, `aiDomainAdapterRoutes`, `aiSelfHealingRoutes`, `aiOperationIntelligenceRoutes`, `completeAIIntegrationRoutes`, `enterpriseAIRoutes`, `unifiedAIGateway.js`, `unifiedAIRoutes`, `advancedFeatures.js`, `m400AiBackboneRoutes`, `visionRoutes`, `nervousSystemRoutes`
- **Backend services:** `core/claudeAICoordinator.js`, all of `services/ai/*` (13 files) and `services/claude/*` (16 files), plus `aiBackboneService.js` (legacy), `aiGatewayService.js`, `aiCopilotService.js`, `aiOrchestrationService.js`, `aiSelfHealingService.js`, `decisionSupportService.js`, `libraryKnowledgeService.js`, `aiCollaborationService.js`, `knowledgeGraphService.js`, `knowledgeService.js`, `predictiveAnalyticsService.js`, `omnichannelAIService.js`, `v42IntelligenceService.js`, `aiOperationIntelligenceService.js`, `visionService.js`, `voiceAIService.js`, `formService.js`
- **AI component:** This IS the AI system — every file listed is AI infrastructure.
- **Modules:** M400_AI_BACKBONE, M400_AI_CORE, M401_AI_GATEWAY, M402_AI_ORCHESTRATION, M404_DECISION_SUPPORT, M405_PREDICTIVE_ANALYTICS, M407_CONVERSATIONAL_AI, M408_KNOWLEDGE_MANAGEMENT, M409100_ADVANCEDAI, M410_AI_INTELLIGENCE_FABRIC, M455100_AICOPILOT, M317100_AISELFHEALING, M645100_LIBRARYKNOWLEDGE, M699100_AIOPERATIONINTELLIGENCE, M723100_AIBRAIN, M752100_AIBACKBONE, M675100_AIAGENTICCOMPANION, M477100_VOICEAI, M61100_VISION, M639100_OMNICHANNELAI, M764100_V42INTELLIGENCE, M456100_FORM
- **Est. files:** ~110 (largest system — this is the AI backbone spanning both generic orchestration and per-domain adapters)

## 4. Marketplace & E-Commerce
**Purpose:** Buying/selling produce — catalog, cart/checkout, orders, seller tools, B2B/bulk trade, RFQ, pricing intelligence.

- **Frontend:** `MarketplacePage.jsx`, `B2BMarketplace.jsx`, `EcommerceMarketplacePage.jsx`, `PremiumMarketplacePage.jsx`, `NutrientValueMarketplace.jsx`, `CartPage.jsx`, `CheckoutPage.jsx`, `ComparePage.jsx`, `ProductDetailPage.jsx`, `SellerProductFormPage.jsx`, `BulkOrderPage.jsx`, `BulkPurchasePage.jsx`, `GroupBuyingPage.jsx`, `RfqPage.jsx`, `DynamicPricingPage.jsx`, `MarketIntelligencePage.jsx`, `MarketSignalsPage.jsx`, `PriceBuildPage.jsx`, `PriceCheckPage.jsx`, `PreOrderPage.jsx`, `OrderDetailPage.jsx`, `CorporateBuyerPage.jsx`
- **Backend routes:** `orderService.router` (`/api/v1/orders`), `ecommerceRoutes`, `ecommerceIntegrationRoutes`, `ecommerceAIRoutes`, `ecommerceERPRoutes`, `ecommerceBusinessSalesRoutes`, `ecommerceMarketingRoutes`, `marketplaceEnhancements`, `bulkOrderRoutes`/`bulkOrders.js`, `productRoutes`, `productReviewRoutes`, `rfqRoutes`, `glutWarningRoutes`, `nutrientValueSalesRoutes`, `demandRoutes`, `vendorRoutes`, `equipmentExchangeRoutes`, `marketDataRoutes`, `sellerRankingRoutes` (was deleted in this session's cleanup — verify remount), `orderRoutes`
- **Backend services:** `services/commerce/*` (18 files: orderService, productService, productReviewService, bulkOrderService, buyingClubService, rfqService, marketAccessService, marketIntelligenceService, commerceRulesService, valueCommerceService, giIntelligenceService, procurementSubscriptionService, institutionalProcurementService, machineryAccessService, equipmentExchangeService, dprGenerationService, productMediaAIService, preSeasonOrderService, arVrService), `sellerRankingService.js`, `merchandisingService.js`, `dynamicPricingService.js`
- **AI component:** `productAIService.js` / `orderAIService.js` (Claude-layer adapters), `productMediaAIService.js`, `catalogIntelligenceService.js`
- **Modules:** M419100_ORDER, M377100_PRODUCT, M10100_PRODUCTREVIEW, M108100_BULKORDER, M48100_BUYINGCLUB, M205100_RFQ, M618100_GLUTWARNING, M285100_NUTRIENTVALUESALES, M345100_SELLERRANKING, M412100_COMMERCERULES, M474100_VALUECOMMERCE, M190100_GIINTELLIGENCE, M62100_EQUIPMENTEXCHANGE, M70100_MERCHANDISING, M188100_DYNAMICPRICING, M759100_DEMAND, M664100_MARKETINTELLIGENCE, M51100_MARKETACCESS, M801100_INSTITUTIONALPROCUREMENT, M530100_PROCUREMENTSUBSCRIPTION, M290100_MACHINERYACCESS, M652100_ARVR, M707100_CATALOGINTELLIGENCE
- **Est. files:** ~90 (second-largest — commerce is heavily built out with many overlapping route files, a known dedup target)

## 5. Finance, Payments & Ledger
**Purpose:** Core financial services — payments, wallet, loans, credit scoring, escrow, GST, unified ledger, cost accounting.

- **Frontend:** `FinancialReportPage.jsx`, `FinancialServicesDashboard.jsx`, `WalletPage.jsx`, `LoanManagementPage.jsx`, `EMICalculatorPage.jsx`, `CreditScorePage.jsx`, `EscrowPage.jsx`, `TransactionHistoryPage.jsx`, `LedgerPage.jsx`, `UnifiedLedgerPage.jsx`, `PaymentGatewayPage.jsx`, `PaymentProcessingPage.jsx`, `CostControlPage.jsx`, `AssetAccountingPage.jsx`, `BankerDashboardPage.jsx`, `BankPassportPage.jsx`
- **Backend routes:** `financialService.router` (`/api/v1/financial`), `paymentRoutes`, `paymentGatewayRoutes`, `walletRoutes`, `loanManagement.js`, `transactionRoutes`, `unifiedLedgerRoutes`/`finance/unifiedLedgerRoutes`, `gstRoutes`/`finance/gstRoutes`, `revenueRoutes`/`finance/revenueRoutes`, `costRoutes`/`finance/costRoutes`, `costControlRoutes`/`finance/costControlRoutes`, `riskPricingRoutes`/`finance/riskPricingRoutes`, `recoveredFinanceRoutes`/`finance/recoveredFinanceRoutes`, `assetAccountingRoutes`/`finance/assetAccountingRoutes`
- **Backend services:** `services/finance/financialService.js`, `finance/revenueService.js`, `finance/gstService.js`, `finance/recoveredFinanceService.js`, `finance/offlinePaymentService.js`, `finance/dynamicPricingService.js`, `riskPricingService.js`, `escrowService.js`, `assetAccountingService.js`, `costService.js`, `costControlService.js`
- **AI component:** `financialAIService.js` (Claude-layer adapter for financial decisions)
- **Modules:** M301_FINANCIAL_MANAGEMENT, M695100_GST, M117100_REVENUE, M309_COST_MANAGEMENT, M771100_COSTCONTROL, M543100_RISKPRICING, M697100_ESCROW, M3100_OFFLINEPAYMENT, M308_ASSET_MANAGEMENT, M407100_RECOVEREDFINANCE
- **Est. files:** ~55 (note: this session's git status shows active fixes here — escrow auth gap, rural finance schema mismatch)

## 6. Insurance
**Purpose:** Crop/asset insurance — claims, policy issuance, premium calculation, fraud detection.

- **Frontend:** `InsuranceManagementPage.jsx`, `InsurancePage.jsx`
- **Backend routes:** `insuranceService.router` (`/api/v1/insurance`), `insuranceEnhancements`/`finance/insuranceEnhancements`
- **Backend services:** `services/finance/insuranceService.js`, `finance/insuranceClaimsService.js`, `finance/insurancePolicyIssuanceService.js`, `insurancePremiumService.js`, `insuranceFraudDetectionService.js`
- **AI component:** `insuranceAIService.js` (Claude-layer adapter)
- **Modules:** M359100_INSURANCE, M18100_INSURANCECLAIMS, M640100_INSURANCEPOLICYISSUANCE, M292100_INSURANCEPREMIUM, M697100_INSURANCEFRAUDDETECTION
- **Est. files:** ~14

## 7. Rural Finance, Govt Schemes & Cooperative Economy
**Purpose:** Government subsidy administration, contract farming, household procurement, pre-season purchase, cooperative shares, SHGs — the "strategic" service bucket plus the `government/` page directory.

- **Frontend:** `GovernmentDashboardPage.jsx`, `GovernmentSubsidyPage.jsx`, `SubsidyManagementPage.jsx`, `ContractFarmingPage.jsx`, `HouseholdProcurementPage.jsx`, `PreSeasonPurchasePage.jsx`, `CooperativeSharePage.jsx`, `ShgManagementPage.jsx`, plus all 19 files under `pages/government/*` (AnnouncementBoard, ApplicationStatusTracker, ApprovalWorkflow, BeneficiaryManagement, CancellationManagement, ComplianceValidator, DeadlineTracker, DisputeResolutionPage, DocumentUploadPage, GovernmentNotificationCenter, GovernmentSchemeDashboard, MobileVerification, PaymentGateway, SchemeBeneficiaryList, SchemeEligibilityChecker, SchemeReportGenerator, SchemeUpdate Notifier, SchemeVerificationPage, SubsidyApplicationPage; `AuditLogPage.jsx`/`BiometricAuthentication.jsx` in this dir cross-reference System 1/23)
- **Backend routes:** `routes/strategic/*` (contractFarmingRoutes, governmentSubsidyRoutes, householdProcurementRoutes, preSeasonPurchaseRoutes — mounted at `/api/v1/strategic/*`), `cooperativeShareRoutes`
- **Backend services:** `services/strategic/contractFarmingService.js`, `strategic/governmentSubsidyService.js`, `strategic/householdProcurementService.js`, `strategic/preSeasonPurchaseService.js`, `finance/ruralFinanceService.js`, `finance/subsidyService.js`, `finance/governmentSchemeService.js`, `cooperativeShareService.js`, `agriculture/householdEconomyService.js`
- **AI component:** None (rules/eligibility-driven, not AI-driven).
- **Modules:** M333100_RURALFINANCE, M386100_SUBSIDY, M652100_GOVERNMENTSCHEME, M569100_COOPERATIVESHARE, M37100_HOUSEHOLDECONOMY, M570100_PRESEASONORDER
- **Est. files:** ~45

## 8. Logistics & Cold Chain
**Purpose:** Freight, cold storage, geofencing, track & trace, blockchain traceability, custody events, return-load matching.

- **Frontend:** `LogisticsPage.jsx`, `LogisticsEnhancementPage.jsx`, `LogisticsMatchingPage.jsx`, `LogisticsProviderPage.jsx`, `ColdStorageDashboardPage.jsx`, `ColdStoragePage.jsx`, `TraceabilityPage.jsx`, `BlockchainVerificationPage.jsx`
- **Backend routes:** `logisticsService.router` (`/api/v1/logistics`), `routes/logistics/*` (coldStorageRoutes, freightPoolingRoutes, geofencingRoutes, logisticsEnhancementRoutes/Enhancements, returnLoadBoardRoutes, trackDartRoutes), `blockchainTrace.js`, `blockchainVerificationRoutes`, `coldStorageRoutes` (`/api/v1/cold-storage`), `freightPoolingRoutes` (`/api/v1/freight-pooling`), `returnLoadBoardRoutes` (`/api/v1/return-load-board`)
- **Backend services:** `services/legacy/coldStorageService.js` (this session's dedup target), `services/logistics/logisticsService.js`, `logistics/logisticsEnhancementService.js`, `logistics/freightPoolingService.js`, `logistics/blockchainTraceabilityService.js`, `logistics/iotIntegrationService.js`, `custodyEventService.js`
- **AI component:** `logisticsAIService.js` (Claude-layer adapter)
- **Modules:** M615100_LOGISTICS, M100100_LOGISTICSENHANCEMENT, M132100_FREIGHTPOOLING, M379100_COLDSTORAGE, M560100_GEOFENCING, M414100_RETURNLOADBOARD, M388100_BLOCKCHAINTRACEABILITY, M353100_CUSTODYEVENT
- **Est. files:** ~35 (note: cold-storage services/routes actively modified this session, plus NGO/cold-storage integration noted in memory)

## 9. Crop & Agronomy Advisory
**Purpose:** Crop lifecycle — planning, registration, variety selection, monitoring, seed/nursery/sowing management, AI crop recommendations.

- **Frontend:** `CropCalendarPage.jsx`, `CropMonitoringPage.jsx`, `CropRegistrationPage.jsx`, `CropValueReviewPage.jsx`, `CropVarietyPage.jsx`, `SeedPlanningPage.jsx`, `SeedVaultPage.jsx`, `SowingManagementPage.jsx`, `NurseryManagementPage.jsx`, `HarvestPlanPage.jsx`, `HarvestScorePage.jsx`, `WhatGrowPage.jsx`, `VarietyDirectoryPage.jsx`, `FarmAdvisorPage.jsx`
- **Backend routes:** `cropManagementRoutes`, `cropPlanningRoutes`, `cropRecommendations.js` (`/api/v1/crop-ai`), `cropValueResearchRoutes`, `cropRegistration/crops` (crop-registration), `cropVarietyRoutes`, `seedPlanningRoutes`, `nurseryManagementRoutes`, `sowingManagementRoutes`, `cropMonitoringRoutes`, `variety-directory` (regionalVarietyRoutes), `seedVaultRoutes`/`agriculture/seedVaultRoutes`
- **Backend services:** `cropManagementService.js`, `services/agriculture/cropPlanningService.js`, `cropValueResearchService.js`, `agriculture/seedVaultService.js`, `agriculture/regionalVarietyService.js`, `agriculturalIntelligenceService.js`
- **AI component:** `agriculturalIntelligenceService.js` / `agriculturalIntelligenceRoutes` (real AI crop advisory — noted as fixed this session), plus `aiAdvisoryService.js`
- **Modules:** M100_CROP_MANAGEMENT, M30100_CROPPLANNING, M444100_CROPVALUERESEARCH, M472100_AIADVISORY, M186100_REGIONALVARIETY, M109_SEED_MANAGEMENT
- **Est. files:** ~50

## 10. Soil, Nutrient & Land Mapping
**Purpose:** Soil health cards, nutrient/fertility management, GIS land mapping, land records/registry, geo-boundaries, land surveys.

- **Frontend:** `SoilManagementPage.jsx`, `LandManagementPage.jsx`, `LandRegistryPage.jsx`, `NutrientCalculatorPage.jsx`, `LandUseCarbonPage.jsx`
- **Backend routes:** `soilManagementRoutes`/`soilHealth.js`, `soil-health/cards`, `nutrient-management/plans`, `fertility-management/records`, `gis-land-mapping/parcels`, `soil-mapping/zones`, `water-resource-mapping/resources` (cross-ref System 11), `geo-boundaries`, `land-surveys`, `landRecordsRoutes` (`/api/v1/land-records`), `landManagementRoutes`
- **Backend services:** `soilManagementService.js`, `agriculture/landRecordsService.js`, `landManagementService.js`
- **AI component:** None (mapping/records CRUD).
- **Modules:** M104_SOIL_MANAGEMENT, M192100_LANDRECORDS, M781100_LANDMANAGEMENT, M477100_SOILTESTING
- **Est. files:** ~25

## 11. Water & Irrigation Management
**Purpose:** Irrigation scheduling, water budgeting, water quality, rainwater harvesting, watershed management.

- **Frontend:** `WaterManagementPage.jsx`, `WaterRecordsPage.jsx`, `IrrigationManagementPage.jsx`
- **Backend routes:** `irrigation/schedules`, `irrigation/water-sources`, `irrigation/logs`, `water-budgeting/budgets`, `water-quality/readings`, `rainwater-harvesting/structures`, `watersheds`, `water-analytics/records`, `waterManagementRoutes`
- **Backend services:** `waterManagementService.js`
- **AI component:** None.
- **Modules:** M77100_WATERMANAGEMENT
- **Est. files:** ~15

## 12. Climate, Weather & Risk Intelligence
**Purpose:** Weather advisory, climate risk, agro-meteorology, drought/flood/disease forecasting.

- **Frontend:** `ClimateAdvisoryPage.jsx`, `ClimateMonitoringDashboardPage.jsx`, `ClimateMonitoringPage.jsx`, `ClimateWeatherPage.jsx`, `WeatherAnalyticsPage.jsx`, `SustainabilityDashboardPage.jsx`, `DisruptionPage.jsx`
- **Backend routes:** `weatherRoutes`/`agriculture/weatherRoutes`, `weatherAdvisory.js`, `climateAdvisory.js`/`climateAdvisoryRoutes`/`agriculture/climateAdvisoryRoutes`, `climateMonitoringRoutes`, `climateRiskRoutes`, `agroMeteorologyRoutes`, `droughtMonitoringRoutes`, `floodMonitoringRoutes`, `diseaseForecastingRoutes`, `climateRouteSupport.js`
- **Backend services:** `weatherService.js`/`agriculture/weatherService.js`, `climateMonitoringService.js`
- **AI component:** Climate advisory / forecasting endpoints are model-driven (disease/drought forecasting) — treated as domain-specific AI.
- **Modules:** M105_WEATHER_INTELLIGENCE, M263100_CLIMATEMONITORING
- **Est. files:** ~25

## 13. Crop Inputs Supply Chain
**Purpose:** Biofertilizers, pesticides, micronutrients, organic inputs, input procurement/distribution/traceability, fertilizer inventory.

- **Frontend:** none dedicated (surfaced through Crop Advisory / Marketplace pages)
- **Backend routes:** `biofertilizers`, `pesticide-inventory`, `bio-pesticides`, `micronutrients`, `organic-inputs`, `input-procurement/orders`, `input-distribution/records`, `input-traceability/records`, `fertilizerRoutes`
- **Backend services:** `fertilizerInventoryService.js`
- **AI component:** None.
- **Modules:** M108_FERTILIZER_MANAGEMENT, M604100_INPUTSUPPLYMANAGEMENT
- **Est. files:** ~12

## 14. Livestock & Dairy
**Purpose:** Cattle/dairy/poultry/goat/sheep/pig management, animal health, feed management, cattle registry.

- **Frontend:** `AnimalHealthPage.jsx`, `DairyManagementPage.jsx`, `GoatFarmingPage.jsx`, `SheepFarmingPage.jsx`, `PigFarmingPage.jsx`, `PoultryManagementPage.jsx`, `LivestockManagementPage.jsx`, `CattleRegistryPage.jsx`
- **Backend routes:** `routes/livestock/*` (animalHealthRoutes, dairyRoutes, goatRoutes, pigRoutes, poultryRoutes, sheepRoutes), `livestock.js`, `livestockManagementRoutes`, `livestockRouteSupport.js`, `cattle-registry/animals`, `livestock-feed/records`, `livestock-analytics/records`
- **Backend services:** `animalHealthService.js`, `dairyService.js`, `goatService.js`, `sheepService.js`, `pigService.js`, `poultryService.js`, `livestockManagementService.js`
- **AI component:** None.
- **Modules:** M101_LIVESTOCK_MANAGEMENT, M102_DAIRY_MANAGEMENT, M18100_POULTRY, M82100_GOAT, M499100_SHEEP, M858100_PIG, M87100_ANIMALHEALTH
- **Est. files:** ~28

## 15. Fisheries & Aquaculture
**Purpose:** Fisheries management, hatcheries, fish feed/health/processing, cold fish chain, aquaculture analytics.

- **Frontend:** `FisheriesManagementPage.jsx`, `PondManagementPage.jsx`
- **Backend routes:** `fisheries` (legacyFisheriesRoutes), `fisheriesManagementRoutes`, `biofloc-farms`, `hatchery-management`, `fish-feed`, `fisheries-water-quality`, `fish-health`, `fisheries-harvest`, `fish-processing`, `cold-fish-chain`, `aquaculture-analytics`
- **Backend services:** `fisheriesService.js`, `fisheriesManagementService.js`
- **AI component:** None.
- **Modules:** M103_FISHERIES_MANAGEMENT, M880100_FISHERIESMANAGEMENT
- **Est. files:** ~16

## 16. Horticulture & Protected Cultivation
**Purpose:** Vegetable/floriculture production, polyhouse, hydroponics/aeroponics, precision & protected cultivation.

- **Frontend:** `HorticultureManagementPage.jsx`, `OrchardManagementPage.jsx`, `EnvironmentManagementPage.jsx`
- **Backend routes:** `horticulture.js`, `horticultureManagementRoutes`, `vegetable-production`, `floriculture`, `polyhouse-management`, `hydroponics`, `aeroponics`, `precision-horticulture`, `protected-cultivation`, `horticulture-analytics`
- **Backend services:** `horticultureManagementService.js`
- **AI component:** None.
- **Modules:** M868100_HORTICULTUREMANAGEMENT, M129100_GREENHOUSE
- **Est. files:** ~15

## 17. Forestry, Sericulture & Minor Forest Produce
**Purpose:** Forestry, sericulture (silk), mushroom cultivation, vermicompost, apiculture (bees), biodiversity, indigenous knowledge.

- **Frontend:** `TrainingAcademyPage.jsx` (indigenous/skill overlap), plus surfaced through generic module pages
- **Backend routes:** `forestryRoutes`, `sericultureRoutes`, `mushroomRoutes`, `vermicompostRoutes`, `apicultureRoutes`
- **Backend services:** `forestryService.js`, `sericultureService.js`, `mushroomService.js`, `vermicompostService.js`, `agriculture/biodiversityService.js`, `agriculture/indigenousKnowledgeService.js`
- **AI component:** None.
- **Modules:** M726100_FORESTRY, M201100_SERICULTURE, M149100_MUSHROOM, M120100_VERMICOMPOST, M43100_APICULTURE, M590100_BIODIVERSITY, M68100_INDIGENOUSKNOWLEDGE
- **Est. files:** ~18

## 18. Nutrition, Food & Consumer Health
**Purpose:** Nutrition intelligence, food safety/traceability, consumer health, diet/recipe guidance, farmer health & welfare.

- **Frontend:** `NutritionCalculatorPage.jsx`, `DietRecipesPage.jsx`, `FarmerHealthWelfarePage.jsx`, `NaturalTherapistPage.jsx`
- **Backend routes:** `nutrition-intelligence`, `food` (foodRoutes/`agriculture/foodRoutes`), `farmer-health` (farmerHealthRoutes/`agriculture/farmerHealthRoutes`), `dietTherapyRoutes`
- **Backend services:** `services/food/nutritionIntelligenceService.js`, `food/foodIntelligenceService.js` + `FoodIntelligenceEngine.js`, `food/foodSafetyService.js`, `food/consumerHealthService.js`
- **AI component:** `nutritionIntelligenceService.js` / `foodIntelligenceService.js` are domain-specific AI (per task brief guidance — not a separate "AI system").
- **Modules:** M386100_NUTRITIONINTELLIGENCE, M167100_FOODINTELLIGENCE, M235100_FOODSAFETY, M897100_CONSUMERHEALTH, M8100_RECIPEINTELLIGENCE
- **Est. files:** ~20

## 19. ERP Integration (SAP-style)
**Purpose:** Enterprise resource planning bridges — asset accounting, controlling/cost-control, project systems, comprehensive/complete ERP integration, SAP module architecture, laboratory ERP.

- **Frontend:** `ERPDashboard.jsx`, `ERPDashboardPage.jsx`, `CompleteERPIntegrationPage.jsx`, `ComprehensiveERPPage.jsx`, `EcommerceIntegrationPage.jsx`, `ProjectSystemsPage.jsx`, `SAPModuleArchitecturePage.jsx`, `EnterpriseIntegrationPage.jsx`
- **Backend routes:** `erp/assets` (assetAccountingRoutes), `erp/controlling` (costControlRoutes), `erp/projects` (projectSystemsRoutes), `erp/cost-management` (erpCostManagementRoutes), `completeERPIntegrationRoutes`/`platform/completeERPIntegrationRoutes`, `comprehensiveERPRoutes`/`platform/comprehensiveERPRoutes`, `sapModuleArchitectureRoutes`/`platform/sapModuleArchitectureRoutes`, `erpRoutes`
- **Backend services:** `platform/erpService.js`, `erp/CostControlModule.js`, `platform/laboratoryERPService.js`, `platform/sapModuleArchitectureService.js`, `projectSystemsService.js`
- **AI component:** None (note: this session fixed a duplicate `/erp-dashboard` route path and mounted orphaned cost-control routes here).
- **Modules:** M300_ERP_CORE, M282100_LABORATORYERP, M388100_SAPMODULEARCHITECTURE, M513100_COMPREHENSIVEERP, M573100_COMPLETEERPINTEGRATION, M865100_PROJECTSYSTEMS
- **Est. files:** ~35

## 20. HR & Labour Management
**Purpose:** Human resources and farm labour tracking.

- **Frontend:** `LabourManagementPage.jsx`
- **Backend routes:** `hrRoutes`/`platform/hrRoutes`, `labourRoutes`
- **Backend services:** `hrService.js`
- **AI component:** None.
- **Modules:** M306_HUMAN_RESOURCES
- **Est. files:** ~8

## 21. Farmer Identity, Portal & Household
**Purpose:** Farmer-facing portal/profile experience, household/family records, village registry — distinct from platform-level auth (System 1).

- **Frontend:** `FarmerEntranceHubPage.jsx`, `FarmerFieldDoorPage.jsx`, `FarmerFieldPage.jsx`, `FarmerHomePage.jsx`, `FarmerHouseholdDoorPage.jsx`, `FarmerPortalPage.jsx`, `FarmerProfilePage.jsx`, `FarmerReportPage.jsx`, `FarmerRevenueLedgerPage.jsx`, `FarmerSellDoorPage.jsx`, `FarmerSellPage.jsx`, `FarmerSharedDoorPage.jsx`, `FarmerSkillPage.jsx`, `FarmerFamilyPage.jsx`, `VillageRegistryPage.jsx`
- **Backend routes:** `farmerRoutes`/`agriculture/farmerRoutes` (`/api/v1/farmers`), `farmerPortalEnhancements`/`agriculture/farmerPortalEnhancements`, `farmerFamilyRoutes`, `farmer-family/members`
- **Backend services:** `agriculture/farmerService.js`, `agriculture/villageProfileService.js`, `farmerFamilyService.js`, `farmerValueService.js`
- **AI component:** None.
- **Modules:** M775100_FARMERFAMILY, M722100_FARMER, M844100_FARMERVALUE, M445100_VILLAGEPROFILE
- **Est. files:** ~30

## 22. Analytics, BI & Reporting
**Purpose:** Cross-domain analytics dashboards, custom reports, forecasting, market/financial/supply-chain analytics.

- **Frontend:** `AnalyticsPage.jsx`, `AdvancedAnalyticsDashboard.jsx`, `ReportsDashboardPage.jsx`, `ResearchDashboardPage.jsx`, `OperationalDashboard.jsx`, `OperationsReportPage.jsx`, `SalesReportPage.jsx`, `InventoryReportPage.jsx`, `FinancialReportPage.jsx` (cross-ref System 5), `SupplyChainAnalyticsPage.jsx`, plus all 20 files under `pages/analytics/*` (AdvancedAnalyticsDashboard, AnomalyDetection, CropYieldPrediction, CustomReportBuilder, DataQualityReport, ErrorRateAnalysis, FarmerBehaviorAnalytics, ForecastingDashboard, HistoricalDataView, IntelligenceReports, MarketTrendAnalysis, OpportunitiesIdentifier, PerformanceMetrics, PriceVolatilityChart, RegionalComparison, ResponseTimeMetrics, RiskAssessment, SubsidyDistributionMap, SystemHealthMonitor, UserEngagementStats, WeatherImpactAssessment)
- **Backend routes:** `analyticsReportRoutes` (`/api/v1/analytics`), `advancedAnalyticsRoutes`, `marketAnalytics.js`, `financialAnalytics.js`, `supplyChainAnalytics.js`, `predictiveAnalytics.js`
- **Backend services:** `platform/analyticsService.js`, `platform/analyticsMonitoringService.js`, `predictiveAnalyticsService.js`, `marketIntelligenceService.js`
- **AI component:** `predictiveAnalyticsService.js` (forecasting models) and `marketIntelligenceService.js`.
- **Modules:** M746100_ANALYTICS, M576100_ANALYTICSMONITORING, M405_PREDICTIVE_ANALYTICS (shared w/ System 3)
- **Est. files:** ~35

## 23. Compliance, Governance & Audit
**Purpose:** Regulatory compliance tracking, governance workflows, audit trails, certifications.

- **Frontend:** `ComplianceDashboardPage.jsx`, `CompliancePage.jsx`, `AuditReportPage.jsx`, `admin/ComplianceDashboard.jsx`, `admin/AuditLogs.jsx`, `government/AuditLogPage.jsx`
- **Backend routes:** `governanceModule`/`platform/governanceModule` (`/api/v1/governance`), `complianceRoutes`/`platform/complianceRoutes`, `complianceTracking.js`, `auditRoutes`/`platform/auditRoutes`, `auditTrail.js`, `certificationManagement.js`, `productCertifications.js`
- **Backend services:** `platform/governanceService.js`, `platform/complianceService.js`, `platform/auditService.js`
- **AI component:** None.
- **Modules:** M205_COMPLIANCE_MANAGEMENT, M206_AUDIT_MANAGEMENT, M208_GOVERNANCE
- **Est. files:** ~20

## 24. IoT, Sensors, Realtime & Digital Twin
**Purpose:** Field sensor integration, realtime monitoring, digital twin simulation.

- **Frontend:** `IoTMonitoringDashboard.jsx`, `RealtimeMonitoringPage.jsx`, `DigitalTwinDashboardPage.jsx`, `DigitalTwinPage.jsx`
- **Backend routes:** `iotIntegrationRoutes`, `iotSensors.js`, `realtimeMonitoringRoutes`/`realtime-monitoring`, `digitalTwinRoutes`
- **Backend services:** `logistics/iotIntegrationService.js`, `iotSensorService.js`, `platform/realtimeMonitoringService.js`, `digitalTwinService.js`
- **AI component:** None (telemetry/CRUD; feeds System 3 for downstream AI analysis).
- **Modules:** M90100_IOTINTEGRATION, M186100_IOTSENSOR, M606100_REALTIMEMONITORING, M254100_DIGITALTWIN
- **Est. files:** ~15

## 25. Mobile Experience Layer
**Purpose:** Dedicated mobile-optimized UI surface (chat, marketplace, wallet, notifications) layered atop the desktop web app.

- **Frontend:** all 10 files under `pages/mobile/*` (MobileChat, MobileHelp, MobileHomepage, MobileMarketplace, MobileNotifications, MobileOffers, MobilePayments, MobileProfile, MobileSettings, MobileWallet)
- **Backend routes:** `experienceRoutes`/`platform/experienceRoutes` (`/api/v1/experience`)
- **Backend services:** `platform/experienceLayerService.js`
- **AI component:** None (UI-layer only; consumes other systems' APIs).
- **Modules:** M805100_EXPERIENCELAYER
- **Est. files:** ~14

## 26. Engineering, R&D & Enterprise Knowledge
**Purpose:** Engineering project tracking, R&D pipeline, enterprise-wide knowledge/info-sharing infrastructure.

- **Frontend:** `EngineeringProjectPage.jsx`, `ResearchAndDevelopmentPage.jsx`, `InformationSharingPage.jsx`
- **Backend routes:** `engineeringProjectRoutes` (`/api/v1/engineering`), `researchAndDevelopmentRoutes`/`platform/researchAndDevelopmentRoutes`, `informationSharingRoutes`/`platform/informationSharingRoutes`, `knowledgeRoutes`/`platform/knowledgeRoutes`
- **Backend services:** `engineeringProjectService.js`, `platform/researchAndDevelopmentService.js`, `informationSharingService.js`, `knowledgeService.js`
- **AI component:** None directly (overlaps System 3's knowledge graph for retrieval).
- **Modules:** M712100_ENGINEERINGPROJECT, M651100_RESEARCHANDDEVELOPMENT, M854100_INFORMATIONSHARING
- **Est. files:** ~14

## 27. Enterprise Admin & DevOps Console
**Purpose:** Infrastructure-facing admin tooling — database/cloud/server management, backups, module support scaffolding, shared infra.

- **Frontend:** `admin/DatabaseManagement.jsx`, `admin/BackupRecovery.jsx`, `admin/CacheManagement.jsx`, `admin/ResourceMonitoring.jsx`, `admin/PerformanceTuning.jsx`, `admin/LogViewer.jsx`, `admin/ErrorHandling.jsx`, `SharedInfraPage.jsx`
- **Backend routes:** `databaseManagementRoutes`/`platform/databaseManagementRoutes`, `cloudManagementRoutes`/`platform/cloudManagementRoutes`, `serverManagementRoutes`/`platform/serverManagementRoutes`, `startupEnvironmentRoutes`/`platform/startupEnvironmentRoutes`, `moduleSupportInfrastructureRoutes`/`platform/moduleSupportInfrastructureRoutes`, `healthRoutes`
- **Backend services:** `platform/backupService.js`, `platform/databaseManagementService.js`, `platform/cloudManagementService.js`, `platform/serverManagementService.js`, `platform/startupEnvironmentService.js`, `platform/sharedInfraService.js`/`sharedInfrastructureService.js`, `platform/moduleSupportInfrastructureService.js`
- **AI component:** None.
- **Modules:** M356100_BACKUP, M663100_SHAREDINFRA, M852100_SHAREDINFRASTRUCTURE, M538100_RESOURCECRUDFACTORY
- **Est. files:** ~18

## 28. Vendor, Procurement & Supply Chain Ops
**Purpose:** Vendor registry, supply-chain visibility/decision support, procurement operations not already covered by Marketplace (System 4).

- **Frontend:** `SupplyChainAnalyticsPage.jsx` (cross-ref System 22)
- **Backend routes:** `vendorRoutes` (`/api/v1/vendors`), `supplyChainAnalytics.js`, `supplyChainDecisionRoutes`, `supplyChainTracking.js`
- **Backend services:** (vendor logic largely embedded in commerce services — see System 4)
- **AI component:** None dedicated.
- **Modules:** (none uniquely named; overlaps System 4/9 module set)
- **Est. files:** ~12

## 29. Machinery, Equipment & Village Ops
**Purpose:** Farm machinery/equipment scheduling, maintenance, contractor management, plus village/community/administrative-boundary management (blocks/districts/states/producer groups) grouped here as "field operations" infrastructure.

- **Frontend:** `MachineryManagementPage.jsx`, `TractorManagementPage.jsx`, `ImplementManagementPage.jsx`, `SparePartsManagementPage.jsx`, `BreakdownMaintenancePage.jsx`, `FuelManagementPage.jsx`, `EquipmentInventoryPage.jsx`, `EquipmentRentalPage.jsx`, `CommunityForumPage.jsx`, `CommunityManagementPage.jsx`, `FPODashboardPage.jsx`, `FPORegistrationPage.jsx`
- **Backend routes:** `machinery-operations`, `equipment-scheduling`, `preventiveMaintenanceRoutes` (`/api/v1/preventive-maintenance`), `contractors`, `communityManagementRoutes`/`platform/communityRoutes`, `communityRoutes`, `blocks`(blockManagementRoutes), `districts`(districtManagementRoutes), `states`(stateManagementRoutes), `producer-groups`, `community-assets`, `rural-development/projects`
- **Backend services:** `preventiveMaintenanceService.js`, `communityManagementService.js`
- **AI component:** None.
- **Modules:** M701100_PREVENTIVEMAINTENANCE, M602100_COMMUNITYMANAGEMENT, M791100_RURALENTERPRISE
- **Est. files:** ~25

---

## Notes on Sizing & Follow-Up

- **Route mount count vs. route file count:** `backend/src/index.js` has 207 `app.use('/api/v1/...')` lines but only ~95 top-level + ~115 subdirectory route files exist (some files are mounted at multiple prefixes, e.g. `platformCoreRoutes` at both `/platform` and `/platform-core`; some route files may be mounted 0 or 2+ times — worth a follow-up audit).
- **`sellerRankingRoutes.js`** shows as deleted (`D`) in this session's git status under `backend/src/routes/commerce/` while `index.js` still references `sellerRankingRoutes` at `/api/v1/seller-ranking` — flag for the Marketplace (System 4) work session to confirm the remaining mount point resolves correctly.
- **`services/legacy/*`** (183 files) is the confirmed-live layer per this session's dedup work; the subdirectory services (`agriculture/`, `commerce/`, etc., 126 files) appear to be a newer/parallel organization — several services exist in both places under the same name (e.g. `coldStorageService.js` in both `legacy/` and referenced by `logistics/`). Systems above cite whichever the evidence points to as canonical; a dedicated legacy-vs-subdirectory reconciliation pass would sharpen this further.
- **Generated pages** (`pages/Generated/Page0.jsx`–`Page88.jsx`, 89 files) and **generated routes** (`routes/generated/`) were not assigned to a system — they are scaffolded placeholders without clear domain identity yet; worth a triage pass to see which real system each should be folded into (or removed).
- **192 of 351 module directories** have a populated `module.json` (the other ~159 dirs — mostly the bare `M0XX/` numeric-only folders — are empty scaffolds paired with a named sibling, e.g. `M001/` next to `M001_PLATFORM_CORE/`). Module counts above cite only the named/populated ones.

---

## Completeness Ranking (Most to Least Incomplete)

**Method:** For each system, evidence was gathered directly (not estimated) from:
(1) line counts of the actual backing `service.js` files under
`backend/src/services/legacy/*` (the confirmed-live layer) and any
`services/<domain>/*` counterpart — a service backing several route groups
in the 20-80 line range is a strong thin/scaffold signal, 400+ lines with
real control flow is a strong real-implementation signal; (2) matching route
file line counts, to rule out "logic moved into the route handler instead";
(3) `.claude/audits/AUDIT_DB.md`, `AUDIT_API.md`, `AUDIT_BUGS.md`,
`AUDIT_CODE.md`, `AUDIT_SECURITY.md`, `AUDIT_UI.md` findings mapped to the
system whose files they name; (4) `.ai/tasks/ACTIVE.md`'s most recent
"services/ vs services/legacy/ duplicate remediation" entry, which
explicitly lists which drifted pairs were left unreconciled ("not yet
collapsed, needs a closer read") vs. safely collapsed; (5) the generic
`M0XX` (three-digit, unnamed) scaffold-module finding in `AUDIT_DB.md`
Finding 4 (150 loader-matched scaffold modules, 67% with no real schema),
which is a platform-wide tax rather than a single system's problem and is
noted only where a named module from that finding maps cleanly to a system
(e.g. `M074`/`M075` → Soil/Water).

Percentages are a judgment call anchored to concrete evidence, not a
formula — treat the ranking (relative order) as the reliable part, the
exact percentage as an approximation.

| Rank | System # | System Name | Completeness % | Top gaps (evidence-based) |
|---|---|---|---|---|
| 1 | 28 | Vendor, Procurement & Supply Chain Ops | ~15% | No dedicated backend service file exists anywhere in the repo (`find backend/src/services -iname "*vendor*"` returns zero hits) despite 4 mounted route groups; SYSTEM_MAP itself already flags "vendor logic largely embedded in commerce services"; only 1 (cross-referenced) frontend page. |
| 2 | 11 | Water & Irrigation Management | ~20% | Single backing service (`waterManagementService.js`) is 50 lines, standing behind 8 distinct route groups (schedules, water-sources, logs, budgeting, quality, rainwater-harvesting, watersheds, analytics) — route surface far exceeds real logic; only 1 service listed in SYSTEM_MAP for the whole system. |
| 3 | 29 | Machinery, Equipment & Village Ops | ~22% | `preventiveMaintenanceService.js` (legacy) is 42 lines and `communityManagementService.js` (legacy) is 51 lines, backing 11 route groups (machinery-operations, equipment-scheduling, contractors, community mgmt, blocks/districts/states, producer-groups, community-assets, rural-development); large frontend page count (12) with thin backend to match. |
| 4 | 10 | Soil, Nutrient & Land Mapping | ~25% | `soilManagementService.js` is 31 lines and `landManagementService.js` is 49 lines, backing 11 route groups; `AUDIT_DB.md` Finding 4 names this system's `M074`/`M075` modules explicitly as still carrying unfilled two-line placeholder comments ("Fertility Management"/"Irrigation Management") while actually querying `sheep_flocks`/`pig_herds` — a genuine copy-paste schema mismatch, not just an empty stub. |
| 5 | 13 | Crop Inputs Supply Chain | ~30% | Zero dedicated frontend pages (confirmed in SYSTEM_MAP); one service (`fertilizerInventoryService.js`, 262 lines legacy) stands behind 8 route groups (biofertilizers, pesticide-inventory, bio-pesticides, micronutrients, organic-inputs, input-procurement/distribution/traceability) — most of that route surface has no matching dedicated service logic at all. |
| 6 | 16 | Horticulture & Protected Cultivation | ~32% | `horticultureManagementService.js` is 63 lines backing 9 route groups (vegetable-production, floriculture, polyhouse, hydroponics, aeroponics, precision/protected cultivation, analytics); only 1 backend service for the whole domain. |
| 7 | 15 | Fisheries & Aquaculture | ~35% | `fisheriesManagementService.js` is 75 lines backing 9 route groups (biofloc, hatchery, fish-feed, water-quality, fish-health, harvest, processing, cold-fish-chain, analytics); only 2 pages, 2 services total for a 9-route-group domain. |
| 8 | 23 | Compliance, Governance & Audit | ~38% | `AUDIT_CODE.md` Finding 2: every method in `governanceService.js` calls a bare, undeclared `pool` instead of `this.pool` (24 call sites) — a guaranteed `ReferenceError` on every single DB call; this is a substantial, real file (not a stub) that is currently 100% non-functional at runtime, which is worse than an honest scaffold because it looks complete. |
| 9 | 12 | Climate, Weather & Risk Intelligence | ~48% | `climateMonitoringService.js` (legacy) is only 44 lines despite the system claiming a dedicated `climateMonitoringRoutes`/`climateRiskRoutes`/`agroMeteorologyRoutes`/`droughtMonitoringRoutes`/`floodMonitoringRoutes`/`diseaseForecastingRoutes` route surface (6+ route files); only `weatherService.js` (459 lines) is genuinely solid, pulling the system average up from where the monitoring half alone would sit. |
| 10 | 27 | Enterprise Admin & DevOps Console | ~48% | Infra-facing scaffolding (database/cloud/server management, backups) not deeply verified this pass; SYSTEM_MAP's own summary table records 0 frontend pages for this row despite the body text listing 8 `admin/*.jsx` pages — an internal inconsistency in the map itself that signals this system wasn't cleanly categorized, itself a completeness/clarity gap. |
| 11 | 22 | Analytics, BI & Reporting | ~52% | `.ai/tasks/ACTIVE.md`'s dedup pass explicitly flags `services/platform/analyticsService.js` and `services/platform/formService.js` as "not yet reconciled... left untouched; do not collapse without reading both fully first," and separately notes `tests/analyticsService.test.js` requires the wrong path (`../services/analyticsService` instead of `../services/platform/analyticsService`) — a pre-existing test/path mismatch left unfixed, meaning this system's own test suite cannot currently validate it. |
| 12 | 3 | AI Orchestration & Copilot Layer | ~55% | Largest system by file count (~110) and the one most actively hardened this session (`aiBackboneService.js`'s 9-competing-`module.exports` bug fixed, `mountRoute()` router type-check bug fixed — both were silently defeating large swaths of this system's own mounts until this session), but CLAUDE.md itself records "Claude API key not configured — blocks real AI calls," so much of the actual AI behavior across this system and its per-domain adapters remains unverified/fallback-only in practice despite solid code volume. |
| 13 | 4 | Marketplace & E-Commerce | ~55% | `AUDIT_SECURITY.md`/`AUDIT_DB.md` Finding 1: live, unauthenticated SQL injection in `productReviewService.js`'s review-count query, reachable via a real mounted route with no auth. `AUDIT_BUGS.md` Finding 2: `ecommerceController.js`'s `gi_tagged`/`organic` filters always coerce to boolean, silently excluding every GI-tagged/organic product from the default marketplace view — undermines the newly-wired Premium Marketplace page's whole purpose. `services/commerce/productService.js` vs `services/legacy/productService.js` also flagged in `ACTIVE.md` as "not yet reconciled... ~194 diff lines, meaningfully drifted." |
| 14 | 8 | Logistics & Cold Chain | ~58% | Large service files (600-720 lines) but `AUDIT_CODE.md` Finding 2 names `logisticsEnhancementService.js` alongside governance with the identical bare-`pool` ReferenceError bug (every DB call throws); Finding 3 adds 3 route handlers in `logisticsEnhancementRoutes.js` calling an undefined identifier (`logisticsEnhancementService` instead of the imported `logisticsService`), crashing those endpoints. `AUDIT_DB.md` Finding 2 also flags a live N+1 (1+2N queries) in `coldStorageService.js`'s facility-status listing. Looks complete by line count, several real breaks underneath. |
| 15 | 17 | Forestry, Sericulture & Minor Forest Produce | ~58% | All 4 core services (`forestryService.js`, `sericultureService.js`, `mushroomService.js`, `vermicompostService.js`) sit at a near-identical ~146 lines each — consistent, moderate depth, but not deep for a 7-module system; no frontend pages dedicated to this system at all per SYSTEM_MAP (only a tangential `TrainingAcademyPage.jsx`). |
| 16 | 21 | Farmer Identity, Portal & Household | ~62% | `ACTIVE.md`'s dedup pass explicitly flags `services/agriculture/farmerService.js` vs `services/legacy/farmerService.js` as "~180 diff lines, meaningfully drifted... not read closely enough this pass to safely collapse either direction" — two independently-evolved implementations of core farmer logic left unreconciled, a genuine open risk even though only one is currently live-mounted. |
| 17 | 25 | Mobile Experience Layer | ~65% | Single service (`experienceLayerService.js`, 441 lines — solid) backing all 10 mobile pages; reasonably built but entirely dependent on other systems' APIs underneath it, so its own completeness is bounded by theirs. |
| 18 | 1 | Identity, Auth & Security | ~70% | `AUDIT_SECURITY.md` Finding 2: the H1 hardcoded-JWT-fallback fix does not cover every module-resolution path — `services/authService.js` (flat file, still vulnerable) is what ambiguous `require('../services/authService')` calls resolve to (confirmed via `require.resolve()`), and the repo's own regression test (`jwtSecretRequired.test.js`) currently fails 3 of 4 assertions when run. Otherwise a well-hardened, heavily-fixed-this-session system (rate limiting, OAuth state validation, trust proxy all verified fixed). |
| 19 | 26 | Engineering, R&D & Enterprise Knowledge | ~70% | Solid service depth (`engineeringProjectService.js` 258 lines, `informationSharingService.js` 622 lines) but small system overall (~14 files), not deeply cross-checked against audits this pass. |
| 20 | 2 | Platform Core, Multi-Tenancy & Org Admin | ~72% | `AUDIT_API.md` F-NEW-2: the `mountRoute()` router type-check bug (`typeof router !== 'object'`, always true for real Express routers) was silently defeating ~47 mount calls platform-wide until fixed this session — this system owns `mountRoute()` itself; the fix is verified live (157/165 mounted) but the fact it existed at all means this system's own core plumbing was broken for an unknown prior period. Core services (`tenantManagementService.js` 614 lines, `dual-use/platformCoreService.js` 171 lines) are otherwise solid. |
| 21 | 5 | Finance, Payments & Ledger | ~75% | Actively and successfully hardened this session per git log (`5e2eb01b`: escrow auth gap, rural finance schema mismatch, claim ownership check all fixed and independently re-verified in `AUDIT_SECURITY.md`'s "Verified Fixed" section); real remaining gap is thin (`insurancePremiumService.js`/`insuranceFraudDetectionService.js` top-level wrappers, but their legacy backing is substantial at 416/593 lines). |
| 22 | 7 | Rural Finance, Govt Schemes & Cooperative Economy | ~75% | Large, real services (`governmentSubsidyService.js` 1038 lines, `contractFarmingService.js` 824 lines, `ruralFinanceService.js` 344 lines, confirmed schema-correct per `AUDIT_SECURITY.md`'s verified-fixed rural-finance item); rules/eligibility-driven domain matches its "no AI needed" self-description. |
| 23 | 9 | Crop & Agronomy Advisory | ~76% | Real AI crop advisory explicitly fixed this session per git log; solid supporting services (`cropPlanningService.js` 519 lines, `agriculturalIntelligenceService.js` 468-469 lines); one thin outlier (`cropManagementService.js` legacy, 65 lines) doesn't drag down an otherwise well-built system. |
| 24 | 14 | Livestock & Dairy | ~76% | Solid services throughout (`animalHealthService.js` 543 lines, `dairyService.js` 688 lines); `AUDIT_API.md`'s carried-forward F2-F4 note some frontend-backend verb/path mismatches (animal-health DELETE/PUT gaps, goat/sheep/pig breeding-outcome path mismatch, pig FCR endpoint missing) as still-open leads, not fresh this pass. |
| 25 | 19 | ERP Integration (SAP-style) | ~78% | Very solid — `erpService.js` legacy is 4,479 lines, `projectSystemsService.js` 525 lines; this session's git log shows a duplicate `/erp-dashboard` route path fixed and orphaned cost-control routes mounted, i.e. active maintenance rather than neglect. |
| 26 | 20 | HR & Labour Management | ~78% | `hrService.js` is 913 lines — real, substantial implementation for a small (~8 file) system; no audit findings target this system specifically. |
| 27 | 24 | IoT, Sensors, Realtime & Digital Twin | ~78% | Solid services (`iotSensorService.js` 721 lines, `digitalTwinService.js` 833 lines); telemetry/CRUD domain matches its stated scope well. |
| 28 | 6 | Insurance | ~80% | All services substantial and consistent (`insuranceService.js` ~686-687 lines in both copies, `insuranceClaimsService.js` 615 lines, `insurancePremiumService.js`/`insuranceFraudDetectionService.js` legacy backing at 416/593 lines); `AUDIT_SECURITY.md` confirms the insurance-claims ownership-check fix from this session's commit `5e2eb01b` is real and verified. |
| 29 | 18 | Nutrition, Food & Consumer Health | ~82% | Deepest services in the platform relative to system size: `nutritionIntelligenceService.js` legacy is 1,984 lines, `consumerHealthService.js` 898 lines, `food/nutritionIntelligenceService.js` 699 lines — genuinely built out, not scaffolded; only gap found is `aiFeedbackService.js`'s new table/service being registered but not yet routed (`AUDIT_DB.md` Finding 5, informational, not a defect in this system's own domain logic). |

### Caveat on module-level (M0XX) stub-ratio data

This ranking leans primarily on service-file depth (line counts + real
DB/business logic vs. thin wrappers), audit findings, and the
`ACTIVE.md` dedup-reconciliation flags — all independently verified by
direct file reads during this pass. The task's Signal #1 (per-system
stub-ratio across each system's *named* `M0XX_NAME` modules specifically,
e.g. `M002_USER_MANAGEMENT`) was additionally dispatched to a background
research pass covering Systems 15-27 and 29 for a full module-by-module
classification. **That pass returned and corroborates this ranking
directly: 0 true stubs found across all 52 named-module lookups checked
for those systems** (every `M0XX_NAME/backend/service.js` is a thin
wrapper whose `require()` target — `services/legacy/*.js` — is where the
real logic lives; the wrapper's own relative path is broken if invoked
directly, but that's a dead-code-path oddity, not evidence of an
unimplemented module). Two refinements worth folding in:
- **3 modules are "REAL but in-memory-only"** — substantial class-based
  logic (400-900 lines) with zero DB persistence, data lost on restart:
  `M388100_SAPMODULEARCHITECTURE` (System 19/ERP), `M651100_RESEARCHANDDEVELOPMENT`
  and `M854100_INFORMATIONSHARING` (both System 26/Engineering). This is a
  real, narrower gap than "stub" but should mildly discount Systems 19 and
  26's scores above (already reflected — both were kept in the "solid,
  ~70-78%" band rather than pushed higher, specifically because of this).
- A companion pass covering Systems 1-14 was also dispatched; if/when it
  returns with a materially different signal (e.g. a real stub ratio > 0
  for any of those systems), re-check this ranking's placement for that
  system specifically before treating the table above as final — the
  service-file-depth evidence already gathered directly for Systems 1-14
  in this pass (all showed substantial legacy service files, 100-1300+
  lines, no true stubs found) is consistent with the Systems 15-27/29
  pass's 0-stub finding, so a contradiction is unlikely but not yet
  100% ruled out.

*This ranking is a point-in-time snapshot (8 September 2026) on an actively-changing branch (`audit/ui-api-fix`) — several systems listed as "solid" above were solid specifically *because* they were the target of this session's own concurrent fix work (Finance/Insurance, Platform Core's `mountRoute()`, AI Orchestration's export bug). Re-run this ranking after the next major fix pass rather than treating it as permanent.*
