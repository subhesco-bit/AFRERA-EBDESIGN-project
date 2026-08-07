# Boundary Violations

**Generated:** 2026-08-04 by `tools/wireframe-boundaries.js`
**Status:** DESCRIPTIVE — measured from source, comments stripped.
**Do not edit by hand.**

---

**Total: 46** across 45 modules.

| Rule | Severity | Count | Description |
|---|---|---|---|
| BR-01 | critical | 0 | A service must not construct its own database Pool. |
| BR-02 | high | 0 | core/ must not import services/. |
| BR-03 | high | 0 | utils/ must import nothing from the application. |
| BR-04 | medium | 0 | A service must not import another service directly. |
| BR-05 | medium | 1 | Routes must not contain SQL. |
| BR-06 | critical | 0 | A module with write endpoints must guard them. |
| BR-07 | critical | 0 | Signals must be published with emitSignal(), never emit(). |
| BR-08 | high | 45 | Multi-statement writes must run in a transaction. |

## BR-05 — Routes must not contain SQL.

**MEDIUM.** SQL in a route means business logic is in the HTTP layer, where it cannot be reused, tested without a request, or found by anyone looking in services/.

- `routes/gstRoutes.js` — 9 occurrence(s)

## BR-08 — Multi-statement writes must run in a transaction.

**HIGH.** Two INSERTs without BEGIN/COMMIT can half-succeed. In an accounting or inventory context that leaves the books wrong with no error.

- `services/advancedFeaturesService.js` — 6 occurrence(s)
- `services/aiCopilotService.js` — 5 occurrence(s)
- `services/arVrService.js` — 7 occurrence(s)
- `services/authService.js` — 14 occurrence(s)
- `services/biodiversityService.js` — 8 occurrence(s)
- `services/blockchainTraceabilityService.js` — 6 occurrence(s)
- `services/bulkOrderService.js` — 8 occurrence(s)
- `services/consumerHealthService.js` — 7 occurrence(s)
- `services/conversationalAIService.js` — 5 occurrence(s)
- `services/digitalProductPassportService.js` — 12 occurrence(s)
- `services/erpService.js` — 5 occurrence(s)
- `services/farmerService.js` — 9 occurrence(s)
- `services/financialService.js` — 8 occurrence(s)
- `services/foodIntelligenceService.js` — 6 occurrence(s)
- `services/foodSafetyService.js` — 12 occurrence(s)
- `services/formService.js` — 4 occurrence(s)
- `services/giIntelligenceService.js` — 6 occurrence(s)
- `services/governanceService.js` — 11 occurrence(s)
- `services/indigenousKnowledgeService.js` — 10 occurrence(s)
- `services/institutionalProcurementService.js` — 8 occurrence(s)
- `services/insurancePolicyIssuanceService.js` — 6 occurrence(s)
- `services/insuranceService.js` — 4 occurrence(s)
- `services/iotIntegrationService.js` — 6 occurrence(s)
- `services/knowledgeGraphService.js` — 5 occurrence(s)
- `services/laboratoryERPService.js` — 6 occurrence(s)
- `services/landRecordsService.js` — 5 occurrence(s)
- `services/logisticsEnhancementService.js` — 13 occurrence(s)
- `services/logisticsService.js` — 6 occurrence(s)
- `services/multilingualService.js` — 7 occurrence(s)
- `services/nutritionIntelligenceService.js` — 5 occurrence(s)
- `services/offlinePaymentService.js` — 13 occurrence(s)
- `services/offlineSyncService.js` — 16 occurrence(s)
- `services/omnichannelAIService.js` — 14 occurrence(s)
- `services/orderService.js` — 12 occurrence(s)
- `services/organicTraceabilityService.js` — 8 occurrence(s)
- `services/predictiveAnalyticsService.js` — 5 occurrence(s)
- `services/productReviewService.js` — 10 occurrence(s)
- `services/productService.js` — 3 occurrence(s)
- `services/recipeIntelligenceService.js` — 3 occurrence(s)
- `services/shelfLifeService.js` — 7 occurrence(s)
- `services/smsAuthService.js` — 6 occurrence(s)
- `services/valueCommerceService.js` — 4 occurrence(s)
- `services/voiceAIService.js` — 7 occurrence(s)
- `routes/gstRoutes.js` — 6 occurrence(s)
- `core/outcomeSink.js` — 4 occurrence(s)
