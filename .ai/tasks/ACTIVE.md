# 📋 ACTIVE TASKS — REAL-TIME TRACKING
## All Work in Progress (Updated Continuously)

**Last Updated:** 2026-09-11 14:30 UTC  
**Total Active:** 15 tasks  
**Blocked:** 1 task  

---

## PRIORITY 1: FOUNDATION (Today - Day 1)

### ✅ Task 1: Complete Honest Project Audit
- **Status:** COMPLETED
- **Evidence:** HONEST_PROJECT_AUDIT.md created
- **Next:** Devin reviews findings

### ✅ Task 2: Create Unified Repo Structure
- **Status:** COMPLETED
- **Evidence:** COMPLETE_REPO_STRUCTURE.md created
- **Next:** Create folder structure locally

### ✅ Task 3: Set Up Master Coordination Protocol
- **Status:** COMPLETED
- **Evidence:** MASTER_PROTOCOL.md created
- **Next:** All agents follow protocol

### 🔄 Task 4: Create Coordination Files (.ai/)
- **Status:** IN PROGRESS (75%)
- **Files:** SYNC_LOG.md, CHECKPOINT.md, DECISION_LOG.md
- **Deadline:** 2026-09-11 EOD

---

## PRIORITY 2: EXECUTION (Days 2-3)

### ⏳ Task 5: Audit Backend Modules (541 total)
- **Assigned:** Devin
- **Deadline:** 2026-09-12
- **What:** Verify each module status (SKELETON/PARTIAL/COMPLETE)

### ⏳ Task 6: Audit Frontend Pages (790 total)
- **Assigned:** Visual Studio
- **Deadline:** 2026-09-12
- **What:** Categorize pages by completeness

### ⏳ Task 7: Set Up PostgreSQL + Run Migrations
- **Assigned:** Devin
- **Deadline:** 2026-09-12
- **Status:** 🚨 BLOCKED (PostgreSQL not running)
- **Blocker:** User needs to run Docker or install PostgreSQL locally

### ⏳ Task 8: Get Backend Running (npm start)
- **Assigned:** Devin
- **Deadline:** 2026-09-12
- **Depends on:** Task 7

### ⏳ Task 9: Get Frontend Running (npm run dev)
- **Assigned:** Visual Studio
- **Deadline:** 2026-09-12
- **Status:** Ready when Node installed

---

## PRIORITY 3: VERIFICATION (Days 4-5)

### ⏳ Task 10: Test 20 Random Backend Endpoints
- **Assigned:** Devin
- **Deadline:** 2026-09-13

### ⏳ Task 11: Test 20 Random Frontend Pages
- **Assigned:** Visual Studio
- **Deadline:** 2026-09-13

### ⏳ Task 12: Write Tests for M001-M050
- **Assigned:** Devin
- **Deadline:** 2026-09-13

---

## 🚨 CRITICAL BLOCKER

**PostgreSQL Not Running**
- **Impact:** Cannot run migrations, test database operations
- **Solution:** 
  - Option 1: `docker-compose up` (easiest)
  - Option 2: Install PostgreSQL locally
- **Timeline:** MUST RESOLVE TODAY
- **Who:** User + Devin

---

## 2026-09-08 — Module-schema gap closure, batch 1 (58-broken-module cleanup)

