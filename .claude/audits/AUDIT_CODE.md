---
agent: code-auditor
status: fail
findings: 6
---

> Current read-only completeness audit. The historical code-quality findings below are superseded by the evidence in this report.

# Domain Connectivity Audit: Accounting, GST, Logistics, Storage, Livestock, and Northeast Supply

## Scope and method

Read-only audit of the actual `backend/src`, `frontend/src`, and SQL migration files. Existing reports and indexes were not treated as evidence. The local `.vibecheck/truthpack` directory is absent, so no truthpack claims could be cross-checked. Source files were not modified; this audit file is the only intended output.

Status labels:

- **Reachable**: route is imported and mounted by `backend/src/index.js`; service import and endpoint symbols were inspected.
- **Mismatch**: source contains both sides, but frontend URL or resource shape does not match the mounted backend route.
- **Candidate orphan**: file exists and may be substantial, but no controlling import/mount or caller was found in the inspected source path.
- **Duplicate candidate**: a legacy and a top-level service/route surface coexist; the route's actual import is the authority until deliberately consolidated.

## Executive findings

1. **High: Asset accounting frontend calls an unmounted prefix.** `assetAccountingAPI` calls `/erp/assets/...` in `frontend/src/services/api.js`, while `backend/src/index.js` mounts `assetAccountingRoutes` only at `/api/assetaccounting`. `AssetAccountingPage.jsx` therefore has a real route module and service behind it, but its requests do not reach that module unless an unseen proxy rewrites the path.
2. **High: Fisheries frontend calls nine resource prefixes that are not mounted.** `fisheriesManagementRoutes.js` is mounted at `/api/fisheriesmanagement` and exposes one generic router with `/` and `/:id`; `FisheriesManagementPage.jsx` calls `/biofloc-farms`, `/hatchery-management`, `/fish-feed`, etc. The page itself says these endpoints are not built, but the backend route is present under a different shape. This is a concrete integration mismatch, not an absent schema.
3. **High: Duplicate route registration exists for freight pooling.** `backend/src/index.js` mounts both `freightPoolingRoutes` and `freightPooling` at `/api/freightpooling`. Express will evaluate both stacks in order; overlapping methods/paths can shadow or double-handle behavior. `freightPoolingRoutes.js` and `freightPooling.js` need one declared owner before further frontend integration.
4. **Medium: Legacy service directories are load-bearing for most requested domains.** Accounting, GST, return-load, cold storage, fisheries, poultry, and logistics enhancement routes import `backend/src/services/legacy/*`, while same-named top-level services also exist for several domains. These top-level files are orphan/duplicate candidates, not safe replacement targets.
5. **Medium: Database coverage is broader than reachable behavior.** Migrations define reverse logistics, backhaul, freight pools, warehouses, cold storage, GST, fisheries, poultry, and Northeast variety/export-corridor tables. Table existence does not establish that a route reads/writes the table; several frontend screens are explicitly conventional REST shells over route shapes that do not exist.

## Domain map

### Accounting and ledger

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| Fixed assets | `backend/src/routes/assetAccountingRoutes.js`, symbol `assetAccountingService`, methods `createAsset`, `getAssets`, `getAssetRegisterSummary`, `generateDepreciationSchedule`, `postDepreciationPeriod`, `runDepreciationForPeriod`, `disposeAsset`; service is `backend/src/services/legacy/assetAccountingService.js` | **Mounted** at `/api/assetaccounting`; frontend `assetAccountingAPI` uses `/erp/assets/...`, so **mismatch** | Add a compatibility mount only after confirming the global API base convention, or change the frontend wrapper to the existing `/assetaccounting/...` prefix. Do not switch the route to top-level `services/assetAccountingService.js` without comparing exports and schema behavior. |
| General ledger | `frontend/src/pages/LedgerPage.jsx` calls `financeAPI.trialBalance` and `verifyLedger`; `frontend/src/services/api.js` calls `/finance/ledger/trial-balance` and `/finance/ledger/verify` | Backend owner was not identified in the requested route slice; `UnifiedLedgerPage.jsx` explicitly says the old unified-ledger API was removed | Trace the actual finance route/service before adding UI. Treat `9999_zzzzzzzzzz_unified_ledger_schema.sql` tables (`unified_ledger`, `economy_balances`, `unified_balances`, `cross_economy_transfers`) as persistence candidates only, not proof of a live API. |
| Unified ledger duplicate | `frontend/src/pages/UnifiedLedgerPage.jsx` states the segmented backend was deleted and points users to `/ledger` | **Intentional non-caller/redirect-style page**, not an orphan backend integration | Keep canonical journal/finance ownership explicit; do not revive the deleted segmented API merely because `unified_ledger` migration files remain. |

