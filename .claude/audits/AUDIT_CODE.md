---
agent: code-auditor
status: warn
findings: 10
---

# Code Quality Audit — AFRERA Platform

## Summary

Scope: `backend/src` (818 files, ~87,300 LOC) and `frontend/src` (572 files, ~30,500 LOC). Audit is code-quality/complexity/maintainability only — security, dependency, infra, DB, and performance issues are out of lane and left to their respective auditors.

The codebase runs and is organized into recognizable layers (services, routes, modules, middleware), but shows heavy signs of rapid, tool-assisted accretion: a 150-module code-generation scaffold that is roughly half unimplemented stubs, a single 2,339-line "shared pool" file that embeds an entire in-memory mock database for tests, an 899-line monolithic route-mounting bootstrap with inline commentary documenting its own history of orphaned/recovered routes, and a fragile test-mode pattern (implicit global reassignment of hoisted functions) repeated across at least five service files. ESLint already reports 67 errors and 579 warnings on `backend/src`, but the `lint` npm script has no `--max-warnings` gate, so none of this fails CI today. Automated test coverage is thin, especially on the frontend (1 test file for 572 source files).

None of this is a "does not run" blocker, which is why overall status is **warn** rather than **fail** — but the volume and character of the findings (dead scaffolding, stub logic disguised as working endpoints, an unenforced lint gate) mean the repo is not yet at a maintainable "launch level" baseline.

## Findings