**Task:** AUDIT_DB.md (refresh pass) Finding 4 said 58 of 150 `M0XX` modules
have real, reachable `pg.query()`/`pool.query()` calls against tables that
don't exist anywhere in `migrations/`. This session worked through that
list module by module (read each `service.js`'s actual column lists,
cross-referenced against every migration file for both table existence
*and* column-level/type-level collisions - not just "does a table with
this name exist somewhere").

### Correction to the audit's "58" count

A systematic re-check of all schema-less modules with real queries found
**61** candidates (audit said "≥58, sampled"), which break down as:

- **21 already fully fixed, no new migration needed.** These are the
  generic "40-line CRUD template" modules (`tableName = '<prefix>_m0XX_items'`,
  columns `id`/`data`/`created_at`/`updated_at` only): M040, M047, M048,
  M050, M090, M091, M093, M094, M098, M099, M100, M106, M111, M114, M115,
  M117, M120, M137, M139, M148, M149. **`backend/src/database/migrations/3000_M0XX_generated.sql`
  already exists for every one of these (in fact for all 150 modules) and
  creates exactly that generic shape.** Verified column-for-column against
  each service.js. The audit's static grep missed these because it checked
  for a *named* schema file per module, not the separately-numbered
  `3000_` generated migrations.
- **19 more already fine for the same reason but with real, non-generic
  table names** (not the `_items` template, but still already covered by
  an existing dedicated migration with matching columns, verified by
  direct read of both sides): M026, M027, M028, M029, M030, M033, M036,
  M043, M046, M069, M072, M092, M110, M118, M119, M132, M141. No action
  needed.
- **11 genuinely broken, fixed this session** (real column lists with no
  matching CREATE TABLE anywhere, or colliding with an earlier,
  incompatible same-named table): **M006, M008, M009, M014, M021, M044,
  M045, M071, M073, M074, M075, M144.**
- **0 remaining unaddressed** from the original 61-candidate list — every
  one was individually verified this session (either already fine, or
  fixed below). The audit's other ~42 "inert stub" modules (queries=0)
  were spot-checked (not exhaustively) and left untouched per the task
  brief.

### New migration file

`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql`
(40 z's — longer than any prior `9999_zzz...` file, so it sorts and runs
last; this matters because several of its `ALTER TABLE`s target tables
only created by other `9999_zzz...` migrations). Contents, by module:

- **M006 (System Administration) + M008 (Audit & Compliance):**
  `audit_logs` ALTER — added `entity`, `details`, `block_hash`,
  `previous_hash` (M008 also needs blockchain-style hash chaining). Real
  winning `audit_logs` definition is `000_base_schema.sql` (collides with
  4 other files: `001_skeleton_complete_schema.sql`,
  `014_audit_system.sql`, `014_platform_foundation_modules.sql`,
  `1002_system_administration.sql` — all lose). `created_at`/`status`
  turned out to already exist on the real table via
  `014_audit_system.sql`'s own earlier ALTER (not added again except as a
  harmless idempotent no-op).
  New table: `compliance_rules` (M008).
