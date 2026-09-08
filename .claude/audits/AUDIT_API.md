---
agent: api-tester
status: warn
findings: 11
---

# API Endpoint Validation / Contract Testing Audit — EBDESIGN Backend

**Scope:** `backend/src/routes/**`, cross-referenced against
`backend/src/index.js` mounting, `backend/src/services/**`, and
`frontend/src/services/api.js`. Static analysis only (PostgreSQL/Mongo/Redis
are not running in this environment — see Method below for how far live
testing still went). Branch: `audit/ui-api-fix`, working tree re-read fresh
at time of this audit (many concurrent sessions are editing this repo right
now — see git status snapshot in Metrics).

**Method:** Because the Express app itself does not require a live database
to boot and listen, this audit went beyond pure static analysis where it
mattered: the server was started locally (`node src/index.js`, no
Postgres/Redis reachable — confirmed via startup log, consistent with every
prior session in `.ai/tasks/ACTIVE.md`) and several endpoints were hit with
real HTTP requests to confirm route-mounting claims that static reading alone
can't settle (e.g., whether a `mountRoute()`-based service's router is
actually reachable). This is not full live testing (no DB-backed endpoint was
exercised past its DB call), but it is real request/response verification of
the mounting layer, which is exactly where this audit found its two biggest
findings.

---

## Summary

This pass was asked to (1) do a fresh static/dynamic-boot audit of route
mounting and handler existence, and (2) specifically check whether the
uncommitted deletion of `backend/src/routes/commerce/sellerRankingRoutes.js`
broke anything. Both are answered below. The bulk of this audit's value,
however, is verifying — not discovering — two extremely large,
already-in-progress fixes from concurrent sessions editing this same repo
right now: a `mountRoute()` type-check bug that appears to have silently
defeated most of the ~47 `mountRoute()`-based service mounts for an unknown
period, and a 9-times-reassigned `module.exports` in
`aiBackboneService.js` that silently discarded 8 of its 9 export sections.
Both are fixed in the current uncommitted working tree and both were
confirmed fixed by live HTTP request, not just by reading the diff.

The prior `AUDIT_API.md` (commit `967ff53c`) findings F1–F9 were **not
re-run in full this pass** — that cross-reference (2,880 backend endpoints ×
1,622 frontend calls) is a multi-hour undertaking and the task instructions
explicitly flagged F6 (~150 frontend-ahead-of-backend calls) and F8 (~78
unverified orphaned mount prefixes) as already-deferred, not something to
re-litigate here. They are carried forward unchanged at the bottom of this
report as still-open leads. Everything above them (F-NEW-1 through
F-NEW-4, plus the seller-ranking check) is fresh work from this pass.

---

## Findings

### F-NEW-1 — RESOLVED (verify only) — `sellerRankingRoutes.js` deletion is safe; the live route is untouched
**Location:** `backend/src/routes/commerce/sellerRankingRoutes.js` (deleted,
uncommitted) vs. `backend/src/routes/sellerRankingRoutes.js` (live, mounted).

