---
agent: code-auditor
status: warn
findings: 11
---

# Code Quality Audit — SVESCO/EBDESIGN Platform (refresh)

## Summary

Scope: `backend/src` (2,691 tracked `.js` files, ~408,000 LOC) and `frontend/src`
(1,229 tracked `.js`/`.jsx` files, ~88,400 LOC). Code-quality/complexity/
maintainability only — security, DB, infra, perf, and dependency issues are
out of lane. This is a **refresh**, not a first pass: the previous
`AUDIT_CODE.md` (10 findings, scoped to an 818-file/87K-LOC snapshot) is
superseded — the codebase has grown roughly 3-5x since then via the module
and duplication work logged in `.ai/tasks/ACTIVE.md`/`FIXES.md`. This pass
re-ran every metric fresh (`git status`, ESLint on both trees, direct file
reads) rather than trusting the old numbers, and cross-checked prior findings
against current code before re-reporting anything.

**What has genuinely improved since the last audit** (verified, not assumed):
- `database/pool.js`'s embedded mock-DB `console.log('TEST-POOL: ...')` debug
  spam and `isTestMode` branching are both gone (0 hits now, were 20+/dozens).
  The file is still large (2,281 lines) but the worst symptom is fixed.
- The M0xx module scaffold stub ratio dropped from 55% (82/150) to ~11%
  (39/344) — consistent with `.ai/tasks/ACTIVE.md` items 2, 3, 9 turning most
  "Domain: TBD" scaffolds into real implementations.
- `services/productReviewService.js` (the duplicate flagged implicitly by the
  wider pattern in Finding 1 below) has already been collapsed to a one-line
  re-export of `services/legacy/productReviewService.js`, with a clear
  dated comment explaining why — this is the correct fix pattern, just not
  yet applied to the other ~160 pairs.

**What is new or still open** is dominated by one large, previously
under-reported structural issue (Finding 1: a `services/` vs
`services/legacy/` — and further, `services/<domain>/` — naming collision
affecting ~163 file pairs, most of which are real, independently-drifted
implementations, not stubs) plus a handful of concrete runtime-breaking bugs
that ESLint's `no-undef`/`no-dupe-keys` rules surfaced directly (Findings
2-5) and a lint-gate regression (Finding 6, the opposite direction from what
the last audit recommended). Status remains **warn**: nothing here stops the
server from booting, but the duplication problem has grown rather than
shrunk, and several of the newly-found `no-undef` bugs mean specific
endpoints/functions are currently unreachable-without-crashing in code that
looks complete from the route table.

## Findings

