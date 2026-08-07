# Master Module Catalogue — AFRERA

Generated: 2026-08-05T15:02:00+05:30
Branch: audit/ui-api-fix

This file is an initial authoritative index of modules, submodules, top frontend screens and API route prefixes discovered automatically. Use this as the single source for wireframing, API surface design, DB schema mapping and traceability.

## Backend modules (discovered routers / services)
- authService / smsAuthService
- farmerRoutes / farmerPortalEnhancements / farmerValueService
- marketplaceEnhancements / productService / merchandisingService
- orderService / commerceRulesService / valueCommerceService
- logisticsService / logisticsEnhancements / logisticsOpsRoutes
- revenueRoutes / demandRoutes / costRoutes
- enterpriseAIRoutes / enterpriseControlService / enterpriseAIRoutes
- aiService / advancedAIService / conversatinalAIService / omnichannelAIService
- decisionSupportService / decisionSupportRoutes
- knowledgeGraphService
- foodIntelligenceService / recipeIntelligenceService / nutritionIntelligenceService
- foodSafetyService / organicTraceabilityService / blockchainTraceabilityService
- finance: financialService / treasury / offlinePaymentService / insuranceService
- erpService / laboratoryERPService / inventory/order/warehouse modules
- governanceModule / auditRoutes / compliance & scheme modules (giIntelligenceService)
- vendorRoutes / institutionalProcurementService
- gstRoutes / tax-related modules
- iotIntegrationService / offlineSyncService / offlineSync / sync protocol
- moduleCatalogService
- multilingualService
- voiceAIService / advancedVoiceAI / voiceAI
- analyticsService / predictiveAnalyticsService
- formService / form management
- biodiversityService / indigenousKnowledgeService
- neProductIntelligenceService (North-East specialization)
- shelfLifeService / food processing helper services
- enterpriseControlService / module orchestration

> Note: many services both under src/routes and src/services expose routers. Index above is consolidated.

## Backend top-level route prefixes (from src/index.js)
- /api/v1/marketplace
- /api/v1/insurance
- /api/v1/farmer-portal
- /api/v1/governance
- /api/v1/logistics
- /api/v1/advanced
- /api/v1/enterprise-ai
- /api/v1/gst
- /api/v1/logistics-ops
- /api/v1/farmers
- /api/v1/admin/audit
- /api/v1/vendors
- /api/v1/revenue
- /api/v1/demand
- /api/v1/costs
- /graphql

## Frontend top-level routes (frontend/src/App.jsx)
- / (HomePage)
- /marketplace (MarketplacePage)
- /products/:id (ProductDetailPage)
- /forms (FormManagementPage)
- /analytics (AnalyticsPage)
- /modules (ModuleHubPage)
- /login (LoginPage)
- /register (RegisterPage)
- /pricecheck (PriceCheckPage)
- /pricebuild (PriceBuildPage)
- /dynamicpricing (DynamicPricingPage)
- /selltiming (SellTimingPage)
- /compare (ComparePage)
- /discover (DiscoverPage)
- /pricebuild, /dynamicpricing and other commerce pages
- catch-all: * (Page not found)

## Suggested Top-20 screens to wireframe (priority for Phase 1)
1. Auth & Onboarding (Login / Register / MFA / Password Reset)
2. Farmer Dashboard (summary, quick actions)
3. Farmer Sell Flow (create lot, price guidance, buyer matching)
4. Marketplace Listing (search, filters, facets)
5. Product Detail (images, specs, traceability)
6. Pre-order / Subscription flow
7. Order Checkout & Payment (including offline/escrow notes)
8. Logistics Tracking / Driver location (real-time map)
9. Inventory / Warehouse overview (slotting & pick/pack)
10. Analytics Dashboard (high-level KPI widgets)
11. Module Hub / Admin (module registry, enable/disable)
12. Forms Management (create, fill, submit)
13. Decision Support / AI Recommendations panel
14. Contract Farming onboarding & contract viewer
15. Revenue Optimization / Price Projection page
16. Cost Breakdown / TCO view for product
17. Food/Recipe page (food intelligence integration)
18. North-East specialization module main page (NE products)
19. Offline Sync status & conflict resolver
20. Settings / Profile / Org management

## Next immediate actions (wireframes & spec)
1. Produce desktop + mobile wireframes for Top-20 screens and place under `/docs/wireframes/top-20/` as SVG/PNG + MD descriptions.
2. Create OpenAPI stubs for the route prefixes above (start with /api/v1/farmers and /api/v1/marketplace).
3. Draft DB schema DDL for Farmer, Product, Order, Inventory, ModuleCatalog, and Audit tables.
4. Produce traceability matrix mapping the Top-20 screens to route prefixes and DB tables.

## Notes / Observations
- `openapi.json` exists in backend root; will reconcile and extend it to cover missing routes.
- GraphQL endpoint exists at /graphql — will extract schema if available.
- Many AI-related services expose routers — these will be captured into an AI registry with capabilities (Claude, ChatGPT connectors, model types).

---

Created by automation step run on branch `audit/ui-api-fix`. Use this catalogue as the baseline for wireframing and API/DB drafting. Next commit will add `/docs/wireframes/top-20/` with initial wireframes and OpenAPI stubs for the top-priority modules.
