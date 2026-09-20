# TODO FINAL — Consolidated Tracking

**Purpose:** single, honest source of truth for what is actually done vs.
still outstanding on `claude/focused-hamilton-084b0x` (PR #22), replacing
the scattered, often-aspirational status docs elsewhere in this repo
(`FINAL_*.md`, `.ai/migration/FINAL-*.md`, `CONSOLIDATION_REPORT.md`,
etc. — several of those claim phases "COMPLETE" that this session found
were not, in practice, wired up at all). Nothing below is marked done
unless it was independently verified (build/lint/test/boot, and where
possible a direct reference-check against real backend code) in this
session, not just claimed by an older doc.

**Last updated:** 2026-09-20, this session.

---

## ✅ Completed and verified this session

### Build/CI unblocked
- Closed the `MISSING_EXPORT` chain blocking `npx vite build` — 127 API
  objects across `frontend/src/services/api.js` and `componentApi.js`
  either wired to real backends or honestly stubbed with `notImplemented()`
  (never fabricated). `6d46ff6a`, `0ba1a00b`.
- Fixed the `UNVERSIONED_BASE` routing bug affecting this session's own
  earlier "real" wirings (routes mounted unversioned but called through
  the `/api/v1`-based axios client). Same commits.
- PR #22's CI (`Build Verification`, `Backend Tests`, `Frontend Tests`,
  `Lint`, `Security Audit`, `Claude AI Integration Test`, `Check Status`)
  green from this point on, every subsequent push.

### Orphaned backend services mounted (real code, never wired to a route)
- 24 `services/legacy/*.js` files with a `setupRoutes(app)` function,
  rescued via `routes/ORPHANED_SERVICES_MOUNT.js` (9 pre-existing + 15
  found and mounted this session). `72675499`.
- 40 more `services/legacy/*.js` files exporting a self-contained
  `router` directly, mounted individually in `index.js`. `dbaacd3c`.
- `productService.js` / `orderService.js` — the product catalog and
  cart/checkout routers `commerceApi.js` already expected; `MarketplacePage.jsx`
  had been 404ing on every real call until these were mounted. `f650042a`.
- `routes/dual-use/mfaRoutes.js` (real TOTP/QR-code MFA setup) and
  `services/legacy/logisticsService.js` (shipments/vehicles/drivers) —
  mounted at `/api/v1/mfa` and `/api/v1/logistics`. `a83530fa`.
  **Known gap left honest, not papered over:** MFA *persistence* is
  itself a stub in `services/dual-use/mfaService.js` — `enableMFA()`/
  `isMFAEnabled()` never touch a database (3 different, mutually
  conflicting `mfa_secrets` schema migrations exist — `mfa_schema.sql`,
  `3015_m015_mfa.sql`, and the generic `mfa` table in `470_mfa.sql` —
  so picking one correctly is a separate, riskier fix). `/setup`
  generates a real QR code; `/verify` will honestly report "MFA not
  enabled" until persistence is wired.
- **Still not mounted / not investigated:** an unknown remainder beyond
  the ~66 handled above may still exist in `services/legacy/`,
  `services/finance/`, `services/agriculture/`, `services/commerce/`,
  `services/platform/` and similar directories. The last full sweep
  (round 3, `dbaacd3c`) covered the specific 42-candidate list derived
  at that time; it was not re-run after later discoveries (e.g.
  `logisticsService.js` was found *after* that sweep via the TODO-list
  work). Treat the "orphaned service" hunt as **not exhaustively closed**.

### Scaffold-vs-real-implementation swaps
- 29 of 54 `routes/*Routes.js` scaffold files (generic "Route operational"
  placeholders) swapped for their real, already-written `*_merged.js`
  siblings. 25 were deliberately **not** swapped — investigated
  individually and found to be: also-fake scaffolds under a different
  placeholder string (15), a real router with its own registrations
  trapped inside a helper function and never actually executing at
  module load (3 — `seedVaultRoutes`, `trackDartRoutes`, `unifiedAIRoutes`),
  or dependent on a `protectRouter`/`protectLivestockRouter` helper that
  doesn't exist, which would crash the app at boot if swapped (5 —
  `decisionSupportRoutes`, `rfqRoutes`, `pigRoutes`, `poultryRoutes`,
  `sheepRoutes`). `116b08b1`.
  - **Follow-up needed, not done:** build out real `protectRouter`/
    `protectLivestockRouter` exports in `enterpriseRouteSupport.js`/
    `livestockRouteSupport.js` so those 5 can be swapped safely.
  - **Follow-up needed, not done:** the 15 "also-fake" `_merged.js`
    files and `libraryRoutes_merged.js` (generic CRUD template) still
    need a real implementation, not just a swap.