- **M009 (Security & Access Control):** `security_events` ALTER — added
  `severity`, `user_agent`, `blocked` (no collision, single definition in
  `9999_zzzzzzzzzzzzzzz_m012_session_security_schema.sql`, safe to ALTER
  directly). New tables: `access_policies`, `ip_lists` (unique on
  `list_type, ip_address` to match the module's `ON CONFLICT`),
  `rate_limits`.
- **M014 (Single Sign-On):** `sso_providers` ALTER — added
  `client_secret`, `auth_url`, `token_url`, `user_info_url`,
  `saml_config`, `scopes`, `is_active` (no collision, single definition in
  `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_identity_management_schema.sql`).
  New tables: `oauth_states`, `sso_events`, `user_sso_mappings` (unique on
  `user_id, provider`).
- **M021 (Farmer Registration):** `farmers` ALTER — added `name`, `email`,
  `phone`, `date_of_birth`, `gender`, `address`, `land_size`,
  `primary_crop`, `skills`, `education`, `farming_experience`, `verified`.
  See "critical pipeline-halt bugs" below — this was the big one.
- **M044 (Crop Variety) + M045 (Seed Planning):** `crop_varieties` ALTER —
  added `crop_name`, `variety_name`, `characteristics`, `seed_source`,
  `maturity_days`, `yield_potential`, `disease_resistance`,
  `drought_tolerance`, `notes`, `status`, `updated_at`. New tables:
  `variety_performance` (M044), `seed_suppliers`, `seed_plans` (M045 —
  distinct from the pre-existing, differently-named `seed_planning_plans`
  table used by `cropManagementService.js`, no collision).
- **M071/M073/M074/M075 (Dairy/Goat/Sheep/Pig management):** four new,
  structurally near-identical herd tables (`dairy_herds`, `goat_herds`,
  `sheep_flocks`, `pig_herds`, all `farm_id UUID REFERENCES farms(id)`)
  plus `milk_quality` (M071 only).
- **M144 (Greenhouse Management):** `greenhouses` ALTER — added `status`,
  `automation_config` (no collision with its winning definition in
  `014_horticulture_module.sql`; a later duplicate in
  `3017_phase4_greenhouse.sql` only re-declares `farmer_id`, which already
  matches, so it's a harmless no-op, not a bug). New tables:
  `greenhouse_sensors`, `greenhouse_sensor_readings`,
  `greenhouse_automation_rules`.

All new tables/columns were reverse-engineered directly from each
service.js's actual `INSERT`/`SELECT`/`UPDATE` column lists — nothing
speculative. Every FK's target PK type was checked directly (`farmers.id`
UUID, `farms.id` UUID, `crop_varieties.id` SERIAL/INTEGER,
`crop_registrations.id` UUID, `greenhouses.id` SERIAL/INTEGER, `users.id`
UUID) before typing the FK column to match.

### Two critical, pre-existing pipeline-halting bugs found and fixed (NOT part of the 58/61 count — these would have blocked the ENTIRE migration run, including all 44 already-folded 9500-9543 migrations, long before reaching any M0XX fix)

Both are the same failure class: a losing side of a table-name collision
(`CREATE TABLE IF NOT EXISTS X` that's a silent no-op because an earlier
file already created `X` with different columns) followed by
`CREATE INDEX ... ON X(<column that only exists in the losing definition>)`.
`migrate.js` has no defense against this — on any migration failure it
archives the file, writes a repair template, and **throws**, which stops
every subsequent file in the sorted run from ever executing (see
`migrate.js` lines ~130-141). Static analysis only (no Postgres running in
this environment) — found by tracing exactly which `CREATE TABLE` wins
each collision and checking every index against *that* table's real
columns, not the file's own (losing) `CREATE TABLE` block.

1. **`backend/src/database/migrations/3021_m021_farmer_registration.sql`**
   — `CREATE INDEX idx_farmers_email ON farmers(email)` and
   `idx_farmers_primary_crop ON farmers(primary_crop)`, where `farmers`
   actually resolves to `000_base_schema.sql`'s UUID-keyed,
   FDI-scoring-shaped table (no `email`/`primary_crop` columns) because
   `000` sorts before `3021`. This file's own `farmers` CREATE (a
   different, `id SERIAL` shape) is dead on arrival. **Fixed:** removed
   both broken index lines from `3021` (left a dated comment explaining
   why), re-added as `idx_farmers_email_m021` /
   `idx_farmers_primary_crop_m021` in the new batch-1 migration, which
   runs after the ALTER that actually adds those columns. `farmer_verifications`/
   `farmer_onboarding` (the other two tables `3021` defines) were NOT
   affected — nothing else declares those names, so they're real, and
   both already correctly FK to `farmers(id)` as UUID.
2. **`backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzz_crop_management_schema.sql`**
   — `CREATE INDEX idx_crop_varieties_crop ON crop_varieties(crop_name)`,
   where `crop_varieties` actually resolves to
   `001_skeleton_complete_schema.sql`'s `id SERIAL` / `code`/`name`/
   `description` shape (no `crop_name`) because `001` sorts before this
   file. **Fixed:** removed the broken index line (dated comment left in
   place), re-added as `idx_crop_varieties_crop_name` in the new batch-1
   migration.

**These two fixes were necessary for the batch-1 migration (or anything
after it) to ever have a chance of running on a real database** — without
them, `migrate.js` would halt at `3021` (or, once past that, at the crop
management file) regardless of anything else in this session's work.
Given the number of `9999_zzz...` migrations that already exist in this
tree, it's likely there are more instances of this same failure class
still undiscovered — worth a dedicated pass (grep every collided table's
losing-side `CREATE INDEX` statements against the actual winning column
list) rather than assuming these were the only two.