### 1. [High] ~163 same-named service files exist in both `services/` (or `services/<domain>/`) and `services/legacy/`, and most are real, independently-sized implementations, not thin duplicates
- **Location**: `backend/src/services/*.js` vs `backend/src/services/legacy/*.js` (163 overlapping basenames — full list generated this pass, e.g. `erpService.js`, `farmerService.js`, `aiBackboneService.js`, `dairyService.js`, `analyticsService.js`, `enterpriseAIService.js`); a third copy exists for at least `farmerService.js`/`farmerTrainingService.js` under `services/agriculture/`.
- **Description**: Spot-checked several pairs directly rather than assuming from filenames alone:
  - `services/erpService.js` (943 lines) vs `services/legacy/erpService.js` (4,479 lines) — every real caller (`completeERPIntegrationController.js`, `comprehensiveERPController.js`, `index.js`, `M300_ERP_CORE`) requires the `legacy/` copy. The 943-line non-legacy file has **zero live callers** — it's dead weight, not a stub.
  - `services/farmerService.js` (617 lines) vs `services/legacy/farmerService.js` (693 lines) vs `services/agriculture/farmerService.js` — three parallel copies; `routes/farmerRoutes.js` uses `legacy/`, `routes/agriculture/farmerRoutes.js` uses `agriculture/`. Nothing wires them together, so a fix to farmer logic in one place silently does not apply to callers using another.
  - `services/aiBackboneService.js` (797 lines) vs `services/legacy/aiBackboneService.js` (7,051 lines) and `services/dairyService.js` (681) vs `services/legacy/dairyService.js` (688) — these are *not* identical-content duplicates (different line counts, different-sized logic), meaning they have drifted independently rather than being a clean copy/rename.
  - The one file already fixed the right way — `services/productReviewService.js` — is now a 17-line re-export with a dated comment explaining the collapse; that's the target end-state for the rest, not yet applied.
  - Root cause, confirmed via `services/index.js` (566 lines, header: "Auto-generated index file"): this barrel file `require()`s ~9-160 of the non-legacy top-level copies, but **`services/index.js` itself has zero callers anywhere in the live app** (`index.js` never requires it). For most of the 163 pairs, the non-legacy copy's only reachability path is through this dead barrel — i.e. most of the 163 "duplicates" are effectively unreachable dead code, but a handful (confirmed live: `aiBackboneService` 31 real callers, `aiGatewayService` 14, `analyticsService` 16) are genuinely both alive at once, which is the more dangerous half of this finding (two different live implementations of the same domain logic, not one dead one).
  - A frontend mirror of the same anti-pattern exists: `frontend/src/services/index.js` is also an "Auto-generated index file" using CommonJS `require()`/`module.exports` in a Vite/ESM-only codebase (flagged by ESLint's `no-undef` on every `require`/`module` token, since neither exists in that parser environment) and has zero importers anywhere in `frontend/src` — same dead-barrel shape, independently generated.
- **Remediation**: Per the standing project rule ("merge, don't delete duplicates" / "verify usefulness before dead-code calls"), do not bulk-delete. Triage in two passes: (1) confirm-dead pairs (like `erpService.js` non-legacy, and the frontend `services/index.js`) — verify zero live callers with a repo-wide `require()`/`import` grep, then collapse to a re-export exactly like `productReviewService.js` did, or remove if genuinely orphaned; (2) confirm-both-live pairs (`aiBackboneService`, `aiGatewayService`, `analyticsService`, and any others the same grep surfaces) — these need an actual reconciliation decision (which is canonical, merge the drifted logic) before collapsing, since two different real implementations may currently be answering the same domain differently depending on which route a request hits. Delete `services/index.js` and `frontend/src/services/index.js` outright once confirmed to have zero callers (they do as of this pass) — they add no value and actively mislead anyone searching for "who uses this service."

### 2. [High] `governanceService.js` and `logisticsEnhancementService.js`: every method references a bare, undeclared `pool` instead of `this.pool` — every DB call in both files throws `ReferenceError` at runtime
- **Location**: `backend/src/services/governanceService.js` (24 call sites, e.g. lines 27, 60, 71, 101, 135...608), `backend/src/services/logisticsEnhancementService.js` (same pattern, lines 27, 60...)
- **Description**: Both constructors correctly do `this.pool = require('../database/pool')`, but every method's query calls use bare `pool.query(...)` — `pool` is never declared at module or method scope, so this is a guaranteed `ReferenceError: pool is not defined` the instant any method actually runs (caught ESLint `no-undef`, not a false positive — verified by reading the source). These two files appear to share a common template (identical line numbers for the bug: 27, 60, 71...), suggesting a copy-paste origin. Both are real, substantial domain files (village/panchayat/CSR governance; logistics fleet/route enhancement), not stubs — so this silently breaks otherwise-complete functionality.
- **Remediation**: Mechanical fix — replace bare `pool.` with `this.pool.` throughout both files (or, cleaner, destructure `const { pool } = this;` at the top of each method, or better, hoist a module-level `const pool = require(...)` outside the class the way most other services in this codebase do it). `node -c` both files clean and grep-verify no other `services/*.js` files share this exact bug (this pass found only these two; a full-repo check for "`this.pool = require` in constructor + bare `pool.` in method bodies" would be cheap insurance against a third).

### 3. [Med] `logisticsEnhancementRoutes.js`: three route handlers reference an undefined identifier, crashing those specific endpoints only
- **Location**: `backend/src/routes/logistics/logisticsEnhancementRoutes.js:384, 394, 403`
- **Description**: The file imports the service as `const logisticsService = require('../../services/logistics/logisticsEnhancementService');` (line 9) and correctly uses `logisticsService.xxx()` everywhere else, but three handlers at lines 384/394/403 call `logisticsEnhancementService.xxx()` instead — an identifier that was never imported under that name. Those three endpoints (not the whole file) will throw `ReferenceError` on every request. Caught by ESLint `no-undef`, confirmed by reading the import list.
- **Remediation**: Rename the three call sites to `logisticsService`. One-line-per-site fix; verify with `node -c` and a live smoke test of those three routes once DB is reachable.

### 4. [Low] `index.js` health-check payload has a duplicate object key (`erp`), silently discarding the static placeholder in favor of the dynamic mount-check
- **Location**: `backend/src/index.js:1125` and `:1130` (same `services: {...}` object literal inside the `/health` handler)
- **Description**: `erp: { status: 'unknown', message: 'ERP services not verified' }` is declared, then five lines later `erp: { status: mountedRoutes.has('/api/v1/erp') ? 'mounted' : 'not_mounted' }` overwrites it (caught by ESLint `no-dupe-keys`). The net runtime behavior is probably what was intended (the dynamic check is more useful), but the first key is dead code that misleads a reader into thinking `/health` reports an "unverified" ERP status when it actually reports a mount check — and the same copy-paste pattern (a static `ai: {status:'unknown', ...}` placeholder sitting next to `ai_brain`/`ai_gateway`/etc. dynamic checks) suggests other services in this object may have been intended to get the same dynamic treatment but didn't.
- **Remediation**: Delete the dead `erp: {status:'unknown', ...}` line (line ~1125) since it's fully shadowed; audit whether `ai: {status: 'unknown', ...}` should similarly become a `mountedRoutes.has(...)` check for consistency with its siblings.

### 5. [Med] Real `no-undef` bugs in production API-client and service code (not test-only noise)
- **Location**: `frontend/src/services/api.js:1792`, `frontend/src/services/componentApi.js:7-18`
- **Description**: `nutritionIntelligenceAPI.calculateNutritionPricing(productId, basePrice, pricingRuleId)` (api.js:1792) builds its POST body as `{ product_id: productId, base_price, pricing_rule_id }` — but `base_price`/`pricing_rule_id` were never declared anywhere in that scope (the parameters are camelCase `basePrice`/`pricingRuleId`); this is an object-shorthand typo that throws `ReferenceError` the instant this function is called, meaning nutrition-based pricing is currently 100% broken end-to-end despite looking complete in the client. Separately, `componentApi.js` re-exports everything from `./api` (`export * from './api'`) but then defines three more objects (`multilingualAPI`, `conversationalAIAPI`, `voiceAIAPI`, 6 methods total) that call a bare `api.get/post(...)` with no local `api` binding anywhere in the file — same crash-on-call bug, three more times.
- **Remediation**: `api.js:1792` — change to `{ product_id: productId, base_price: basePrice, pricing_rule_id: pricingRuleId }`. `componentApi.js` — add `import api from './api';` at the top (consistent with how `./api`'s default export is already re-exported one line above it). Both are one-line-per-site fixes; ESLint `no-undef` already pinpoints every call site, so a `--fix`-adjacent manual sweep of the 29 frontend `no-undef` hits (this pass's full JSON output enumerates all of them) would catch anything similar beyond these two files.

### 6. [Med] Lint-gate regression: frontend's `--max-warnings 0` gate from the last audit is now gone, and neither tree fails CI on lint issues
- **Location**: `frontend/package.json:10` — `"lint": "eslint src --ext js,jsx --report-unused-disable-directives --no-error-on-unmatched-pattern --plugin jsx-a11y"` (no `--max-warnings` flag); `backend/package.json` — `"lint": "eslint src/"` (unchanged, still no gate, as flagged last audit)
- **Description**: The previous audit specifically noted the frontend enforced `--max-warnings 0` while the backend didn't, and recommended backend catch up. Instead, this pass found the frontend script has since lost its own gate — verified live: `npm run lint` inside `frontend/` currently reports **30 errors and 988 warnings** (including the real `no-undef` bugs in Finding 5) yet **exits 0**. So both trees can now accumulate lint errors indefinitely without CI noticing, which is a regression relative to the last audit's baseline, not just a persisting gap.
- **Remediation**: Restore `--max-warnings 0` (or a tracked non-zero ceiling with a burn-down plan) on the frontend script immediately — this used to exist and its removal looks accidental (e.g. dropped during a merge/rebase) rather than a deliberate decision. Add an equivalent gate to the backend script once Finding 5-class errors are triaged; at minimum, gate on **errors** first (30 on frontend, 329 on backend) even before tackling the much larger warning backlog, since errors are far more likely to be real bugs like Findings 2-5 above.

### 7. [Low] `no-useless-catch` — 97 occurrences of a try/catch that only rethrows
- **Location**: Backend-wide (ESLint `no-useless-catch`, 97 hits, worst concentration in `modules/M001_PLATFORM_CORE` and sibling generated modules)
- **Description**: A `catch (error) { throw error; }` (or equivalent) block adds no value over not having the try/catch at all — it's boilerplate left over from a code-generation template (consistent with the M0xx scaffold's generated shape) that obscures where errors are actually being handled versus just passed through.
- **Remediation**: Either remove the redundant try/catch, or make it earn its place (log before rethrow, wrap in a domain error type, or add cleanup). Mechanical enough to batch-fix per module with a scripted pass plus a `node -c` sanity check.