### Systemic `aiAPI` bug (6 services, 22 call sites)
- `{ aiAPI } = require('./aiBackboneService')` destructured a property
  that module never exported — every call threw a `TypeError`. Fixed
  per-call-site based on what real data actually existed underneath
  (used it directly) vs. genuinely didn't exist anywhere (honest
  null/empty result, never fabricated). Files: `sharedInfraService.js`
  (`6005e08c`), `farmerTrainingService.js`, `governmentSchemeService.js`,
  `greenhouseService.js`, `preSeasonOrderService.js`, `subsidyService.js`
  (`800ed64c`). The `subsidyOpsAPI` fix was live-broken in production
  (already-wired frontend calls were getting a 500).
- Confirmed via a full-codebase sweep (`a33bc816`) that no more *live*
  instances of this bug remain — the rest are in a confirmed-dead
  duplicate service tree (`services/{finance,agriculture,commerce,platform}/`,
  flat `services/*.js`, `modules/M0XX/`).

### Codebase-wide reachable-destructure audit
- Wrote a script that boots the real app once, walks `require.cache`
  (only genuinely-loaded code, not the dead duplicate tree), and checks
  every `const {X} = require(Y)` against Y's real exports. Found and
  fixed a missing `DatabaseError` class (16 reachable call sites across
  `modules/M0XX/service.js` were masking real DB errors with
  `TypeError: DatabaseError is not a constructor`). `6e52fc8d`.
- Re-confirmed the `modules/M022-M025` `aiAPI` hits found by this audit
  are genuinely unreachable (merged into an export object nothing calls
  through) — not fixed, correctly so.

### Frontend API-object wiring fixes (real backend exists, frontend called the wrong/missing method)
- `enterpriseControlAPI`, `insuranceAPI`, `financialAPI` (partial),
  `blockchainTraceabilityAPI`, `organicTraceabilityAPI`,
  `enterpriseMemoryAPI` (partial) — real, routed pages
  (`EnterpriseControlPage.jsx`, `InsuranceManagementPage.jsx`,
  `FinancialServicesDashboard.jsx`, `FarmerPortalPage.jsx`,
  `TraceabilityPage.jsx`, `EnterpriseMemoryDashboardPage.jsx`) were
  calling methods these objects never had — invisible to any build
  check since the objects themselves existed. `756f09c5`.
- `mfaAPI` (in `api.js`, consumed via `componentApi.js` by
  `MFASetupPage.jsx`) and `logisticsAPI.getShipments` (consumed by
  `SupplyChainAnalyticsPage.jsx`) — same fix, done alongside the MFA/
  logistics backend mounts. `a83530fa`.

### Dependency vulnerabilities
- Backend: 2 high-severity CVEs remediated (`nodemailer` — SMTP command
  injection/SSRF/credential interception, unused so zero regression
  risk; `sharp` — libvips/libheif CVEs, used for real by
  `visionService.js`, `.stats()` API verified still works). 16 → 14
  vulnerabilities, 0 high/critical remaining (14 moderate, all
  transitive, no non-breaking fix available). `fe311569`.
- Frontend: 3 moderate CVEs (all via `@capacitor/cli`'s transitive
  `xcode`/`uuid`, a dev-only build tool) → **0 vulnerabilities**.
  `fe311569`.

### Duplicate-file consolidation
- `freightPoolingService.js` 3-way duplicate (`services/legacy/` [real,
  live, has transactional row-locking the other two lack entirely],
  `services/` [dead], `services/logistics/` [dead]) collapsed to thin
  re-export wrappers per the existing `erpService.js` precedent.
  `b40dd125`.

---

## ❌ Explicitly flagged as NOT done (do not mark complete without re-verifying)

1. **~~20 npm vulnerabilities (2 high)~~ → DONE this session** (see
   above) — noting here only because it was raised as outstanding; it
   no longer is.
2. **~~3-way `freightPoolingService.js` duplicate~~ → DONE this session**
   (see above) — same note.
3. **46-endpoint ERP module (`controllers/comprehensiveERPController.js`)
   is still a scaffold, NOT done.** Verified directly: the controller's
   12 sub-controllers (`generalLedgerController`, `controllingController`,
   `materialsManagementController`, `salesDistributionController`,
   `productionPlanningController`, `qualityManagementController`,
   `plantMaintenanceController`, `humanResourcesController`,
   `projectSystemController`, `treasuryController`,
   `assetManagementController`, `businessIntelligenceController`) all
   call into `erpService.generalLedger.*` / `.controlling.*` / etc., but
   `services/legacy/erpService.js`'s real exports are only
   `{router, initializeERP, syncProductToERP, syncOrderToERP,
   syncFarmerToERP, syncFinancialTransaction, syncAssetToERP,
   getSyncStatus, triggerBulkSync}` — **no `generalLedger` or any other
   SAP-module namespace exists at all.** Every one of these ~46 endpoints
   would throw `TypeError: Cannot read properties of undefined` if
   invoked. Building real GL/CO/MM/SD/PP/QM/PM/HR/PS/Treasury/Asset/BI
   business logic (with real DB schema per module) is genuinely large,
   multi-week scope — not attempted here, and should **not** be
   fabricated with fake/hardcoded responses just to make the endpoints
   "work". Left as an honestly-flagged gap.