### GST

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| GST routes | `backend/src/routes/gstRoutes.js` imports `GSTService` from `../services/legacy/gstService`; symbols include `calculateOrderGST`, `calculateProductGST`, `getGSTSummary`, `generateGSTInvoice`, `updateOrderGST`, `validateGSTNumber`, `getGSTRate`, rate CRUD, and return endpoints | **Mounted** at `/api/gst` | Use the existing route/service for GST operations; preserve its `gstService.pool` contract until migration/schema cleanup is complete. |
| Marketplace GST wrapper | `frontend/src/services/api.js` `marketplaceAPI.calculateProductGST`, `calculateOrderGST`, `generateGstInvoice` call `/marketplace/gst/...` | Potential **second route owner**; this is not the `/api/gst` mount shown in `index.js` | Verify `marketplaceRoutes` ownership and route mounting before changing either side. The API comments identify `gstService.resolveGSTRate()` as canonical, but source route naming must win over comments. |
| GST schema | `028_gst_schema.sql`: `gst_rates`, `gst_calculations`, `gst_invoices`, `gst_invoice_items`, `gst_returns`, `gst_payments`, `gst_notifications`, `gst_compliance_records`, `gst_audit_logs`; `047_gst_tables.sql`: HSN mapping, e-way bills, ITC ledger, compliance tracking, returns history | **Schema present**, migration execution not proven by filesystem | Use the existing GST service as the integration boundary; do not add another invoice/ledger implementation against the same tables. |

### Logistics, reverse logistics, and return loads

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| Logistics enhancement | `backend/src/routes/logisticsEnhancementRoutes.js` imports `../services/legacy/logisticsEnhancementService`; route symbols cover fleet vehicles, tracking, geofences, temperature readings/alerts, warehouses, inventory, and driver location | **Mounted** at `/api/logisticsenhancement`; a sibling `logisticsEnhancements.js` is also mounted at `/api/logisticsenhancements` | Keep the existing route/service pair as the integration owner. Compare the sibling route before adding endpoints because the two prefixes differ only by pluralization. |
| Warehouse management | `backend/src/routes/warehouseManagement.js` imports top-level `../services/warehouseManagementService`; symbols `createWarehouse`, `updateStock`, `getWarehouseInventory` | **Mounted** at `/api/warehousemanagement`; separate warehouse CRUD also exists inside logistics enhancement | Treat this as a duplicate domain owner. Safest next step is a route/service manifest documenting ownership and table contract, not merging code blindly. |
| Return-load board | `backend/src/routes/returnLoadBoardRoutes.js` imports `../services/legacy/returnLoadBoardService`; symbols `postCapacity`, `searchAvailable`, `bookPosting`, `cancelPosting` | **Mounted** at `/api/returnloadboard`; frontend `LogisticsMatchingPage.jsx` comments claim `/api/v1/return-load-board`, which is a **prefix mismatch** against the entrypoint | Align the frontend wrapper to `/returnloadboard` or add a deliberate compatibility mount. The migration `9999_zzzzzzzz_return_load_board_schema.sql` defines `return_load_postings`, including `booked_shipment_id`. |
| Freight pooling | `backend/src/routes/freightPoolingRoutes.js`, `backend/src/routes/freightPooling.js`, services `backend/src/services/freightPoolingService.js` and `backend/src/services/legacy/freightPoolingService.js` | **Duplicate mount** at `/api/freightpooling`; duplicate service candidates | Choose one route/service owner after comparing endpoint sets and migrations `3012_phase3_freight_pooling.sql` (`freight_pools`, `freight_shipments`) versus `9999_zzzzzz_freight_pooling_schema.sql` (`freight_pool_windows`, `freight_pool_shipments`). |
| Reverse logistics schema | `042_rural_procurement_logistics_mobility_schema.sql` defines `reverse_logistics` and `backhaul_opportunities`; return-load migration defines a separate `return_load_postings` model | **Schema-only / ownership unclear** from requested source slice | Consolidate terminology and map return-load postings to shipment/backhaul concepts through an explicit service contract. Do not create a third table. |

