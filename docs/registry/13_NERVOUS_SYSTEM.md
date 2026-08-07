# Nervous System Audit

**Generated:** 2026-08-07 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

The signal bus (`core/signalBus.js`) is the platform's nervous system.
A module that neither emits nor subscribes is **denervated** — it works in
isolation but cannot participate in any system-wide reflex. A temperature
breach in such a module reaches no one.

| | Count |
|---|---|
| Afferent (sensory — emit signals) | **5** |
| Efferent (motor — subscribe) | **0** |
| Denervated (routes, no bus) | **69** |
| **Broken emits (signalBus.emit instead of emitSignal)** | **0** |
| Total modules | 112 |

**Innervation: 4%**

## Afferent — modules that sense

- **shelfLifeService** — 2 emit(s)
- **enterpriseControlService** — 2 emit(s)
- **iotIntegrationService** — 1 emit(s)
- **orderService** — 1 emit(s)
- **advancedAIService** — 2 emit(s)

## Efferent — modules that act on signals

_none_

## Denervated — live routes, no nervous connection

- logisticsEnhancementRoutes (26 routes)
- digitalProductPassportService (25 routes)
- marketplaceEnhancements (23 routes)
- governanceModule (22 routes)
- foodSafetyService (21 routes)
- farmerPortalEnhancements (20 routes)
- logisticsEnhancements (20 routes)
- indigenousKnowledgeService (19 routes)
- insuranceEnhancements (18 routes)
- biodiversityService (17 routes)
- recipeIntelligenceService (17 routes)
- institutionalProcurementService (16 routes)
- gstRoutes (16 routes)
- omnichannelAIService (15 routes)
- consumerHealthService (14 routes)
- experienceRoutes (14 routes)
- laboratoryERPService (13 routes)
- organicTraceabilityService (13 routes)
- enterpriseAIRoutes (13 routes)
- multilingualService (12 routes)
- recoveredFinanceRoutes (12 routes)
- aiCopilotService (11 routes)
- giIntelligenceService (11 routes)
- insuranceService (11 routes)
- logisticsService (11 routes)
- v42IntelligenceService (11 routes)
- riskPricingRoutes (11 routes)
- vendorRoutes (11 routes)
- arVrService (10 routes)
- authService (10 routes)
- blockchainTraceabilityService (10 routes)
- conversationalAIService (10 routes)
- foodIntelligenceService (10 routes)
- merchandisingService (10 routes)
- nutritionIntelligenceService (10 routes)
- offlinePaymentService (10 routes)
- voiceAIService (10 routes)
- weatherRoutes (10 routes)
- predictiveAnalyticsService (9 routes)
- advancedFeatures (9 routes)
- decisionSupportRoutes (9 routes)
- rfqRoutes (9 routes)
- catalogIntelligenceService (8 routes)
- financialService (8 routes)
- formService (8 routes)
- offlineSyncService (8 routes)
- productService (8 routes)
- valueCommerceService (8 routes)
- auditRoutes (8 routes)
- complianceRoutes (8 routes)
- erpService (7 routes)
- knowledgeGraphService (7 routes)
- erpRoutes (7 routes)
- farmerRoutes (7 routes)
- foodRoutes (7 routes)
- advancedVoiceAI (6 routes)
- neProductIntelligenceService (6 routes)
- energyRoutes (6 routes)
- marketDataRoutes (6 routes)
- aiService (5 routes)
- commerceRulesService (5 routes)
- farmerValueService (5 routes)
- smsAuthService (5 routes)
- foluRoutes (5 routes)
- moduleCatalogService (4 routes)
- analyticsService (3 routes)
- demandRoutes (3 routes)
- costRoutes (2 routes)
- revenueRoutes (2 routes)