### 1. [High] Fragile test-mode pattern: implicit reassignment of hoisted function declarations
- **Location**: `backend/src/services/iotIntegrationService.js:24-35`, `knowledgeGraphService.js`, `multilingualService.js`, `predictiveAnalyticsService.js`, `valueCommerceService.js` (ESLint `no-func-assign`, 41 occurrences total)
- **Description**: Inside `if (process.env.NODE_ENV === 'test') { ... }` blocks, these files reassign identifiers such as `registerIoTDevice = async (data) => {...}` with no `let`/`const`/`var`. Because a function declaration with the same name exists later in the same file, this is a direct reassignment of that hoisted binding (flagged by ESLint's `no-func-assign`, which specifically warns because it silently breaks under strict mode / bundling / minification, and makes control flow depend on declaration order rather than explicit test doubles).
- **Remediation**: Replace with explicit conditional exports or dependency injection (e.g. `const impl = process.env.NODE_ENV === 'test' ? testImpl : realImpl`), or move test doubles into the existing (currently near-empty) `backend/src/test-mocks/` directory and inject them via Jest module mocking instead of runtime reassignment.

### 2. [High] `database/pool.js` is a 2,339-line "connection proxy" that embeds a full mock database
- **Location**: `backend/src/database/pool.js`
- **Description**: The file's own header documents a legitimate motivation (consolidating 42 separate `new Pool()` instances that were oversubscribing `max_connections`), but the implementation goes far beyond a lazy pool proxy: it hard-codes dozens of `Map`-backed in-memory tables (`health_profiles`, `gi_products`, `blockchain_transactions`, `conversation_sessions`, etc.) and hundreds of lines of `if (isTestMode) { ... } else { ... }` branching per query shape, plus ad-hoc `console.log('TEST-POOL: ...')` debug statements left in place (20+ call sites). This makes a piece of core infrastructure code one of the largest and least navigable files in the repo, and couples unrelated domain knowledge (IoT, blockchain certs, conversations, nutrition) into a single module.
- **Remediation**: Extract the in-memory test-mode store into its own module (or per-domain fixtures under `test-mocks/`), leaving `pool.js` as a thin proxy as the header describes. Remove the leftover `console.log` debug lines or gate them behind a `DEBUG_POOL` flag.

### 3. [Med] 150-module code-generation scaffold is roughly half unimplemented placeholders
- **Location**: `backend/src/modules/M001` … `M150` (600 files: `controller.js`, `index.js`, `model.sql`, `routes.js`, `service.js`, `README.md` per module)
- **Description**: `backend/src/index.js:471-482` dynamically `readdirSync`s and auto-mounts every `M0xx` module at `/api/v1/modules/<name>`. Of the 150 module directories, 82 have a `service.js` of 10 lines or fewer — i.e. still the generated stub `// Add business logic here` / `module.exports = { /* functions */ }`. Only two modules (`M011`, `M006`) are explicitly imported by name elsewhere for their "real" mount points (`/api/v1/users`, `/api/v1/admin`); a third (`M029`) is referenced from `farmerHealthRoutes.js`. The remainder are exposed only through the generic auto-mount loop, meaning ~600 files exist in the tree with no clear signal to a reader (short of opening each `service.js`) of which are load-bearing and which are scaffolding.
- **Remediation**: Either delete/archive modules that are still pure stubs, or mark them clearly (e.g. a `STATUS: stub` line in each `README.md` surfaced in a generated index) so `git grep`/navigation isn't polluted with 68+ dead directories. Consider gating the auto-mount loop to skip stub modules so the route table doesn't advertise non-functional endpoints.

### 4. [Med] `backend/src/index.js` is an 899-line monolithic bootstrap with inline "archaeology" comments
- **Location**: `backend/src/index.js` (e.g. lines 440-539)
- **Description**: Route registration is done as ~100+ sequential `mountRoute(...)` / `app.use(...)` calls in one file, interspersed with comments such as `// Routes that existed but were never mounted anywhere`, `// Newly created routes covering previously-orphaned services`, and references to specific migration numbers (`992`, `993`). This is useful historical context, but it is also evidence that route wiring has been managed ad hoc across many separate change sessions with no central registry — which increases the risk of silently duplicated or shadowed route prefixes as the file keeps growing (six separate `ecommerce*` route groups and three separate ERP integration route sets already coexist: `erpService`, `completeERPIntegrationRoutes`, `comprehensiveERPRoutes`).
- **Remediation**: Introduce a route manifest (array of `{ path, module }` or per-domain sub-routers loaded via a folder convention) so new routes are declarative and diffable, and so overlapping domains (ecommerce, ERP) can be spotted at a glance instead of by reading 900 lines of comments.

### 5. [Med] 551 `no-unused-vars` warnings, concentrated in a handful of services, often on identifying parameters
- **Location**: Backend-wide (ESLint), worst offenders: `enterpriseAIService.js` (101), `farmerTrainingService.js` (63), `preSeasonOrderService.js` (63), `governmentSchemeService.js` (36), `insuranceClaimsService.js` (29), `soilTestingService.js` (27), `aiCopilotService.js` (26)
- **Description**: A large share of these are unused function parameters like `farmerId`, `timeframe`, `regionId` passed into handler functions that never reference them (sample from `enterpriseAIService.js:200,282,287,292,297`). Functionally, these read as endpoints that accept a scoping/identity parameter but return the same data regardless of who or what is asked for — i.e., stub or mock-data implementations sitting behind routes that look complete from the outside. This is a maintainability and correctness-adjacent smell: it's not obvious from the route table which of the 109 services actually implement their contract versus return canned data.
- **Remediation**: Triage the top-offending files first; for genuinely unused parameters, prefix with `_` (already allowed by the existing `argsIgnorePattern`) or remove them; for parameters that should be used, that's a functional gap to track separately (out of this audit's lane, but worth a follow-up ticket per file).

### 6. [Med] Backend `lint` script does not enforce a warning budget, unlike frontend's
- **Location**: `backend/package.json:11` (`"lint": "eslint src/"`) vs `frontend/package.json` (`"lint": "eslint src --ext js,jsx --report-unused-disable-directives --max-warnings 0 ..."`)
- **Description**: The frontend fails its lint script on any warning (`--max-warnings 0`); the backend's does not, so the 579 existing warnings (and any new ones) never fail a CI lint step. Findings #1, #5, and #7 below can accumulate indefinitely without being caught.
- **Remediation**: Add `--max-warnings` (start at current count or 0 after triage) to `backend`'s lint script once the backlog in #5 is addressed, or split into `lint:errors` (CI-gating) and `lint:warnings` (tracked separately) during the interim.

