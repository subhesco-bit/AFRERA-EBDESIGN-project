---
agent: architect-reviewer
status: warn
findings: 6
---

# Architecture Review — Module/API/UI Linkage Audit

Scope per task: route mounting completeness, duplicate mounts, module→schema
correctness (sample), broken imports, and overall layering verdict. This is a
**delta review** against `.ai/tasks/ACTIVE.md`, which already documents many
resolved orphaned-route/duplicate-route sweeps through commit `967ff53c`. Items
already closed there (6 legacy/ route files, insurance triple-mount, devin
layer removal, nervous system routes, etc.) are **not** re-reported here.

## Summary

Route mounting itself is now clean: all 116 top-level `backend/src/routes/*.js`
files and all 6 `backend/src/routes/legacy/*.js` files are both `require()`'d
and `app.use()`'d in `backend/src/index.js` (verified by cross-referencing
every `const x = require('./routes/...')` against every `app.use('/path', x)`
in the 1,316-line file — 111 route-router mounts found, zero unmounted, zero
router-level path collisions). No boot-crashing broken `require()` was found
across `routes/`, `services/`, `services/legacy/`, `services/dual-use/`,
`core/`, `core/ai/`, `controllers/`, `middleware/`, or all 86
`backend/src/modules/M0XX/service.js` files (all syntax-clean via `node -c`,
all relative `require()` targets resolve to real files).

**The real, NEW linkage gap this pass found is one layer deeper than routing:
module code that references database tables no migration ever creates.**
This is a schema-linkage bug distinct from the "hardcoded confidence /
fabricated placeholder data" pattern ACTIVE.md already tracked for the Water
(M076-080) and Livestock (M122/M123/M127) domains — those fixes addressed
fabricated *values*; the tables underneath several of the same calls don't
exist at all, so the queries would fail outright the first time a real
Postgres instance runs them, before the fabrication question even arises.

## Findings

### 1. [HIGH] M055 (Pricing) — full CRUD against a `pricing_rules` table with zero migration
**Location:** `backend/src/modules/M055/service.js:53,135,155,181,213,265`
All 6 SQL statements (INSERT/SELECT/UPDATE/DELETE) target a bare `pricing_rules`
table. No migration anywhere creates it — only differently-prefixed, unrelated
tables exist: `gi_pricing_rules` (migration 027), `nutrition_pricing_rules`
(036), `value_pricing_rules` (044). Verified via
`grep -rli pricing_rules backend/src/database/migrations` (4 hits, none is
`CREATE TABLE ... pricing_rules`). M055 is live and reachable — routed through
the generic `/api/v1/backend-modules/M055/*` bridge
(`routes/claude/backendModuleBridge.js`, mounted `index.js:712`), and per
ACTIVE.md item 9 its README already documents "real, substantial content" —
but every call will throw `relation "pricing_rules" does not exist` against a
real database.
**Remediation:** either add a migration creating `pricing_rules` (check first
whether one of the 3 domain-prefixed tables above was meant to be reused
instead — would avoid yet another parallel pricing table), or rename the
service's queries to point at an existing table.

### 2. [HIGH] M144 (Greenhouse) — 3 of 3 core tables have no migration
**Location:** `backend/src/modules/M144/service.js:150,167,203-210,387,400,411`
`greenhouse_sensors`, `greenhouse_sensor_readings`, and
`greenhouse_automation_rules` are all queried/inserted with no corresponding
migration anywhere (`grep -rli greenhouse backend/src/database/migrations`
finds only an unrelated `greenhouses` table in migration 014 — horticulture
facility records, not sensor/automation tables). The module's own code
comment at line 210 already admits this for one table
("`greenhouse_sensor_readings` has no migration in this codebase yet") but the
other two (`greenhouse_sensors`, `greenhouse_automation_rules`) carry no such
disclosure and would fail identically.
**Remediation:** write the missing migration (schema is fully inferable from
the INSERT column lists at service.js:150 and :387), or add the same honest
`configured:false` disclosure ACTIVE.md's item 2/3 already applied to this
module's IoT-reading fabrication, extended to cover the missing-table case
explicitly rather than only the missing-hardware case.

### 3. [HIGH] M122 (Cattle) — 3 of 4 referenced tables have no migration
**Location:** `backend/src/modules/M122/service.js:177,301,313,342`
`cattle_breed_characteristics`, `cattle_health_records`, and
`regional_cattle_health_patterns` are queried with no migration creating them.
Only `cattle_registry` exists (migration `9999_..._livestock_management_schema.sql`).
Confirmed via `grep -rli cattle backend/src/database/migrations` (2 files: 068
goat farming — unrelated — and the 9999 livestock file, which contains only
`cattle_registry`).
**Remediation:** same as #2 — add the 3 missing tables or make the gap honest
in the service/README, matching the disclosure pattern ACTIVE.md's item 9
already used for this module's fabricated-value bugs.