### 8. [Low] Test-file bugs mean at least 3 backend test suites cannot run at all
- **Location**: `backend/src/routes/__tests__/climateRoutes.test.js:39`, `enterpriseCommerceSafety.test.js:47`, `operationsMachineryRoutes.test.js:21`
- **Description**: All three call `app.use(expresson())` — `expresson` is not a typo ESLint invented; it's genuinely not defined anywhere in the file (should be `express()`, matching the `const express = require('express')` import each file has). Any test in these three suites fails at setup with `ReferenceError`, not from a real assertion failure — meaning whatever coverage these files were meant to provide is currently zero, silently.
- **Remediation**: Fix the typo (`expresson()` → `express()`) in all three files; then actually run them to confirm the underlying tests pass now that setup works.

### 9. [Low] Largest files remain very large, several have grown since the last audit
- **Location**: `backend/src/database/pool.js` (2,281 lines, down slightly from 2,339 but still the largest backend file and still mixes 40+ domains' worth of pool/mock logic), `backend/src/services/legacy/aiBackboneService.js` (7,051 lines — did not exist as a named large file in the last audit's top list, now the single largest service file in the repo by a wide margin), `frontend/src/services/api.js` (4,439 lines, up from 2,947 — ~50% growth), `frontend/src/config/routes.js` (1,808 lines).
- **Description**: Same shape of finding as before (monolithic, low-modularity files), now larger. `aiBackboneService.js` at 7,051 lines in one file/one class is a genuinely new outlier not called out last time, and is one of the "confirmed both live" duplicate pairs from Finding 1, which compounds the risk: any future maintainer editing "the" AI backbone logic has a 1-in-2 chance of editing the file with 31 real callers versus the smaller one with none.
- **Remediation**: Same recommendation as before, now more urgent for `aiBackboneService.js` specifically given Finding 1 — split into per-capability modules only *after* the duplication in Finding 1 is resolved (no point modularizing a file that has an as-yet-unreconciled sibling).

