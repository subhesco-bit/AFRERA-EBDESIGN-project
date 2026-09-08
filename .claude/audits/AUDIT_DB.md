---
agent: db-auditor
status: fail
findings: 6
---

# Database Audit — EBDESIGN Platform (Refresh Pass — 2026-09-08)

## Summary

Scope for this pass: `backend/src/database/**` (407 migrations + 31 loose `.sql`
files), `backend/src/modules/M0XX/**` (module-local schema/service linkage),
and a targeted review of the files currently uncommitted on `audit/ui-api-fix`
(`coldStorageRoutes.js`/`coldStorageService.js`, `aiFeedbackService.js`,
`productReviewService.js` and its two duplicate copies, `healthRoutes.js`,
`index.js`) plus adjacent services (`ecommerceService.js`,
`ecommerceIntegrationService.js`, `geofencingService.js`) surfaced while
re-checking the prior SQL-injection conclusion. PostgreSQL is not running;
this is static analysis only (grep/read against source, cross-referenced
against `migrate.js`'s actual load path and `index.js`'s actual mount path —
not just "does a query exist somewhere").

Per instructions, this pass does **not** re-report items already closed or
already-deferred-as-out-of-scope from the prior audit:
- **Findings 11/13 (prior audit) — CONFIRMED CLOSED.** Verified
  `backend/src/database/migrations/9500_m001_platform_core.sql` through
  `9543_m127_m127.sql` exist (44 files) and `.ai/tasks/ACTIVE.md:1346-1495`
  documents the fold-in. This is real: `migrate.js` reads `migrations/`
  directly, so these 44 tables are now on the one execution path that runs
  in CI/prod, not stranded module-local files.
- **Findings 1, 3-10 (prior audit)** — not re-scanned; nothing in this
  pass's diff touched the base schema, docker-compose, `database/models/`,
  or the transaction-helper usage those findings covered. Assume unchanged
  unless a future pass says otherwise.
- **Finding 12 (prior audit)** — re-checked, **still open, and the affected
  surface has grown substantially** (see Finding 4 below — this is not a
  duplicate, the numbers materially changed since the last pass).

Three genuinely new items were found in this pass, one of them a live,
unauthenticated SQL-injection vector that overturns the prior audit's
"no injection vectors found" conclusion for one specific function (that
conclusion was reached via a grep for `${req.`/`${params.`/`${body.` inside
query strings, which has a blind spot: injection through a local variable
that was itself sourced from `req.query` upstream, one call frame away from
the string literal).

## Findings

### 1. [Critical] Live, unauthenticated SQL injection via `status` filter in product reviews
- **Location**: `backend/src/services/legacy/productReviewService.js:127-133` (`getProductReviews`), reached via `GET /api/v1/product-reviews/products/:productId` (`backend/src/routes/productReviewRoutes.js:26-33`, mounted at `backend/src/index.js:985`, **no auth middleware** — contrast with the `POST` on line 17 of the same file, which does have `authMiddleware`)
- **Description**: `getProductReviews(productId, filters)` destructures `status` out of `filters` (which is literally `req.query` — `productReviewService.getProductReviews(req.params.productId, req.query)`), defaulting to `'approved'`. The main paginated `SELECT` correctly binds `status` as `$N`, but the adjacent count query does not:
  ```js
  const countQuery = `
    SELECT COUNT(*) as total
    FROM product_reviews
    WHERE product_id = $1
    ${status ? `AND status = '${status}'` : ''}
  `;
  const countResult = await this.pool.query(countQuery, [productId]);
  ```
  `status` is user-controlled (`?status=...` on an unauthenticated GET) and interpolated directly into the SQL text with no escaping or allowlisting. A request like `GET /api/v1/product-reviews/products/1?status=x'%20OR%20'1'='1` or a stacked/UNION payload reaches `pool.query()` as part of the literal SQL string. This is a real, reachable, unauthenticated injection point, not a theoretical one.
  Two other copies of this file exist (`backend/src/services/productReviewService.js` and `backend/src/services/commerce/productReviewService.js`) but both were already collapsed to `module.exports = require('../legacy/productReviewService')` in this session's diff, so there is exactly one copy of the vulnerable code, not three — but it is the one every mounted route resolves to (verified: `productReviewRoutes.js`, `commerce/marketplaceEnhancements.js`, and `marketplaceEnhancements.js` all ultimately `require('../services/legacy/productReviewService')` or a re-export of it).
- **Remediation**: Parameterize the count query identically to the main query — `AND status = $2` with `params.push(status)` — rather than string-interpolating. No functional behavior changes; this is a pure hardening fix.