### Cold storage, storage, and warehouse

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| Cold storage | `backend/src/routes/coldStorageRoutes.js` imports `../services/legacy/coldStorageService`; symbols cover facility CRUD, utilization, booking CRUD/status | **Mounted** at `/api/coldstorage`; `ColdStoragePage.jsx` calls `coldStorageAPI` and documents this exact route/service pair | This is the strongest existing integration path. Keep capacity validation in `coldStorageService.createBooking`; avoid routing cold storage through the broader warehouse service. |
| Cold chain monitoring | `backend/src/routes/coldChainMonitoring.js` mounted at `/api/coldchainmonitoring`; top-level `backend/src/services/coldChainMonitoringService.js` exists | **Mounted**, but route/service symbol contract was not fully inspected here; separate from cold-storage booking | Use cold-chain monitoring for sensor/alert events and cold-storage routes for facility capacity/bookings. Join through shipment/facility IDs, not duplicate booking tables. |
| Warehouse schemas | `013_logistics_enhancements.sql` defines `warehouses`, `warehouse_inventory`, `warehouse_shipments`; `034_logistics_enhancement_schema.sql` defines `warehouse_locations`, `warehouse_inventory`, `inventory_movements`, `warehouse_performance`, `route_optimization`, `delivery_schedules`; `3009_phase3_warehouse.sql` defines another `warehouses` and `warehouse_stock` | **High schema duplication risk**; filenames do not prove migration order or live table selection | Establish one canonical warehouse repository/service and add compatibility adapters around it. First check migration runner ordering and actual database state before changing schema. |

### Fish, meat, and egg

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| Fisheries backend | `backend/src/routes/fisheriesManagementRoutes.js` imports nine service objects from `../services/legacy/fisheriesManagementService`: `biofloccFarm`, `hatcheryManagement`, `fishFeed`, `fisheriesWaterQuality`, `fishHealth`, `fisheriesHarvest`, `fishProcessing`, `coldFishChain`, `aquacultureAnalytics` | **Mounted** at `/api/fisheriesmanagement`, but the route exposes generic `/` and `/:id` routers rather than named resource prefixes | Either update frontend API wrappers to target explicit subrouters, or split this router into named mounts. The latter is safer for stable URLs but should be done once, with tests against all nine service objects. |
| Fisheries frontend | `frontend/src/pages/FisheriesManagementPage.jsx` imports nine API objects and calls conventional paths such as `/biofloc-farms`; it explicitly sets `backendNote` that endpoints “have not been built yet” | **Frontend mismatch / likely 404** despite backend service and migration files existing | Replace the placeholder route shapes only after defining the named route mapping. The schema `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzz_fisheries_management_schema.sql` already defines tables matching the page fields. |
| Poultry and eggs | `backend/src/routes/poultryRoutes.js` imports functions from `../services/legacy/poultryService`; `backend/src/index.js` mounts `/api/poultry`; frontend `poultryAPI` uses `/poultry/flocks`, egg production, feed, mortality, vaccinations, performance | **Reachable and coherent**; `PoultryManagementPage.jsx` uses the wrapper and documents actual field names | Preserve this route/service pair. Migration `067_poultry_management_schema.sql` defines `poultry_flocks`, `poultry_egg_production`, `poultry_feed_consumption`, `poultry_mortality`, `poultry_vaccination_records`. |
| Meat | No dedicated `meatRoutes.js`, `meatService.js`, or meat-specific migration was found in the requested source inventory. Northeast variety migration classifies “Animal Products” including meat, dairy, and fish, but that is catalog data, not meat operations | **Candidate missing/orphan domain**, not proven implementation | Integrate meat through an existing product/order/cold-chain contract first; do not invent a meat operations route based only on catalog classification. |

### Northeast supply routes and regional inventory

| Surface | Actual evidence | Reachability / risk | Safest integration point |
|---|---|---|---|
| Northeast varieties | `backend/src/routes/neVarietiesRoutes.js` imported and mounted at `/api/v1/varieties`; migration `9001_north_east_varieties_comprehensive.sql` defines `product_categories`, `gi_tags`, `ne_variety_products`, `animal_genetic_resources`, `elite_crop_varieties`, `export_corridors`, `fpo_product_mapping`, `ne_variety_media` | **Reachable candidate**; exact route symbols were not needed to establish import/mount, but frontend has a `VarietyDirectoryPage` and API comments referencing this catalog | Use this as the regional product/catalog anchor. Join logistics via product/FPO/export-corridor IDs rather than adding state-specific logistics tables. |
| Supply-chain routes | `supplyChainTracking`, `supplyChainAnalytics`, `supplyChainDecisionRoutes` are imported and mounted at `/api/supplychaintracking`, `/api/supplychainanalytics`, `/api/supply-chain`, and `/api/v1/supply-chain` | **Reachable**, with a deliberate duplicate versioned/unversioned mount for decision routes | Safest integration point for Northeast corridors is supply-chain nodes/tracking plus `export_corridors`; keep accounting/GST downstream of shipment/order events. |
| Regional route data | `9001...` includes `export_corridors`, but no source evidence in this audit proved a route reads it | **Schema-only until route/service call is confirmed** | Find the owner by searching for `export_corridors` table references before exposing UI claims or adding route mounts. |

