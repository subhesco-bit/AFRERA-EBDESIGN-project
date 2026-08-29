# ERP Domain Coverage

**Generated:** 2026-08-28 by `tools/module-audit.js`
**Status:** DESCRIPTIVE — read from source, comments stripped before analysis.
**Do not edit by hand.**

---

Each AFRERA domain against its SAP equivalent. A domain with zero modules
is an ERP function the platform cannot perform at all.

| Code | Domain | SAP | Modules | Endpoints | AI apps | Status |
|---|---|---|---|---|---|---|
| AF-FI | Financial Accounting | FI | 6 | 45 | 3 | Covered |
| AF-CO | Controlling / Cost | CO | 0 | 0 | 0 | **MISSING** |
| AF-MM | Materials Management | MM | 3 | 38 | 2 | Covered |
| AF-SD | Sales & Distribution | SD | 12 | 77 | 9 | Covered |
| AF-WM | Warehouse Management | WM | 4 | 21 | 3 | Covered |
| AF-TM | Transport Management | TM | 7 | 77 | 1 | Covered |
| AF-QM | Quality Management | QM | 2 | 34 | 2 | Covered |
| AF-PP | Production Planning | PP | 1 | 17 | 1 | Covered |
| AF-PM | Plant Maintenance | PM | 9 | 30 | 6 | Covered |
| AF-AA | Asset Accounting | AA | 2 | 9 | 0 | No AI |
| AF-HCM | Human Capital Management | HCM | 10 | 54 | 15 | Covered |
| AF-PS | Project Systems | PS | 8 | 32 | 2 | Covered |
| AF-CS | Customer Service | CS | 3 | 19 | 5 | Covered |
| AF-MDM | Master Data Management | MDM | 17 | 105 | 16 | Covered |
| AF-SEC | Governance / Risk / Compliance | GRC | 7 | 53 | 2 | Covered |
| AF-CRM | Customer Relationship Mgmt | CRM | 1 | 13 | 1 | Covered |
| AF-TR | Treasury | TR | 2 | 0 | 2 | No endpoints |
| AF-AGRI | Agronomy (AFRERA-specific) | — | 15 | 98 | 15 | Covered |

## Domain detail

### AF-FI — Financial Accounting

- gstRoutes
- financialService
- offlinePaymentService
- assetAccountingRoutes
- assetAccountingService
- gstService

### AF-CO — Controlling / Cost

_No module serves this domain._

### AF-MM — Materials Management

- institutionalProcurementService
- vendorRoutes
- procurementSubscriptionService

### AF-SD — Sales & Distribution

- marketplaceEnhancements
- merchandisingService
- orderService
- bulkOrderRoutes
- nutrientValueSalesRoutes
- valueCommerceService
- ecommerceBusinessSalesRoutes
- bulkOrderService
- dynamicPricingService
- ecommerceBusinessSalesService
- nutrientValueSalesService
- preSeasonOrderService

### AF-WM — Warehouse Management

- shelfLifeService
- livestockManagementRoutes
- fertilizerInventoryService
- livestockManagementService

### AF-TM — Transport Management

- logisticsEnhancementRoutes
- logisticsEnhancements
- logisticsService
- v42IntelligenceService
- freightPoolingRoutes
- freightPoolingService
- logisticsEnhancementService

### AF-QM — Quality Management

- foodSafetyService
- laboratoryERPService

### AF-PP — Production Planning

- recipeIntelligenceService

### AF-PM — Plant Maintenance

- sharedInfrastructureService
- assetAccountingRoutes
- equipmentExchangeRoutes
- preventiveMaintenanceRoutes
- assetAccountingService
- equipmentExchangeService
- greenhouseService
- preventiveMaintenanceService
- sharedInfraService

### AF-AA — Asset Accounting

- assetAccountingRoutes
- assetAccountingService

### AF-HCM — Human Capital Management

- animalHealthRoutes
- farmerTrainingRoutes
- farmerHealthRoutes
- hrRoutes
- healthRoutes
- mushroomRoutes
- cropValueResearchRoutes
- farmerTrainingService
- hrService
- mushroomService

### AF-PS — Project Systems

- projectSystemsRoutes
- gdprRoutes
- engineeringProjectRoutes
- dprGenerationRoutes
- gdprService
- dprGenerationService
- engineeringProjectService
- projectSystemsService

### AF-CS — Customer Service

- conversationalAIService
- decisionSupportRoutes
- decisionSupportService

### AF-MDM — Master Data Management

- digitalProductPassportService
- informationSharingRoutes
- productService
- platformConfigurationRoutes
- catalogIntelligenceService
- formService
- neProductIntelligenceService
- platformCoreRoutes
- moduleCatalogService
- productMediaAIRoutes
- platformTelemetryRoutes
- platformCoreService
- informationSharingService
- platformConfigurationService
- platformTelemetryService
- productMediaAIService
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

- escrowService
- subsidyService

### AF-AGRI — Agronomy (AFRERA-specific)

- indigenousKnowledgeService
- biodiversityService
- nutritionIntelligenceService
- organicTraceabilityService
- giIntelligenceService
- agriculturalIntelligenceRoutes
- cropManagementRoutes
- soilManagementRoutes
- cropValueResearchRoutes
- agriculturalIntelligenceService
- cropManagementService
- cropPlanningService
- cropValueResearchService
- soilManagementService
- soilTestingService
