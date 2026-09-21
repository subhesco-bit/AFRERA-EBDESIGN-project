# Retirement review sheet — 2026-09-13

Nothing is committed. Every file below is a tracked deletion, so any single
decision can be reversed with:

```bash
git restore <path>
```

Policy: `.ai/decisions/0001-module-lineage-consolidation.md` §6 —
verify, then remove via a reviewable commit, never a bulk delete.

## Rule A — every route already present in the canonical file (73)

Retired because the canonical file declares a superset of its routes, nothing
requires it, and nothing calls its `-merged` URL.

| retired file | canonical file | evidence |
|---|---|---|
| `backend/src/routes/agriculture/agriculturalIntelligenceRoutes_merged.js` | `backend/src/routes/agriculturalIntelligenceRoutes.js` | all 9 route(s) already in agriculturalIntelligenceRoutes.js |
| `backend/src/routes/aiBackboneRoutes_merged.js` | `backend/src/routes/aiBackboneRoutes.js` | all 6 route(s) already in aiBackboneRoutes.js |
| `backend/src/routes/aiBrainRoutes_merged.js` | `backend/src/routes/aiBrainRoutes.js` | all 14 route(s) already in aiBrainRoutes.js |
| `backend/src/routes/aiGatewayRoutes_merged.js` | `backend/src/routes/aiGatewayRoutes.js` | all 7 route(s) already in aiGatewayRoutes.js |
| `backend/src/routes/aiOperationIntelligenceRoutes_merged.js` | `backend/src/routes/aiOperationIntelligenceRoutes.js` | all 13 route(s) already in aiOperationIntelligenceRoutes.js |
| `backend/src/routes/aiSelfHealingRoutes_merged.js` | `backend/src/routes/aiSelfHealingRoutes.js` | all 11 route(s) already in aiSelfHealingRoutes.js |
| `backend/src/routes/claude/aiCollaborationRoutes_merged.js` | `backend/src/routes/aiCollaborationRoutes.js` | all 10 route(s) already in aiCollaborationRoutes.js |
| `backend/src/routes/climateAdvisoryRoutes_merged.js` | `backend/src/routes/climateAdvisoryRoutes.js` | all 1 route(s) already in climateAdvisoryRoutes.js |
| `backend/src/routes/completeAIIntegrationRoutes_merged.js` | `backend/src/routes/completeAIIntegrationRoutes.js` | all 15 route(s) already in completeAIIntegrationRoutes.js |
| `backend/src/routes/decisionSupportRoutes_merged.js` | `backend/src/routes/decisionSupportRoutes.js` | all 9 route(s) already in decisionSupportRoutes.js |
| `backend/src/routes/demandRoutes_merged.js` | `backend/src/routes/demandRoutes.js` | all 3 route(s) already in demandRoutes.js |
| `backend/src/routes/dprGenerationRoutes_merged.js` | `backend/src/routes/dprGenerationRoutes.js` | all 5 route(s) already in dprGenerationRoutes.js |
| `backend/src/routes/ecommerceAIRoutes_merged.js` | `backend/src/routes/ecommerceAIRoutes.js` | all 8 route(s) already in ecommerceAIRoutes.js |
| `backend/src/routes/ecommerceBusinessSalesRoutes_merged.js` | `backend/src/routes/ecommerceBusinessSalesRoutes.js` | all 8 route(s) already in ecommerceBusinessSalesRoutes.js |
| `backend/src/routes/ecommerceERPRoutes_merged.js` | `backend/src/routes/ecommerceERPRoutes.js` | all 6 route(s) already in ecommerceERPRoutes.js |
| `backend/src/routes/ecommerceIntegrationRoutes_merged.js` | `backend/src/routes/ecommerceIntegrationRoutes.js` | all 10 route(s) already in ecommerceIntegrationRoutes.js |
| `backend/src/routes/ecommerceMarketingRoutes_merged.js` | `backend/src/routes/ecommerceMarketingRoutes.js` | all 10 route(s) already in ecommerceMarketingRoutes.js |
| `backend/src/routes/ecommerceRoutes_merged.js` | `backend/src/routes/ecommerceRoutes.js` | all 11 route(s) already in ecommerceRoutes.js |
| `backend/src/routes/energyRoutes_merged.js` | `backend/src/routes/energyRoutes.js` | all 1 route(s) already in energyRoutes.js |
| `backend/src/routes/enterpriseAIRoutes_merged.js` | `backend/src/routes/enterpriseAIRoutes.js` | all 1 route(s) already in enterpriseAIRoutes.js |
| `backend/src/routes/equipmentExchangeRoutes_merged.js` | `backend/src/routes/equipmentExchangeRoutes.js` | all 1 route(s) already in equipmentExchangeRoutes.js |
| `backend/src/routes/farmerHealthRoutes_merged.js` | `backend/src/routes/farmerHealthRoutes.js` | all 1 route(s) already in farmerHealthRoutes.js |
| `backend/src/routes/farmerPortalEnhancements_merged.js` | `backend/src/routes/farmerPortalEnhancements.js` | all 20 route(s) already in farmerPortalEnhancements.js |
| `backend/src/routes/farmerRoutes_merged.js` | `backend/src/routes/farmerRoutes.js` | all 7 route(s) already in farmerRoutes.js |
| `backend/src/routes/farmerTrainingRoutes_merged.js` | `backend/src/routes/farmerTrainingRoutes.js` | all 9 route(s) already in farmerTrainingRoutes.js |
| `backend/src/routes/fertilizerRoutes_merged.js` | `backend/src/routes/fertilizerRoutes.js` | all 1 route(s) already in fertilizerRoutes.js |
| `backend/src/routes/finance/costRoutes_merged.js` | `backend/src/routes/costRoutes.js` | all 2 route(s) already in costRoutes.js |
| `backend/src/routes/foluBenchmarkRoutes_merged.js` | `backend/src/routes/foluBenchmarkRoutes.js` | all 2 route(s) already in foluBenchmarkRoutes.js |
| `backend/src/routes/foluRoutes_merged.js` | `backend/src/routes/foluRoutes.js` | all 5 route(s) already in foluRoutes.js |
| `backend/src/routes/foodRoutes_merged.js` | `backend/src/routes/foodRoutes.js` | all 1 route(s) already in foodRoutes.js |
| `backend/src/routes/glutWarningRoutes_merged.js` | `backend/src/routes/glutWarningRoutes.js` | all 2 route(s) already in glutWarningRoutes.js |
| `backend/src/routes/gstRoutes_merged.js` | `backend/src/routes/gstRoutes.js` | all 1 route(s) already in gstRoutes.js |
| `backend/src/routes/insuranceEnhancements_merged.js` | `backend/src/routes/insuranceEnhancements.js` | all 19 route(s) already in insuranceEnhancements.js |
| `backend/src/routes/logistics/coldStorageRoutes_merged.js` | `backend/src/routes/coldStorageRoutes.js` | all 1 route(s) already in coldStorageRoutes.js |
| `backend/src/routes/logistics/freightPoolingRoutes_merged.js` | `backend/src/routes/freightPoolingRoutes.js` | all 6 route(s) already in freightPoolingRoutes.js |
| `backend/src/routes/logisticsEnhancementRoutes_merged.js` | `backend/src/routes/logisticsEnhancementRoutes.js` | all 1 route(s) already in logisticsEnhancementRoutes.js |
| `backend/src/routes/logisticsEnhancements_merged.js` | `backend/src/routes/logisticsEnhancements.js` | all 21 route(s) already in logisticsEnhancements.js |
| `backend/src/routes/marketDataRoutes_merged.js` | `backend/src/routes/marketDataRoutes.js` | all 6 route(s) already in marketDataRoutes.js |
| `backend/src/routes/marketplaceEnhancements_merged.js` | `backend/src/routes/marketplaceEnhancements.js` | all 23 route(s) already in marketplaceEnhancements.js |
| `backend/src/routes/mfaRoutes_merged.js` | `backend/src/routes/dual-use/mfaRoutes.js` | all 4 route(s) already in mfaRoutes.js |
| `backend/src/routes/nervousSystemRoutes_merged.js` | `backend/src/routes/nervousSystemRoutes.js` | all 22 route(s) already in nervousSystemRoutes.js |
| `backend/src/routes/nutrientValueSalesRoutes_merged.js` | `backend/src/routes/nutrientValueSalesRoutes.js` | all 9 route(s) already in nutrientValueSalesRoutes.js |
| `backend/src/routes/pigRoutes_merged.js` | `backend/src/routes/pigRoutes.js` | all 22 route(s) already in pigRoutes.js |
| `backend/src/routes/platform/advancedFeatures_merged.js` | `backend/src/routes/advancedFeatures.js` | all 9 route(s) already in advancedFeatures.js |
| `backend/src/routes/platform/auditRoutes_merged.js` | `backend/src/routes/auditRoutes.js` | all 8 route(s) already in auditRoutes.js |
| `backend/src/routes/platform/civilDisruptionRoutes_merged.js` | `backend/src/routes/civilDisruptionRoutes.js` | all 5 route(s) already in civilDisruptionRoutes.js |
| `backend/src/routes/platform/complianceRoutes_merged.js` | `backend/src/routes/complianceRoutes.js` | all 8 route(s) already in complianceRoutes.js |
| `backend/src/routes/platform/experienceRoutes_merged.js` | `backend/src/routes/experienceRoutes.js` | all 14 route(s) already in experienceRoutes.js |
| `backend/src/routes/platform/governanceModule_merged.js` | `backend/src/routes/governanceModule.js` | all 24 route(s) already in governanceModule.js |
| `backend/src/routes/platformConfigurationRoutes_merged.js` | `backend/src/routes/platformConfigurationRoutes.js` | all 1 route(s) already in platformConfigurationRoutes.js |
| `backend/src/routes/platformCoreRoutes_merged.js` | `backend/src/routes/platformCoreRoutes.js` | all 15 route(s) already in platformCoreRoutes.js |
| `backend/src/routes/poultryRoutes_merged.js` | `backend/src/routes/poultryRoutes.js` | all 19 route(s) already in poultryRoutes.js |
| `backend/src/routes/projectSystemsRoutes_merged.js` | `backend/src/routes/projectSystemsRoutes.js` | all 14 route(s) already in projectSystemsRoutes.js |
| `backend/src/routes/recoveredFinanceRoutes_merged.js` | `backend/src/routes/recoveredFinanceRoutes.js` | all 10 route(s) already in recoveredFinanceRoutes.js |
| `backend/src/routes/regionalVarietyRoutes_merged.js` | `backend/src/routes/regionalVarietyRoutes.js` | all 5 route(s) already in regionalVarietyRoutes.js |
| `backend/src/routes/researchAndDevelopmentRoutes_merged.js` | `backend/src/routes/researchAndDevelopmentRoutes.js` | all 1 route(s) already in researchAndDevelopmentRoutes.js |
| `backend/src/routes/returnLoadBoardRoutes_merged.js` | `backend/src/routes/returnLoadBoardRoutes.js` | all 4 route(s) already in returnLoadBoardRoutes.js |
| `backend/src/routes/revenueRoutes_merged.js` | `backend/src/routes/revenueRoutes.js` | all 2 route(s) already in revenueRoutes.js |
| `backend/src/routes/rfqRoutes_merged.js` | `backend/src/routes/rfqRoutes.js` | all 9 route(s) already in rfqRoutes.js |
| `backend/src/routes/riskPricingRoutes_merged.js` | `backend/src/routes/riskPricingRoutes.js` | all 11 route(s) already in riskPricingRoutes.js |
| `backend/src/routes/sapModuleArchitectureRoutes_merged.js` | `backend/src/routes/sapModuleArchitectureRoutes.js` | all 1 route(s) already in sapModuleArchitectureRoutes.js |
| `backend/src/routes/seedVaultRoutes_merged.js` | `backend/src/routes/seedVaultRoutes.js` | all 6 route(s) already in seedVaultRoutes.js |
| `backend/src/routes/serverManagementRoutes_merged.js` | `backend/src/routes/serverManagementRoutes.js` | all 23 route(s) already in serverManagementRoutes.js |
| `backend/src/routes/sheepRoutes_merged.js` | `backend/src/routes/sheepRoutes.js` | all 22 route(s) already in sheepRoutes.js |
| `backend/src/routes/startupEnvironmentRoutes_merged.js` | `backend/src/routes/startupEnvironmentRoutes.js` | all 1 route(s) already in startupEnvironmentRoutes.js |
| `backend/src/routes/systemAdministrationRoutes_merged.js` | `backend/src/routes/systemAdministrationRoutes.js` | all 1 route(s) already in systemAdministrationRoutes.js |
| `backend/src/routes/tenantManagementRoutes_merged.js` | `backend/src/routes/tenantManagementRoutes.js` | all 1 route(s) already in tenantManagementRoutes.js |
| `backend/src/routes/trackDartRoutes_merged.js` | `backend/src/routes/trackDartRoutes.js` | all 1 route(s) already in trackDartRoutes.js |
| `backend/src/routes/unifiedAIRoutes_merged.js` | `backend/src/routes/unifiedAIRoutes.js` | all 7 route(s) already in unifiedAIRoutes.js |
| `backend/src/routes/vendorRoutes_merged.js` | `backend/src/routes/vendorRoutes.js` | all 1 route(s) already in vendorRoutes.js |
| `backend/src/routes/visionRoutes_merged.js` | `backend/src/routes/visionRoutes.js` | all 4 route(s) already in visionRoutes.js |
| `backend/src/routes/weatherRoutes_merged.js` | `backend/src/routes/weatherRoutes.js` | all 11 route(s) already in weatherRoutes.js |
| `backend/src/routes/wikipediaRoutes_merged.js` | `backend/src/routes/wikipediaRoutes.js` | all 2 route(s) already in wikipediaRoutes.js |