## Orphan and duplicate candidate inventory

These are candidates, not deletion recommendations:

- `backend/src/services/legacy/assetAccountingService.js` is the route owner; any top-level `backend/src/services/assetAccountingService.js` should be treated as duplicate until reference analysis proves otherwise.
- `backend/src/services/legacy/gstService.js` is the `/api/gst` route owner; any top-level GST service candidate must not replace it without comparing the pool and exported methods.
- `backend/src/services/legacy/coldStorageService.js` is the cold-storage route owner; `backend/src/services/coldChainMonitoringService.js` is a separate monitoring service, not an equivalent replacement.
- `backend/src/services/legacy/returnLoadBoardService.js` is the return-load route owner; a top-level same-named service, if retained, is a duplicate candidate.
- `backend/src/services/legacy/fisheriesService.js` and `backend/src/routes/legacy/fisheriesRoutes.js` are legacy fisheries candidates distinct from the mounted `fisheriesManagementRoutes.js` / `fisheriesManagementService.js` pair.
- `backend/src/services/legacy/logisticsService.js` and `backend/src/services/claude/logisticsAIService.js` are not proven mounted owners for the core logistics enhancement endpoints; do not wire them by filename similarity.
- `backend/src/routes/logisticsEnhancements.js` and `backend/src/routes/logisticsEnhancementRoutes.js` are both mounted under near-identical prefixes and require endpoint overlap review.
- `frontend/src/pages/UnifiedLedgerPage.jsx` is an intentional compatibility/explanation page after removal of its prior API, not evidence that the unified-ledger backend should be revived.
- `frontend/src/pages/FisheriesManagementPage.jsx` is a live UI route but its resource calls are frontend-only shapes until they are aligned with the mounted generic backend router.

## Safest integration order

1. Fix path contracts first: asset accounting (`/erp/assets` vs `/assetaccounting`), return-load (`/api/v1/return-load-board` vs `/api/returnloadboard`), and fisheries named-resource URLs.
2. Remove the freight pooling double mount after comparing route symbols and service exports; add one route-level test per overlapping endpoint.
3. Declare canonical ownership for warehouse versus logistics-enhancement warehouse operations and for legacy versus top-level services.
4. Verify migration runner/database state for duplicated warehouse, cold-chain, freight, GST, and ledger tables before schema edits.
5. Only then connect Northeast `export_corridors` and perishable fish/meat flows to shipment/cold-chain events; catalog presence alone is insufficient.

## Metrics from this audit

| Item | Observed |
|---|---:|
| Requested domain route modules explicitly imported in `backend/src/index.js` | 13+ |
| Requested domain mount duplicates identified | Freight pooling; logistics enhancement sibling; multiple warehouse surface |
| Requested legacy service files used directly by inspected routes | 7+ |
| Requested frontend pages routed in `frontend/src/config/routes.js` | Asset accounting, cold storage, fisheries, poultry, logistics, logistics matching, ledger |
| Relevant migration families found | GST, logistics, reverse logistics/backhaul, warehouse, cold chain/storage, freight, poultry, fisheries, Northeast varieties |
| Meat-specific route/service/migration found | None |

## Limitations

This is static source tracing. It does not claim that migrations have executed, that PostgreSQL tables exist, or that dynamic middleware/proxy rewrites do not alter URLs. Runtime route discovery and database introspection were not run, consistent with the read-only request and the repository’s documented external-service prerequisites.

## Summary

The repository's declared completeness counts are not reproducible from the current tree. Filesystem inventory found 230 production service files, 174 route files, 302 page files, 292 component files, 86 module directories, and 81 module service files. Concrete incomplete behavior also exists: `backend/src/routes/aiGatewayRoutes.js` returns HTTP 501 for every endpoint, and 16 Atomic frontend components contain literal `TODO: Implement` returns.

