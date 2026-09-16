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
`varietyDirectoryAPI` (`/api/regionalvariety`, unversioned base).

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
`equipmentRentalAPI`, `machineryOperationsAPI`, `implementManagementAPI`,
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

`cattleRegistryAPI`, `feedManagementAPI`, `livestockAnalyticsAPI`,
`farmActivityAPI`, `farmTaskAPI`, `fertilityManagementAPI`,
`fishHealthAPI`, `fishProcessingAPI`, `coldFishChainAPI`,
`biofloccFarmAPI`, `aquacultureAnalyticsAPI`, `pondAPI`,
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

`householdEconomyAPI`, `sharedInfrastructureAPI` (note: distinct from the
already-wired `sharedInfraAPI` — different backend file,
`sharedInfrastructureService.js` vs `sharedInfraService.js`), `ruralFinanceAPI`,
`mobilityRidesAPI`, `marketAccessAPI` — **not gaps, DEAD IMPORTS**:
`REOSDashboardPage.jsx` imports 13 REOS API names but only calls 6 of them
in any `useQuery`; these 5 (plus the already-known duplicate-shadowed 6)
are imported and never used anywhere in the frontend. `ruralFinanceAPI`
and `mobilityRidesAPI` in particular have substantial, real, DB-backed
`setupRoutes` implementations already live (`/api/v1/rural-finance`,
`/api/v1/mobility-rides`) that could be wired proactively even though
nothing currently calls them — not done here since nothing consumes them
yet (wiring an unused export doesn't fix a build error). `marketAccessAPI`
already exists as an export at `api.js` (~line 3935) but is an earlier
fabricated placeholder hitting the wrong path (`POST
/market-access/manage` vs the real `POST /market-access`) — flagged for
cleanup, not fixed here since it's unused either way.

`organizationManagementAPI` and `platformTelemetryAPI` are the closest of
this batch to a real fix if backend work comes into scope: both have a
complete, correct implementation that's simply never `require()`'d by a
mounted route (`platform/organizationManagementRoutes_merged.js` and
`controllers/platformTelemetryController.js` respectively) — an
unmount/wiring bug, not missing code.

Batch-verified 2026-09-16 (25 crop/horticulture/agronomy names) — 24 of
25 CONFIRMED GAP, added here, do not re-investigate:

`aeroponicsAPI`, `bioPesticideAPI`, `biofertilizerAPI`, `floricultureAPI`,
`horticultureAnalyticsAPI`, `inputConsumptionAPI`, `inputDistributionAPI`,
`inputProcurementAPI`, `inputTraceabilityAPI`, `micronutrientAPI`,
`nurseryAPI`, `organicInputAPI`, `pesticideInventoryAPI`, `polyhouseAPI`,
`precisionHorticultureAPI`, `protectedCultivationAPI`, `seedPlanningAPI`,
`sowingAPI`, `vegetableProductionAPI`, `surveyManagementAPI`,
`farmProductivityAPI`, `farmOperationsDashboardAPI`, `operationsAPI` —
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
