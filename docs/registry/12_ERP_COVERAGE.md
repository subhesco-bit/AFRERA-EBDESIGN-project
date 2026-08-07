# ERP Domain Coverage

**Generated:** 2026-08-07 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

Each AFRERA domain against its SAP equivalent. A domain with zero modules
is an ERP function the platform cannot perform at all.

| Code | Domain | SAP | Modules | Endpoints | AI apps | Status |
|---|---|---|---|---|---|---|
| AF-FI | Financial Accounting | FI | 4 | 34 | 1 | Covered |
| AF-CO | Controlling / Cost | CO | 0 | 0 | 0 | **MISSING** |
| AF-MM | Materials Management | MM | 2 | 27 | 2 | Covered |
| AF-SD | Sales & Distribution | SD | 7 | 51 | 7 | Covered |
| AF-WM | Warehouse Management | WM | 1 | 16 | 3 | Covered |
| AF-TM | Transport Management | TM | 5 | 68 | 0 | No AI |
| AF-QM | Quality Management | QM | 2 | 34 | 2 | Covered |
| AF-PP | Production Planning | PP | 1 | 17 | 1 | Covered |
| AF-PM | Plant Maintenance | PM | 2 | 0 | 5 | No endpoints |
| AF-AA | Asset Accounting | AA | 0 | 0 | 0 | **MISSING** |
| AF-HCM | Human Capital Management | HCM | 1 | 0 | 3 | No endpoints |
| AF-PS | Project Systems | PS | 0 | 0 | 0 | **MISSING** |
| AF-CS | Customer Service | CS | 3 | 19 | 5 | Covered |
| AF-MDM | Master Data Management | MDM | 7 | 59 | 9 | Covered |
| AF-SEC | Governance / Risk / Compliance | GRC | 7 | 51 | 2 | Covered |
| AF-CRM | Customer Relationship Mgmt | CRM | 1 | 13 | 1 | Covered |
| AF-TR | Treasury | TR | 1 | 0 | 2 | No endpoints |
| AF-AGRI | Agronomy (AFRERA-specific) | — | 7 | 70 | 8 | Covered |

## Domain detail

### AF-FI — Financial Accounting

- gstRoutes
- offlinePaymentService
- financialService
- gstService

### AF-CO — Controlling / Cost

_No module serves this domain._

### AF-MM — Materials Management

- institutionalProcurementService
- vendorRoutes

### AF-SD — Sales & Distribution

- marketplaceEnhancements
- merchandisingService
- orderService
- valueCommerceService
- bulkOrderService
- dynamicPricingService
- preSeasonOrderService

### AF-WM — Warehouse Management

- shelfLifeService

### AF-TM — Transport Management

- logisticsEnhancementRoutes
- logisticsEnhancements
- logisticsService
- v42IntelligenceService
- logisticsEnhancementService

### AF-QM — Quality Management

- foodSafetyService
- laboratoryERPService

### AF-PP — Production Planning

- recipeIntelligenceService

### AF-PM — Plant Maintenance

- greenhouseService
- sharedInfraService

### AF-AA — Asset Accounting

_No module serves this domain._

### AF-HCM — Human Capital Management

- farmerTrainingService

### AF-PS — Project Systems

_No module serves this domain._

### AF-CS — Customer Service

- conversationalAIService
- decisionSupportRoutes
- decisionSupportService

### AF-MDM — Master Data Management

- digitalProductPassportService
- catalogIntelligenceService
- formService
- productService
- neProductIntelligenceService
- moduleCatalogService
- productReviewService

### AF-SEC — Governance / Risk / Compliance

- governanceModule
- enterpriseControlService
- auditRoutes
- complianceRoutes
- auditService
- complianceService
- governanceService

### AF-CRM — Customer Relationship Mgmt

- enterpriseControlService

### AF-TR — Treasury

- subsidyService

### AF-AGRI — Agronomy (AFRERA-specific)

- indigenousKnowledgeService
- biodiversityService
- organicTraceabilityService
- giIntelligenceService
- nutritionIntelligenceService
- cropPlanningService
- soilTestingService