## Current Findings

### 1. [Critical] Mounted AI gateway endpoints are explicitly unimplemented

- **Location:** `backend/src/routes/aiGatewayRoutes.js:17-29`
- **Evidence:** `notImplemented()` always sends status `501`; seven routes use it: chat, statistics, providers, model listing, provider enable/disable, and stream.
- **Impact:** Exposed API routes advertise unavailable capabilities. Route presence is being counted as implementation.
- **Remediation:** Remove or gate these routes until the matching service exists, or implement and test the declared contract.

### 2. [High] The module inventory is incomplete and conflicts with declarations

- **Locations:** `backend/src/modules/`, `TRUTHPACK.json`, `.ai/architecture/CURRENT_IMPLEMENTATION.md`
- **Evidence:** Only 86 module directories and 81 `service.js` files exist; numbered modules are selective and stop at M144, with non-numbered directories also present. The truthpack declares M001-M150 and 150 module services. The architecture matrix presents M031-M150 as a declared range despite this incomplete tree.
- **Impact:** The 150-module surface does not exist as a complete filesystem inventory; completeness percentages based on it are unreliable.
- **Remediation:** Generate per-module status from the tree and distinguish absent modules from skeletons and implemented modules.

### 3. [High] Frontend contains literal placeholder components

- **Locations:** `frontend/src/components/Atomic/Avatar.jsx:4`, `frontend/src/components/Atomic/Badge.jsx:4`, `frontend/src/components/Atomic/Button.jsx:4`, and 13 other Atomic files
- **Evidence:** Representative `Button.jsx` returns only `<div className="button">{/* TODO: Implement */}</div>` and ignores `props`. The source scan found 294 TODO occurrences; 16 Atomic files contain `TODO: Implement`.
- **Impact:** Component file counts overstate usable UI completeness and shared primitives may render empty markup.
- **Remediation:** Implement and test these primitives or remove them from the import surface; classify placeholders separately from file counts.

### 4. [High] Truthpack and implementation documentation report unsupported counts

- **Locations:** `TRUTHPACK.json`, `.ai/architecture/CURRENT_IMPLEMENTATION.md`, `backend/src/services/`, `backend/src/routes/`, `frontend/src/pages/`, `frontend/src/components/`
- **Evidence:** Observed counts are 230 production services (231 including test/support), 174 route files (165 with router signatures), 302 page files, and 292 component files. Declared counts are 200, 100, 150, and 80. The architecture document separately reports 123/150 frontend pages.
- **Impact:** Counting units are undocumented and inconsistent, so the reported completion state cannot be independently verified.
- **Remediation:** Define production/reachable/functional counting rules, publish the commands, and regenerate both documents from those rules.

### 5. [Medium] Orphan and mount checks are only heuristic

- **Locations:** `backend/src/index.js`, `backend/src/routes/`, `backend/src/services/`, `backend/src/services/loggingService.js`
- **Evidence:** `backend/src/index.js` is 899 lines and contains broad `app.use`/`mountRoute` wiring. A basename scan found all route names somewhere in source, but comments and dynamic wiring can produce false positives. The same scan found `loggingService.js` with no basename reference.
- **Impact:** Static text presence does not prove runtime mounting; the architecture claim that all routes are mounted remains unverified.
- **Remediation:** Use AST or runtime route discovery to resolve imports and mounts, report dynamic registrations separately, and assign each service an explicit integration role.

### 6. [Medium] Incompleteness markers require production classification

- **Locations:** `backend/src/core/moduleRegistry.js:405`, `backend/src/middleware/compliance.js:116-149`, `backend/src/routes/aiGatewayRoutes.js:17-29`
- **Evidence:** Scans found 16 `not implemented` matches, 32 `NotImplemented` matches, 1,733 `throw new Error` occurrences, and 294 TODO occurrences. Some markers are intentional unavailable-feature responses, but the AI gateway and Atomic components are confirmed incomplete behavior.
- **Impact:** Raw marker counts are noisy and current documents do not distinguish honest failure handling from production stubs.
- **Remediation:** Classify markers into intentional unavailable behavior, tests, and production stubs; gate new production 501/TODO paths in CI with an allowlist.

## Metrics

