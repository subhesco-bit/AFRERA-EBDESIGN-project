# Skeleton Route Audit — What "Complete All Skeletons" Actually Requires

**Date:** 2026-09-21
**Branch:** `claude/complete-skeletons`
**Method:** runtime introspection of every service object, live probes against a
booted backend, and live queries against the `afrera` PostgreSQL database. No
conclusion here rests on file existence or on reading a name.

## Summary

The task was framed as "58 route files are in-memory scaffolds, complete them."
The scaffolds are real, but completing them one by one is mostly the wrong
repair. The measured state:

| Finding | Count | Evidence |
|---|---|---|
| Route files using `let _items = []` as their data layer | 67 (59 are route files) | source scan |
| Same-named service exists for the scaffold's domain | 56 / 58 | runtime `require` + prototype walk |
| Those services that actually persist to PostgreSQL | 33 | `*.query(` after resolving re-export shims |
| Mountable route files | 881 | `DynamicRouteLoader._walkDirectory` |
| Unique route names the loader registers | 782 | `_extractRouteName` = basename |
| **Route files silently discarded, never mounted at any path** | **99** | `_registerRoute` duplicate check |
| **Collisions where a scaffold is served and the real implementation is discarded** | **27** | `tools/audit-route-collisions.js` |

So roughly 20,000 lines of working, database-backed domain logic exists and is
unreachable — not because it was never written, but because of a name collision
in the route loader.

## The mechanism

`DynamicRouteLoader._extractRouteName()` returns the file's **basename**:

```js
_extractRouteName(relativePath) {
  return path.basename(relativePath, '.js');
}
```

`_registerRoute()` then discards any file whose basename is already registered.
The discarded file is never mounted **at any path**, even though
`_generateMountPath()` includes the subfolder and would have given it a distinct
one. Which file survives is decided by `_walkDirectory` order, not by which is
correct.

Concretely:

```
routes/ecommerceRoutes.js           real, 834-line DB-backed service behind it   -> DISCARDED
routes/commerce/ecommerceRoutes.js  in-memory CRUD scaffold                      -> SERVED
```

Before this branch the loader logged only `Duplicate route name: <name>` at
warning level — not enough to identify either file. It now logs both paths at
error level and records them on `loader.collisions`, and the discard count is
returned in the mount stats.

## The 27 paths currently serving a scaffold

Several sit directly on the flagship flows in the project brief — nutrient-based
pricing, the e-commerce order path, DPR generation, vision:

`climateAdvisoryRoutes`, `completeAIIntegrationRoutes`, `dprGenerationRoutes`,
`ecommerceAIRoutes`, `ecommerceBusinessSalesRoutes`, `ecommerceERPRoutes`,
`ecommerceIntegrationRoutes`, `ecommerceMarketingRoutes`, `ecommerceRoutes`,
`farmerTrainingRoutes`, `fertilizerRoutes`, `nervousSystemRoutes`,
`nutrientValueSalesRoutes`, `pigRoutes`, `platformConfigurationRoutes`,
`platformCoreRoutes`, `poultryRoutes`, `projectSystemsRoutes`,
`publicDomainDataExtractionRoutes`, `researchAndDevelopmentRoutes`,
`sapModuleArchitectureRoutes`, `serverManagementRoutes`, `sheepRoutes`,
`startupEnvironmentRoutes`, `systemAdministrationRoutes`,
`tenantManagementRoutes`, `visionRoutes`.

Run `node tools/audit-route-collisions.js` for the current list with both paths.
It exits 1 while any of these exist, so it can gate CI.

**This is not fixed on this branch.** Changing which file wins changes what a
live URL serves, and for 53 further collisions *both* sides are real
implementations shadowing each other — picking a winner there is an
architectural decision, not a cleanup. Reporting it rather than changing it
silently follows CLAUDE.md's "report conflicts rather than silently changing
architecture."