### Verification method (per task brief — static only, no `npm run migrate` run)

For every table touched: (a) grepped **all** migration files for
`CREATE TABLE IF NOT EXISTS <name>`, not just the obvious ones, to find
every collision; (b) for a collision, determined the winner by filename
sort order (matching `migrate.js`'s `fs.readdirSync(...).sort()`); (c)
read the winning table's actual column list; (d) diffed that against the
consuming service.js's real `INSERT`/`SELECT`/`UPDATE`/`ON CONFLICT`
column references; (e) for every FK added, grepped the referenced table's
own `CREATE TABLE` to confirm the PK type (UUID vs SERIAL/INTEGER) before
typing the FK column. Parenthesis-balance and CREATE/ALTER statement
counts were also mechanically checked on the new file (204/204 parens,
23 CREATE TABLE, 28 ALTER TABLE).

### Not done / follow-up for a future session

- The ~42 "inert stub" modules (zero real queries) were spot-checked, not
  exhaustively re-verified one by one — per the task brief these are
  intentionally out of scope, but a future pass should confirm the exact
  count/list if that number matters for planning.
- **Recommended follow-up scan**: search every other `9999_zzz...`
  migration (and any other file past `014_audit_system.sql`'s already-hardened
  pattern) for the same "index on a column that only exists in a losing
  collision side" bug class found twice above. Two instances were found
  by manually tracing this session's own 11 touched tables; there was no
  time in this pass to check the other ~100+ tables the full migration
  tree declares.
- This migration has **not been run against a real Postgres instance**
  (none available in this dev environment) — per the task brief, this is
  static SQL authoring + verification only. Must be run in CI or a real
  DB before trusting it fully.

**Files touched:** `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql`
(new), `backend/src/database/migrations/3021_m021_farmer_registration.sql`
(2 broken index lines removed, comment added), `backend/src/database/migrations/9999_zzzzzzzzzzzzzzzzzzzzzzzzz_crop_management_schema.sql`
(1 broken index line removed, comment added). No other migration file,
`migrate.js`, or module `service.js` was modified.

---

## services/ vs services/legacy/ duplicate remediation (2026-09-08)

Continuation of the pattern started by `services/productReviewService.js`
(see AUDIT_CODE.md Finding 1: ~163 same-basename pairs across
`backend/src/services/*.js` and `backend/src/services/legacy/*.js`, plus a
handful of third `services/<domain>/` copies).

### Method
Built a small reachability analyzer (not committed - scratch tooling,
deleted after use) that: (1) parses `backend/src/index.js` for every
`app.use(...)` and `mountRoute(...)` call, resolving both inline
`require()`s and every var/destructured-require assignment (handles the
`const { a, b } = require(...)` batches used for the farm/water/soil/etc.
route groups); (2) BFS-walks the local `require()` graph from those mounted
files; (3) for each of the 163 basenames, checks whether
`services/<name>.js`, `services/legacy/<name>.js`, and any
`services/<domain>/<name>.js` fall inside that reachable set. Cross-checked
every result against direct `grep -rn "require(...<name>...)"` before
acting - the analyzer's job was to separate "a route file requires this" (audit's
apparent bar) from "and that route file is actually mounted" (the real bar).

### Key correction to AUDIT_CODE.md Finding 1
The audit named `aiGatewayService.js`, `analyticsService.js`, and
`aiBackboneService.js` as "confirmed live-and-drifted" (both copies alive
at once). Direct verification found this was **not accurate for two of the
three**, and partially accurate for the third in a different way than
described:
- **aiBackboneService.js**: top-level (797 lines) has **zero** live callers
  anywhere in the repo (not even tests) - it's a stale, strictly-smaller
  earlier version of `legacy/aiBackboneService.js` (7,051 lines, confirmed
  superset: same function names/signatures plus Ollama support and much
  more). Collapsed top → legacy.