| Surface | Observed | Declared |
|---|---:|---:|
| Backend service files | 231 total / 230 production | 200 |
| Backend route files | 174; 165 router signatures | 100 |
| Backend module directories | 86 | 150 numbered modules |
| Module service files | 81 | 150 |
| Frontend component files | 292 | 80 |
| Frontend page files | 302 | 150 |
| TODO occurrences | 294 | Not documented |
| Atomic `TODO: Implement` files | 16 | 0 implied |
| `not implemented` / `NotImplemented` matches | 16 / 32 | Not documented |
| Backend entry point | 899 lines | Not documented |

## Checks Run

- Read `TRUTHPACK.json` and `.ai/architecture/CURRENT_IMPLEMENTATION.md`.
- Recursively counted service, module, route, component, and page files; counted module directories and `service.js` files.
- Scanned router/export signatures, TODO/FIXME/XXX/HACK/not-implemented markers, and thrown errors.
- Inspected the AI gateway, representative Atomic components, bootstrap, module registry, and logging service.
- Ran basename-based route/service reference analysis; this is heuristic, not AST/runtime proof.
- No source files were modified; no database, external services, or runtime route discovery were started.

## Limitations

File totals mix legacy, generated, test, and production surfaces. Reachability was not proven for dynamic imports or runtime registrations. A final git status capture was attempted but terminal-session interference prevented reliable output.

# Code Quality Audit — AFRERA Platform

## Summary

Scope: `backend/src` (818 files, ~87,300 LOC) and `frontend/src` (572 files, ~30,500 LOC). Audit is code-quality/complexity/maintainability only — security, dependency, infra, DB, and performance issues are out of lane and left to their respective auditors.

The codebase runs and is organized into recognizable layers (services, routes, modules, middleware), but shows heavy signs of rapid, tool-assisted accretion: a 150-module code-generation scaffold that is roughly half unimplemented stubs, a single 2,339-line "shared pool" file that embeds an entire in-memory mock database for tests, an 899-line monolithic route-mounting bootstrap with inline commentary documenting its own history of orphaned/recovered routes, and a fragile test-mode pattern (implicit global reassignment of hoisted functions) repeated across at least five service files. ESLint already reports 67 errors and 579 warnings on `backend/src`, but the `lint` npm script has no `--max-warnings` gate, so none of this fails CI today. Automated test coverage is thin, especially on the frontend (1 test file for 572 source files).

None of this is a "does not run" blocker, which is why overall status is **warn** rather than **fail** — but the volume and character of the findings (dead scaffolding, stub logic disguised as working endpoints, an unenforced lint gate) mean the repo is not yet at a maintainable "launch level" baseline.

## Findings

