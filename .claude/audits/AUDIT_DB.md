---
agent: db-auditor
status: fail
findings: 14
---

# Database Audit — AFRERA Platform

## Summary

Scope: `backend/src/database/**` (265 migrations + 30 loose `.sql` files + a 4-model `models/` folder), `backend/src/core/withTransaction.js` / `outcomeResolver.js`, `backend/src/database/{pool,connection,migrate}.js`, and a targeted sweep of `backend/src/services/*.js` (107 files) for query-in-loop and raw-SQL patterns.

The production data path is real: `database/connection.js` opens one shared `pg.Pool` (max 20) against a real PostgreSQL instance, and CI (`.github/workflows/ci.yml`) spins up an actual `postgres:15-alpine` service, parses every migration with the real PostgreSQL grammar (`pglast`), applies all 265 migrations with `npm run migrate`, and asserts table/index/FK counts (`>=500` tables, `>=2000` indexes, `>=500` FKs) plus spot-checks specific tables. That is a genuinely strong schema-verification gate and should be credited.

However, three things undercut "launch level" confidence in this layer:

1. **The unit test suite never exercises real SQL.** `jest.config.js` maps the `pg` module itself to a 30-line dumb mock (`src/test-mocks/pg.js`, returns empty rows for almost everything) *and* `NODE_ENV=test` simultaneously activates `database/pool.js`'s own ~2,200-line hand-rolled, per-table, regex-matched in-memory mock (`Map`-backed stores, one `if (text.includes('insert into X'))` branch per query shape). These are two independent, mutually inconsistent fakes standing in for the database depending on which import path a piece of code takes — neither validates that a service's actual SQL text is well-formed or matches real columns. `pool.js`'s own header comments document a real historical instance of this drifting silently (the `laboratories` handler faking columns that didn't match what the service actually inserted). CI's real-Postgres step only counts tables/indexes/FKs and spot-checks ~19 table names — it does not execute each service's individual queries, so a broken `SELECT`/`INSERT` in, e.g., one of the 107 service files could pass CI green end-to-end while never having run against real Postgres.
2. **Two independent schema-provisioning paths that can drift.** `docker-compose.yml` mounts only `src/database/schema.sql` (49 `CREATE TABLE`) as the Postgres init script, while the real schema lives in `src/database/migrations/*.sql` (265 files, 1,104 `CREATE TABLE`). A developer who runs `docker-compose up` alone gets roughly 4% of the schema; nothing in the compose file or `Dockerfile` runs `npm run migrate` afterward. Separately, ~29 topic-named `*_schema.sql` files sit loose in `src/database/` (`ai_copilot_schema.sql`, `blockchain_traceability_schema.sql`, etc.) duplicating content already covered by numbered migrations (`016_ai_copilot_schema.sql`, `019_blockchain_traceability_schema.sql`, ...) but are not read by `migrate.js`, `docker-compose.yml`, or `require()`d anywhere — dead duplicate schema definitions.
3. **Missing indexes on a meaningful fraction of foreign keys**, and a handful of real N+1 write patterns in checkout/sync-critical services.

No SQL-injection vectors were found — see Finding 10 (verified safe) for detail.

Overall status was **warn** as of the original pass below: the schema itself is real, migrated, and CI-verified at the structural level, but coverage of query *correctness* is weaker than the file layout suggests, and there are concrete, fixable index and N+1 gaps.

**Status escalated to `fail` in the 2026-08-30 follow-up pass** (see "Follow-up pass (2026-08-30) — module-layer schema linkage" below, Findings 11-14): dozens of live, auto-mounted `backend/src/modules/M0XX` endpoints query real tables that were never created by anything `database/migrate.js` executes — 46 modules ship a correct, unexecuted `model.sql`, and 35 more have no schema defined anywhere in the repo at all. This is unconditional (fails in CI and prod, not just "untested locally") and is the clearest concrete instance of the cross-stack linkage gap this audit was re-scoped to find.

## Findings