- **analyticsService.js**: top-level and legacy are byte-identical modulo
  require-path depth. Top-level has zero live callers. Collapsed top →
  legacy. Bonus finding: a **third**, genuinely different copy at
  `services/platform/analyticsService.js` (express-router-shaped, exports
  `buildPipelineInsights`) is what `tests/analyticsService.test.js` actually
  needs but the test requires `../services/analyticsService` instead - a
  pre-existing test/path mismatch, left unfixed (out of this task's scope,
  flagged here for whoever owns test health next).
- **aiGatewayService.js**: this is the one pair that genuinely fits the
  audit's "two live, drifted implementations of the same concept" framing
  in spirit, except **neither copy is actually reachable from a mounted
  route** (verified - no route file requires either path). More
  importantly, they are not drifted copies of the same concept at all: the
  top-level file is a small, separately-tested "governed AI gateway"
  (`run`/`buildGovernedPrompt`/`loadLibraryContext`, layers library-context
  guardrails on top of `legacy/aiBackboneService.js`, exercised by
  `tests/aiGatewayService.test.js` and `tests/aiDomainAdapterService.test.js`)
  while `legacy/aiGatewayService.js` is an unrelated 421-line class-based
  AI/ML prediction hub. **Left unmerged** per the "genuinely different
  features, don't force a merge" rule - added a collision-explaining
  comment to both files instead.
- Same false-positive pattern found independently for **`farmerService.js`**
  (audit implied `routes/farmerRoutes.js` (legacy) and
  `routes/agriculture/farmerRoutes.js` (agriculture/ domain copy) were both
  live) - `routes/agriculture/farmerRoutes.js` is never required by
  `index.js` at all, so only the legacy copy is actually live. Not
  collapsed (see "Not yet collapsed" below - the domain copy is
  meaningfully drifted, ~180 diff lines, needs a real read before touching).

**Takeaway for future passes**: audit tooling that greps "route file X
requires service Y" without confirming X is `app.use()`d in `index.js`
will systematically over-report "live" pairs. Every one of this session's
BFS-confirmed-dead classifications was cross-checked with a direct
`grep -rn require` before any file was touched.

### Files collapsed to `module.exports = require('./legacy/<name>')` (dead top-level copy → confirmed-live legacy copy)
152 files via a scripted pass (all zero-live-caller, verified via the
reachability BFS) plus 6 handled individually with pair-specific comments
because they needed a closer read first:
`aiBackboneService.js`, `analyticsService.js`, `productService.js`,
`formService.js`, `completeERPIntegrationService.js`,
`comprehensiveERPService.js`, `ecommerceBusinessSalesService.js`,
`ecommerceIntegrationService.js`.
(`productReviewService.js` was already done in a prior session - left
untouched.) Full list of the 152 scripted ones is reconstructable via
`git diff --stat -- backend/src/services` (excludes `services/legacy/**`
and the domain folders) since every collapsed file is now a ~20-line
wrapper with a dated explanatory comment. `node -c` passed on all touched
files; spot-required 6 of the collapsed files directly in a live Node
process (`riskPricingService.js`, `insurancePolicyIssuanceService.js`,
`marketAccessService.js`, `animalHealthService.js`, +2) - all loaded
cleanly (the only runtime noise was the pre-existing, expected
"PostgreSQL connection failed → fallback mode" warning, since no DB is
running in this dev environment - not caused by this change).

### Reversed-direction case
- **`services/legacy/libraryKnowledgeService.js`**: here the *legacy* copy
  was the dead one. Top-level `services/libraryKnowledgeService.js` is a
  live 23-line compatibility wrapper delegating to
  `modules/M645100_LIBRARYKNOWLEDGE/backend/service.js`'s singleton,
  required by `routes/libraryRoutes.js` (mounted at `/api/v1/library`).
  The legacy copy (346-line fs/crypto/Postgres content-hashing catalog) was
  only required by `routes/claude/libraryRoutes.js`, which `index.js` never
  mounts. Collapsed legacy → top.

### Left unmerged, documented instead (genuinely different features sharing a basename)
- `services/aiGatewayService.js` / `services/legacy/aiGatewayService.js` -
  see above. Comment added to both files.