## Rule B — in-memory CRUD scaffold, canonical is real (13)

Retired because the duplicate is the generated `let _items = []` placeholder —
state lost on restart — while the canonical file is service/DB-backed. The
scaffold's extra routes are boilerplate, not behaviour.

| retired file | canonical file |
|---|---|
| `backend/src/routes/commerce/bulkOrderRoutes_merged.js` | `backend/src/routes/bulkOrderRoutes.js` |
| `backend/src/routes/finance/assetAccountingRoutes_merged.js` | `backend/src/routes/assetAccountingRoutes.js` |
| `backend/src/routes/finance/cooperativeShareRoutes_merged.js` | `backend/src/routes/cooperativeShareRoutes.js` |
| `backend/src/routes/finance/costControlRoutes_merged.js` | `backend/src/routes/costControlRoutes.js` |
| `backend/src/routes/livestock/animalHealthRoutes_merged.js` | `backend/src/routes/animalHealthRoutes.js` |
| `backend/src/routes/livestock/goatRoutes_merged.js` | `backend/src/routes/goatRoutes.js` |
| `backend/src/routes/platform/cloudManagementRoutes_merged.js` | `backend/src/routes/cloudManagementRoutes.js` |
| `backend/src/routes/platform/communityRoutes_merged.js` | `backend/src/routes/communityRoutes.js` |
| `backend/src/routes/platform/companyRoutes_merged.js` | `backend/src/routes/companyRoutes.js` |
| `backend/src/routes/platform/databaseManagementRoutes_merged.js` | `backend/src/routes/databaseManagementRoutes.js` |
| `backend/src/routes/platform/enterpriseControlRoutes_merged.js` | `backend/src/routes/enterpriseControlRoutes.js` |
| `backend/src/routes/platform/hrRoutes_merged.js` | `backend/src/routes/hrRoutes.js` |
| `backend/src/routes/platform/moduleSupportInfrastructureRoutes_merged.js` | `backend/src/routes/moduleSupportInfrastructureRoutes.js` |