Confirmed via `git log` that the deleted file was added in the same bulk
recovery commit (`c39316fe`, "Extract 2,699 genuinely-new files from old
branches/worktrees") as a duplicate of the real route file, never the
original. `backend/src/index.js` line 430/998 requires and mounts
`./routes/sellerRankingRoutes` (no `commerce/` in the path) at
`/api/v1/seller-ranking` — a completely different file from the one deleted.
The deleted `commerce/sellerRankingRoutes.js` pointed at
`services/commerce/sellerRankingService.js`, which **does not exist on
disk** (confirmed missing) — so the deleted file could never have loaded
successfully if it *had* been required anywhere; it wasn't. A repo-wide grep
for `commerce/sellerRankingRoutes` and `services/commerce/sellerRankingService`
returns zero hits anywhere in `backend/src`. The live route
(`routes/sellerRankingRoutes.js` → `services/legacy/sellerRankingService.js`)
was smoke-tested live: `GET /api/v1/seller-ranking/sellers` → `400` (route
mounted, auth-less endpoint reached real service code, failed only on the
expected `ECONNREFUSED` from no local Postgres) — confirmed intact.
**No remediation needed; the deletion is a clean no-op removal of dead,
already-broken duplicate code.**

### F-NEW-2 — CRITICAL, already fixed this session (verify live) — `mountRoute()`'s router type-check rejected every genuine Express router
**Location:** `backend/src/index.js` line ~611 (current, fixed state) vs.
git-diff'd prior state.

The helper every `mountRoute('/api/v1/x', xService)` call in `index.js`
depends on (~47 call sites, per the prior `AUDIT_API.md`'s own count)
contained:
```js
if (typeof serviceModule.router !== 'object' || typeof serviceModule.router.use !== 'function') {
```
`typeof express.Router()` is `'function'`, not `'object'` (verified directly:
`node -e "console.log(typeof require('express').Router())"` → `function`).
That means the first half of this OR-condition was `true` for **every
genuine, correctly-built Express router** ever passed to `mountRoute()`,
so the function always fell into the "invalid_router" branch and returned
`false` **without ever calling `app.use()`** — regardless of whether the
service module was actually fine. This is a boot-time silent failure, not a
crash, so it would never surface in a stack trace; it would only show up as
routes that always 404 with no obvious cause, which is exactly the shape of
confusion the prior `AUDIT_API.md`'s F8 finding describes ("~47
`mountRoute()` calls covering far more surface area than the frontend
currently exercises... may be genuinely unbuilt speculative services").
Some or all of that apparent dead surface may actually have been this bug,
not unbuilt features — worth re-running F8's orphan check now that this is
fixed, since routes that were unreachable before may now be live.

**Current state:** already fixed in the uncommitted working tree (the fix
correctly checks `!serviceModule.router || typeof serviceModule.router.use !== 'function'`
instead). **Verified live, not just by reading the diff:** booted the server
locally and hit `POST /api/v1/clinical-nutrition/assess` (a brand-new
`mountRoute()`-based service added in this same session) → `401 NO_TOKEN`
(proves the router is mounted and its auth middleware runs — a 404 would
mean it wasn't). `GET /health/comprehensive` (unauthenticated in dev)
reported `"mounted": 157, "failed": 8` with `/api/v1/ai-self-healing`,
`/api/v1/ai-brain`, `/api/v1/ai-gateway`, `/api/v1/erp` all showing
`"status":"mounted"` in its own `services` block. The one remaining failed
mount in the live run was `/api/v1/analytics` (`no_router_export` — a
different, pre-existing, real gap: `analyticsService` has no `.router` at
all, already documented in the prior audit's Method section as
"compensated by a second real mount at the same path" — not a regression).
**No action needed beyond normal review of the fix; flagging here so it
isn't lost/reverted by a future session that doesn't know why the check
looks the way it does.**

### F-NEW-3 — CRITICAL, already fixed this session (verify live) — `aiBackboneService.js` had 9 competing `module.exports` assignments; 8 were silently discarded
**Location:** `backend/src/services/legacy/aiBackboneService.js` (~7,000
lines — a file built by concatenating 7 originally-separate service files,
per its own section comments: "From aiBackboneService.js", "From
advancedaiBackboneService.js", "From aiCopilotService.js", etc.).

Each concatenated section ended with its own `module.exports = {...}`. In
CommonJS, only the last `module.exports` assignment in a file has any
effect — every earlier one is silently overwritten. This file had the
pattern 9 times, meaning 8 of the 9 sections' real, working exports
(`callAI`/`callClaudeAI`/etc. from the core AI provider section, the
`aiGateway`/`analyze`/`optimize`/`predict`/`recommend` interface that
`organizationManagementService.js`, `tenantManagementService.js`,
`roleManagementService.js`, and `agriculturalIntelligenceService.js` all
call as `aiGateway.analyze(...)`, the `router` needed by `mountRoute()` for
`/api/v1/ai`, `/api/v1/ai-brain`, `/api/v1/ai-gateway`, plus
`aiBrainServiceInstance`, `advancedPredictDemand`/etc.,
`generateCopilotResponse`, `aiOperationIntelligenceService`) were reachable
by nothing — any caller doing `require('.../aiBackboneService').analyze`
would have gotten `undefined`, silently, with no error until something
downstream called it as a function. Compounding this, the diff notes the
*surviving* (last) export block was itself further broken — a syntax-error
pattern (`x || async (a,b) => {}`, invalid because arrow functions need
parens on the right of `||`) that reduced the one export block that did
survive to "3 near-useless fallback stubs".

**Current state:** already fixed in the uncommitted working tree — 8 of the
9 `module.exports` blocks replaced with comments pointing to a single
consolidated block at the end of the file (line ~6985) that explicitly binds
every real method (`aiGatewayInstance.analyze.bind(aiGatewayInstance)` etc.,
since spreading a class instance only copies data fields, not
prototype methods — also called out and fixed in the same pass). Confirmed
consistent with its actual callers: `conversationalAIService.js` and
`aiAgenticCompanionService.js` (both modified in this same working tree)
now `require('./aiBackboneService').callAI` for real LLM calls instead of
returning static template text, and `callAI` is present in the final export
block. **Verified live:** fresh backend boot completed with no crash and
`/api/v1/ai-brain` + `/api/v1/ai-gateway` both reported `"mounted"` in
`/health/comprehensive`'s live output. **No action needed; flagging for the
same reason as F-NEW-2** — this is exactly the kind of fix a future session
might accidentally partially revert while merging.

### F-NEW-4 — LOW (cosmetic, not functional) — duplicate `erp` object key in `/health/comprehensive`'s response builder
**Location:** `backend/src/index.js` lines ~1124–1130 (the `services: {...}`
object literal inside the `GET /health/comprehensive` handler).
```js
services: {
  ai: { status: 'unknown', ... },
  erp: { status: 'unknown', message: 'ERP services not verified' },   // line 1125
  ai_brain: { ... },
  ai_gateway: { ... },
  ai_self_healing: { ... },
  ai_operation_intelligence: { ... },
  erp: { status: mountedRoutes.has('/api/v1/erp') ? 'mounted' : 'not_mounted' }  // line 1130, same key
}
```
The second `erp:` key silently wins (verified live: response shows
`"erp":{"status":"mounted"}`, the correct/intended value), so this is not
currently producing wrong data — but it's dead, misleading code that a
linter with `no-dupe-keys` would flag, and the next person editing this
block might reasonably assume the first `erp` entry is the one in effect.
**Remediation:** delete the first (line 1125) `erp:` entry.

### F-NEW-5 — Verified clean — `productReviewService` triple-duplication was already resolved correctly, no route regression
**Location:** `backend/src/services/productReviewService.js` and
`backend/src/services/commerce/productReviewService.js` (both -434 lines in
git status) vs. `backend/src/services/legacy/productReviewService.js`
(unchanged, canonical).

Both modified files are now thin one-line re-exports of
`services/legacy/productReviewService.js`, with a comment explaining the
rationale (byte-identical older duplicates, one referenced only by an
unmounted dead route file `routes/commerce/marketplaceEnhancements.js`, the
other referenced only by `services/index.js` which nothing requires).
Verified: `routes/commerce/marketplaceEnhancements.js` is confirmed **not**
`require()`'d anywhere in `index.js` (the live, mounted file at
`/api/v1/marketplace` is the different, root-level
`routes/marketplaceEnhancements.js`, which already called
`services/legacy/productReviewService` directly). Verified all 9 methods
either duplicate file's callers use (`createReview`, `getProductReviews`,
`getProductReviewStats`, `markReviewHelpful`, `updateReview`,
`deleteReview`, `moderateReview`, `getUserReviews`, `reportReview`) exist on
the canonical `legacy/productReviewService.js`. No handler-existence risk
introduced by this consolidation.

### F-NEW-6 — Verified clean — `aiFeedbackService.js` rewrite (in-memory → Postgres) has no orphaned old-API callers
**Location:** `backend/src/services/aiFeedbackService.js` (rewritten this
session from an in-memory `AIFeedbackService` class with
`recordFeedback(operationId, feedback)`/`getFeedback(operationId)`/
`analyzeFeedback()` to a real Postgres-backed module with
`recordFeedback(feedbackData)`/`getOverallMetrics()`/
`generateImprovementSuggestions()` against a new
`ai_response_feedback` table).

The table (`backend/src/database/migrations/9998_ai_response_feedback.sql`,
untracked/new) matches the new code's columns exactly
(`user_id, session_id, request_id, feedback_type, rating, comment`). Only
one real caller exists anywhere in the backend —
`backend/src/core/claudeAICoordinator.js` — and it was updated in the same
working tree to call the **new** method names
(`this.aiFeedback.recordFeedback(feedbackData)`,
`.getOverallMetrics()`, `.generateImprovementSuggestions()`), not the old
ones. `claudeAICoordinator.js` is reachable via
`routes/claude/unifiedAIRoutes.js` and `routes/unifiedAIRoutes.js`, both
mounted. No dangling call to the removed `getFeedback`/`analyzeFeedback`/
`initialize`/`init` API exists anywhere in the repo (grepped clean). No
route-level contract break from this rewrite.

### F-NEW-7 — INFO, not a bug — `aiAgentRoutes.js`/`coldStorageRoutes.js`/`healthRoutes.js` diffs are all internally consistent
Spot-checked all three modified route files against their backing services:
- `aiAgentRoutes.js`: added `authMiddleware`/`requireRole('admin')` to 4
  previously-unauthenticated mutation endpoints (`POST /agent`,
  `PUT /agent/:agent_name`, `DELETE /agent/:agent_name/memory`,
  `POST /tool`). All 8 methods the route file calls on `aiAgentService`
  (`registerAgent`, `updateAgent`, `clearAgentMemory`, `registerTool`,
  `executeAgentTask`, `coordinateAgents`, `getAgentStatus`, `getAllAgents`)
  exist on the service. Genuine security hardening, not a functional
  change.
- `coldStorageRoutes.js`: added 6 new endpoints
  (`GET /status`, `GET/POST /facilities/:facilityId/{utilization,
  capacity-planning,book,temperature,alerts,compliance}`) plus switched
  `GET /facilities` from `getFacilities` to `getFacilitiesWithStatus`. All 9
  service methods called (`getSystemStatus`, `getFacilitiesWithStatus`,
  `getUtilization`, `getCapacityPlanning`, `bookFacility`,
  `recordTemperatureReading`, `getTemperatureReadings`,
  `getTemperatureAlerts`, `getComplianceStats`) exist on
  `services/legacy/coldStorageService.js` (which itself merges in
  `modules/M078/service.js` at the bottom via `Object.assign` — confirmed
  `M078/service.js` exists on disk, so this merge doesn't crash on
  require).
- `healthRoutes.js`: gated `/health/detailed`, `/health/checks`,
  `/health/checks/:name` behind `authMiddleware` **only in production**
  (`protectDiagnostics` is a no-op passthrough when
  `NODE_ENV !== 'production'`) — reasonable for local/dev ergonomics, but
  worth being aware these three diagnostic endpoints remain fully
  unauthenticated in every non-production environment, including whatever
  this app considers "staging" if `NODE_ENV` isn't set to `production`
  there. Also fixed a real pre-existing bug in the same diff:
  `duration: Date.now() - Date.now()` (always `0`) → `Date.now() - startTime`
  in the per-check timing inside `HealthCheckRegistry.runAll()`.

---

## Carried forward, unchanged from the prior audit (not re-verified this pass)

Per the task's explicit scoping, F6 and F8 were not re-run (each is a
multi-hour full cross-reference). F1–F5, F7, F9 were likewise not
individually re-checked this pass — nothing in this session's diffs touched
`platformCoreRoutes.js`, `animalHealthRoutes.js`,
`{goat,sheep,pig}Routes.js`, `pigRoutes.js` (FCR), `M056/routes.js`,
`sowingAPI`/`floricultureAPI` comments, or the axios interceptor, so there
is no new information changing their status. Restated verbatim from the
prior report for continuity — **treat as leads to re-verify, not settled
fact**, same caveat the prior audit itself carried:

- **F1** — `platformCoreAPI` frontend calls 9 methods with no matching
  backend route (`platformCoreRoutes.js` only defines 5 endpoints).
- **F2** — animal-health: 4 `DELETE` + 1 `PUT` frontend calls, no matching
  backend route/verb.
- **F3** — goat/sheep/pig breeding-outcome frontend calls an extra path
  segment (`/kidding-outcome` etc.) the backend never defines.
- **F4** — `GET /pig/herd/:id/fcr` has no backend route.
- **F5** — M056 `PUT`/`DELETE /modules/m056/:id` frontend calls, backend
  only has `/:id/status` and `/:id/refund`.
- **F6** (deferred per task instructions) — ~150 frontend-ahead-of-backend
  endpoint calls across ~20 resource families, ~89 of them
  self-documented in `api.js`'s own comments.
- **F7** — 2 confirmed stale "no backend route" comments in `api.js`
  (`sowingAPI`, `floricultureAPI`) where a real backend now exists.
- **F8** (deferred per task instructions) — 91 backend mount prefixes with
  zero frontend textual reference; ~10 confirmed dead, 3 confirmed
  intentional stubs, ~78 unverified. **Note:** given F-NEW-2's discovery
  that `mountRoute()` was silently failing for every genuine router until
  this session, some fraction of F8's "orphaned/unbuilt" `mountRoute()`
  services may actually have been unreachable-until-now rather than
  unbuilt — this list should be re-run, not assumed unchanged, once the
  mountRoute fix is committed.
- **F9** — no systemic frontend auth-wiring gap (still true; nothing in
  this pass's diffs touched the axios interceptor).

---

## Metrics

- Files re-inspected against their backing services this pass: 7 modified
  route/service files (`aiAgentRoutes.js`, `coldStorageRoutes.js`,
  `healthRoutes.js`, `aiAgentService.js`, `aiFeedbackService.js`,
  `commerce/productReviewService.js`, `legacy/aiAgenticCompanionService.js`,
  `legacy/aiBackboneService.js`, `legacy/conversationalAIService.js`,
  `legacy/productReviewService.js`, `productReviewService.js`) + 1 deleted
  route file + `index.js`'s diff.
- `node -c` syntax check: 18/18 modified/new backend files clean.
- Live boot test: clean (only expected no-Postgres/no-Redis
  `ECONNREFUSED` noise, consistent with every prior session's boot log in
  `.ai/tasks/ACTIVE.md`); server reached `AFRERA Backend Server running on
  port 3003`.
- Live HTTP smoke tests run: 6 (`GET /health` → 200, `GET
  /api/v1/seller-ranking/sellers` → 400 confirming live mount, `POST
  /api/v1/clinical-nutrition/assess` → 401 confirming `mountRoute()` fix
  works, `GET /health/detailed` → 200, `GET /health/comprehensive` → 200
  with `mounted: 157 / failed: 8`). All backend processes from this audit's
  test boots were terminated at the end of the session.
- Findings this pass: 7 new (2 critical-already-fixed, 1 low cosmetic, 3
  verified-clean/no-regression, 1 informational), plus 1 explicit
  seller-ranking safety check (resolved), plus 9 carried-forward findings
  from the prior audit (F1–F9, 2 explicitly deferred per task scope) not
  re-verified this pass.
- Git state at time of audit: branch `audit/ui-api-fix`, 16 modified
  tracked files + 1 deletion + 9 new untracked files (fresh `git status`
  re-read immediately before writing this report, per instructions, since
  other sessions are concurrently editing this repo).