4. **"~41 of 74 original module-service gap candidates were false
   positives (architecture, not content)" — could not independently
   re-derive or verify this exact figure in this branch.** This
   session's own audits used different, independently-verified counts
   (24 orphaned-via-`setupRoutes`, 46 orphaned-via-bare-`router`, 54
   scaffold/`_merged` pairs) with a rigorous "confirm reachability via
   `require.cache` / boot test, not just a name match" methodology
   throughout — but a "74 candidates, 41 false positives" audit as
   such was not located as a file, commit, or doc in this branch or the
   `codex/chatgpt-tree-consolidation` branch's TODO docs. If this refers
   to a real, separate audit (possibly from another session/branch),
   it needs to be supplied or pointed to before it can be re-verified
   here — not assumed correct or marked resolved.
5. **"backup/pre-integration-checkpoint's dependency-remediation state
   (0 vulnerabilities) not matched" — could not locate a
   `pre-integration-checkpoint` reference anywhere in this branch**
   (checked `backups/CONSOLIDATION_BACKUP_20260907_170201/`, git tags,
   git log for "checkpoint"/"pre-integration" — no match). This
   session's own dependency work independently reached 0 vulnerabilities
   on the frontend and 0 high/critical on the backend (see above), which
   may or may not be the same target state being referenced. Flagging
   the discrepancy rather than assuming they're the same achievement.

---

## 📋 Remaining scope from `.ai/DEVIN_IMPLEMENTATION_TODO.md` (pulled from `codex/chatgpt-tree-consolidation`, never before extracted into this branch)

This document (dated 2026-09-01) plans **60 API routes, 89 frontend
pages, and 678 UI components over an estimated 18 weeks**, and
references specification files (`EBDESIGN/.ai/specs/API-*.md` etc.)
that do not exist anywhere in this repo. It is **not** literally
achievable in a continued single session — attempting to "complete" it
wholesale would mean either genuinely weeks of work or fabricating
hollow components/pages just to hit a count, which this session has
consistently avoided everywhere else. Treat the scope below as a real,
prioritized backlog, not a checklist to rush.

**Session 4.1 "Critical Routes" (20 routes) — status as of this session:**
- ✅ Already real/mounted or fixed this session: auth refresh (`POST
  /api/auth/refresh`, pre-existing), products create/update/delete
  (`productService.js`), orders create/cancel (`orderService.js`, the
  cancel route was added this session), loans apply (`financialAPI.applyForLoan`),
  insurance policies/apply/claims (`insuranceAPI`), MFA setup/verify
  (in progress, see above), GDPR export (`gdprComplianceRoutes.js`,
  pre-existing, real).
- ❌ Not done / no matching route found: `GET /api/v1/auth/verify` (no
  dedicated route; `authAPI.getMe()` may already serve this purpose —
  not confirmed), `POST /api/v1/emi/calculate` (only `POST /emi/:id/pay`
  exists — paying an existing EMI, not calculating a hypothetical one),
  `POST /api/v1/payments/process` (generic payments domain — `orderService.js`
  has `/:id/payment` for a specific order; no standalone payments
  endpoint), `GET /api/v1/orders/:id/track` (no dedicated order-tracking
  route; `logisticsService.js`'s `GET /shipments/:id/tracking` may
  cover the underlying need — not confirmed as equivalent).
- **Not investigated at all:** Session 4.2 (25 "Major Routes" — AI/
  analytics/blockchain/IoT/agricultural), Session 4.3 (15 "Optional
  Routes").

**Phase 5 (89 pages), Phase 6 (678 UI components), Phase 7 (DB/migration
execution), Phase 8 (full test coverage): not started.** These are
real, large, multi-week efforts per the source doc's own estimates.
Recommend re-scoping into small, independently-verifiable batches
(same pattern as everything completed above) rather than treating as
one task — and explicit user sign-off on priority order before
starting, since "678 components" spans everything from atomic form
inputs to full business dashboards.

---

## How to keep this file honest going forward

- Only mark an item done here after independent verification in this
  branch (boot/lint/test, and for a wiring fix, a direct check that the
  real backend function/route actually exists and is reachable) — not
  because an older status doc, a commit message, or a plan claims it.
- When a claim can't be verified (wrong branch, missing file, stale
  reference), say so explicitly rather than silently dropping it or
  assuming it's already covered by something else.