### Options for the 27

1. **Make route names path-qualified.** `_extractRouteName` returns the relative
   path, so all 881 files register uniquely and each mounts at the distinct path
   `_generateMountPath` already computes. Purely additive for existing URLs —
   every current winner keeps its path — and the 99 discarded files gain theirs.
   The caution: it newly exposes 99 route surfaces, some of which may have been
   dark on purpose. At least one is a deprecated financial authority
   (`recoveredFinanceRoutes`, see Part 3C), so this needs a per-file pass over
   the 99 before being switched on.
2. **Prefer the non-scaffold file on collision.** Fixes exactly the 27 and
   leaves the other 72 alone. Cheap and targeted, but it mounts a root-level
   router under a subfolder prefix it was not written for.
3. **Delete or rename the 27 scaffolds** so the real files win naturally. The
   clearest end state, but it removes files, which the standing instruction not
   to remove anything rules out without an explicit decision.

### Blast radius, measured

Counting frontend call sites by path prefix across `frontend/src`:

| | call sites |
|---|---|
| On the **scaffold** paths served today (`/commerce/ecommerce`, `/livestock/sheep`, …) | **0** |
| On the **real** paths that are unmounted and return 404 (`/ecommerce`, `/sheep`, …) | **238** |

Not one frontend call reaches a scaffold path. 238 frontend calls are hitting
404 right now because the file that would serve them was discarded. Per route:
`researchAndDevelopment` 27, `nervousSystem` 24, `sapModuleArchitecture` 24,
`sheep` 16, `completeAIIntegration` 15, `projectSystems` 15, `ecommerce` 14,
`ecommerceIntegration` 14, `poultry` 13, `pig` 12, `ecommerceAI` 11, and the
rest in single digits. Three have no caller either way
(`publicDomainDataExtraction`, `serverManagement`, `startupEnvironment`).

This removes the *compatibility* objection to option 1: mounting the discarded
files changes no working caller, and fixes 238 broken ones. It is not a
security clearance — see "Per-file pass over the 99" below, which found that
mounting them as they stand would newly expose 113 unauthenticated write
endpoints. Auth-hardening comes first.

### Correction to the caution above, with the mechanism verified

The warning about `recoveredFinanceRoutes` was right but stated imprecisely.
Verified 2026-09-21 by reading both files and probing the running server:

- `routes/finance/recoveredFinanceRoutes.js` — **the file being served** — is the
  one that carries Part 3C's HTTP 410 guards on `/gst/*` and `/ledger/*`.
  `GET /api/v1/finance/recovered-finance/ledger/trial-balance` returns **410**,
  so that deprecation is genuinely in effect.
- `routes/recoveredFinanceRoutes.js` — **the discarded file** — contains no 410
  at all.

So the risk runs the opposite way from the `unifiedLedger` case: mounting the
discarded file would newly expose `/api/v1/recovered-finance/gst/*` and
`/ledger/*` **without** the deprecation, reviving the second GST rate authority
and third ledger that Part 3C deliberately retired. Option 1 must exclude this
file explicitly, which is exactly why the per-file pass over the 99 is a
precondition and not a formality.

Recommendation: option 2 now as a correctness fix, with option 1 done
deliberately afterwards behind the per-file pass.

## Classification of the 58 scaffolds

Using the requested taxonomy, from runtime evidence:

- **Scaffolded, real implementation exists but is displaced (27)** — the list above.
- **Scaffolded, real implementation exists and is already served (19)** — the
  scaffold lost its collision and is inert dead code: `bulkOrder`,
  `assetAccounting`, `cooperativeShare`, `costControl`, `animalHealth`, `dairy`,
  `goat`, `cloudManagement`, `community`, `company`, `completeERPIntegration`,
  `comprehensiveERP`, `databaseManagement`, `enterpriseControl`, `hr`,
  `informationSharing`, `knowledge`, `moduleSupportInfrastructure`,
  `organizationManagement`.