### 1. [High] Fragile test-mode pattern: implicit reassignment of hoisted function declarations
- **Location**: `backend/src/services/iotIntegrationService.js:24-35`, `knowledgeGraphService.js`, `multilingualService.js`, `predictiveAnalyticsService.js`, `valueCommerceService.js` (ESLint `no-func-assign`, 41 occurrences total)
- **Description**: Inside `if (process.env.NODE_ENV === 'test') { ... }` blocks, these files reassign identifiers such as `registerIoTDevice = async (data) => {...}` with no `let`/`const`/`var`. Because a function declaration with the same name exists later in the same file, this is a direct reassignment of that hoisted binding (flagged by ESLint's `no-func-assign`, which specifically warns because it silently breaks under strict mode / bundling / minification, and makes control flow depend on declaration order rather than explicit test doubles).
- **Remediation**: Replace with explicit conditional exports or dependency injection (e.g. `const impl = process.env.NODE_ENV === 'test' ? testImpl : realImpl`), or move test doubles into the existing (currently near-empty) `backend/src/test-mocks/` directory and inject them via Jest module mocking instead of runtime reassignment.

### 2. [High] `database/pool.js` is a 2,339-line "connection proxy" that embeds a full mock database
- **Location**: `backend/src/database/pool.js`
- **Description**: The file's own header documents a legitimate motivation (consolidating 42 separate `new Pool()` instances that were oversubscribing `max_connections`), but the implementation goes far beyond a lazy pool proxy: it hard-codes dozens of `Map`-backed in-memory tables (`health_profiles`, `gi_products`, `blockchain_transactions`, `conversation_sessions`, etc.) and hundreds of lines of `if (isTestMode) { ... } else { ... }` branching per query shape, plus ad-hoc `console.log('TEST-POOL: ...')` debug statements left in place (20+ call sites). This makes a piece of core infrastructure code one of the largest and least navigable files in the repo, and couples unrelated domain knowledge (IoT, blockchain certs, conversations, nutrition) into a single module.
- **Remediation**: Extract the in-memory test-mode store into its own module (or per-domain fixtures under `test-mocks/`), leaving `pool.js` as a thin proxy as the header describes. Remove the leftover `console.log` debug lines or gate them behind a `DEBUG_POOL` flag.

### 3. [Med] 150-module code-generation scaffold is roughly half unimplemented placeholders
- **Location**: `backend/src/modules/M001` … `M150` (600 files: `controller.js`, `index.js`, `model.sql`, `routes.js`, `service.js`, `README.md` per module)
- **Description**: `backend/src/index.js:471-482` dynamically `readdirSync`s and auto-mounts every `M0xx` module at `/api/v1/modules/<name>`. Of the 150 module directories, 82 have a `service.js` of 10 lines or fewer — i.e. still the generated stub `// Add business logic here` / `module.exports = { /* functions */ }`. Only two modules (`M011`, `M006`) are explicitly imported by name elsewhere for their "real" mount points (`/api/v1/users`, `/api/v1/admin`); a third (`M029`) is referenced from `farmerHealthRoutes.js`. The remainder are exposed only through the generic auto-mount loop, meaning ~600 files exist in the tree with no clear signal to a reader (short of opening each `service.js`) of which are load-bearing and which are scaffolding.
- **Remediation**: Either delete/archive modules that are still pure stubs, or mark them clearly (e.g. a `STATUS: stub` line in each `README.md` surfaced in a generated index) so `git grep`/navigation isn't polluted with 68+ dead directories. Consider gating the auto-mount loop to skip stub modules so the route table doesn't advertise non-functional endpoints.

### 4. [Med] `backend/src/index.js` is an 899-line monolithic bootstrap with inline "archaeology" comments
- **Location**: `backend/src/index.js` (e.g. lines 440-539)
- **Description**: Route registration is done as ~100+ sequential `mountRoute(...)` / `app.use(...)` calls in one file, interspersed with comments such as `// Routes that existed but were never mounted anywhere`, `// Newly created routes covering previously-orphaned services`, and references to specific migration numbers (`992`, `993`). This is useful historical context, but it is also evidence that route wiring has been managed ad hoc across many separate change sessions with no central registry — which increases the risk of silently duplicated or shadowed route prefixes as the file keeps growing (six separate `ecommerce*` route groups and three separate ERP integration route sets already coexist: `erpService`, `completeERPIntegrationRoutes`, `comprehensiveERPRoutes`).
- **Remediation**: Introduce a route manifest (array of `{ path, module }` or per-domain sub-routers loaded via a folder convention) so new routes are declarative and diffable, and so overlapping domains (ecommerce, ERP) can be spotted at a glance instead of by reading 900 lines of comments.

### 5. [Med] 551 `no-unused-vars` warnings, concentrated in a handful of services, often on identifying parameters
- **Location**: Backend-wide (ESLint), worst offenders: `enterpriseAIService.js` (101), `farmerTrainingService.js` (63), `preSeasonOrderService.js` (63), `governmentSchemeService.js` (36), `insuranceClaimsService.js` (29), `soilTestingService.js` (27), `aiCopilotService.js` (26)
- **Description**: A large share of these are unused function parameters like `farmerId`, `timeframe`, `regionId` passed into handler functions that never reference them (sample from `enterpriseAIService.js:200,282,287,292,297`). Functionally, these read as endpoints that accept a scoping/identity parameter but return the same data regardless of who or what is asked for — i.e., stub or mock-data implementations sitting behind routes that look complete from the outside. This is a maintainability and correctness-adjacent smell: it's not obvious from the route table which of the 109 services actually implement their contract versus return canned data.
- **Remediation**: Triage the top-offending files first; for genuinely unused parameters, prefix with `_` (already allowed by the existing `argsIgnorePattern`) or remove them; for parameters that should be used, that's a functional gap to track separately (out of this audit's lane, but worth a follow-up ticket per file).

### 6. [Med] Backend `lint` script does not enforce a warning budget, unlike frontend's
- **Location**: `backend/package.json:11` (`"lint": "eslint src/"`) vs `frontend/package.json` (`"lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0 ..."`)
- **Description**: The frontend fails its lint script on any warning (`--max-warnings 0`); the backend's does not, so the 579 existing warnings (and any new ones) never fail a CI lint step. Findings #1, #5, and #7 below can accumulate indefinitely without being caught.
- **Remediation**: Add `--max-warnings` (start at current count or 0 after triage) to `backend`'s lint script once the backlog in #5 is addressed, or split into `lint:errors` (CI-gating) and `lint:warnings` (tracked separately) during the interim.

