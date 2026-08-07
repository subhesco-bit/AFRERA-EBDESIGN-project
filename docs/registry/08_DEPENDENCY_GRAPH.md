# Dependency Graph

**Generated:** 2026-08-04 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

**Objects indexed:** 18

---

```mermaid
graph LR
  logisticsEnhancementRoutes --> logisticsEnhancementService
  marketplaceEnhancements --> gstService
  marketplaceEnhancements --> productReviewService
  marketplaceEnhancements --> bulkOrderService
  governanceModule --> governanceService
  farmerPortalEnhancements --> landRecordsService
  farmerPortalEnhancements --> cropPlanningService
  farmerPortalEnhancements --> farmerService
  logisticsEnhancements --> logisticsEnhancementService
  insuranceEnhancements --> insurancePremiumService
  insuranceEnhancements --> insurancePolicyIssuanceService
  insuranceEnhancements --> insuranceFraudDetectionService
  gstRoutes --> gstService
  vendorRoutes --> decisionSupportService
  advancedFeatures --> advancedFeaturesService
  decisionSupportRoutes --> decisionSupportService
  auditRoutes --> auditService
  farmerRoutes --> farmerService
```

Service-to-service edges: **18**. Low coupling is intentional —
services communicate through the signal bus rather than direct requires.
