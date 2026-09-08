---
agent: bug-auditor
status: fail
findings: 4
---

# Bug Audit — 2026-09-08 (current working-tree diff, `audit/ui-api-fix`)

## Summary

Re-ran `git status`/`git diff` fresh at the start of this pass (per instructions — other
sessions are actively editing this repo). The uncommitted change set at the moment of this
audit: `backend/src/index.js`, `backend/src/routes/{aiAgentRoutes,coldStorageRoutes,
healthRoutes}.js`, deletion of `backend/src/routes/commerce/sellerRankingRoutes.js`,
`backend/src/services/{aiAgentService,aiFeedbackService}.js`,
`backend/src/services/commerce/productReviewService.js`,
`backend/src/services/legacy/{aiAgenticCompanionService,aiBackboneService,coldStorageService,
conversationalAIService,productReviewService}.js`, `backend/src/services/productReviewService.js`,
and `frontend/src/pages/{AuditReportPage,ColdStorageDashboardPage,PremiumMarketplacePage}.jsx`,
plus several new untracked test files and `backend/src/config/productionConfig.js`.

The prior audit (Devin's 30 Aug Tier 1 batch — `sendSuccess`/`sendError`, fabricated schema
queries, the `routes.js` syntax error, etc.) is fully superseded; none of those files are in
the current diff and none of those issues remain in what's touched now. This pass covers only
what's actually uncommitted right now, and does not re-report anything already closed in
`.ai/tasks/ACTIVE.md`.

Verified: `node -c` clean on every modified backend `.js` file. Most of today's diff is
legitimate, careful fix work (dedup of two dead `productReviewService.js` copies onto the
canonical `legacy/productReviewService.js`, a genuine cold-storage service/route expansion with
schema cross-checked against migration `3104_cold_storage_schema.sql`/`9998_cold_storage_
temperature_compliance.sql` and matching, `eval()` removed from `aiAgentService.js`'s calculator
tool, a real SSRF allowlist added to its `api_call` tool, an `AVG`/`AG` typo fix, a genuinely
restored `router` export in `aiBackboneService.js` that mounting depends on, and honest
`implemented:false`/`source:'fallback'` labeling replacing several previously-fabricated AI
outputs). One new code path, however, is live but silently broken end-to-end due to a
pre-existing migration collision, and one newly-wired frontend page surfaces a pre-existing
backend filter bug that undermines its whole purpose.

## Findings

### 1. [CRITICAL] New `generateFarmInsights()` (today's diff) is live at `GET /api/v1/ai-companion/insights/:farmId` but can never return real data — two separate pre-existing migration-collision bugs make every query inside it fail, silently swallowed into a fake "farm not found"

**Location:** `backend/src/services/legacy/aiAgenticCompanionService.js:635-696` (new
`generateFarmInsights`), wired live via `setupRoutes()` at
`backend/src/services/legacy/aiAgenticCompanionService.js:605` (`app.get('/api/v1/ai-companion/insights/:farmId', ...)`),
itself mounted from `backend/src/index.js:1374` (`aiAgenticCompanionService.setupRoutes(app)`).
Confirmed this is the only caller of the new method (`grep -rn generateFarmInsights backend/src`
finds no other reference) and confirmed the route is genuinely reachable, not dead code.

Today's rewrite replaced an honest empty-placeholder with real queries:
```js
const farmResult = await getPostgreSQL().query(
  'SELECT id, name, area, soil_type, current_status FROM farms WHERE id = $1', [farmId]);
farm = farmResult.rows[0] || null;
const plantingResult = await getPostgreSQL().query(
  `SELECT cp.growth_stage, ... FROM crop_plantings cp JOIN crops c ON c.id = cp.crop_id
   WHERE cp.farm_id = $1 AND cp.status = 'active' ...`, [farmId]);
```
wrapped in a single `try { ... } catch (error) { logger.warn(...) }` that, on **any** error,
silently falls through to `farm` staying `null` and the function returning
`{ farm_id, found: false, source: 'fallback', message: 'No farm record found for this farmId.' }`
— i.e. every SQL error here is indistinguishable from "this farmId genuinely doesn't exist."