## Duplicate-basename stubs (0)

`dynamicRouteLoader.js` registers by basename and drops repeats, so these stubs
beat the real implementation on directory walk order and its routes never
mounted. `/health` was preserved onto the real file where it lacked one.

| retired stub | real implementation it was hiding | routes unblocked |
|---|---|---|

## KEPT — not retired (11)

| file | why it stays |
|---|---|
| `backend/src/routes/gdprRoutes_merged.js` | holds 3 route(s) the canonical lacks: GET /export, POST /delete-request, GET /consent-status |
| `backend/src/routes/libraryRoutes_merged.js` | holds 2 route(s) the canonical lacks: POST /, GET /:id |
| `backend/src/routes/livestock/dairyRoutes_merged.js` | in-memory scaffold, but canonical dairyRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/logistics/geofencingRoutes_merged.js` | holds 1 route(s) the canonical lacks: GET /health |
| `backend/src/routes/platform/completeERPIntegrationRoutes_merged.js` | in-memory scaffold, but canonical completeERPIntegrationRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/platform/comprehensiveERPRoutes_merged.js` | in-memory scaffold, but canonical comprehensiveERPRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/platform/informationSharingRoutes_merged.js` | in-memory scaffold, but canonical informationSharingRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/platform/knowledgeRoutes_merged.js` | in-memory scaffold, but canonical knowledgeRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/platform/organizationManagementRoutes_merged.js` | in-memory scaffold, but canonical organizationManagementRoutes.js is ALSO a placeholder — no real implementation exists for this resource yet |
| `backend/src/routes/publicDomainDataExtractionRoutes_merged.js` | holds 1 route(s) the canonical lacks: GET /health |
| `backend/src/routes/unifiedLedgerRoutes_merged.js` | holds 1 route(s) the canonical lacks: GET /health |

## The one call that is yours, not mine

Six of the kept files are in-memory scaffolds whose **canonical counterpart is
also a placeholder** — `dairy`, `completeERPIntegration`, `comprehensiveERP`,
`informationSharing`, `knowledge`, `organizationManagement`. Neither side is
real. Retiring the scaffold removes the only thing answering those paths;
keeping it means a fake in-memory store stays mounted. That is a build-out
decision about whether those resources are wanted at all, so I left them.

## To reverse everything at once

```bash
git restore backend/src/routes/
```

That also reverts the consolidations and corruption repairs, which are edits to
tracked files in the same directory — so prefer per-file `git restore` if you
only want to put a specific duplicate back.
