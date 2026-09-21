---
agent: batch-fix
date: 2026-09-12
status: migration chain unblocked; wiring gap quantified
---

# Batch bug resolution — 2026-09-12

Worked by bug *class*: find every instance of a class first, fix the class in one
pass, re-scan to prove the count reached zero. Scanners used are in the session
scratchpad; the two durable ones (`tools/schema-collisions.js`,
`backend/src/database/migration_preflight.js`) were fixed rather than replaced.

## First: the standing audit was stale

`.claude/audits/AUDIT_BUGS.md` (2026-09-08) listed 4 findings. Re-verified all 4
against current code:

| # | Finding | State |
|---|---|---|
| 1 | `generateFarmInsights()` broken by farms/crops migration collision | **already fixed** — method reverted to an honest placeholder; `farms` now uses `ALTER ... ADD COLUMN IF NOT EXISTS`; `crop_plantings.crop_id` already retyped `INTEGER` |
| 2 | `gi_tagged`/`organic` filters exclude every premium product | **already fixed** — `ecommerceController.js:57-58` now round-trips absent params as `undefined` |
| 3 | SSRF allowlist only enforced in production | **already fixed** — `aiAgentService.js` now blocks loopback/link-local/private ranges unconditionally, after DNS resolution, with redirects disabled |
| 4 | Arithmetic parser rejects unary minus | **still present** — fixed here |

## The real blocker nobody had counted

`npm run migrate` could not run at all. Not "had not been run" — *could not*.
`migrate.js` rethrows on the first failing statement, and the chain had **156
statements PostgreSQL rejects outright**, the earliest in `014`.

| Class | Before | After |
|---|---|---|
| C1 FK child type ≠ parent PK type | 94 | **0** |
| C2 FK → column the winning parent lacks | 2 | **0** |
| C3 `CREATE INDEX` on a column the winning table lacks | 147 | **0** real (2 remaining are materialized views, a scanner artefact) |
| C5 partial-index `WHERE deleted_at IS NULL` with no `deleted_at` | 14 | **0** |
| `migration_preflight.js` blockers | 3 | **0** |

Root cause for all of it: ~105 table names are declared by more than one
migration, and `CREATE TABLE IF NOT EXISTS` silently skips every declaration
after the first. Later migrations then index, reference, and type columns
against a shape that never got created.

### How each class was closed

**C1 — 94 FK type mismatches, 27 files.** Retyped the child column to match the
PK of the definition that actually wins at `migrate.js` ordering. Same fix
already applied by hand twice before (`crop_plantings.crop_id`,
`crop_plantings.variety_id`); this generalised it. Groups: `villages` 29,
`users` 13, `crops` 9, `farms` 7, `farmers` 4, plus smaller sets.

Seven of these sit in `014`, `041` and `061` — inside CLAUDE.md's protected
`000-071` range. No later migration can repair a bad constraint inside another
file's own `CREATE TABLE`, so the chain died at `014` regardless of everything
else. Fixed in place **with explicit user approval**, each with a comment
recording why the exception was taken.

**`product_listings` — the wrong table won.** `097_ai_image_generation_enhanced.sql`
declares an AI-image listing record (`listing_id`, `primary_image_id`,
`quality_score`); `3100_ecommerce_tables.sql` declares the real marketplace
listing (`seller_id`, `price`, `listing_status`, `gi_tagged`, `organic`). 097
runs first, so the marketplace table was never created — even though every live
consumer queries it (`ecommerceController`, `ecommerceService`,
`ecommerceAIService`, `ecommerceERPService`, `ecommerceBusinessSalesService`),
`3101`/`3102`/`3103` `ALTER` it, and 14 FKs point at it. Nothing queries 097's
shape, so 097's table was renamed `ai_image_product_listings`. That one rename
closed 14 of the 94 C1 findings.

Two more of the same shape, both confirmed by checking which definition live
code actually queries:

- `monitoring_metrics` / `monitoring_alerts` → 9532's M086 copies renamed
  `m086_*`. 095's tables are what `infrastructureMonitoringService.js` uses;
  M086's own service queries `water_mgmt`, not these.
- `soil_samples` → 9510's M032 copy renamed `m032_soil_samples`.
  `soilNutrientLandService.js` inserts m010's column list and updates
  `WHERE id = $2` against m010's UUID key; M032's service queries `suppliers`.

All four renames are recorded in `backend/src/database/schema-decisions.json`.

**C3 — 147 indexes on non-existent columns.** Restored exactly the columns the
indexes require, typed from the losing definition that declared them, as
idempotent `ADD COLUMN IF NOT EXISTS`. 110 inserted directly before the first
index in the 44 unprotected files that needed them.