### 1. [High] Foreign-key columns without a covering index in the base schema
- **Location**: `backend/src/database/migrations/000_base_schema.sql`
- **Description**: The base schema declares 58 `*_id ... REFERENCES` foreign-key columns but only 23 `CREATE INDEX` statements exist in the same file. Confirmed unindexed FK columns include `cart.user_id` / `cart.product_id`, `payments.order_id` / `payments.user_id`, `wishlist.user_id` / `wishlist.product_id`, `land_records.farm_location_id`, `crop_plans.farmer_id`, `loans.farmer_id`, `government_scheme_applications.farmer_id` / `.scheme_id`, `contracts.buyer_id` / `.crop_id`, `agri_assets.asset_id` / `.user_id`, `vehicles.assigned_vehicle_id`, `shipments.mode_id`. Any lookup or JOIN on these columns (e.g. "get a user's cart", "get a farmer's loans", "payments for an order") forces a sequential scan as tables grow.
- **Remediation**: Add `CREATE INDEX IF NOT EXISTS idx_<table>_<col> ON <table>(<col>);` for each unindexed FK, as a new additive migration (do not edit `000_base_schema.sql` in place, since it is already marked executed in `schema_migrations` on any running environment).

### 2. [High] `docker-compose.yml` provisions ~4% of the schema; no auto-migrate step
- **Location**: `backend/docker-compose.yml:16` (`./src/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql`), `backend/src/database/schema.sql` (49 tables) vs. `backend/src/database/migrations/*.sql` (265 files, 1,104 `CREATE TABLE` statements)
- **Description**: Postgres's init-script mechanism (`docker-entrypoint-initdb.d`) only runs once, on first container start, and only loads the single `schema.sql` file — the small, base-only snapshot. The 264 additive migrations covering insurance, GI, blockchain traceability, AR/VR, marketplace, logistics, GST, etc. are never applied by `docker-compose up`. The `backend` service has no `command`/entrypoint step or `depends_on` ordering that runs `npm run migrate` after Postgres is healthy, and the migrations are idempotent (`CREATE TABLE IF NOT EXISTS` throughout) so running them manually afterward is safe — but nothing makes that automatic. Anyone bringing the stack up via `docker-compose` alone for local dev or a demo gets a database missing ~95% of its tables and no error indicating why.
- **Remediation**: Either mount the full `migrations/` directory as the init scripts (Postgres runs `*.sql`/`*.sh` files in `docker-entrypoint-initdb.d` in filename order, which — given the duplicate numeric prefixes noted in Finding 7 — needs the ordering verified first), or add a `migrate` step to the `backend` service's startup command / a dedicated one-shot `migrate` service with `depends_on: postgres: condition: service_healthy`.

### 3. [Medium] ~29 orphaned duplicate schema files under `src/database/` not used by anything
- **Location**: `backend/src/database/*.sql` (e.g. `ai_copilot_schema.sql`, `ar_vr_schema.sql`, `biodiversity_schema.sql`, `blockchain_traceability_schema.sql`, `consumer_health_schema.sql`, `conversational_ai_schema.sql`, ... 29 files total, all sitting directly in `src/database/` rather than `src/database/migrations/`)
- **Description**: Each of these duplicates a numbered migration that already exists (`016_ai_copilot_schema.sql`, `017_ar_vr_schema.sql`, `018_biodiversity_schema.sql`, `019_blockchain_traceability_schema.sql`, ...). `migrate.js` only reads `path.join(__dirname, 'migrations')`, so these loose files are never executed by the migration runner; a repo-wide search found no `require()`/`fs.read` reference to any of them either. They are dead weight that duplicates schema-authoring effort and creates ambiguity about which file is the "real" definition for a given domain if the two copies are ever edited independently.
- **Remediation**: Delete the loose duplicates (confirm each has an equivalent already-applied migration first) or, if they predate the numbered migrations and are meant to be historical source material, move them to a clearly-labeled `docs/` or `archive/` location so they stop looking like part of the live schema-loading path.