### 7. [Med] Inconsistent async control-flow patterns flagged by ESLint
- **Location**: `no-case-declarations` (20 occurrences: `advancedFeaturesService.js`, `advancedVoiceAI.js`, `offlineSyncService.js`) — `const`/`let` declared directly inside `switch` `case` blocks without braces, which is a real TDZ/scope-leak hazard if cases are reordered or a case falls through. `no-return-await` (26 occurrences: `redis.js`, `aiCopilotService.js`, `erpService.js`, `offlineSyncService.js`, `omnichannelAIService.js`) — redundant `return await`, which flattens stack traces and obscures error handling intent.
- **Remediation**: Wrap `case` bodies with blocks (`case 'x': { const y = ...; break; }`); apply `eslint --fix` for the mechanical parts, review the case-declaration sites by hand for pre-existing fallthrough bugs.

### 8. [Low] Near-zero frontend automated test coverage
- **Location**: `frontend/src` — 1 test file across 572 source files, despite `vitest` and a `test:coverage` script being configured in `frontend/package.json`
- **Description**: Backend has 30 test files for 818 source files (109 services), which is thin but non-trivial; frontend effectively has none, despite tooling being fully wired up. For a codebase this large heading toward "launch level," regressions in `App.jsx` (1,342 lines) or `api.js` (2,947 lines) would only surface manually.
- **Remediation**: Prioritize test coverage for `frontend/src/services/api.js` interceptor/refresh-token logic and the highest-traffic pages first; wire `test:coverage` into CI once a baseline exists.

### 9. [Low] Monolithic, low-modularity files on the frontend
- **Location**: `frontend/src/services/api.js` (2,947 lines, 242 exported functions in one file), `frontend/src/App.jsx` (1,342 lines)
- **Description**: A single API client file covering every domain (dairy, fertilizer, insurance, logistics, marketplace, etc.) makes it hard to find call sites, increases merge-conflict surface, and mixes concerns (axios setup/interceptors alongside 242 domain functions). `App.jsx` at 1,342 lines is large for a root component/router file.
- **Remediation**: Split `api.js` into per-domain modules (`services/api/insurance.js`, `services/api/logistics.js`, ...) re-exported from an index, mirroring the backend's service-per-domain layout. Extract route definitions and top-level layout from `App.jsx` into dedicated files.

### 10. [Low] No static typing anywhere on the frontend
- **Location**: `frontend/src` — 0 `.ts`/`.tsx` files; no PropTypes usage observed
- **Description**: A 30K-LOC React SPA with no TypeScript and no PropTypes means component contracts (props, API response shapes) are unenforced at build time, which raises the cost of the refactors implied by findings #8-9.
- **Remediation**: Not a blocking issue for launch; consider incremental adoption (`.tsx` for new files, `checkJs`/JSDoc typedefs for `api.js`) rather than a big-bang migration.

## Metrics

| Metric | Value |
|---|---|
| Backend source files (`backend/src/**/*.js`) | 818 |
| Backend LOC (`backend/src`) | ~87,324 |
| Frontend source files (`.js`/`.jsx`) | 572 |
| Frontend LOC (`frontend/src`) | ~30,481 |
| Backend services (`backend/src/services`) | 109 |
| Backend route files (`backend/src/routes`) | 39 |
| Backend generated modules (`backend/src/modules/M0xx`) | 150 dirs / 600 files (82 are ≤10-line stubs) |
| ESLint errors / warnings (backend/src, per existing `eslint-report.json`) | 67 errors / 579 warnings across 157 files |
| Top ESLint rule violations | `no-unused-vars` 551, `no-func-assign` 41, `no-return-await` 26, `no-case-declarations` 20, `no-prototype-builtins` 4 |
| Largest backend file | `backend/src/database/pool.js` — 2,339 lines |
| Largest frontend file | `frontend/src/services/api.js` — 2,947 lines |
| Backend test files | 30 (for 818 source files) |
| Frontend test files | 1 (for 572 source files) |
| `console.*` calls in backend/src | 53 (majority debug logging left in `database/pool.js`) |
| TODO/FIXME/XXX/HACK markers in backend/src | 1 |
| TypeScript files in frontend/src | 0 |
