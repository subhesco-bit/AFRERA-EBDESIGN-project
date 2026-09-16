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

**Backend fixes beyond route mounting**: fixed a real route-shadowing bug
in `services/legacy/villageProfileService.js` (`GET /villages/search`
registered after `GET /villages/:villageId`, same shape as
`productService.js`'s earlier fix); fixed `farmerTrainingRoutes.js`
(another scaffold swap for `farmerTrainingRoutes_merged.js`); identified
(but did not fix — real architectural work, out of scope for a wiring
pass) a systemic duplicate-service-filename bug in
`core/dynamicServiceLoader.js` — see the "Update — 2026-09-16" section
below for the full writeup before touching anything in this area.

Result: the frontend's `MISSING_EXPORT` build-error count went from 161 →
109 as of 2026-09-16 (161 at the start of this session — see
`.ai/tasks/2026-09-15-nextgen-vision-todo.md`'s 32 dated updates for the
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
`landLeaseAPI`, `shgAPI`, `publicDataAPI`, `consentManagementAPI`,
`digitalIdentityAPI`, `sessionManagementAPI`, `ssoAPI`,
`securityAccessControlAPI`, `userManagementAPI`, `rolePermissionAPI`,
`permissionManagementAPI`, `schemeRegistryAPI`, `aiAdvisoryAPI`,
`buyingClubAPI`, `procurementSubscriptionAPI`, `renewableEnergyAPI`,
`ruralEnterpriseAPI` (these last 6 are the confirmed duplicate-filename
shadowing bug specifically — real code exists in `services/legacy/*.js`,
just never reachable — a different kind of gap than the others in this
list, see the update above), plus ~24 of `farmersAPI`'s methods (field
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

`fertilityManagementAPI`,
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
`waterResourceMappingAPI` — real `createCrudService(...)` CRUD objects in
`services/legacy/landManagementService.js`, zero `setupRoutes`, the only
matching mounted route (`landManagementRoutes.js`) is a dead stub. Same
pattern as the other management-service batches above.

`waterBudgetRecordsAPI`, `waterQualityRecordsAPI`, `rainwaterStructuresAPI`,
`watershedRecordsAPI`, `waterAnalyticsRecordsAPI` — real CRUD objects in
`services/legacy/waterManagementService.js`; **this one is a genuine
regression, not just an unmounted stub**: `waterManagementRoutes.js` used
to require this service and was overwritten with a dead "Route
operational" placeholder stub by a later batch-fix commit
(`a2beb556`, 2026-09-10) — confirmed via `git log`/`git show` on the exact
file, not assumed from a stale comment.

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

`bioPesticideAPI`, `biofertilizerAPI`,
`inputDistributionAPI`,
`inputProcurementAPI`, `inputTraceabilityAPI`, `micronutrientAPI`,
`nurseryAPI`, `organicInputAPI`, `pesticideInventoryAPI`,
`seedPlanningAPI`,
`sowingAPI`, `surveyManagementAPI`,
`operationsAPI` —
same pattern as the livestock batch above: real `createCrudService(...)`
DB-backed objects in `services/legacy/{horticultureManagementService,
inputSupplyManagementService,cropManagementService,landManagementService,
operationsManagementService}.js` (shared `resourceCrudFactory.js`
factory), zero `setupRoutes`, never mounted — needs new route files, not
a wiring fix. `orchardAPI` is the standout: a genuinely complete
standalone module (`modules/M141/{controller,service,routes}.js`, real
CRUD REST handlers matching the frontend's exact fields) but `modules/`
is never scanned by either dynamic loader and never manually
`require()`'d — only 3 of the ~150+ M0xx modules in that tree are
individually wired (M029, M400_AI_BACKBONE, M645100_LIBRARYKNOWLEDGE).
Cheapest real fix of this whole gap list if module-mounting ever comes
into scope, not done here.

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