### 4. [MEDIUM] M076 (Water) — 4 of ~5 referenced tables have no migration
**Location:** `backend/src/modules/M076/service.js:71-72,213,234,246,267`
`crop_patterns`, `groundwater_levels`, `water_usage_history`, and
`water_usage_records` are queried with no backing migration
(`water_budgets` does exist, migration 014_horticulture/`014_platform_...`;
the only other hit for "water_usage" anywhere in migrations is an unrelated
`water_usage JSONB` column in migration 022). ACTIVE.md's item 9 already
flagged M076-080 for fabricated confidence values and added disclosure
banners to the service files, but did not check schema existence — this is
the gap underneath that pass.
**Remediation:** same pattern as #2/#3.

### 5. [LOW, informational] AI orchestration fragmentation — confirmed still open, not re-fixed
ACTIVE.md already documents (2026-08-29 entries) that at least 5 independent
AI orchestration systems exist (`core/aiOrchestrator.js`,
`core/ai/aiOrchestratorCore.js`, `core/claudeAICoordinator.js`,
`services/legacy/aiOrchestrationService.js`, plus the `modules/M400*`
family), and that 2 rounds of consolidation work have already added bridging
engines rather than merging the systems outright. Spot-checked
`core/aiOrchestrator.js` and `core/erpAgents.js` (both modified on the current
branch per `git status`) — both still load clean and the bridging engines
(`claude_coordinator`, `model_registry`, `module_dispatch`) are present as
documented. Not re-auditing in depth per task scope (explicitly already
tracked, not new); flagging only that it remains genuine unresolved
architectural debt, not a regression.

### 6. [INFO] No new duplicate route-path mounts found
Re-ran the duplicate-mount check ACTIVE.md's item 12 previously used to catch
the `/api/v1/insurance` triple-mount. Current state: 111 route-router objects
mount to 111 distinct paths, zero collisions. The only paths that appear more
than once in `app.use()` calls are `/api/v1/auth`, `/api/v1/logistics`, and
`/api/v1/insurance`, but in each case the second registration is a
non-router middleware (`criticalRouteMonitoring`, `rateLimiters.auth`)
layered onto the same path ahead of the real router, not a second competing
route file — not a bug.

## Architecture Verdict

**Routing/mounting layer: coherent.** The many prior sweeps documented in
ACTIVE.md have genuinely closed the orphaned-route and duplicate-mount classes
of bug — this pass found zero new instances of either.

**Schema-linkage layer: the actual remaining gap.** The pattern found in
findings 1-4 (module service code written against a plausible-sounding table
name that was never migrated) is systemic to the same water/livestock/
greenhouse "generic-scaffold-turned-real" modules ACTIVE.md's items 2, 3, and
9 already flagged for *fabricated values* — but nobody has yet checked those
modules' SQL against `grep -rl "CREATE TABLE"` across all 500+ migrations. This
audit's spot-check (5 modules) found real schema gaps in 3 of them (M055,
M122, M144) plus a 4th already-partially-disclosed one (M076). Given the sheer
module count (86 in `backend/src/modules/`), a full sweep — mechanically
extracting every `FROM/INTO/UPDATE <table>` from every `service.js` and
diffing against `CREATE TABLE` across all migrations — would very likely
surface more instances of this same class. That mechanical sweep is the
concrete next step, not a rewrite of any individual module.

**Module/AI layering: known, tracked debt, not regressed.** The 5-system AI
orchestration fragmentation is real but already understood and partially
bridged; no new fragmentation was introduced by the diffs currently on this
branch.

## Metrics
- Route files (top-level): 116, all mounted
- Route files (legacy/): 6, all mounted
- Route-router mounts in index.js: 111, 0 unmounted, 0 path collisions
- Modules scanned for broken imports: 86 (`backend/src/modules/M0XX`) — 0 broken
- Directories scanned for broken relative `require()`: routes, services,
  services/legacy, services/dual-use, core, core/ai, controllers, middleware — 0 broken
- Modules schema-spot-checked: 5 (M013, M055, M076, M122, M144)
- Modules with missing-table bugs found: 3 confirmed (M055, M122, M144) + 1
  partially self-disclosed (M076) = 4 of 5 sampled