### Not yet reconciled — flagged for a future session
- `services/agriculture/farmerService.js` vs `services/legacy/farmerService.js`
  - ~180 diff lines, meaningfully drifted, dead (unmounted route), not
    read closely enough this pass to safely collapse either direction.
- `services/commerce/productService.js` vs `services/legacy/productService.js`
  - ~194 diff lines, same situation as above.
- `services/platform/analyticsService.js` vs `services/platform/formService.js`
  - Both are express-router-shaped and structurally unlike their
    same-named top-level/legacy siblings (different exports, different
    dependencies) - likely genuinely different features per-file, not
    verified in depth. Currently dead (no live caller other than another
    dead file, `services/agriculture/agriculturalIntelligenceService.js`).
    Left untouched; do not collapse without reading both fully first.
- `backend/src/services/index.js` and `frontend/src/services/index.js`
  (the dead barrel files) - re-confirmed zero callers this pass, matching
  the audit. Not deleted (out of this task's explicit scope: "collapse
  duplicates," not "delete the barrel" - the audit recommends deletion,
  but that's a separate, smaller follow-up someone should explicitly
  decide on).
- The remaining ~89 `services/<domain>/*.js` third copies noted in the
  audit's basename overlap with `services/legacy/` were **not**
  individually triaged this pass (only the handful that intersected the
  163 top-vs-legacy basenames above were touched). A future pass should
  run the same reachability BFS against the full domain-folder set.

**Files touched this pass:** 158 files under `backend/src/services/` (152
scripted collapses + 6 hand-written), all `.js`, all now either a thin
re-export wrapper or (for the 2 `aiGatewayService.js` files) an unchanged
implementation with an added header comment. No route, controller, or
`index.js` changes were needed - every route continues requiring whatever
path it already required; only the top-level file's own contents changed.

## Token-saving guidelines extracted + wired into the real OpenAI call path (2026-09-20) — DONE

User asked to "extract token saving guidelines and integrate with openai."
The guidelines existed only on other, unmerged remote branches
(`origin/codex/chatgpt-tree-consolidation`, `origin/version/deep`) as
`.ai/workflows/*.md` methodology docs — never on this branch, and never
actually wired to a live provider call anywhere in the repo (the OpenAI
plugin doc described a batch manager + token counter to build; neither
file existed).

**Extracted** 4 of the guideline docs from `origin/codex/chatgpt-tree-consolidation`
into `.ai/workflows/` on this branch: `TOKEN_OPTIMIZATION_METHODOLOGY.md`,
`UNIVERSAL_TOKEN_OPTIMIZATION.md`, `PLUGIN_TOKEN_OPTIMIZATION.md`,
`OPENAI_PLUGIN_INTEGRATION.md`. Skipped `COMPLETE_TOKEN_OPTIMIZATION_SYSTEM.md`
/ `COMPREHENSIVE_TOKEN_OPTIMIZATION_FINAL.md` — read both, confirmed they're
summary wrappers over the four above, not independent content.

