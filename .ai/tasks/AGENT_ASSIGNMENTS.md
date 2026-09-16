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
`predictiveAnalyticsAPI` (3 of 5 methods), `blockchainTraceabilityAPI`.

Result: the frontend's `MISSING_EXPORT` build-error count went from 161 →
122 across this session (still tracked by CI's `Build Verification` job on
PR #21 — expected to still show red on ~122 remaining errors, that's
normal, don't re-file it as a new bug).

## Confirmed Missing-Feature Gaps — Do NOT Re-Investigate, Do NOT Fabricate

These frontend API names have **no real backend implementing their needed
methods anywhere in the codebase**, checked directly (not assumed). Wiring
a fake client to a nonexistent endpoint, or inventing backend logic to
match, would reintroduce the exact fabrication problem this whole PR has
been removing. If real backend work gets built for any of these, wire the
frontend client then — not before:

`decisionEngineAPI`, `erpDashboardAPI`, `enterpriseMemoryAPI`,
`climateMonitoringAPI`, `competitorAPI`, `platformTelemetryAPI`,
`platformConfigurationAPI`, `mfaManagementAPI`, `informationSharingAPI`,
`logisticsEnhancementAPI`, `irrigationAPI`, `yieldAPI`, `waterQualityAPI`,
`soilTestingOpsAPI`, `fleetManagementAPI`, `equipmentRentalAPI`,
`machineryOperationsAPI`, `implementManagementAPI`, `landLeaseAPI`,
`shgAPI`, `publicDataAPI`, `consentManagementAPI`, `digitalIdentityAPI`,
`sessionManagementAPI`, `ssoAPI`, `securityAccessControlAPI`,
`userManagementAPI`, `rolePermissionAPI`, `permissionManagementAPI`, plus
~24 of `farmersAPI`'s methods (field management, harvest scoring, most
market/pricing analytics — see the twenty-fourth update for the full list).

`weatherRoutes_merged.js` is a related but distinct case: it's real code
with a genuinely missing dependency (`climateRouteSupport.js`, a whole
validation library, not a simple bug) — not mounted, needs that library
written for real before it can be.

## How To Add Your Own Section

When Friend Claude or ChatGPT complete their first block of work, add a
`## Completed This Session (<Agent> — <branch>)` section below this one,
same format: what was fixed/added, verified how, and any new confirmed
gaps found so the other two agents don't re-check them either.