Both queries are broken by a pre-existing migration collision, not by today's new code:

- **`farms` table**: `backend/src/database/migrations/001_skeleton_complete_schema.sql:225`
  declares `CREATE TABLE IF NOT EXISTS farms` with columns `farm_code, total_acreage, soil_type,
  water_source, latitude, longitude, ...` — **no `name`, `area`, or `current_status` column**.
  A second, later migration,
  `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_farms_crop_plantings_schema.sql:20`,
  also does `CREATE TABLE IF NOT EXISTS farms`, this time *with* `name`, `area`, and
  `current_status` — but since `migrate.js` runs files in `readdirSync().sort()` order
  (`backend/src/database/migrate.js:67-69`), `001_...` runs first, creates the real table, and
  the later `IF NOT EXISTS` on the same name silently no-ops. The columns
  `generateFarmInsights()`'s first query selects (`name`, `area`, `current_status`) **never
  exist on the real table**, so `SELECT id, name, area, soil_type, current_status FROM farms
  WHERE id = $1` throws `column "name" does not exist` on every single call.

- **`crop_plantings` table** (second, independent failure, would matter even if the first were
  fixed): the same `9999_..._farms_crop_plantings_schema.sql` migration declares
  ```sql
  CREATE TABLE IF NOT EXISTS crop_plantings (
    ...
    crop_id UUID NOT NULL REFERENCES crops(id), -- the static catalog (041)
    variety_id INTEGER REFERENCES regional_variety_directory(id), -- fixed to match 9999's INTEGER id
    ...
  ```
  The comment shows the author was already aware of this exact class of bug and fixed it for
  `variety_id` — but missed it for `crop_id`. `crops` has the identical `IF NOT EXISTS`
  collision as `farms`: `001_skeleton_complete_schema.sql:255` declares
  `CREATE TABLE IF NOT EXISTS crops (id SERIAL PRIMARY KEY, code, name, scientific_name,
  category, ...)` (runs first, wins), while `041_rural_life_os_schema.sql:29`'s later
  `CREATE TABLE IF NOT EXISTS crops (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), crop_code,
  common_name, ...)` no-ops. The real `crops.id` is therefore `SERIAL`/`INTEGER`, not `UUID`.
  Declaring `crop_id UUID NOT NULL REFERENCES crops(id)` against an `INTEGER` primary key is a
  type mismatch Postgres rejects outright (`foreign key constraint ... cannot be implemented`),
  so the `CREATE TABLE crop_plantings` statement itself fails during migration — the table
  never gets created at all. `generateFarmInsights()`'s second query (`FROM crop_plantings cp
  JOIN crops c ...`) would then fail with `relation "crop_plantings" does not exist` even on a
  farm whose `farms` row *did* have the right columns.

**Net effect:** this brand-new, real, well-intentioned AI-insights endpoint cannot return real
insights for any farm, ever, against the current migration set — and because both failure modes
are caught by the same broad `catch` and mapped to `found: false`, callers get a *misleading*
"no farm record found" instead of a diagnosable 500, which will make this much harder to notice
in testing/QA than an outright crash.

**Remediation:** Fix the two collisions at the source rather than in this new caller: (a) add
an idempotent repair migration (`ALTER TABLE farms ADD COLUMN IF NOT EXISTS name ...`, `... area
...`, `... current_status ...`), following the exact precedent this repo already uses for the
`roles` and `tender_bids` collisions; (b) resolve the `crops` collision explicitly — either
change `crop_plantings.crop_id` to `INTEGER REFERENCES crops(id)` to match the table that
actually wins, or (if a UUID-keyed crop catalog is actually wanted) rename/consolidate the two
`crops` definitions so only one wins and it matches what `crop_plantings` expects. Also
consider not swallowing schema errors (`column does not exist` / `relation does not exist`)
into the same "not found" branch as a genuinely absent row — logging them as `logger.error`
and returning a distinguishable `source: 'error'` would have caught this immediately instead of
looking like normal behavior.

### 2. [HIGH] Newly-wired `PremiumMarketplacePage.jsx` now calls a real endpoint whose filter defaults silently exclude every GI-tagged and organic product — undermining the page's whole premise

**Location:** `frontend/src/pages/PremiumMarketplacePage.jsx:467-499` (today's diff, now calls
`GET /api/v1/ecommerce/listings`) → `backend/src/controllers/ecommerceController.js:52-64`
(`getListings`) → `backend/src/services/ecommerceService.js:184-195` (`getMarketplaceListings`).

The controller always coerces these two filters to a boolean, never `undefined`:
```js
gi_tagged: req.query.gi_tagged === 'true',
organic: req.query.organic === 'true',
```
When the frontend doesn't send `gi_tagged`/`organic` at all (the default "browse everything"
view, and also `PremiumMarketplacePage`'s default tab before a user picks "organic" or "gi" from
`filters.category`), these become `false`, not `undefined`. The service then does:
```js
if (gi_tagged !== undefined) { query += ` AND pl.gi_tagged = $${paramCount}`; params.push(gi_tagged); }
if (organic !== undefined)  { query += ` AND pl.organic = $${paramCount}`;  params.push(organic); }
```
Since `gi_tagged`/`organic` are *always* boolean (never `undefined`) coming out of the
controller, both conditions are always true, so **every** call to this endpoint — the general
marketplace listing page and the newly-wired Premium page alike — silently adds
`AND pl.gi_tagged = false AND pl.organic = false` unless the caller explicitly opts in with
`?gi_tagged=true`/`?organic=true`. `PremiumMarketplacePage`'s default landing view (no category
selected) will therefore always return zero GI-tagged and zero organic products from the real
API — exactly the products a "premium marketplace" should be leading with — silently falling
back to the 6 hardcoded `mockProducts` only when the real call returns nothing, which will look
like a config/data issue rather than the actual cause (a filter bug in a shared, otherwise-real
endpoint).

**Remediation:** In `ecommerceController.js`, only set `gi_tagged`/`organic` on the filters
object when the query param is actually present (`req.query.gi_tagged !== undefined ? req.query.gi_tagged === 'true' : undefined`),
so "not requested" round-trips as `undefined` through to the service's existing (correct)
`!== undefined` check instead of colliding with the "explicitly want non-GI/non-organic" case.
This is a pre-existing bug in files not touched today, but it's now directly exposed by, and
undermines the purpose of, today's `PremiumMarketplacePage.jsx` change.

### 3. [MEDIUM] SSRF allowlist for the `api_call` agent tool only applies in production

**Location:** `backend/src/services/aiAgentService.js:150-171` (today's diff).

```js
const target = new URL(params.url);
const allowedHosts = (process.env.AI_AGENT_ALLOWED_API_HOSTS || '')
  .split(',').map(host => host.trim()).filter(Boolean);