**Integrated** the guidance for real (not just documentation) into the
existing OpenAI call path:
- New `backend/src/core/ai/tokenOptimizer.js` — applies the methodology's
  context-compression (truncate an oversized prompt to a fixed token
  budget, keeping head+tail), max-token capping (never let a caller
  request more completion tokens than the provider's configured ceiling),
  and a pre-call budget guard against the existing `aiCostController`
  hourly/daily spend limits (warns by default; set
  `AI_TOKEN_BUDGET_ENFORCE=true` to hard-block instead).
- `backend/src/services/legacy/aiBackboneService.js`'s `callOpenAI()` now
  runs every request through `tokenOptimizer.optimizeRequest()` before
  sending it, and records actual billed usage back into
  `aiCostController.recordCost()` on success (it never had cost tracking
  wired in before — only per-provider request counts).
- Deliberately scoped to `callOpenAI` only (matches "integrate with
  openai"); the other providers (Claude, Gemini, Azure, HuggingFace,
  Ollama) are untouched.

**Config:** `AI_PROMPT_TOKEN_BUDGET` (default 6000 estimated tokens) caps
prompt size; `AI_TOKEN_BUDGET_ENFORCE` (default off) switches the cost
guard from warn-only to hard block.

**Verified:** `backend/src/tests/tokenOptimizer.test.js` (new, 7 cases) +
existing `backend/src/tests/aiBackboneFailureRetry.test.js` (2 cases, both
still pass unmodified) + an ad-hoc integration smoke test confirming the
actual HTTP request body sent to OpenAI has the truncated prompt, the
capped `max_tokens`, no stray fields, and that `aiCostController`'s token
counter increments by the response's real `usage.total_tokens` after a
successful call. `eslint` clean on all 3 touched/added files.

**Not done (out of scope for this pass):** the OpenAI Batch API manager
and exact tiktoken-based counting the doc also describes — those need a
real `OPENAI_API_KEY` and the `openai`/`js-tiktoken` packages to exercise
and verify live, which this session doesn't have. The estimator here is
character-based (~4 chars/token), documented as an approximation in the
module's own comments; real billed tokens still come from the provider's
response, not the estimate.

## T01 — repair all 3 failing frontend test suites (2026-09-20) — DONE

Following `origin/codex/chatgpt-tree-consolidation`'s `.ai/migration/CRITICAL_PATH_TODO.md`
Wave 1 item T01. Frontend suite was 49/52 tests across 13/16 suites at
session start; all 16/16 suites (55/55 tests) now pass.

1. **`MarketplacePage.test.jsx`** — `MarketplacePage.jsx` was a 2-line
   placeholder stub. Replaced with a real listing page wired to the
   existing `productsAPI.getProducts`/`ordersAPI.addToCart`, with search,
   pagination, and loading/error/empty states.
2. **`TrainingTraceabilityPages.test.jsx`** — the two pages under test were
   already real and correct, but crashed on render because `ui/card.jsx`
   and `ui/button.jsx` only had default exports while every consumer
   (these 2 pages, ~500 other call sites per PR #21's audit) imports them
   as named exports. Added real named exports (`Card`/`CardHeader`/
   `CardTitle`/`CardDescription`/`CardContent`/`CardFooter`, `Button`)
   alongside the existing defaults — additive only. Also fixed `Button`
   silently dropping every prop except `children` (no `onClick`,
   `disabled`, `type` ever reached the DOM node) and mapped the
   `variant`/`size` props already used across the app to real classes.
3. **`criticalModules.test.jsx`** (M084 "Disaster Alerts") — a module-
   numbering collision: `frontend/src/modules/M084/M084Page.jsx` was an
   unfilled code-generator template (`${className}` never substituted,
   imported a nonexistent `@/store`); `backend/src/modules/M084/` is a
   same-numbered but unrelated "Trend Analysis" scaffold. The real
   disaster-alerts implementation already existed — migration 057's
   `climate_alerts` table, `weatherService.js`'s `raiseAlert`/
   `activeDispatchBlocks`/`dispatchCheck` — but its route file
   (`routes/agriculture/weatherRoutes.js`) crashed at require time on a
   bad, unused import path, so `index.js` mounted a "Route operational"
   scaffold at `/api/weather` instead (the same scaffold-swap pattern PR
   #21 found repeatedly for order/product/iotIntegration). Fixed the
   import, added `weatherService.listAlerts()` (raiseAlert existed but
   nothing could list what it wrote) + `GET /alerts`, swapped `index.js`
   to mount the real route file at the same path, and rewrote
   `M084Page.jsx` against the real `GET`/`POST /weather/alerts` endpoints.

**Left alone, confirmed pre-existing and out of scope:** `backend/src/tests/m084Routes.test.js`
(a different test, for the unrelated `modules/M084/` scaffold — fails
independently on a nonexistent `middleware/validationMiddleware` import,
untouched by any of the above).

Commits: `ebc873f7` (suites 1–2), `d433d143` (suite 3).

---

*This document must be updated after every task completion or status change.*