- **Backed by a service that only holds state in process memory (18)** — e.g.
  `serverManagementService` and `databaseManagementService` expose
  `simulateProvisioning` / `simulateDeletion` over `new Map()`. Wiring a route to
  these would move the fiction from the route file into the service file, so they
  must not be reported as infrastructure management.
- **No backing service at all (3)** — `fertilizer` (only
  `fertilizerInventoryService` exists, a different name), `nervousSystem`,
  `comprehensiveERP` (its service exports `{}`).

## Services that persist but whose tables do not exist

Wiring a route to these produces 500s, not function. Blocked behind the
migration work (todo #8, #9, #11):

| Service | Missing database objects |
|---|---|
| `completeAIIntegration` | all 18, incl. `farmer_crop_plans`, `crop_lifecycle`, `livestock_inventory` |
| `hr` | 9, incl. `employee_data`, `leave_requests`, `performance_reviews` |
| `completeERPIntegration` | 8, incl. `erp_gl_entries`, `erp_assets` |
| `ecommerceAI` | 8, incl. `customer_purchases`, `rfm_scores`, `sales_forecasts` |
| `ecommerceMarketing` | 6, incl. `marketing_campaigns`, `customer_segments` |
| `nutrientValueSales` | 5, incl. `nutrient_value_pricing`, `nutrient_benchmarks` |
| `projectSystems` | `project_wbs`, `project_milestones` |
| `platformConfiguration` | `platform_configurations`, `configuration_snapshots` |
| `ecommerceIntegration` | `dietitian_collections`, `dietitian_collection_products` |
| `ecommerceERP` | `inventory_adjustments`, `crm_customers` |
| `ecommerceBusinessSales` | `contract_farming`, `platform_commissions` |
| `organizationManagement` | `organizational_units` |
| `platformCore` | `platform_configurations` |

Services whose referenced objects all exist: `bulkOrder`, `dprGeneration`,
`assetAccounting`, `cooperativeShare`, `costControl`, `animalHealth`, `dairy`,
`goat`, `pig`, `poultry`, `sheep`, `company`, `enterpriseControl`.

## Correction recorded against this branch

The first commit on this branch wired `routes/finance/unifiedLedgerRoutes.js` to
`unifiedLedgerService` and added a migration so its writes would succeed. That
was wrong and has been reverted in code.

`AFRERA_CLAUDE_BUILD_DIRECTIVE.md` Part 3C records an explicit, authorized
decision dated 2026-08-15: that service implements the "9 separate economies"
ledger the directive rejects, the canonical architecture is one
`journal_entries`/`journal_lines` ledger with economy as a cost-center tag, and
the whole route surface is deprecated in place with HTTP 410. The root-level
`routes/unifiedLedgerRoutes.js` already carried that 410 — but it threw on load
(`router.use(rateLimiter)` against a module exporting an object), so the 410
never took effect, and the scaffold twin under `routes/finance/` served
fabricated success in its place. Both halves are now fixed: the root file loads,
and the `finance/` path returns the same 410.

Two things found while doing it, neither resolved here:

- **The database still carries that change.** `economy_balances`'s primary key
  is now `(economy, currency)` and four verification rows remain in
  `unified_ledger`. Reverting is a destructive edit to a live financial table
  and was declined by the sandbox, so it is left for an explicit decision. The
  migration file is kept, not deleted, because it is already applied — deleting
  it would leave the repository silently diverged from the live schema. The
  underlying contradiction is real and worth recording either way: the table's
  declared key is `(economy)` while the service upserts
  `ON CONFLICT (economy, currency)`, so **every write through that service had
  always failed and rolled back.**
- **The directive's "no frontend caller was found" note no longer holds.**
  `UnifiedLedgerPage.jsx` calls `/unified-ledger`, and `LedgerPage.jsx` calls
  `/ledger` — which returns 404, because no canonical ledger route is mounted at
  all. Building it, and moving `UnifiedLedgerPage.jsx` onto it, is separate work.

## What was actually completed

- `GET /` and `GET /:id` now require authentication across 58 scaffolded route
  files. `GET /api/v1/finance/unified-ledger` had been returning ledger rows to
  unauthenticated callers; verified 401 after the change, `/health` still 200.
- `routes/unifiedLedgerRoutes.js` loads instead of throwing, so its deprecation
  takes effect.
- `routes/finance/unifiedLedgerRoutes.js` returns 410 with a canonical pointer
  instead of fabricating `{success:true,data:[]}`.
- Route-name collisions are logged at error level with both paths and recorded
  on `loader.collisions`; the mount stats now report the discard count.
- `tools/audit-route-collisions.js` fails (exit 1) while any path serves a
  scaffold in place of a real implementation.

Boot verified after every change: 782 routes discovered, 782 mounted, 0 failed.

## CI coverage gap on this integration line

No workflow can run on a pull request into `consolidated/final`. All 8
CI-enabled workflows filter their `pull_request` trigger on `main`, `develop`,
or `chatgpt-clone/**`:

```
ci.yml                    pull_request: branches: [main, develop]
claude-ai-integration     pull_request: branches: [main, develop]
system-completion-gate    pull_request: branches: ['chatgpt-clone/**', main]
clone-completion-verif.   pull_request: branches: ['chatgpt-clone/**', main]
production-hardening      pull_request: branches: [chatgpt-clone/foundation]
production-re-audit       pull_request: branches: [chatgpt-clone/foundation]
complete-production-...   pull_request: branches: [chatgpt-clone/foundation]
clone-m001-m050-...       pull_request: branches: [chatgpt-clone/highest-standard-enhancement]
```

PR #7 reported `total_count: 0` checks, as would every PR opened against this
base. `ci.yml` does carry `workflow_dispatch`, so it was triggered manually
against this branch (run 35607089476) to get a real signal; GitHub attached the
run to the PR.

**Result:** Frontend lint+build **passed**, Dependency audit **passed**, Backend
lint **failed** — and the failure is pre-existing on the base, not this PR's:

```
src/services/enterpriseModule550RuntimeService.js
  21:461  error  Empty block statement  no-empty
```

That file is not in this PR's diff (`git diff --name-only 546648074..HEAD`
does not list it; it was last touched by 6ddaf8f97), and linting the base
commit's copy of it reproduces the identical error. Everything after the Lint
step was skipped, so **the test, migration and governance steps have still
never executed on this line.**