### 2. [High] N+1 read pattern in `getFacilitiesWithStatus` — 2 extra queries per facility on a live listing endpoint
- **Location**: `backend/src/services/legacy/coldStorageService.js:96-133` (`getFacilitiesWithStatus`, new in this session's diff), reached via the cold storage facilities list route (confirmed caller: `backend/src/routes/coldStorageRoutes.js:37`, `const facilities = await coldStorageService.getFacilitiesWithStatus(req.query);`)
- **Description**: After fetching the facility list, the method does `Promise.all(facilities.map(async (f) => { ...await this.pool.query(occupancy); ...await this.pool.query(latestTemperature); ... }))` — two additional round trips per facility. For N facilities this is 1 + 2N queries instead of the 1 + 2 that a `GROUP BY facility_id` / `DISTINCT ON (facility_id) ... ORDER BY facility_id, recorded_at DESC` pair would need. Low blast radius today (facility counts are typically small), but it is a genuine, currently-live N+1 on the dashboard's primary listing call, and the file's own comment block (documents it as deliberately-added, not accidental legacy debt) makes this the right place to flag it before it's copied as a pattern elsewhere.
- **Remediation**: Replace the per-facility occupancy query with one query using `WHERE facility_id = ANY($1)` + `GROUP BY facility_id`, and the per-facility latest-temperature query with `DISTINCT ON (facility_id) ... ORDER BY facility_id, recorded_at DESC` (or a window function), then join both result sets back onto `facilities` in JS. Two total queries regardless of facility count.

### 3. [Medium] N+1 write/read patterns in `ecommerceService.js` / `ecommerceIntegrationService.js` (new — distinct from the 4 sites already reported in the prior audit's Finding 5)
- **Location** (each pattern duplicated near-verbatim across `backend/src/services/legacy/ecommerceService.js` and `backend/src/services/ecommerceIntegrationService.js` / `backend/src/services/legacy/ecommerceIntegrationService.js` — confirmed live via `controllers/ecommerceController.js`, `ecommerceBusinessSalesController.js`, `ecommerceIntegrationController.js`, all mounted through `index.js`'s `ecommerceRoutes`/`ecommerceIntegrationRoutes`/`ecommerceBusinessSalesRoutes`):
  - `ecommerceIntegrationService.js:327-345` (and the `legacy/ecommerceService.js:1020+` mirror) — `for (const ingredient of ingredients) { const matches = await pg.query('SELECT ... FROM product_listings WHERE ...') }`, one product-matching query per recipe ingredient.
  - `ecommerceIntegrationService.js:554-560` (and mirror) — `for (const item of cartItems) { const product = await pg.query('SELECT nutrition_data, quantity, unit FROM product_listings WHERE id = $1', [item.product_id]) }` instead of one `WHERE id = ANY($1)`.
  - `legacy/ecommerceService.js:1644-1660` — nested `for (const platform of platforms) { for (const creative of creatives) { await pg.query('INSERT INTO ad_placements ...') } }`, one insert per platform×creative pair instead of a multi-row `INSERT ... VALUES (...), (...), ...`.
  - `legacy/ecommerceService.js:1854-1860` — `for (const product of result.rows) { await pg.query('UPDATE sponsored_products SET impressions = impressions + 1 WHERE id = $1', [product.id]) }` instead of one `UPDATE ... WHERE id = ANY($1)`.
- **Description**: Same class of issue as the prior audit's Finding 5 (checkout/sync loops), just a different set of files that scan didn't cover. Ad-placement creation and cart nutrition lookups are the two with realistic N (campaign creative counts, cart sizes); the ingredient-matching loop is bounded by recipe length so lower priority.
- **Remediation**: Same fixes as Finding 5's remediation — batch with `ANY($1)`/multi-row `VALUES`. Not urgent (no correctness bug, just avoidable round trips), but worth doing in the same pass as Finding 5 if that work is picked up, since it's the same root pattern in adjacent files.

### 4. [High] Module-schema gap (prior audit's Finding 12) has roughly tripled in scope since the last pass
- **Location**: `backend/src/modules/M001` .. `M150` (exactly 150 directories now match the loader's own filter, `/^M\d{3}$/`, in `backend/src/index.js:717` — confirmed by direct count, not the stray `M0XX_DESCRIPTIVE_NAME` sibling directories like `M001_PLATFORM_CORE`, which the loader's regex does **not** match and which are therefore genuinely dead/unloaded, not a linkage bug)
- **Description**: Of these 150 live, auto-mounted modules:
  - 50 have a filled-in `model.sql` (up from 46 — the +4 are pre-existing modules whose schema was authored since the last pass, unrelated to the 9500-9543 fold-in which covered a different 46).
  - 57 have only a placeholder `model.sql` (`-- SQL model placeholder ... Define tables and indexes here`, no `CREATE TABLE`) — up from 18.
  - 43 have no `model.sql` file at all — up from 17.
  That is 100 of 150 modules (67%) with no real schema anywhere in the repo, versus 35 of 81 (43%) at the last pass. The module count itself grew from 81 → 150 between passes (concurrent scaffolding work, not this session's own changes), which is why the absolute numbers moved even though the *rate* also got worse.
  Critically, this is not all inert scaffolding: sampled directly, **58 of the 100 schema-less modules already contain real, parameterized `pg.query()`/`pool.query()` calls** against a generated table name (e.g. `M111/service.js`'s `listItems`/`getItem`/`createItem`/`updateItem`/`deleteItem` against `tableName = 'fpo_m111_items'` — a real, reachable 5-function CRUD service, just pointed at a table nothing creates). The other 42 are genuinely inert stubs (e.g. `M130/service.js`, `M140/service.js`, `M150/service.js` are 3-4 lines, `// Add business logic here`, zero queries) and should **not** be treated as broken — they are honestly incomplete, matching CLAUDE.md's "do not assume a module is a scaffold" guidance cutting the other way here: some of these truly are just scaffolds, and conflating them with the 58 reachable ones would overstate the problem.
  The specific modules named in the prior audit's Finding 11/12 examples (`M045`, `M071`, `M073`, `M074`, `M075`, `M144`) were spot-checked directly and remain exactly as reported — `M074`/`M075` still carry the same unfilled two-line placeholder comments (still saying "Fertility Management"/"Irrigation Management" while querying `sheep_flocks`/`pig_herds`), `M045`/`M071`/`M073`/`M144` still have no `model.sql` at all.
- **Remediation**: Same as the prior audit's Finding 12 remediation — this needs schema authored from scratch per module (most of the 58 reachable ones show their exact required columns directly in the generic `${tableName}` CRUD calls or in module-specific `INSERT INTO ... (col1, col2, ...)` lists), not a wiring fix. Given the growth rate, recommend adding a CI check that fails the build when a live-mounted module's `service.js` references a table absent from both `database/migrations/*.sql` and its own `model.sql` — this class of gap keeps reappearing faster than it's being closed by hand.

### 5. [Info — verified] New untracked migration `9998_ai_response_feedback.sql` is structurally sound and does not collide
- **Location**: `backend/src/database/migrations/9998_ai_response_feedback.sql` (untracked, from a concurrent session per the task brief — not this audit's own work, spot-checked only)
- **Description**: Defines `ai_response_feedback` (id BIGSERIAL PK, user_id/session_id/request_id TEXT, feedback_type VARCHAR(50) NOT NULL, rating SMALLINT CHECK 1-5, comment TEXT, created_at TIMESTAMPTZ) plus two indexes, all `IF NOT EXISTS`. Confirmed: (a) `ai_response_feedback` is not defined anywhere else in `migrations/` — no name collision; (b) the file numbering collides on the `9998` prefix with five other existing files (`9998_cold_storage_booking_trigger_fix.sql`, `9998_cold_storage_temperature_compliance.sql`, `9998_driver_location_telemetry_columns.sql`, `9998_foreign_key_indexes_followup.sql`), but this is the same already-documented, already-accepted non-bug from the prior audit's Finding 7 — `migrate.js` sorts and tracks by full filename, not numeric prefix, so this executes exactly once, order is deterministic, no correctness issue; (c) the one live caller, `backend/src/services/aiFeedbackService.js` (`recordFeedback`/`getOverallMetrics`/`generateImprovementSuggestions`), uses exactly the six non-PK/timestamp columns this migration defines, with matching types (rating as an integer 1-5, matching the CHECK constraint). One gap worth flagging back to whoever owns that service, not this audit: `aiFeedbackService` is registered in `backend/src/services/index.js:76,356` but no route file currently calls `recordFeedback`/`getOverallMetrics` — the table and service are consistent with each other but not yet reachable from any endpoint. Not a bug, just unfinished wiring on someone else's in-flight work.
- **Remediation**: None needed on the migration itself. Whoever owns `aiFeedbackService.js` still needs to add a route.

## Metrics

| Metric | Value (this pass) | Value (prior pass) |
|---|---|---|
| Migration files (`backend/src/database/migrations/`) | 407 | 265 |
| Loose/orphaned `*.sql` files directly under `database/` | 31 | 30 |
| `backend/src/modules/M0XX` dirs matching the loader's own `/^M\d{3}$/` filter | 150 | 81 |
| ...with a filled `model.sql` | 50 | 46 |
| ...with a placeholder-only `model.sql` | 57 | 18 |
| ...with no `model.sql` at all | 43 | 17 |
| Schema-less modules confirmed to issue real queries against a table nothing creates | 58 | ≥22 (of 35 total) |
| Schema-less modules that are genuinely inert stubs (no queries yet, not a live bug) | 42 | not separately counted |
| New SQL-injection vectors found | 1 (`legacy/productReviewService.js:131`, unauthenticated) | 0 |
| New N+1 sites found (beyond prior audit's 4) | 5 (1 read-heavy dashboard endpoint + 4 in ecommerce services) | — |
| Findings 11/13 (module `model.sql` → migrations fold-in) | Confirmed closed | — |
| Findings 1, 3, 5-10 | Not re-scanned this pass (out of diff scope) — assume unchanged | — |

*verified by vibecheck*