### 4. [Medium] `src/database/models/` is a dead, unused model layer
- **Location**: `backend/src/database/models/{index.js,Order.js,Product.js,User.js}` (478 lines total)
- **Description**: These four files define an `Order`/`Product`/`User` model abstraction, but nothing in `backend/` requires `database/models` or `database/models/index` anywhere — every service in `src/services/*.js` talks to Postgres directly via `pool.query(...)`. This is an abandoned scaffold that re-encodes column names/types for three tables in a second place; if the real schema changes (as it has 265 times via migrations) this file has no mechanism to stay in sync and will silently drift into being actively wrong documentation.
- **Remediation**: Delete `database/models/` (confirmed unreferenced), or if a model layer is actually wanted going forward, wire at least one service to use it so drift is caught by tests.

### 5. [Medium] N+1 write patterns in checkout and sync paths
- **Location**:
  - `backend/src/services/orderService.js:267-277` — inside the order-creation transaction, `for (const cartItem of cartItems) { await client.query('INSERT INTO order_items ...') }` issues one `INSERT` per cart line instead of a single multi-row `INSERT`.
  - `backend/src/services/valueCommerceService.js:408-424` — `for (const rec of recommendations) { await pool.query('INSERT INTO value_recommendations ... ON CONFLICT ...') }`, one upsert per recommendation, each on its own implicit transaction (not wrapped together, so a mid-loop failure leaves a partial set committed).
  - `backend/src/services/offlineSyncService.js:164-176` — the `completedIds` branch correctly does one bulk `UPDATE sync_queue ... WHERE id = ANY($1)`, but the adjacent `failedIds` branch loops `await pool.query('UPDATE sync_queue SET ... WHERE id = $4', ...)` once per failed item instead of a set-based update (e.g. `UPDATE ... FROM (SELECT * FROM unnest($1::int[], $2::int[], ...)) AS v(id, retry_count, ...) WHERE sync_queue.id = v.id`).
  - `backend/src/services/offlinePaymentService.js:254-267` — fetches up to 10 pending sync items then loops per item calling `syncPaymentTransaction()` plus a per-row `UPDATE`; bounded by `LIMIT 10` so impact is capped, but still one round trip per row instead of a batch.
- **Description**: Each of these turns an O(1) network round trip into O(n). `orderService` and `offlinePaymentService` sit on hot/user-facing paths (checkout, payment sync); `offlineSyncService`'s own file demonstrates the fix is already known (the `completedIds` branch right next to the `failedIds` branch).
- **Remediation**: Batch with multi-row `VALUES` lists (inserts) or `UPDATE ... FROM unnest(...)` (updates with per-row differing values); wrap `valueCommerceService`'s loop in the existing `withTransaction()` helper so a partial failure doesn't leave half the recommendations updated.

### 6. [Low-Medium] Transaction handling duplicated ad hoc instead of using the existing `withTransaction()` helper
- **Location**: `backend/src/core/withTransaction.js` (the helper, used in exactly 1 place) vs. manual `client.query('BEGIN')` / `COMMIT` / `ROLLBACK` / `client.release()` blocks hand-written in `enterpriseControlService.js`, `farmerService.js`, `financialService.js`, `orderService.js`, `recoveredFinanceService.js`, `v42IntelligenceService.js`.
- **Description**: `withTransaction()`'s own doc comment says it exists specifically to fix "44 unbounded multi-statement writes" and to guarantee rollback-on-throw plus always-release-the-client. Spot-checking the 6 manual implementations shows they do currently pair `BEGIN`/`COMMIT`/`ROLLBACK`/`release()` correctly, so this is not presently broken — but it is the exact class of hand-written boilerplate the helper was built to eliminate, and every future edit to one of these 6 blocks risks reintroducing the leaked-connection or missed-rollback bug the helper guards against structurally.
- **Remediation**: Migrate these 6 call sites onto `withTransaction()` opportunistically (not urgent, no active bug).