The offending code is a deliberate best-effort swallow in `readTitle()`, which
tries `README.md` then `module.json` and falls through to the module code on a
malformed file. `no-empty` accepts a block containing a comment, so the minimal
fix carries no behaviour change:

```js
-}catch{} }return code;}
+}catch{ /* best-effort: malformed file, fall through to the next candidate */ } }return code;}
```

Not applied here: it is unrelated to this PR's subject, and widening a PR to
carry someone else's lint fix is worse than naming it. Whether
`consolidated/final` should be added to the CI branch filters is a separate
decision — it is a one-line change per workflow, but which branches gate which
pipelines is not mine to choose.

## Per-file pass over the 99 — and a correction to the recommendation above

The pass the options section named as a precondition is now done. Every one of
the 99 discarded files was classified by reading it, `require`-ing it, and
counting the frontend call sites its would-be mount path serves.

| class | count | meaning |
|---|---|---|
| **A. Unsafe — served twin carries a 410 this file lacks** | **1** | `recoveredFinanceRoutes.js` |
| B. Self-deprecating (already returns 410) | 1 | `unifiedLedgerRoutes.js`; mounting turns 404 into the intended 410 |
| C. Would fail to load if mounted | 0 | nothing breaks on require |
| D. The discarded file is itself a scaffold | 19 | nothing gained by mounting |
| E. Safe and real | 78 | would serve **365** frontend call sites now hitting 404 |