### 10. [Low] Frontend automated test coverage improved but is still thin relative to codebase size
- **Location**: `frontend/src` — 16 test files across 1,229 source files (was 1/572 last audit — real, absolute improvement, ~16x more files, but the *ratio* barely moved: ~1.3% of files now vs ~0.2% before)
- **Description**: Noted as a genuine improvement in absolute terms, not re-flagged as urgent, but the codebase has grown faster than its test suite, so the coverage gap in relative terms hasn't closed.
- **Remediation**: Same as before — prioritize `api.js`'s interceptor/refresh-token logic and the highest-traffic pages; the growth in file count (16 tests already written) suggests momentum exists, so extending the existing pattern rather than starting from zero.

### 11. [Low] No static typing anywhere on the frontend (unchanged)
- **Location**: `frontend/src` — 0 `.ts`/`.tsx` files (confirmed again this pass), no PropTypes usage observed.
- **Description**: Unchanged from the last audit. Repeated here only because it compounds Finding 5 (the `no-undef` API-client bugs) — a typed client would have caught the `base_price`/`pricing_rule_id` typo at compile time.
- **Remediation**: Unchanged recommendation — incremental adoption, not a big-bang migration. Not blocking.

## Metrics

| Metric | This pass | Last audit |
|---|---|---|
| Backend tracked `.js` files (`git ls-files backend/src`) | 2,691 | 818 |
| Backend LOC (`backend/src`) | ~408,220 | ~87,324 |
| Frontend tracked `.js`/`.jsx` files | 1,229 | 572 |
| Frontend LOC (`frontend/src`) | ~88,431 | ~30,481 |
| Backend services (`backend/src/services`, all levels) | 610 | 109 |
| Backend `services/legacy` files | 183 | n/a (not split out) |
| Same-basename pairs across `services/` and `services/legacy/` | 163 | not reported |
| Backend route files (`backend/src/routes`, all levels) | 339 | 39 |
| Backend module dirs (`backend/src/modules/M0xx`) | 344 | 150 |
| M0xx modules with a ≤10-line `service.js` (stub ratio) | 39 (~11%) | 82 (~55%) |
| Backend ESLint: files scanned / with issues | 2,700 / 559 | not reported this granularly |
| Backend ESLint errors / warnings | 329 / 3,235 | 67 / 579 |
| Backend top ESLint rules | `no-unused-vars` 2,951, `no-return-await` 150, `prefer-const` 134, `no-useless-catch` 97, `no-undef` 92, `no-func-assign` 84, `no-case-declarations` 35 | `no-unused-vars` 551, `no-func-assign` 41, `no-return-await` 26, `no-case-declarations` 20 |
| Backend `no-dupe-keys` (real bug, Finding 4) | 1 | 0 reported |
| Frontend ESLint: `npm run lint` exit code with 30 errors / 988 warnings | 0 (ungated) | not measured directly |
| Frontend top ESLint rules | `no-unused-vars` 970, `no-undef` 29, `prefer-const` 17 | not reported this granularly |
| Largest backend file | `services/legacy/aiBackboneService.js` — 7,051 lines | `database/pool.js` — 2,339 lines |
| `database/pool.js` current size / `console.log`/`isTestMode` hits | 2,281 lines / 0 / 0 (fixed since last audit) | 2,339 lines / 20+ / dozens |
| Largest frontend file | `services/api.js` — 4,439 lines | `services/api.js` — 2,947 lines |
| Backend test files (`*.test.js` + `__tests__/`) | 809 (749 under `__tests__/`) | 30 |
| Frontend test files | 16 | 1 |
| TODO/FIXME/XXX/HACK markers in backend/src | 25 | 1 |
| `console.log`/`console.debug` calls in backend/src | 252 | 53 (different counting method — not directly comparable) |
| TypeScript files in frontend/src | 0 | 0 |