if (!['http:', 'https:'].includes(target.protocol)
  || (process.env.NODE_ENV === 'production' && !allowedHosts.includes(target.hostname))) {
  throw new Error('API destination is not allowlisted');
}
```
This is a real improvement over the prior code (which had no destination check at all), but the
hostname allowlist is only enforced when `NODE_ENV === 'production'`. In any non-production
environment (dev, staging, a locally-run instance, CI) the AI agent's `api_call` tool can still
be pointed at an arbitrary URL, including internal/loopback addresses
(`http://localhost:6379`, `http://169.254.169.254/...` for cloud metadata endpoints, etc.) —
this is exactly the class of SSRF the allowlist is meant to close, just left open outside prod.

**Remediation:** Enforce the allowlist unconditionally (falling back to a small, explicit local
default such as `localhost`-only for dev if genuinely needed), or at minimum block link-local/
loopback/private-range hosts regardless of `NODE_ENV`, so staging/dev environments aren't a
softer target for the same class of bug this change was written to close.

### 4. [LOW] `evaluateArithmetic()` rejects any expression starting with a unary minus

**Location:** `backend/src/services/aiAgentService.js:13-57` (today's diff, replacing `eval()`
in the `calculate` tool).

The shunting-yard implementation has no concept of a unary operator — every `-`/`+` token found
by the tokenizer is treated as binary. For an expression like `"-5+3"`: tokens are
`['-', '5', '+', '3']`. Processing `'-'` first pushes it onto `operators` with the `values`
stack still empty; when `'+'` is later reached (same precedence), `apply()` pops the pending
`'-'` but only finds one value in the `values` stack (`5`), so `left` is `undefined` and the
function throws `'Invalid arithmetic expression'` — a valid, useful expression is rejected. The
same happens for a unary minus right after an opening paren, e.g. `"(-5+3)"`.