So the exclusion list is **one file**, not an open-ended audit:
`routes/recoveredFinanceRoutes.js`. Its served twin
`routes/finance/recoveredFinanceRoutes.js` holds Part 3C's 410 guards on
`/gst/*` and `/ledger/*`; the discarded copy has none, so mounting it would
revive the retired second GST rate authority and third ledger.

### The correction

The recommendation above — that the 238/0 measurement makes the additive fix
"clearly right" — was incomplete, and acting on it as written would have been a
security regression. Auditing the 78 safe-and-real files for route guards
(`authMiddleware`, `requireRole`, `requirePermission`, `adminMiddleware`,
`optionalAuth`, `mfaMiddleware`, or a blanket `router.use`):

```
total handlers across the 78            : 777
unguarded handlers (any method)         : 263
unguarded WRITE handlers (POST/PUT/DELETE): 113, in 25 files
files with a blanket router.use(auth)   : 7
files with no unguarded handler at all  : 34
```

Mounting those files as they stand would newly expose 113 unauthenticated write
endpoints. The worst of them are not obscure:

| route | unguarded writes | examples |
|---|---|---|
| `publicDomainDataExtraction` | 16 | `POST /data-sources`, `DELETE /data-sources/:id`, `POST /extraction-jobs/:id/start` |
| `completeAIIntegration` | 13 | `POST /crop/:id/disease-detection`, `POST /livestock/:id/health-monitoring` |
| `researchAndDevelopment` | 13 | `POST /projects`, `DELETE /projects/:id` |
| `startupEnvironment` | 13 | `POST /startups`, `POST /incubation-programs/:id/apply` |
| `serverManagement` | 10 | `POST /servers`, `DELETE /servers/:id`, `POST /scale` |
| `platformConfiguration` | 5 | `POST /configuration/apply`, `/rollback`, `/security-scan` |
| `systemAdministration` | 5 | `POST /initialize`, `POST /self-healing` |
| `tenantManagement` | 5 | `POST /tenants`, `DELETE /tenants/:id` |
| `gst` | 1 | a tax-rate surface |

Unauthenticated tenant deletion, platform-configuration apply and rollback, and
server provisioning are not acceptable to switch on, whatever it does for the
365 broken frontend calls. This is the same defect class as the one fixed in
`d13301536` — scaffolded reads were public there — and it wants the same
treatment before, not after, the paths go live.

### Corrected sequence

1. **Auth-harden first.** Apply route guards to the 113 unguarded write
   handlers across those 25 files (at minimum; the 263 unguarded handlers
   overall deserve the same pass). Each file's own domain decides the role, so
   this is a reviewed pass, not a regex.
2. **Exclude `routes/recoveredFinanceRoutes.js`** explicitly, by path, in
   whatever mechanism lands — with the reason in a comment, so a later cleanup
   does not "tidy" the exclusion away and silently revive a retired financial
   authority.
3. **Then path-qualify route names** so the remaining discarded files mount at
   the distinct paths `_generateMountPath` already computes, and the 365
   frontend calls start reaching real implementations.

Steps 1 and 2 are prerequisites. Doing step 3 alone, which is what the earlier
recommendation amounted to, trades 365 broken calls for 113 open write
endpoints.

A caveat on step 3 that the numbers do not show: for the real-vs-real
collisions, mounting leaves **two** real implementations of the same domain
live at different paths. Mostly that is an improvement over one of them being
404, but for `mfa`, `gdpr`, `gst`, `revenue`, `riskPricing`, `cost`,
`insuranceEnhancements`, `governmentSubsidy`, `contractFarming` and
`preSeasonPurchase` it means two live authorities on security, tax, or money.
Those ten deserve a decision about which is canonical rather than both being
switched on.