### 7. [Low] Migration filename numeric-prefix collisions
- **Location**: `backend/src/database/migrations/` — `013_farmer_health_welfare_module.sql` & `013_logistics_enhancements.sql`; `014_audit_system.sql`, `014_horticulture_module.sql` & `014_platform_foundation_modules.sql`; `015_advanced_features.sql` & `015_authorization_service.sql`; `016_advanced_ponds_iot.sql` & `016_ai_copilot_schema.sql`
- **Description**: `migrate.js` sorts migration files by full filename (`fs.readdirSync(...).sort()`) and tracks execution by full filename in `schema_migrations`, so this is **not** a correctness bug — order is fully deterministic and every file still runs exactly once. It is, however, evidence that the numeric prefix is not being used as a reliable ordering/authoring convention, which makes it easy for a future migration to be dropped in with an already-used number and land in an unintended position relative to its true logical siblings.
- **Remediation**: No functional fix required; consider renumbering new migrations to the next free 3-4 digit slot (the repo already reserves `9999`/`3000` ranges for late-arriving and generated migrations per the existing convention) to keep the prefix meaningful.

### 8. [Medium] `migrate.js down` does not actually roll anything back
- **Location**: `backend/src/database/migrate.js:139-154` (`rollbackMigration`)
- **Description**: `node migrate.js down <file>` only runs `DELETE FROM schema_migrations WHERE filename = $1` — it never executes any reverse/DOWN SQL, because no down-migrations exist anywhere in the repo. This makes every table/column/index that migration created remain in place while the tracker now says it's "pending" again. Re-running `up` will silently no-op most of it (all `CREATE TABLE`/`ADD COLUMN` in this repo already use `IF NOT EXISTS`), but there is no real way to undo a migration that inserted seed data, altered a constraint, or dropped a column.
- **Remediation**: Either remove the `down` command (to stop advertising a capability that doesn't exist) or implement paired `.up.sql`/`.down.sql` files for migrations going forward.

### 9. [Medium] Migration runner silently rewrites failing SQL and retries
- **Location**: `backend/src/database/migrate.js:109-136` (`tryAutoRepair`), invoked automatically from `runMigrations()` on any migration failure
- **Description**: When a migration fails, `migrate.js` regex-rewrites it (adds `IF NOT EXISTS` to `CREATE TABLE`, `IF NOT EXISTS` to `ADD COLUMN`, appends `ON CONFLICT DO NOTHING` to bare `INSERT ... VALUES (...)` statements) and silently re-executes the modified SQL, writing the "repaired" version to `migrations/repairs/` and marking the original filename as executed in `schema_migrations` on success. This is a well-intentioned resilience mechanism, but it means a migration that fails for a real reason (wrong column name, bad constraint, logic error) can end up "succeeding" via a mechanically-generated rewrite that changes its semantics (e.g., turning an `INSERT` that should have failed on conflict into one that silently drops the row) rather than surfacing to a human for review. Combined with CI's separate `pglast` grammar check and table/index/FK count assertions (which would likely still pass after an auto-repair), a semantically-wrong migration has a real path to landing unnoticed.
- **Remediation**: Keep the archival/repair-template behavior for genuine failures, but stop auto-executing the regex-rewritten SQL unattended — require the generated repair file to be reviewed and re-run explicitly, or at minimum fail the CI job loudly (not just log) whenever `tryAutoRepair` actually changes and successfully applies a migration.

### 10. [Info — verified safe] No SQL-injection vectors found; identifier interpolation is properly guarded
- **Location**: `backend/src/core/outcomeResolver.js:49-56,84-106`, `backend/src/core/withTransaction.js:54-70`, `backend/src/utils/geo.js:117-132`
- **Description**: These are the only three places in `backend/src` where SQL text is built with template-literal interpolation rather than pure `$1`/`$2` parameters (verified via repo-wide grep for `` query(`...${ `` and for `${req./params./body.` inside query strings — zero hits). In all three, only *identifiers* (table/column names) are interpolated, every one of them is validated first against a strict allowlist regex (`/^[a-z_][a-z0-9_]*$/i` in `outcomeResolver.js` and `withTransaction.js`; `geo.js`'s `table`/`latCol`/`lngCol` are always literal strings passed by the calling service, never request input), and all *values* go through parameterized placeholders. This is the correct pattern for dynamic-identifier SQL and should be treated as a positive baseline, not a gap.
- **Remediation**: None required. Worth calling out in review guidance so future dynamic-SQL additions copy this pattern (allowlist identifiers, parameterize values) rather than reinventing it less safely.

## Follow-up pass (2026-08-30) — module-layer schema linkage

Re-scoped per explicit direction to focus on cross-stack **linkage** (module ↔
service ↔ real schema), not re-report the items above. Read `.ai/tasks/ACTIVE.md`
first; nothing there documents the finding below — it is new. Method: built a
script (`tables.json`/`missing_tables.json` approach, not checked into the
repo) that parses every `CREATE TABLE` across all 300 files under
`backend/src/database/migrations/` + the 30 loose `src/database/*.sql` files
(1,100 distinct table names total), then greps every `services/**/*.js` and
`modules/**/service.js` SQL string for `FROM|INTO|UPDATE|JOIN <table>` and
flags any table name not in that set. Manually verified every finding below
by direct `grep`/`Read` before reporting — false positives from English
prose in comments (e.g. "from the", "from a") were discarded; only real
`pg.query(...)` string literals are counted.

### 11. [Critical] Dozens of live, mounted M0XX modules query tables that exist nowhere in the executed migration pipeline
- **Location**: `backend/src/modules/{M022,M023,M024,M025,M031,M045,M055,M071,M073,M074,M075,M081,M082,M083,M085,M086,M101,M107,M123,M144,...}/service.js` (≥22 modules directly confirmed; the mechanical scan surfaced 147 candidate table references before manual filtering — see raw list for the rest)
- **Description**: Every module under `backend/src/modules/M0XX/` is auto-discovered at boot (`index.js:642-648`, `fs.readdirSync(generatedModuleRoot)`) and mounted live at `POST/GET /api/v1/backend-modules/:moduleId/:operation` via `routes/claude/backendModuleBridge.js` (`index.js:712`). Confirmed by direct `Read`/`grep`, several of these modules' `service.js` files issue real parameterized `pool.query()`/`pg.query()` calls against tables that were never created by anything `database/migrate.js` executes:
  - `modules/M022/service.js` → `farmer_profiles`, `farmer_contact_info`, `farmer_household`, `farmer_skills` (e.g. line 66 `INSERT INTO farmer_profiles`, line 109 `SELECT * FROM farmer_profiles WHERE profile_id = $1`)
  - `modules/M023/service.js` → `training_sessions`, `farmer_enrollments`, `assessment_results`, `training_attendance` (e.g. line 184 `SELECT * FROM farmer_enrollments WHERE session_id = $1 AND farmer_id = $2`)
  - `modules/M024/service.js` → `farmer_groups`, `group_memberships`
  - `modules/M025/service.js` + `modules/M031/service.js` → `land_parcels` (a real `folu_land_parcels` table exists in `migrations/991_aeos_folu_ne_policy.sql`, but plain `land_parcels` — the exact string both modules query — does not; confirmed via `grep -n "land_parcels" migrations/991_aeos_folu_ne_policy.sql`, which only matches the substring inside `folu_land_parcels`)
  - `modules/M045/service.js` → `seed_plans`
  - `modules/M071/service.js` → `dairy_herds`; `M073` → `goat_herds`; `M074` → `sheep_flocks`; `M075` → `pig_herds`
  - `modules/M081/service.js` → `dashboard_widgets`, `dashboard_usage_logs`
  - `modules/M082/service.js` → `kpi_definitions`, `kpi_measurements`
  - `modules/M083/service.js` → `performance_metrics` (a *different* `performance_metrics` table also queried by `services/legacy/analyticsMonitoringService.js` — worth checking those aren't meant to be the same table under two independent, non-agreeing schemas)
  - `modules/M085/service.js` → `comparison_groups`; `M086/service.js` → `real_time_data`, `monitoring_alerts`
  - `modules/M101/service.js` → `tractor_registry`; `M123/service.js` → `poultry_registry`
  - `modules/M107/service.js` → (see Finding 14, same file)
  - `modules/M144/service.js` → `greenhouse_automation_rules`
  - `modules/M008/service.js` → `compliance_rules`; `M009/service.js` → `ip_lists`, `access_policies`, `rate_limits`; `M014/service.js` → `sso_events`, `oauth_states`, `user_sso_mappings`
  Any real call to these endpoints against a live database returns Postgres error `42P01 relation "..." does not exist` — a hard 500, not a graceful `not_configured` response (these modules do not use this codebase's own honest-degradation pattern; they assume the table exists). This is a genuine cross-stack linkage break exactly matching the user's complaint: the module is wired, the route is mounted, the frontend can reach it, but the database layer underneath was never connected.
- **Root cause (see Finding 13)**: 46 of these modules ship their own `model.sql` file *inside* the module folder (`backend/src/modules/M0XX/model.sql`) that correctly defines these exact tables — but `database/migrate.js` only ever reads `path.join(__dirname, 'migrations')` (confirmed: `grep -n "readdirSync" migrate.js` shows exactly 2 call sites, both against `migrationsDir`, never against `modules/`). These 46 `model.sql` files are schema-complete but 100% disconnected from the one execution path that populates a real database — the same "schema exists on disk, nothing runs it" pattern already documented in Finding 2/3 above for `docker-compose.yml` and the 29 loose `*_schema.sql` files, just discovered independently in a different location (81 more files, one per module).
- **Remediation**: Either (a) fold each module's `model.sql` into a numbered file under `database/migrations/` (idempotent `CREATE TABLE IF NOT EXISTS`, so safe to add even after other migrations have run), or (b) have `migrate.js` additionally glob `modules/*/model.sql` as a second, clearly-ordered migration source. Do the former for the 46 modules with real content; for the 18+17 modules covered in Finding 12, the schema needs to be authored first — there's nothing to fold in yet.

### 12. [High] 35 of those modules have literally zero schema definition anywhere in the repository — worse than "written but not run"
- **Location**: `backend/src/modules/` — 18 modules ship an unfilled placeholder `model.sql` (e.g. `M074/model.sql`: `-- SQL model placeholder for Fertility Management (M074)\n-- Define tables and indexes here`, two comment lines, nothing else — yet `M074/service.js` queries `sheep_flocks` against it), and 17 modules (confirmed: `M045`, `M071`, `M073`, `M144` among them) have no `model.sql` file at all.
- **Description**: For these, there is no artifact in the entire repo — not migrations, not loose schema files, not module-local SQL — that defines the tables their `service.js` queries (`sheep_flocks`, `dairy_herds`, `goat_herds`, `pig_herds`, `seed_plans`, `greenhouse_automation_rules`, etc.). This isn't a wiring gap that folding in an existing file would fix; the schema itself was never authored. Note the mismatch inside `M074`/`M075` specifically: `M074`'s placeholder comment says "Fertility Management" and `M075`'s says "Irrigation Management," but their respective READMEs and live code are "Sheep Management" (queries `sheep_flocks`) and (queries `pig_herds`) — the placeholder comments look copy-pasted from a different module template and were never customized, a small extra signal that this was auto-generated scaffolding nobody returned to finish.
- **Remediation**: Before any schema can be written, confirm with the module's README/service.js which fields are actually used (most are straightforward — `service.js` already shows the exact `INSERT INTO ... (col1, col2, ...)` column lists), then author a real migration. Treat every module in this bucket as a genuine "not yet buildable without new schema-design work" item, not a quick wiring fix like Finding 11's 46.
- **Verification method note**: counted via `find backend/src/modules -maxdepth 2 -iname model.sql` (64 files) cross-checked against `find backend/src/modules -maxdepth 1 -type d -name "M*"` (81 dirs) for the 17 with none, then `grep -L "CREATE TABLE" <each model.sql>` for the 18 present-but-empty.

### 13. [Medium] Cross-module soft FKs inside the orphaned `model.sql` files have no resolvable dependency order even if someone did wire them in
- **Location**: `backend/src/modules/{M001,M002,M003,M004,M005,M022,M023,M024}/model.sql`
- **Description**: `M001/model.sql` and `M002/model.sql` both declare `config_id VARCHAR(50) REFERENCES platform_configurations(config_id)`; `M003/model.sql` references `tenants(tenant_id)`; `M004/model.sql` references `organizations(org_id)`, `org_departments(dept_id)`, `org_teams(team_id)`; `M005/model.sql` references `environments(env_id)`; `M022`'s child tables reference `farmer_profiles(profile_id)` (defined in the same file, fine); `M023` references `training_programs`/`training_sessions`/`farmer_enrollments` (also same-file, fine); `M024`'s `group_memberships` references `farmer_groups(group_id)` (same-file, fine). The problem is specifically the first five: `platform_configurations`, `tenants`, `organizations`, `org_departments`, `org_teams`, and `environments` are not defined in the referencing module's own `model.sql` — they'd need to live in some other module's file or a real migration, and nothing in the repo declares which. If Finding 11's remediation (folding `model.sql` files into numbered migrations) is done naively — one file per module, alphabetical/numeric order — `M001`'s `CREATE TABLE ... REFERENCES platform_configurations` would need to run *after* whatever defines `platform_configurations`, and that dependency is currently undocumented.
- **Remediation**: When executing Finding 11's fix, build the dependency graph first (which module's `model.sql` defines `platform_configurations`/`tenants`/`organizations`/`environments`, if any does at all — a quick search found no `CREATE TABLE platform_configurations` anywhere in `backend/src/modules/*/model.sql`, meaning this table may not exist as module-local schema either and would need to come from `database/migrations/` instead) and number the folded-in migrations accordingly, not just in module-ID order.

### 14. [Low-Medium] Two new confirmed instances of fabricated/hardcoded output ignoring real input — beyond what `.ai/tasks/ACTIVE.md` already documents as fixed
- **Location**: `backend/src/modules/M022/service.js:617-623` (`generateEnrichmentSuggestions(profileData)`), `backend/src/modules/M107/service.js:241-246` and `:294-298` (`analyzeSymptoms(symptoms, equipmentType)`, `estimateRepairTime(breakdownId, requiredParts)`)
- **Description**: `M022.generateEnrichmentSuggestions(profileData)` takes a real per-farmer `profileData` argument and ignores it completely, always returning `[{field:'occupation', suggested_value:'farming', confidence:0.9}, {field:'language', suggested_value:'hindi', confidence:0.8}]` regardless of who the farmer actually is. `M107.analyzeSymptoms(symptoms, equipmentType)` takes the caller's actual reported symptoms and equipment type and ignores both, always returning `{likely_cause:'mechanical_failure', confidence:0.85}`; the adjacent `estimateRepairTime(breakdownId, requiredParts)` similarly ignores `requiredParts` and always returns `{estimated_hours:8, confidence:0.8}`. This is the exact fabrication pattern already fixed elsewhere this session (`fetchGreenhouseSensorData`, `fetchSensorData`, M060's `getProductContext`, etc.) — a function name and a `confidence:` field that imply real per-input computation, backed by a constant. Lower severity than Findings 11/12 because these modules' underlying tables don't exist yet anyway (M022 partially, M107 not checked against this scan — M107 wasn't in the missing-table list, so its table layer may be fine; only these two specific functions are fabricated), so the fabrication is currently unreachable in practice until the schema gap is closed — but it will mislead whoever closes that gap into thinking the intelligence layer is real.
- **Remediation**: Same pattern as the session's prior fixes — either implement real logic against `profileData`/`symptoms`/`equipmentType`, or relabel honestly (`source: 'static'`, drop the fake `confidence` field) until real logic exists.

## Note on migration-execution status (item 4 of this pass's brief)

`.ai/tasks/ACTIVE.md:1180-1182` confirms migrations are still not executed in
this local dev environment (no PostgreSQL running) — unchanged since the
2026-08-24 handoff. This audit's original Finding 2 above notes CI *does* run
a real ephemeral `postgres:15-alpine` and executes all of `database/migrations/`
via `npm run migrate`, which is a genuinely stronger guarantee than "never
tested" for that directory specifically. **But Findings 11/12 above sit
entirely outside that safety net**: `modules/*/model.sql` is not in
`database/migrations/`, so CI's real-Postgres step never sees these tables
either — meaning the 22+ confirmed-broken modules in Finding 11 would fail
their first real query in *any* environment, local or CI, dev or prod alike.
This is not a "only detectable by static review until infra is up" caveat —
it is a real, unconditional runtime bug independent of whether Postgres is
running locally right now.

## Metrics

| Metric | Value |
|---|---|
| Migration files (`backend/src/database/migrations/`) | 265 |
| Loose/orphaned `*_schema.sql` files outside `migrations/` | 30 (incl. `schema.sql`) |
| `CREATE TABLE` across all migrations | 1,104 |
| `CREATE INDEX` across all migrations | 1,898 |
| `REFERENCES` (FK declarations) across all migrations | 900 |
| `CREATE TABLE` in base schema (`000_base_schema.sql`) | 49 |
| FK columns in base schema | 58 |
| Indexes defined in base schema | 23 (≈40% FK coverage) |
| `docker-compose.yml`-provisioned tables vs. full schema | 49 / 1,104 (≈4%) |
| Services doing raw `client.query('BEGIN')` outside `withTransaction()` | 6 |
| Uses of the `withTransaction()` helper | 1 |
| N+1 write-loop sites found | 4 (`orderService.js`, `valueCommerceService.js`, `offlineSyncService.js`, `offlinePaymentService.js`) |
| Dynamic-SQL identifier-interpolation sites (all validated) | 3 |
| Raw-SQL injection vectors found | 0 |
| Dead/unused DB abstraction code | `database/models/` (478 lines, 4 files), 29 duplicate schema files |
| `new Pool()` construction sites outside test/CLI infra | 0 (historical 42-instance oversubscription bug is fixed; only `connection.js`, `migrate.js`, `seed.js`, and test files construct pools directly) |
| CI: real Postgres service + real migration apply + structural verification | Yes (`.github/workflows/ci.yml`) |
| CI/Jest: service-level SQL executed against real Postgres | No — `pg` module and `database/pool.js` are both mocked when `NODE_ENV=test` |
| **Follow-up pass (2026-08-30) — module-layer linkage** | |
| `backend/src/modules/M0XX` directories (live, auto-mounted at boot) | 81 |
| Modules shipping a real, filled-in `model.sql` (correct schema, never executed by `migrate.js`) | 46 |
| Modules with an unfilled placeholder `model.sql` (no real schema anywhere) | 18 |
| Modules with no `model.sql` file at all (no real schema anywhere) | 17 |
| Modules directly confirmed (manual grep+read) querying a table absent from every migration | ≥22 (`M022,M023,M024,M025,M031,M045,M055,M071,M073,M074,M075,M081,M082,M083,M085,M086,M101,M123,M144,M008,M009,M014`) |
| Raw candidate missing-table hits from the mechanical scan (pre manual filtering) | 147 across 25 distinct table names in real SQL strings |
| New fabricated-output instances found (input ignored, hardcoded `confidence`) | 2 (`M022.generateEnrichmentSuggestions`, `M107.analyzeSymptoms`/`estimateRepairTime`) |
| CI coverage of `modules/*/model.sql` | None — CI's real-Postgres migration step only reads `database/migrations/` |

*verified by vibecheck*
