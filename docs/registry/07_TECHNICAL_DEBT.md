# Technical Debt Register

**Generated:** 2026-08-30 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

---

| Item | Measure | Severity |
|---|---|---|
| Fabricated AI output (`Math.random()`) | 68 calls | **Critical** — presented to users as analysis |
| Services with routes but no auth guard | 24 | **High** |
| Duplicate table definitions | 38 | High |
| TODO/FIXME markers | 0 | Low |
| Test files vs services | 31 / 329 | **High** — 9% |
| Components with zero ARIA | 685 of 686 | **High** |
| Error boundaries | 4 | **High** — one fault blanks the app |

## Unguarded services

- catalogIntelligenceService (8 routes)
- merchandisingService (10 routes)
- moduleCatalogService (4 routes)
- whatsappService (1 routes)
- aiAgentRoutes (10 routes)
- aiBrainRoutes (14 routes)
- aiCollaborationRoutes (10 routes)
- aiGatewayRoutes (7 routes)
- aiOperationIntelligenceRoutes (13 routes)
- aiSelfHealingRoutes (11 routes)
- bulkOrderRoutes (9 routes)
- aiCollaborationRoutes (10 routes)
- libraryRoutes (7 routes)
- completeAIIntegrationRoutes (15 routes)
- completeERPIntegrationRoutes (15 routes)
- demandRoutes (3 routes)
- energyRoutes (6 routes)
- farmerHealthRoutes (8 routes)
- foodRoutes (7 routes)
- healthRoutes (6 routes)
- informationSharingRoutes (22 routes)
- knowledgeRoutes (22 routes)
- researchAndDevelopmentRoutes (23 routes)
- sapModuleArchitectureRoutes (19 routes)
