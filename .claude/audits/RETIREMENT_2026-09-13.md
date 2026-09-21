---
agent: consolidation
date: 2026-09-13
policy: .ai/decisions/0001-module-lineage-consolidation.md §6 + .ai/consolidation/CONSOLIDATION_PLAN.md Phase 3.1/4
status: 98 duplicates retired; 11 kept with the outstanding merge recorded
---

# Duplicate retirement — 2026-09-13

## The policy I applied

`.ai/decisions/0001-module-lineage-consolidation.md` §6 is the governing gate.
Nothing is retired until the unified version is verified (`node --check`, tests,
and a request against the mounted path where a route changed); removal happens
only after that passes, through a normal reviewable git commit, never a bulk or
silent delete. `.ai/consolidation/CONSOLIDATION_PLAN.md` Phase 3.1 step 4 adds
the direction of travel: **the consolidated code belongs in the canonical file**,
and the duplicate is what becomes a wrapper — not the reverse.

That last point mattered. The previous pass had made each canonical
`xRoutes.js` delegate to its `xRoutes_merged.js` sibling. That fixed
reachability but left the *duplicate* holding the implementation, which is the
opposite of "one canonical implementation". Corrected here.

## What the verification gate caught

Running the gate before retiring — rather than after — paid for itself:

- **6 route families failed to load at all.** `enterpriseRouteSupport.js`,
  `livestockRouteSupport.js` and `climateRouteSupport.js` export shared
  request-hardening helpers (`protectRouter`, `protectLivestockRouter`,
  `queryValidator`, …). Commit `2e3420a1` ("Batch middleware and syntax repairs
  on 358 route files") corrupted all three; commit `441c87e4` then *replaced*
  them with 12–17 line router stubs rather than repairing them. Every consumer
  threw `... is not a function` at require time. Recovered from git
  (`2e3420a1^`, and `7278fd11^` for the livestock one, whose corruption came
  from a `requireRole` helper injected into the middle of a function signature).

- **2 route families were silently under-registering.** A corruption class I had
  to find by byte inspection: a **bare `\r`** (carriage return with no line
  feed) where a newline belonged. JavaScript treats `\r` as a line terminator,
  so these files parse cleanly and pass every `node --check` gate — but the
  function was never closed, and every following `router.get/post(...)` became
  unreachable code inside its body. Live counts before → after repair:

  | file | registered before | after |
  |---|---|---|
  | `platformCoreRoutes.js` | 5 of 15 | **15** |
  | `unifiedAIRoutes.js` | 3 of 8 | **10** |
  | `labourRoutes.js` | 0 of 7 | **7** |

  Seven files carried this corruption. Two of them (`animalHealthRoutes.js`,
  `goatRoutes.js`) had `protectLivestockRouter(router)` commented out with a
  "DISABLED: protect" block when the helper was stubbed — so those routes were
  running without the rate limiting, pagination bounds and route-param
  validation their pig/sheep/poultry siblings still had. Re-enabled.

## Consolidation before retirement

| change | effect |
|---|---|
| 42 canonical files now hold the implementation (was: delegating to `_merged`) | endpoint sets byte-identical, live-verified |
| `aiGatewayRoutes`, `trackDartRoutes` consolidated | missed by the first pass — its stub heuristic required a controller/service import, which misjudged files whose routes are honest 501 handlers |
| `governanceModule` ← `platform/governanceModule_merged.js` | **1 → 25 endpoints live** (villages, panchayats, CSR projects, compliance reports, cooperatives) |
| `costRoutes` ← `finance/costRoutes_merged.js` | 2 → 3 (`/breakup`, `/corridor-model`) |
| `sapModuleArchitectureRoutes` | its duplicate's only endpoint, `GET /status`, preserved as an alias before retirement |

## A second duplicate class, found on the way

`dynamicRouteLoader.js` keys its registry by **basename** and drops any later
file with a name it has already seen. Where a 39-line generated stub sat in a
subfolder and the real implementation sat at the top level, the stub won on walk
order and the real routes never mounted — the same failure as the `_merged`
shadowing, by a different mechanism. 12 cases, retired, unblocking 64 routes:
`seedVaultRoutes` (7), `recoveredFinanceRoutes` (11), `unifiedAIRoutes` (8),
`gdprRoutes` (7), `mushroom`/`sericulture`/`vermicompost` (5 each), `demand` (4),
`foluBenchmark`/`glutWarning`/`revenue`/`wikipedia` (3 each). `/health` was
preserved onto the 4 real files that lacked one.

## Retirement decision

**Retired: 98** — 86 `_merged` duplicates + 12 duplicate-basename stubs.

Two rules, both requiring no requirer and no caller of the `...-merged` URL
(verified: the only `-merged` references in the tree are provenance comments):

- **Rule A — contained (73).** Every route the duplicate declares already exists
  in the canonical file.
- **Rule B — scaffold (13).** The duplicate is the generated in-memory CRUD
  placeholder (`let _items = []`, state lost on restart) *and* the canonical file
  is a real service/DB-backed implementation. Boilerplate that pretends to
  persist is not functionality worth preserving.

All 98 were git-tracked before deletion, so every one is recoverable with
`git restore`.

**Kept: 11**, each with the outstanding work recorded:

| file | why it stays |
|---|---|
| `gdprRoutes_merged.js` | holds `GET /export`, `POST /delete-request`, `GET /consent-status` — real GDPR endpoints not in the canonical file |
| `libraryRoutes_merged.js` | holds `POST /`, `GET /:id` |
| `geofencing`, `publicDomainDataExtraction`, `unifiedLedger` `_merged` | hold a `GET /health` the canonical lacks |
| `dairy`, `completeERPIntegration`, `comprehensiveERP`, `informationSharing`, `knowledge`, `organizationManagement` `_merged` | in-memory scaffolds whose canonical counterpart is **also** a placeholder — no real implementation exists for these resources yet, so retiring the scaffold would remove the only thing there. These are a build-out decision, not a retirement one. |

## Verification

- `node --check`: **753 route files, 0 failures**
- Live load of all 42 consolidated files: **0 load failures** (was 6)
- Endpoint sets compared live against the pre-consolidation snapshot: identical,
  except three files where the live set is a **superset** — an array-path route
  (`router.put(['/breeding/:id', '/breeding/:id/farrowing-outcome'])`) that the
  static scanner only half-read, and a mounted sub-router. Nothing lost.
- Duplicate filenames where a stub still hides a real implementation: **0** (was 12)
- No dangling `require()` to any retired file
- Frontend calls with no backend route: 2832 → **2819**; the three that look like
  regressions (`GET /cost`, `/cost-management/corridor-model`,
  `/village-profiles/villages/search`) were never served — `/cost-management`
  exists only as `/api/v1/erp/cost-management`, and the bare `/cost` never had a
  root handler. `/breakup` and `/corridor-model` are preserved on `costRoutes.js`.

**Not run against a live database** — PostgreSQL and MongoDB are not up in this
environment, so route loading was verified with their connections failing (the
app's documented degraded mode). Run the suite in CI/staging before trusting it.

## Follow-up worth tracking

The `_merged` filename itself is the root cause of both classes: the loader
derives mount paths from filenames, so any file named `x_merged.js` publishes to
`/api/v1/x-merged`, a URL nothing calls. The 11 kept files still have this
property. Once their unique routes are merged, the name should go with them.