The 18 in protected files needed no exception: two new migrations,
`000_zz_collision_column_repair.sql` and `010_zz_collision_column_repair.sql`,
sort into the gap after each table is created and before the first index that
needs it — the same approach as the existing `roles` and `tender_bids` repairs.

**C5 — 14 missing `deleted_at`.** The generated CRUD migrations (`342`–`545`)
index `WHERE deleted_at IS NULL` and their services soft-delete, but each
table's winning definition predates soft delete. Added the column to all 14.

## Fixed outside the migration chain

**Unary `+`/`-` in the agent calculator** (`aiAgentService.js`). `-5+3`,
`(-5+3)` and `2*-3` were all rejected as invalid. Unary is now a distinct
right-associative operator binding tighter than `*`, so `2*-3` is `-6` rather
than the `-3` an implicit-zero fix would have produced. 16 cases pass,
including division-by-zero and unbalanced-paren rejection.

**Migration ordering disagreed with itself** — 5 sites. `migrate.js` orders
numerically (`999_` before `1000_`); `migration_preflight.js`,
`tools/schema-collisions.js`, `tools/gen-reconciliation.js` and the two
alternate runners `execute-migrations.js` / `executeMigrationsComplete.js` used
a plain `.sort()`, where `"1000_"` sorts before `"999_"`. Consequences: the
checkers named the wrong winner for `warehouses`, `edge_computing`,
`purchase_orders`, `production_orders` and `journal_entries`, and the alternate
runners would have built a *different database* than `npm run migrate`. All five
now import one comparator, `backend/src/database/migrationOrder.js`.

**Login and registration were broken and leaking credentials.**
`authAPI.login`/`register` in `frontend/src/services/api.js` used
`api.get('/auth/login', { params })`. The backend declares
`router.post('/login')` and reads `req.body`, so the call 404'd —
`LoginForm.jsx` and `RegisterForm.jsx` could never sign anyone in — and the
password travelled in the request line, into access logs, browser history and
any `Referer`. Now `api.post` with a body.

## Wiring: what I found, and what I deliberately did not do

Resolved the real endpoint table (5,819 endpoints) the way the app actually
builds it — `backend/src/core/dynamicRouteLoader.js` auto-mounts every file
under `backend/src/routes` at `/api/v1/<kebab name minus "Routes">`, plus an
alias table, plus `index.js`'s explicit `app.use()` calls. **Reading `index.js`
alone is misleading**: it makes ~545 route files look orphaned and suggested
`/api/v1/auth` was unmounted, which it is not. `tools/route-audit.js`'s
"545 orphaned files" figure has this flaw.

Two real gaps remain, both large and neither mechanically fixable:

- **285 call sites invoke an API-client method that does not exist** — e.g.
  `AdminDashboardPage` calls `analyticsAPI.getPlatformStats()` where the client
  defines only `getStats`/`getReports`; `TractorManagementPage` calls six
  `machineryAPI` methods that do not exist against a `/machinery` mount that
  does not exist either. Each throws `TypeError: ... is not a function` on
  render.
- **2,823 endpoint literals have no backend route** at any verb.

I built a fuzzy matcher for these and **threw the results away**. It paired
`consumerHealthAPI.getHealthMetrics()` with `/api/v1/ai-self-healing/health-metrics`
and `farmerPortalAPI.getLandRecords()` with `/api/cropplanning/recommend/:landRecordId`
— different subsystems. Generating wrappers from name similarity would have
produced code that looks wired and calls the wrong service, which is worse than
the current honest failure. Under a strict rule (client already talks to that
mount prefix, method tokens equal the route's trailing path tokens, verbs
agree), exactly **1 of 285** could be justified, and that one was dubious too.

This is the same surface `FIXES.md` already deferred as **F6**: a bounded
backend build-out, resource family by resource family, not a wiring pass. The
per-client breakdown is in the session scratchpad (`wiring.json`,
`wiring_classified.json`).

## Verification

- `migration_preflight.js`: 3 blockers → **0**
- Rejected-by-PostgreSQL statements: 156 → **0**
- `tools/schema-collisions.js`: 63 → 50 errors (remainder are undecided
  collisions that do not block a run)
- Paren balance checked on all 64 touched `.sql` files: all balanced
- `node --check` clean on every changed backend `.js`; `api.js` parses clean
- Arithmetic parser: 16/16 cases
- **Not run against a live database** — PostgreSQL is not up in this
  environment. Every statement is verified structurally and against the
  resolved schema model, not proven to apply. Run `npm run migrate` in
  CI/staging before trusting it.