### 7. [Med] Inconsistent async control-flow patterns flagged by ESLint
- **Location**: `no-case-declarations` (20 occurrences: `advancedFeaturesService.js`, `advancedVoiceAI.js`, `offlineSyncService.js`) — `const`/`let` declared directly inside `switch` `case` blocks without braces, which is a real TDZ/scope-leak hazard if cases are reordered or a case falls through. `no-return-await` (26 occurrences: `redis.js`, `aiCopilotService.js`, `erpService.js`, `offlineSyncService.js`, `omnichannelAIService.js`) — redundant `return await`, which flattens stack traces and obscures error handling intent.
- **Remediation**: Wrap `case` bodies with blocks (`case 'x': { const y = ...; break; }`); apply `eslint --fix` for the mechanical parts, review the case-declaration sites by hand for pre-existing fallthrough bugs.

### 8. [Low] Near-zero frontend automated test coverage
- **Location**: `frontend/src` — 1 test file across 572 source files, despite `vitest` and a `test:coverage` script being configured in `frontend/package.json`
- **Description**: Backend has 30 test files for 818 source files (109 services), which is thin but non-trivial; frontend effectively has none, despite tooling being fully wired up. For a codebase this large heading toward "launch level," regressions in `App.jsx` (1,342 lines) or `api.js` (2,947 lines) would only surface manually.
- **Remediation**: Prioritize test coverage for `frontend/src/services/api.js` interceptor/refresh-token logic and the highest-traffic pages first; wire `test:coverage` into CI once a baseline exists.

### 9. [Low] Monolithic, low-modularity files on the frontend
- **Location**: `frontend/src/services/api.js` (2,947 lines, 242 exported functions in one file), `frontend/src/App.jsx` (1,342 lines)
- **Description**: A single API client file covering every domain (dairy, fertilizer, insurance, logistics, marketplace, etc.) makes it hard to find call sites, increases merge-conflict surface, and mixes concerns (axios setup/interceptors alongside 242 domain functions). `App.jsx` at 1,342 lines is large for a root component/router file.
- **Remediation**: Split `api.js` into per-domain modules (`services/api/insurance.js`, `services/api/logistics.js`, ...) re-exported from an index, mirroring the backend's service-per-domain layout. Extract route definitions and top-level layout from `App.jsx` into dedicated files.

### 10. [Low] No static typing anywhere on the frontend
- **Location**: `frontend/src` — 0 `.ts`/`.tsx` files; no PropTypes usage observed
- **Description**: A 30K-LOC React SPA with no TypeScript and no PropTypes means component contracts (props, API response shapes) are unenforced at build time, which raises the cost of the refactors implied by findings #8-9.
- **Remediation**: Not a blocking issue for launch; consider incremental adoption (`.tsx` for new files, `checkJs`/JSDoc typedefs for `api.js`) rather than a big-bang migration.

## Metrics

| Metric | Value |
|---|---|
| Backend source files (`backend/src/**/*.js`) | 818 |
| Backend LOC (`backend/src`) | ~87,324 |
| Frontend source files (`.js`/`.jsx`) | 572 |
| Frontend LOC (`frontend/src`) | ~30,481 |
| Backend services (`backend/src/services`) | 109 |
| Backend route files (`backend/src/routes`) | 39 |
| Backend generated modules (`backend/src/modules/M0xx`) | 150 dirs / 600 files (82 are ≤10-line stubs) |
| ESLint errors / warnings (backend/src, per existing `eslint-report.json`) | 67 errors / 579 warnings across 157 files |
| Top ESLint rule violations | `no-unused-vars` 551, `no-func-assign` 41, `no-return-await` 26, `no-case-declarations` 20, `no-prototype-builtins` 4 |
| Largest backend file | `backend/src/database/pool.js` — 2,339 lines |
| Largest frontend file | `frontend/src/services/api.js` — 2,947 lines |
| Backend test files | 30 (for 818 source files) |
| Frontend test files | 1 (for 572 source files) |
| `console.*` calls in backend/src | 53 (majority debug logging left in `database/pool.js`) |
| TODO/FIXME/XXX/HACK markers in backend/src | 1 |
| TypeScript files in frontend/src | 0 |