**Remediation:** Handle unary `+`/`-` explicitly in the tokenizer/parser (e.g. treat a `-`/`+`
as unary when it's the first token or immediately follows another operator or `(`, by inserting
an implicit `0` before it, or by tagging it as a distinct unary-minus operator with higher
precedence). Low severity since the tool is only reachable through the AI agent's own tool-call
mechanism and the failure mode is a clean error rather than a wrong answer, but it's a real
functional gap introduced while fixing the `eval()` security issue.

## Metrics

- Files in the current uncommitted diff (`backend/src`, `frontend/src` scope): 17 modified/
  deleted (`git diff --stat`), plus 8 new untracked backend files.
- Full diffs read: `backend/src/index.js`, `backend/src/routes/{aiAgentRoutes,
  coldStorageRoutes,healthRoutes}.js`, `backend/src/routes/commerce/sellerRankingRoutes.js`
  (deletion), `backend/src/services/{aiAgentService,aiFeedbackService}.js`,
  `backend/src/services/commerce/productReviewService.js`,
  `backend/src/services/legacy/{aiAgenticCompanionService,aiBackboneService,coldStorageService,
  conversationalAIService,productReviewService}.js`, `backend/src/services/productReviewService.js`,
  `frontend/src/pages/{AuditReportPage,ColdStorageDashboardPage,PremiumMarketplacePage}.jsx`.
- `node -c` run on every modified backend `.js` file (14 files): all clean.
- Cross-checked against migrations: `3104_cold_storage_schema.sql`,
  `9998_cold_storage_temperature_compliance.sql` (cold storage additions — all columns match,
  no bug found), `001_skeleton_complete_schema.sql`, `041_rural_life_os_schema.sql`,
  `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_farms_crop_plantings_schema.sql` (finding #1).
- Cross-checked frontend↔backend contract for: `coldStorageAPI.*` (7 methods) against
  `coldStorageRoutes.js`/`coldStorageService.js` — all match, no bug found;
  `auditComplianceAPI.generateComplianceReport`/`detectAuditAnomalies` against
  `modules/M008/{routes,controller,service}.js` — response shape matches exactly, no bug found;
  `PremiumMarketplacePage.jsx` against `ecommerceController.js`/`ecommerceService.js` — bug
  found (finding #2).
- Verified deletion of `backend/src/routes/commerce/sellerRankingRoutes.js` is safe: it was a
  dead duplicate of the still-mounted `backend/src/routes/sellerRankingRoutes.js`
  (`app.use('/api/v1/seller-ranking', ...)` in `index.js:998`); nothing else required the
  deleted path.
- Verified the two collapsed `productReviewService.js` files (root and `commerce/`) now
  correctly re-export `services/legacy/productReviewService.js`, and that every method name
  their callers (`routes/marketplaceEnhancements.js`, `routes/commerce/marketplaceEnhancements.js`)
  invoke actually exists on the canonical implementation — no bug found.
- Findings: 4 total — 1 Critical, 1 High, 1 Medium, 1 Low.
