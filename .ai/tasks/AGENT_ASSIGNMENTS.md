# AGENT ASSIGNMENTS — Live Claim Board

**Purpose:** Three agents (Claude — this session, "claude/keen-gates-663i5d" /
PR #21; Friend Claude — "feature/claude-friend-work"; ChatGPT — branch TBD)
are working the same repo in parallel. This file is the single place all
three check *before* touching a file, so no two agents edit the same thing
at once. See `.ai/AGENT_PROTOCOL.md` for the full collaboration rules this
extends.

**Rule:** before starting work on a file or feature area, add a row under
"Currently Claimed" naming yourself, the files/area, and what you're doing.
Before adding a row, check it doesn't overlap an existing one — if it does,
pick something else. When you finish, move your row to "Completed This
Session" with a one-line summary, and update the file *before* you push.

`git pull --rebase` this file specifically (`git pull --rebase origin <branch> -- .ai/tasks/AGENT_ASSIGNMENTS.md`
or just a full rebase) right before editing it, since all three agents
write here often — it's the one file every agent should expect near-constant
churn on.

## Currently Claimed

| Agent | Files / Area | Started | Notes |
|---|---|---|---|
| _(empty — add yours above this line)_ | | | |

## Shared Files — Claim By Section, Not Whole File

Two files are large and every agent will need to touch them. Don't claim
the whole file — claim the specific section/export/line-range you're
adding, note it in "Currently Claimed" as e.g. `frontend/src/services/api.js
(adding cattleRegistryAPI export only)`, and `git pull --rebase` immediately
before and after editing so simultaneous additions in different line ranges
merge cleanly instead of conflicting:

- `backend/src/index.js` — route requires/mounts. Each new mount is a
  self-contained 1-3 line addition; append yours, don't reorder others'.
- `frontend/src/services/api.js` — API client exports. Each export is a
  self-contained block; append yours after the last export, don't reorder
  or reformat others'.

## Completed This Session (Claude — PR #21, branch claude/keen-gates-663i5d)

Full detail and reasoning for every item below is in
`.ai/tasks/2026-09-15-nextgen-vision-todo.md` (30 dated updates) — read that
before re-investigating anything listed here, especially the "confirmed
gap" list, so effort isn't repeated checking things already ruled out.

**Backend routes fixed/mounted** (all verified live — real route
registration + real auth enforcement, not just `require()` succeeding):
- `pigRoutes_merged.js`, `sheepRoutes_merged.js`, `poultryRoutes_merged.js`,
  `decisionSupportRoutes_merged.js`, `rfqRoutes_merged.js` — fixed a
  "protect...Router is not a function" load-time bug (dead scaffold
  support files), mounted.
- `serverManagementRoutes_merged.js` — added missing auth middleware
  (was completely unprotected), mounted at `/api/servermanagement`.
- `trackDartRoutes_merged.js`, `labourRoutes.js` — fixed a silent
  route-registration bug (lone CR instead of a closing brace, stranding
  routes inside a helper function) found 4 times total this session
  (also `seedVaultRoutes_merged.js`, `unifiedAIRoutes_merged.js` from an
  earlier pass). Full-tree swept for more instances — none remain.
- `platform/governanceModule_merged.js` — fixed a dead `authRateLimit`
  import, mounted.
- `platform/civilDisruptionRoutes_merged.js` — fixed a wrong require path.
- `platform/experienceRoutes_merged.js` — removed a dead wrong-path import.
- `services/agriculture/agriculturalIntelligenceService.js` — fixed a
  wrong require path (`../ai/aiGatewayService` → `../legacy/aiGatewayService`).
- `glutWarningRoutes.js`, `foluBenchmarkRoutes.js`, `wikipediaRoutes.js`,
  `foluRoutes.js` — scaffold swaps for their real `_merged.js` implementations.
- `services/legacy/marketIntelligenceService.js` — mounted for the first
  time via its `setupRoutes(app)` pattern (different from the usual
  `require` + `app.use()` shape most route files use).

**Frontend `services/api.js` exports added** (each verified against the
real backend's actual req.body/req.query/req.params shape, not guessed):
`productsAPI`, `productReviewsAPI`, `ordersAPI`, `modulesAPI`, `farmersAPI`
(6 of ~30 methods the real backend supports), `seedVaultAPI`, `pigAPI`,
`pigAIAPI`, `sheepAIAPI`, `poultryAIAPI`, `goatAPI`, `goatAIAPI`,
`nervousSystemAPI`, `organicTraceabilityAPI`, `nutrientValueSalesAPI`,
`projectSystemsAPI`, `glutWarningAPI`, `foluBenchmarkAPI`, `wikipediaAPI`,
`foluAPI`, `freightPoolingAPI`, `labourAPI`, `marketIntelligenceAPI`,
`predictiveAnalyticsAPI` (3 of 5 methods), `blockchainTraceabilityAPI`,
`paymentGatewayAPI`, `formsAPI`, `farmerTrainingAPI` (2 of 3 methods),
`pricingAPI`, `wearableAPI`, `villageProfileAPI`, `subsidyOpsAPI`,
`governmentSchemeAPI`, `preSeasonAPI`, `sharedInfraAPI`, `goatFarmingAPI`,
`pigFarmingAPI`, `sheepFarmingAPI`, `poultryManagementAPI` (same real
endpoints as the earlier `goatAPI`/`pigAPI` etc., different method names
for a different consuming page, `LivestockManagementPage.jsx`),
`varietyDirectoryAPI` (`/api/regionalvariety`, unversioned base),
`householdEconomyAPI`, `sharedInfrastructureAPI`, `ruralFinanceAPI`,
`mobilityRidesAPI`, `machineryAccessAPI` (all real, DynamicServiceLoader
winner-verified, wired even though currently uncalled by any page - see
the update below for why that's still correct). Also fixed a wrong path
in the pre-existing `marketAccessAPI` export (`/market-access/manage` ->
`/market-access`).

Result: MISSING_EXPORT count 107 -> 97 (2026-09-16, via 4 parallel
research passes covering all remaining candidates from the prior 109).

**New backend route file** (first of this session to write new backend
route surface rather than just fix/mount existing files):
`backend/src/routes/livestockRegistryRoutes.js` wraps the 3
`createCrudService(...)` objects in
`services/legacy/livestockManagementService.js` (cattle registry, feed
records, analytics records - real DB logic, previously zero Express
router) in a plain REST router, mounted at `/api/livestock-registry`
(unversioned, matching the goat/pig/sheep/poultry precedent so it
doesn't collide with the dynamic route loader's own `/api/v1/...`
auto-mount of the same file). Tested
(`routes/__tests__/livestockRegistryRoutes.test.js`, 7 tests: route count
+ 401-not-404 per resource). Wired `cattleRegistryAPI`, `feedManagementAPI`,
`livestockAnalyticsAPI` in `api.js` against it. This is the pattern to
repeat for the other ~9 `*ManagementService.js` files with the same
"real CRUD, zero router" shape documented above (fisheries, operations,
horticulture, input-supply, land, water, crop) - each needs its own route
file + test + api.js wiring, same shape, not started here beyond this
first one.

MISSING_EXPORT count: 97 -> 94.

**Second new route file**: `backend/src/routes/fisheriesRegistryRoutes.js`
wraps all 9 `createCrudService(...)` objects in
`services/legacy/fisheriesManagementService.js` (biofloc tanks,
hatcheries, feed logs, water quality, health records, harvests,
processing batches, cold-chain shipments, analytics), mounted at
`/api/fisheries-registry`. Tested (10 tests, same shape as the livestock
one). This also fixed 4 **pre-existing fabricated placeholder exports**
found already sitting in `api.js` before this session even started
(`hatcheryManagementAPI`, `fishFeedAPI`, `fisheriesWaterQualityAPI`,
`fisheriesHarvestAPI` - generic `getX()`/`manageX()` hitting made-up
paths like `/hatchery-management/manage` that never matched any backend
route or the real method names the page calls) - worth remembering that
some already-exported names in this file predate this session's
methodology and may be fabricated even though they don't show up in the
MISSING_EXPORT list (the export exists, it just points nowhere real) -
worth spot-checking any *API export against its actual consuming page's
method calls before trusting it, not just checking it exists. Plus 5 new
exports for the previously-missing `fishHealthAPI`/`fishProcessingAPI`/
`coldFishChainAPI`/`biofloccFarmAPI`/`aquacultureAnalyticsAPI`.

MISSING_EXPORT count: 94 -> 89.

**Third new route file**: `backend/src/routes/operationsRegistryRoutes.js`
wraps all 8 `createCrudService(...)` objects in
`services/legacy/operationsManagementService.js` (farm activities, tasks,
contractors, machinery operations, equipment schedules, input
consumption, productivity metrics, dashboard KPIs), mounted at
`/api/operations-registry` (distinct from the still-dead
`operationsManagementRoutes.js` stub at `/api/operationsmanagement` -
not touched). Tested (9 tests). Wired `farmActivityAPI`, `farmTaskAPI`,
`contractorManagementAPI`, `machineryOperationsAPI`,
`equipmentSchedulingAPI`, `inputConsumptionAPI`, `farmProductivityAPI`,
`farmOperationsDashboardAPI` against it - all 8 of that page's tabs now
have a real backend.

MISSING_EXPORT count: 89 -> 81.

**Fourth new route file**: `backend/src/routes/horticultureRegistryRoutes.js`
wraps all 8 `createCrudService(...)` objects in
`services/legacy/horticultureManagementService.js` (vegetable
production, floriculture, polyhouses, hydroponics, aeroponics, precision
readings, protected structures, analytics), mounted at
`/api/horticulture-registry`. Tested (9 tests). Fixed another
pre-existing fabricated placeholder (`hydroponicsAPI`, same
wrong-method-names pattern as the 4 fisheries ones) and wired the 7
previously-missing exports (`vegetableProductionAPI`, `floricultureAPI`,
`polyhouseAPI`, `aeroponicsAPI`, `precisionHorticultureAPI`,
`protectedCultivationAPI`, `horticultureAnalyticsAPI`) - all 8 tabs on
HorticultureManagementPage.jsx now have a real backend.

MISSING_EXPORT count: 81 -> 74.

**Fifth new route file**: `backend/src/routes/inputSupplyRegistryRoutes.js`
wraps all 8 `createCrudService(...)` objects in
`services/legacy/inputSupplyManagementService.js` (biofertilizer,
pesticide inventory, bio-pesticide, micronutrient, organic input,
procurement orders, distribution records, traceability records), mounted
at `/api/input-supply-registry`. Tested (9 tests). Wired all 8
previously-missing exports (`biofertilizerAPI`, `pesticideInventoryAPI`,
`bioPesticideAPI`, `micronutrientAPI`, `organicInputAPI`,
`inputProcurementAPI`, `inputDistributionAPI`, `inputTraceabilityAPI`) -
all tabs on InputSupplyManagementPage.jsx now have a real backend.

MISSING_EXPORT count: 74 -> 66.

**Sixth new route file**: `backend/src/routes/cropRegistryRoutes.js` wraps
all 6 `createCrudService(...)` objects in
`services/legacy/cropManagementService.js` (crop registrations,
varieties, seed plans, nurseries, sowing records, monitoring
observations - 6 separate dedicated pages, not one tab page), mounted at
`/api/crop-registry`. Tested (7 tests). Fixed 3 more pre-existing
fabricated placeholders (`cropMonitoringAPI`, `cropRegistrationAPI`,
`cropVarietyAPI` - same wrong-method-names/missing-update-delete pattern
as fisheries/horticulture) and wired the 3 previously-missing exports
(`nurseryAPI`, `seedPlanningAPI`, `sowingAPI`).

MISSING_EXPORT count: 66 -> 63.

**Seventh new route file**: `backend/src/routes/landRegistryRoutes.js`
wraps all 6 `createCrudService(...)` objects in
`services/legacy/landManagementService.js` (land leases, GIS mappings,
soil zones, water resources, boundaries, surveys), mounted at
`/api/land-registry` (distinct from the still-dead
`landManagementRoutes.js` stub at `/api/landmanagement`). Tested (7
tests). Wired all 6, including `landLeaseAPI` - previously documented as
a plain confirmed gap before finding it's the same "real CRUD, zero
router" pattern as the rest of this batch, not a genuinely missing
feature. All 6 tabs on LandManagementPage.jsx now have a real backend.

MISSING_EXPORT count: 63 -> 57.

**Eighth new route file**: `backend/src/routes/soilRegistryRoutes.js`
wraps the 3 `createCrudService(...)` objects in
`services/legacy/soilManagementService.js` (soil health cards, nutrient
plans, fertility records), mounted at `/api/soil-registry`. Tested (4
tests). Fixed 2 more pre-existing fabricated placeholders
(`soilHealthAPI`, `nutrientManagementAPI`) and wired the 1
previously-missing export (`fertilityManagementAPI`).

MISSING_EXPORT count: 57 -> 56.

**Ninth new route file**: `backend/src/routes/waterRecordsRegistryRoutes.js`
wraps the 5 `createCrudService(...)` objects in
`services/legacy/waterManagementService.js` (water budgets, quality
readings, rainwater structures, watersheds, analytics), mounted at
`/api/water-records-registry` (new path, not resurrecting the regressed
`waterManagementRoutes.js` at `/api/watermanagement` in case its current
stub behavior is relied on elsewhere). Tested (6 tests). Wired
`waterBudgetRecordsAPI`/`waterQualityRecordsAPI`/`rainwaterStructuresAPI`/
`watershedRecordsAPI`/`waterAnalyticsRecordsAPI` (these use plain
`list/create/update/remove` method names, matching
`WaterRecordsPage.jsx`'s calls directly - distinct from the still-gap
`waterBudgetingAPI`/`rainwaterHarvestingAPI`/`watershedManagementAPI`/
`waterAnalyticsAPI` on the separate `WaterManagementPage.jsx`, which need
the unscanned `modules/M076`-`M080` tree wired instead, not done here).

MISSING_EXPORT count: 56 -> 51.

## Update — 2026-09-16 (later): the duplicate-service-filename shadowing bug is fixed for all 6 known cases

Rather than re-key `core/dynamicServiceLoader.js`'s whole discovery
mechanism (a much larger, riskier change touching all 313 discovered
services - out of scope for this pass), each of the 6 confirmed cases
was fixed individually, additively, with zero change to which file wins
the Map for any service:

- **`buyingClubService.js`**: the winning file is a one-line re-export
  shim (`module.exports = require('./legacy/buyingClubService.js')`)
  whose own raw source text doesn't literally contain the word
  "setupRoutes", so `mountServiceRoutes`'s naive text-scan
  (`if (!source.includes('setupRoutes')) continue;`) skipped it even
  though requiring it correctly resolves to the real, working
  `legacy/buyingClubService.js`. Fixed by adding a comment to the shim
  that mentions "setupRoutes" - the text-scan now recognizes it, and the
  delegation was already correct, so this is not a behavior change to
  the actual mounted routes.
- **`aiAdvisoryService.js`, `procurementSubscriptionService.js`,
  `renewableEnergyService.js`, `ruralEnterpriseService.js`,
  `governmentSchemeService.js`**: for each, the Map-winning file (a
  thinner variant) is missing endpoints that only exist in the losing
  `services/legacy/*.js` copy. Verified each legacy file's own
  `app.use(...)` call (or, for governmentSchemeService, its direct
  `app.get/post` registrations) uses either a completely distinct URL
  prefix from the winner (e.g. `/ai-advisories` vs the winner's
  `/ai-advisory`) or the same prefix with non-overlapping sub-paths
  (e.g. `/renewable-energy/systems/*` vs the winner's bare `GET/POST /`)
  - so calling the legacy file's `setupRoutes(app)` directly in
    `index.js`, additively, right after the already-established
    `marketIntelligenceService.js`/`villageProfileService.js` direct-call
    pattern, exposes the missing endpoints with zero risk to the
    winning file's existing behavior. Verified live via a scratch
    script combining `DynamicServiceLoader.mountServiceRoutes(app)` +
    the 5 direct calls before touching `index.js` for real.

Updated `backend/src/services/__tests__/orphanedServiceRoutes.test.js`
to mirror the real production mounting sequence (loader +
the 5 additive direct calls) and flipped its 2 tests that used to lock in
`government/schemes/registry(/expiring)` as a confirmed 404 gap - they
now assert `not.toBe(404)`, plus 5 new test cases for the other formerly-
shadowed endpoints. 115/115 real backend tests pass (17 in this one file,
up from 11).

Wired `schemeRegistryAPI` (`list`/`getExpiring`), `aiAdvisoryAPI`,
`buyingClubAPI`, `procurementSubscriptionAPI`, `renewableEnergyAPI`,
`ruralEnterpriseAPI` (all `getStatistics`) in `api.js` against the real,
now-reachable endpoints.

MISSING_EXPORT count: 51 -> 45.

## Update — 2026-09-16 (later still): investigated wiring backend/src/modules/ for the remaining `modules/`-tree gaps - do NOT proceed, here's why

Of the 45 remaining names, ~16 trace to `backend/src/modules/` (the
~150+ M0xx tree, never scanned by either dynamic loader): `orchardAPI`,
`pondAPI`, `assetLifecycleAPI`, `breakdownMaintenanceAPI`,
`equipmentInventoryAPI`, `fuelManagementAPI`, `preventiveMaintenanceAPI`,
`sparePartsAPI`, `waterBudgetingAPI`, `rainwaterHarvestingAPI`,
`watershedManagementAPI`, `waterAnalyticsAPI`, `irrigationAPI`,
`yieldAPI`, `waterQualityAPI`, `soilTestingOpsAPI`. Investigated whether
these modules could be safely wired the same way as the
`createCrudService` batch above. Found two layered problems, fixed the
first (safe, real) and stopped at the second (not safe, real backend
work needed):

**Problem 1 - fixed**: every M0xx module built from the generic
scaffold template (`controller.js` + `service.js` + `routes.js`, 344
files across the whole tree, confirmed via `require()`ing each module's
`routes.js` directly) crashed immediately at require time with two
systemic, shared missing dependencies:
- `backend/src/utils/response.js` didn't exist at all -
  `controller.js`'s `const { sendSuccess, sendError } = require('../../utils/response')`
  threw `Cannot find module`. Created it, matching the exact call-site
  signature (`sendSuccess(res, data, pagination, statusCode)`,
  `sendError(res, error, statusCode)`) verified from real controller
  usage, not invented.
- `backend/src/middleware/validationMiddleware.js` didn't exist -
  `routes.js`'s `const { validateRequest } = require('../../middleware/validationMiddleware')`
  also threw. Grepped all 344 `routes.js` files for `validateRequest(` -
  zero actual call sites (same dead-import class of bug as
  `sharedInfrastructureAPI` earlier this session). Created a real,
  correct pass-through middleware rather than leaving the require
  broken.
- Separately, `middleware/authMiddleware.js` (an existing compatibility
  wrapper around `auth.js`) didn't export a name called `authenticate` -
  314 of 344 `routes.js` files do
  `const { authenticate } = require('../../middleware/authMiddleware')`
  then the load-bearing `router.use(authenticate)` (not dead - actually
  enforces auth). Fixed by aliasing the same real `authMiddleware`
  function under both names, **mutating the existing exported object in
  place** rather than wrapping it in a new one - 3 existing route files
  (`infrastructureMonitoringRoutes.js`, `gdprComplianceRoutes.js`,
  `aiTrainingEvaluationRoutes.js`) already depend on
  `require('../middleware/authMiddleware')` being directly callable as
  `router.use(authMiddleware)`, and a naive `Object.assign({}, ...)`
  fix would have broken those 3 the same way this file was breaking the
  M0xx scaffold. Verified all 3 still work. Added
  `middleware/__tests__/authMiddleware.test.js` (2 tests) locking this
  in.

Verified all 3 fixes together: every module checked (M076-M080, M103,
M107-M110, M132, M141 - the ones relevant to the 16 gaps above) now
loads without throwing. **These 3 files are currently dormant/inert in
the live app** - nothing requires `backend/src/modules/` today (neither
dynamic loader scans it), so this fix changes zero current behavior; it
only removes a load-time landmine for whoever mounts any of these
modules next.

**Problem 2 - stopped here, real backend work needed, not a wiring
fix**: every module's `service.js` hardcodes `this.table` to a
completely wrong, unrelated table name, disconnected from the module's
stated domain - confirmed for all 12 checked: M076 (Water Budgeting) →
`cooperatives`, M077 (Water Quality) → `credit`, M078 (Rainwater
Harvesting) → `govt_schemes`, M079 (Watershed) → `equipment_rental`,
M080 (Water Analytics) → `agri_tourism`, M103 → `bi`, M107 →
`api_management`, M108 → `workflows`, M109 → `documents`, M110 →
`contracts`, M132 (Pond, already known) → `messaging`, **M141
(Orchard) → `releases`**. `model.sql` in each module directory is a
placeholder comment with no actual schema (`-- SQL model placeholder for
Orchard Management (M141)\n-- Define tables and indexes here`).
Mounting any of these as-is would silently read/write a real but totally
unrelated table - not a missing feature, an actively wrong one. This
also invalidates part of an earlier assessment this session that called
M141 "the standout gap, essentially complete" - it is not; the routes/
controller shape is real but the data layer underneath is a scaffold
placeholder, same class of problem as M132's already-documented
`messaging`-table issue, just not caught until reading `service.js`
directly instead of stopping at `routes.js`'s shape.

Separately, for the water modules specifically (M076-M080): each has a
**second** router at `index.js` (distinct from the generic-CRUD
`routes.js`) with real action-style endpoints matching
`WaterManagementPage.jsx`'s exact expected method names (e.g. M078's
`router.post('/systems', controller.designHarvestingSystem)`) - but
`controller.js` (shared with `routes.js`) only implements the generic
`getAll/getById/create/update/delete/createBulk/search` methods, not
`designHarvestingSystem`/`monitorCollection`/etc. Requiring `index.js`
throws `Route.post() requires a callback function but got a [object
Undefined]`. Building those specific controller methods would be
writing new business logic, not wiring - explicitly out of scope.

**Conclusion**: none of the 16 `modules/`-tree gaps are fixed here.
They need real backend work (a correct migration + table binding per
module at minimum, plus for the water modules specifically, writing the
actual action-method controller logic) before any of them can be safely
mounted - not a same-session wiring fix. The 3 dependency fixes are kept
(safe, dormant, real bug fixes) as groundwork for whoever does that work
next.

**Backend fixes beyond route mounting**: fixed a real route-shadowing bug
in `services/legacy/villageProfileService.js` (`GET /villages/search`
registered after `GET /villages/:villageId`, same shape as
`productService.js`'s earlier fix); fixed `farmerTrainingRoutes.js`
(another scaffold swap for `farmerTrainingRoutes_merged.js`); identified
**and later fixed for all 6 known cases** (see the "Update — 2026-09-16
(later)" section above) a systemic duplicate-service-filename bug in
`core/dynamicServiceLoader.js` — see the "Update — 2026-09-16" section
below for the original writeup of how the bug works, still accurate for
any future undiscovered cases.

Result: the frontend's `MISSING_EXPORT` build-error count went from 161 →
45 as of 2026-09-16 (161 at the start of this session — see
`.ai/tasks/2026-09-15-nextgen-vision-todo.md`'s 35 dated updates for the
full trail; still tracked by CI's `Build Verification` job on PR #21 —
expected to keep showing red on the remaining count, that's normal,
don't re-file it as a new bug).

## Update — 2026-09-16: a systemic bug worth checking before adding anyone to the gap list below

Found that ~24 backend services exist as multiple files sharing the
identical base filename across `services/`, `services/<domain>/`, and
`services/legacy/` (e.g. `governmentSchemeService.js` in 3 places).
`core/dynamicServiceLoader.js` discovers `setupRoutes(app)`-exporting
services by walking the whole `services/` tree and keying a Map by base
filename — **correction, 2026-09-16**: `_registerService()`
(`dynamicServiceLoader.js:82-85`) actually keeps the FIRST-discovered file
for a name and skips+warns on later duplicates (`if
(this.services.has(serviceName)) { logger.warn(...); return; }`), not
"last wins" as originally written here. The practical effect is the same
(you cannot predict the winner from the file list alone) because
`fs.readdirSync` order is OS/filesystem-dependent, not alphabetical or
depth-ordered — so which file counts as "first" isn't obvious either.
Bottom line unchanged: always check the real winner with the loader
script below, never guess from directory order. Confirmed concretely for
6 services
(`governmentSchemeService`, `aiAdvisoryService`, `buyingClubService`,
`procurementSubscriptionService`, `renewableEnergyService`,
`ruralEnterpriseService`): the winning file is a thinner variant missing
exactly the endpoint the frontend needs, while the fuller
`services/legacy/*.js` copy — which has the real, matching endpoint —
loses and is never mounted at all. **Before adding anything to the
confirmed-gap list below, check whether it's actually this bug instead**:
`grep -rl '<serviceName>\.js$' backend/src/services` to find duplicates,
then check which one `new DynamicServiceLoader(null).discoverServicesFromDirectory(servicesDir)`
actually picks (`loader.services.get('<serviceName>').path`) before
concluding the feature is genuinely missing. `platformTelemetryAPI` and
`mfaManagementAPI` in particular haven't been re-checked against this
specific failure mode yet — flagged, not confirmed either way.

## Confirmed Missing-Feature Gaps — Do NOT Re-Investigate, Do NOT Fabricate

These frontend API names have **no real backend implementing their needed
methods anywhere in the codebase**, checked directly (not assumed — and,
as of the update above, checked for the duplicate-filename shadowing bug
too, not just a plain file search). Wiring a fake client to a nonexistent
endpoint, or inventing backend logic to match, would reintroduce the
exact fabrication problem this whole PR has been removing. If real
backend work gets built for any of these, wire the frontend client then
— not before:

`decisionEngineAPI`, `erpDashboardAPI`, `enterpriseMemoryAPI`,
`climateMonitoringAPI`, `competitorAPI`, `platformConfigurationAPI`,
`informationSharingAPI`, `logisticsEnhancementAPI`, `irrigationAPI`,
`yieldAPI`, `waterQualityAPI`, `soilTestingOpsAPI`, `fleetManagementAPI`,
`equipmentRentalAPI`, `implementManagementAPI`,
`shgAPI`, `publicDataAPI`, `consentManagementAPI`,
`digitalIdentityAPI`, `sessionManagementAPI`, `ssoAPI`,
`securityAccessControlAPI`, `userManagementAPI`, `rolePermissionAPI`,
`permissionManagementAPI`,
plus ~24 of `farmersAPI`'s methods (field
management, harvest scoring, most market/pricing analytics — see the
twenty-fourth update for the full list).

`platformTelemetryAPI` and `mfaManagementAPI` — **re-checked 2026-09-16,
still CONFIRMED GAP, but neither is the duplicate-filename bug**:
- `mfaManagementAPI` (`IdentityManagementPage.jsx` device-registry tab):
  the page's own `backendNote` prop admits `/mfa-devices` was never
  built. `mfaRoutes.js`/`mfaRoutes_merged.js` only implement per-user TOTP
  (`/setup`,`/verify`,`/disable`,`/status`), no device CRUD, and neither
  file is even `require()`'d in `index.js`.
- `platformTelemetryAPI` (`PlatformManagementPage.jsx` `.getStatus()`/
  `.getAnalytics()`): a real, working `controllers/platformTelemetryController.js`
  exists (backed by `services/legacy/platformTelemetryService.js`) but is
  never required by any route file — the only mounted route,
  `routes/platformTelemetryRoutes.js` (`/api/platformtelemetry`), is an
  unrelated stub that doesn't import the controller. Orphaned-controller
  bug, not a Map-shadowing one — cheap fix if in scope, but out of scope
  for a wiring pass (needs a new route file, not just an export).

Batch-verified 2026-09-16 (18 livestock/farm-ops + 10 REOS/platform names,
via two research passes) — added to this gap list, do not re-investigate:

`pondAPI`,
`medicalCodingAPI`, `nutritionIntelligenceAPI` — all trace to real
`createCrudService(...)` DB-backed objects (`services/legacy/*.js`:
`livestockManagementService.js`, `operationsManagementService.js`,
`soilManagementService.js`, `fisheriesManagementService.js`) that were
simply never wrapped in an Express router/`setupRoutes` — no
`setupRoutes` string exists in those files at all, so even the loader
can't mount them; needs a new route file written per service, not a
wiring fix. (Exception: `pondAPI` — `modules/M132`'s own README claims a
519-line real pond service reachable via a generic `/api/v1/backend-modules/M132/:operation`
bridge; verified false — the actual file is 242 lines, is a generic
messaging-table scaffold unrelated to ponds, and the claimed bridge route
doesn't exist anywhere in the code. Don't trust module READMEs without
reading the actual file.)

`governmentAPI` (2 methods — `getSchemeAnalytics`/`getComplianceStatus`,
distinct from the already-wired `governmentSchemeAPI`), `organizationManagementAPI`,
`pushNotificationsAPI` (Web Push subscribe/unsubscribe — no VAPID/web-push
code anywhere) — confirmed gaps, no matching backend.

`householdEconomyAPI`, `sharedInfrastructureAPI` (distinct from the
already-wired `sharedInfraAPI` — different backend file,
`sharedInfrastructureService.js` vs `sharedInfraService.js`),
`ruralFinanceAPI`, `mobilityRidesAPI`, `machineryAccessAPI` — **not gaps,
now WIRED even though unused**: `REOSDashboardPage.jsx` imports 13 REOS
API names but only calls 6 of them in any `useQuery`; these were dead
imports in that sense, but **correction**: Vite/rolldown's
`MISSING_EXPORT` check fires on the bare import statement, not on
call-site usage — an unused-but-real export still fixes a real build
error. All 5 verified live via the `DynamicServiceLoader` winner-check
script (not assumed) and wired against their exact real endpoints
(`/api/v1/household-economy`, `/api/v1/shared-infrastructure`,
`/api/v1/rural-finance`, `/api/v1/mobility-rides`,
`/api/v1/machinery-access`). `marketAccessAPI` already existed as an
export at `api.js` but hit a wrong path (`POST /market-access/manage`
instead of the real `POST /market-access`) — fixed in place.

`organizationManagementAPI` and `platformTelemetryAPI` remain genuine
gaps but are the closest to a real fix if backend work comes into scope:
both have a complete, correct implementation that's simply never
`require()`'d by a mounted route
(`platform/organizationManagementRoutes_merged.js` and
`controllers/platformTelemetryController.js` respectively) — an
unmount/wiring bug, not missing code. `governmentAPI` and
`pushNotificationsAPI` remain genuine gaps with no matching backend at
all.

Batch-verified 2026-09-16 (22 land/water/GIS/equipment names) — 21 of 22
CONFIRMED GAP, 1 (`machineryAccessAPI`, above) CONFIRMED LIVE:

`geoBoundaryAPI`, `gisLandMappingAPI`, `soilMappingAPI`,
`waterResourceMappingAPI` — **now fixed, see the seventh new route file
below** (was: real `createCrudService(...)` CRUD objects in
`services/legacy/landManagementService.js`, zero `setupRoutes`, the only
matching mounted route (`landManagementRoutes.js`) a dead stub - same
pattern as the other management-service batches above).

`waterBudgetRecordsAPI`, `waterQualityRecordsAPI`, `rainwaterStructuresAPI`,
`watershedRecordsAPI`, `waterAnalyticsRecordsAPI` — **now fixed, see the
ninth new route file below** (was: real CRUD objects in
`services/legacy/waterManagementService.js`; a genuine regression, not
just an unmounted stub: `waterManagementRoutes.js` used to require this
service and was overwritten with a dead "Route operational" placeholder
stub by a later batch-fix commit (`a2beb556`, 2026-09-10) — confirmed via
`git log`/`git show` on the exact file, not assumed from a stale
comment).

`waterBudgetingAPI`, `rainwaterHarvestingAPI`, `watershedManagementAPI`,
`waterAnalyticsAPI` — action-style names (`designSystem`,
`trackUsage`, etc.) matching real logic in `backend/src/modules/M076`-`M080`,
but `backend/src/modules/` is never scanned by either dynamic loader (only
3 of ~150+ M0xx modules are individually wired: M029, M400_AI_BACKBONE,
M645100_LIBRARYKNOWLEDGE). `waterIrrigationRoutes.js` covers only a
"create" endpoint for each (no `trackUsage`/`monitorHealth`/etc.), so
these stay classified as gaps rather than partial matches.

`assetLifecycleAPI`, `breakdownMaintenanceAPI`,
`equipmentInventoryAPI`, `fuelManagementAPI`,
`preventiveMaintenanceAPI`, `sparePartsAPI` — real M10x modules exist
(same unscanned-`modules/`-directory problem) and some of their *service*
logic (not routes) gets merged into unrelated legacy services by an
automated consolidation pass, but the actually-mounted route for each
target service never calls the merged functions — verified by reading
every real mount point directly, not by trusting page `backendNote`
comments (`MachineryManagementPage.jsx`'s notes claiming several of these
are "confirmed live" are themselves stale/incorrect — flagged, do not
trust without re-verifying).

**General caution for future work in this file**: several page-level
`backendNote`/header comments (`WaterRecordsPage.jsx`,
`WaterManagementPage.jsx`, `MachineryManagementPage.jsx`,
`MedicalCodingDashboardPage.jsx`'s absence of one) assert specific routes
are "real and functional" as of an earlier date. At least 2 confirmed
cases this session (`waterManagementRoutes.js`, the claimed
`backend-modules/:moduleId/:operation` bridge) were true when written but
were later regressed to dead stubs by batch-fix commits on 2026-09-10 —
always verify the *current* file content and git history, never trust an
in-file comment's claim about backend state at face value.

Batch-verified 2026-09-16 (25 crop/horticulture/agronomy names) — 24 of
25 CONFIRMED GAP, added here, do not re-investigate:

`surveyManagementAPI`,
`operationsAPI` —
same pattern as the livestock batch above: real `createCrudService(...)`
DB-backed objects in `services/legacy/{horticultureManagementService,
inputSupplyManagementService,cropManagementService,landManagementService,
operationsManagementService}.js` (shared `resourceCrudFactory.js`
factory), zero `setupRoutes`, never mounted — needs new route files, not
a wiring fix. `orchardAPI` was flagged here as "the standout: a
genuinely complete standalone module" — **correction, see the "Update —
2026-09-16 (later still)" section below**: it is not complete.
`modules/M141/service.js` hardcodes `this.table = 'releases'` (a
completely wrong, unrelated table) and `model.sql` is an empty
placeholder — the routes/controller shape matches the frontend, but the
data layer underneath doesn't exist for real. Not the cheapest fix in
this list after all; needs a real migration + table binding first, same
as the other `modules/`-tree gaps. `modules/` is never scanned by either
dynamic loader and never manually `require()`'d — only 3 of the ~150+
M0xx modules in that tree are individually wired (M029, M400_AI_BACKBONE,
M645100_LIBRARYKNOWLEDGE).

`varietyDirectoryAPI` — the 1 of 25 that's CONFIRMED LIVE and now wired:
`/api/regionalvariety` (unversioned base), static mount in `index.js` via
`regionalVarietyRoutes_merged.js` -> `services/legacy/regionalVarietyService.js`
directly (no loader/shadowing involved at all). Distinct from the
pre-existing `regionalVarietyAPI` export (different path,
`/regional-variety`, different page) — don't conflate the two.

`weatherRoutes_merged.js` is a related but distinct case: it's real code
with a genuinely missing dependency (`climateRouteSupport.js`, a whole
validation library, not a simple bug) — not mounted, needs that library
written for real before it can be.

## How To Add Your Own Section

When Friend Claude or ChatGPT complete their first block of work, add a
`## Completed This Session (<Agent> — <branch>)` section below this one,
same format: what was fixed/added, verified how, and any new confirmed
gaps found so the other two agents don't re-check them either.
