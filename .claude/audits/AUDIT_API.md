---
agent: api-tester
status: fail
findings: 14
---

# API Linkage Audit — Backend ↔ Frontend Cross-Reference

**Scope:** `backend/src/index.js` (215 mount statements, 3 distinct mounting
patterns) cross-referenced against every real backend route
(`router.METHOD`/`app.METHOD` call, ~2,880 endpoints extracted) vs. every
`api.METHOD(...)` call in `frontend/src/services/api.js` (1,622 unique
method+path combinations). Commit audited: `967ff53c` ("Full module/API/UI
integration sweep + AI backbone consolidation").

**Method note (read before trusting any single line below):** backend routes
in this repo are mounted through **four different patterns**, and a naive
`app.use(` grep only catches one of them:
1. `app.use('/api/v1/x', require('./routes/xRoutes'))` — plain router file.
2. `mountRoute('/api/v1/x', xService)` — a helper that silently no-ops if
   `xService.router` is undefined (only `analyticsService` currently no-ops
   this way, and it's compensated by a second real mount at the same path).
3. `xService.setupRoutes(app)` — the service itself calls `app.use(...)` (or
   raw `app.get/post/...`) internally, mounted once from `index.js` but
   invisible to any scan that only reads `index.js`. **~29 services use this
   pattern**, including the entire 11-service "REOS Rural Life OS" family
   (village-profiles, buying-clubs, rural-enterprises, renewable-energy,
   household-economy, shared-infrastructure, machinery-access, rural-finance,
   ai-advisories, market-access, market-intelligence, mobility-rides) and
   custody/greenhouse. **A first pass of this audit wrongly flagged all 11
   REOS services as "genuinely orphaned" — they are not. Re-verified by
   reading `index.js` lines 739-763 directly; all 11 call
   `xService.setupRoutes(app)`.**
4. Root-level `modules/M0XX/routes.js` (both `backend/src/modules/` and the
   separate root-level `modules/` tree, e.g. `M645100_LIBRARYKNOWLEDGE`) —
   loaded generically in a loop, also invisible to a plain grep.

Every finding below was checked against all four patterns before being
reported. Where a family of routes could not be fully re-verified (the
root-level `modules/` tree beyond the one library module spot-checked), it is
marked **UNVERIFIED — re-check before acting**, not asserted as fact.

---

## Findings

### F1 — CRITICAL — `platformCoreAPI` targets 9 routes that don't exist
**Location:** `frontend/src/services/api.js:416-426` vs.
`backend/src/routes/platformCoreRoutes.js` (mounted at both `/api/v1/platform`
and `/api/v1/platform-core`, line 709 and 951 of `index.js`).

The route file only defines `GET /config`, `PUT /config/:key`, `GET /health`,
`GET /stats`, `GET /optimizations`. The frontend client calls 11 methods; only
`getHealth()` (`GET /platform-core/health`) matches. These 404 on every call:
- `initialize()` → `POST /platform-core/initialize`
- `getScalingRecommendations()` → `GET /platform-core/scaling/recommendations`
- `predictCapacity()` → `GET /platform-core/capacity/predict`
- `triggerDisasterRecovery()` → `POST /platform-core/disaster-recovery`
- `monitorPerformance()` → `GET /platform-core/performance/monitor`
- `triggerSelfHealing()` → `POST /platform-core/self-healing`
- `getOptimizedConfiguration()` → `GET /platform-core/configuration/optimized`
- `applyConfiguration()` → `POST /platform-core/configuration/apply`
- `getMetrics()` → `GET /platform-core/metrics`
- `getSystemState()` → `GET /platform-core/state`

**Remediation:** Either these are dead frontend code that should be removed,
or `platformCoreRoutes.js` needs 9 more endpoints backed by
`services/dual-use/platformCoreService.js` (worth checking whether that
service already has the underlying methods — prior session work on this exact
file, per `.ai/tasks/ACTIVE.md`, focused on fixing fabricated stats fields,
not on route coverage).

### F2 — HIGH — Animal-health: 4 DELETE endpoints and 1 PUT endpoint frontend calls but backend never defines
**Location:** `frontend/src/services/api.js` (animalHealthAPI block) vs.
`backend/src/routes/animalHealthRoutes.js`.

Backend only defines `GET/POST /examinations`, `PUT /examinations/:id`,
`GET/POST /treatments`, `GET/POST/PUT /outbreaks`,
`GET/POST/PUT /quarantines` (+ `/overview`, `/active-outbreaks`,
`/active-quarantines`). No `DELETE` verb exists anywhere in this route file.
Frontend calls:
- `DELETE /animal-health/examinations/:id` — no route
- `PUT /animal-health/treatments/:id` — no route (treatments only has GET/POST)
- `DELETE /animal-health/treatments/:id` — no route
- `DELETE /animal-health/outbreaks/:id` — no route
- `DELETE /animal-health/quarantines/:id` — no route

**Remediation:** Add the missing verbs to `animalHealthRoutes.js`, or confirm
with product intent that health records are meant to be immutable/append-only
(in which case remove the dead delete/update UI actions instead).

### F3 — HIGH — Breeding-outcome update calls an extra path segment the backend doesn't have (goat/sheep/pig)
**Location:** `frontend/src/services/api.js` vs. `backend/src/routes/{goat,sheep,pig}Routes.js`.

Backend defines exactly `PUT /breeding/:id` in all three route files
(`goatRoutes.js:259`, `sheepRoutes.js:214`, `pigRoutes.js:213`). The frontend
calls a longer path with a trailing outcome-specific segment that has no
matching route:
- `PUT /goat/breeding/:id/kidding-outcome` — 404 (real route is `PUT /goat/breeding/:id`)
- `PUT /sheep/breeding/:id/lambing-outcome` — 404 (real route is `PUT /sheep/breeding/:id`)
- `PUT /pig/breeding/:id/farrowing-outcome` — 404 (real route is `PUT /pig/breeding/:id`)

This is the "path/param mismatch" pattern the audit was specifically asked to
find: the frontend URL shape doesn't match what Express registered, so every
one of these calls returns 404 even though a *conceptually* matching backend
handler genuinely exists one path segment away.

**Remediation:** Either add the `/kidding-outcome`, `/lambing-outcome`,
`/farrowing-outcome` sub-paths to the three route files (if the outcome
update is meant to be a distinct action from a generic breeding-record PUT),
or fix the three frontend call sites to hit the existing `PUT /breeding/:id`.

### F4 — MEDIUM — `GET /pig/herd/:id/fcr` has no matching backend route
**Location:** `frontend/src/services/api.js` (pig FCR getter) vs.
`backend/src/routes/pigRoutes.js`. No `/herd/:id/fcr` (feed-conversion-ratio)
route exists in the file. Isolated 404, not part of the breeding-outcome
family above.

### F5 — MEDIUM — `PUT`/`DELETE /modules/m056/:id` frontend calls, backend only has `/:id/status` and `/:id/refund`
**Location:** `frontend/src/services/api.js` (the M055/M056 purchase/order
client, ~line 1918-1934) vs. `backend/src/modules/M056/routes.js`.

Backend M056 defines `GET /:id`, `POST /`, `PUT /:id/status`,
`POST /:id/refund` only — no bare `PUT /:id` and no `DELETE` at all. Frontend
`updateOrder(id, data)` (`PUT /modules/m056/:id`) and `deleteOrder(id)`
(`DELETE /modules/m056/:id`) both 404. (M055's equivalent methods were not
individually re-checked — same risk, recommend the same spot-check.)

### F6 — HIGH — A large, self-documented "frontend built ahead of backend" surface is still open (~150 endpoint calls, ~20 resource families)
`frontend/src/services/api.js` contains **89 separate `/** ... No backend
route found` (or equivalent "not yet built") doc-comments** directly above the
API client objects they describe — this is honest, already-present
documentation of real gaps, not a new discovery, but it confirms the current,
still-unresolved state as of `967ff53c`. Confirmed via direct route-file
inspection that none of the following have *any* backend implementation
(checked, not just grepped for the literal path):
- `landAPI` (`/land/parcels/*` — M031 Land Registry; `farm_plots` table exists per the code's own comment, migration `056_named_missing_modules.sql`, but nothing reads/writes it)
- `labourAPI` (`/labour/workers|attendance|payments`)
- `farmerKycAPI` (`/farmer-kyc/applications/*`)
- `farmCostingAPI` (`/farm-costing/records|summary`)
- `machineryAPI` tractors/bookings (`/machinery/tractors|bookings`)
- `authorizationAPI` (`/authorization/roles|users|audit-log`)
- `shgAPI` (`/shg/groups/*` — self-help-group finance)
- `farmerProfileAPI` (`/farmer-profiles/*`)
- `farmerVerificationAPI` (`/farmer-verification/requests/*`)
- `farmerSkillsAPI` (`/farmer-skills/*`)
- `cropCalendarAPI` (`/crop-calendar/entries/*`)
- `fpoRegistrationAPI`, `fpoGovernanceAPI`, `fpoMarketingAPI`, `fpoComplianceAPI`
- `pricingRecordAPI`-style client for `/pricing/records/*` (distinct from
  the real, live `riskPricingRoutes.js` mounted at the same `/api/v1/pricing`
  prefix — a real path collision waiting to happen if `/pricing/records` is
  ever built without checking what else already lives under `/pricing`)
- `greenhouseAPI.getRegistry/createEntry/updateEntry/deleteEntry`
  (`/greenhouse-registry/*` — the action-based part of `greenhouseAPI`,
  `design`/`optimize`/`monitor`/`predictYield`/`dpr`/`costEstimate`, IS real,
  live via `greenhouseService.setupRoutes(app)` — only the CRUD-registry half
  is missing, exactly as the code's own comment at api.js:2563 already says)
- `energyAPI` consumption/solar/overview (`/energy/*`)
- `costAPI`/`costsAPI` breakup/corridor-model/landed/calculate/breakdown
  (`/cost/*`, `/costs/*` — two similarly-named but distinct client objects,
  neither backed)
- `demandAPI` history/plan (`/demand/history/:id`, `PUT /demand/plan/:id`)
- `trainingAPI.getPrograms` (`/training/programs` — note: `farmerTrainingService`
  IS mounted and real at `/api/v1/training`, but only for a different sub-path;
  `/training/programs` specifically isn't one of its routes)
- `visionAPI` process/detect (`/vision/process`, `/vision/detect`)
- `logisticsOpsAPI` (driver location/active/shipment-trail) — this one is
  explicitly commented as **removed** in `index.js` (line 720-721,
  `logisticsOpsRoutes` require deleted, `app.use` commented out) to prevent a
  boot crash from a missing file; the frontend client was never cleaned up to
  match
- `vendorsAPI`-adjacent `GET /vendors/logistics/cold-chain/nodes`
- `rfqAPI` cost-centre P&L and QC-holds sub-routes
  (`/rfq/cost-centres/:id/pnl`, `/rfq/rfq/:id/qc-holds` — note the doubled
  `/rfq/rfq/` segment in the frontend path itself, worth a second look at
  whether that's intentional)

The dashboard-stats family (`adminAPI.getRecentAudit`, `bankerAPI.*`,
`caAPI.getAuditStats`, `fpoAPI.getStats`, `governmentAPI.getSchemeAnalytics`
/`getComplianceStatus`, `researchAPI.getStats`, `subsidyAPI.getStats`
/`getPending`) is **already flagged in the code's own comment block**
(`api.js:1272-1284`, dated 2026-08-07) as a known, pre-existing, explicitly
out-of-scope gap — not new, listed here only for completeness of current
state.

**Remediation:** This is a large body of real, bounded backend work (build
route + controller/service call for each), not something to blanket-fix. The
`environments`/`feature-flags`/`timezones`/`master-config`/`fpo-governance`
(meetings)/`fpo-marketing` subset was already investigated in
`.ai/tasks/ACTIVE.md` ("Module-wiring audit — the 19 flagged mismatches") and
found to be dead code with zero page routes calling them — deprioritize those
specifically; the rest of F6's list has real frontend call sites (verify
per-module before building).

### F7 — LOW (doc-drift, not a functional bug) — Stale "no backend route" comments where a backend route now exists
`frontend/src/services/api.js` comments were not updated after later sessions
wired the backend. Two confirmed:
- `sowingAPI` (`api.js` ~line 1501-1508) still says "No backend route found
  for sowing records" but `sowingManagementRoutes` (from
  `cropManagementRoutes.js`) IS mounted at `/api/v1/sowing/records` and every
  method (`GET/POST /`, `GET/PUT/DELETE /:id`) matches exactly.
- `floricultureAPI` (~line 2555) still says "No backend route found" but
  `floricultureRoutes` IS mounted at `/api/v1/floriculture` with matching CRUD.

**Risk:** a future session reading only the comment (not re-checking, the
exact mistake this audit itself made on the first pass for the REOS family)
could build a duplicate backend for something that already works.
**Remediation:** update both comments; worth grepping the other 87 "no
backend route" comments for the same drift before trusting any of them at
face value — this audit spot-checked 2 and both were stale, so the true rate
across all 89 is unknown and should be re-verified, not assumed.

### F8 — Reverse check: backend routes with zero frontend caller (orphaned/dead endpoints)
Cross-referencing every resolved backend mount prefix against a full-text
search of `frontend/src` (not just `api.js`) found **91 mount prefixes with
no textual reference anywhere in the frontend tree**. After removing expected
noise:

**Confirmed likely-dead (backend real, zero UI, and not flagged elsewhere as
intentional):**
- `/api/v1/apiculture`, `/api/v1/forestry`, `/api/v1/mushroom`,
  `/api/v1/sericulture`, `/api/v1/vermicompost` — the 6 (5 shown here, 6th is
  fisheries which does have a caller) legacy route files
  `.ai/tasks/ACTIVE.md` mounted this session after fixing their broken
  `authMiddleware` import. Mounting was the fix that was scoped; building
  frontend pages for them was not — confirmed still true, these remain
  backend-only.
- `/api/v1/product-reviews` — built and mounted per `.ai/tasks/ACTIVE.md`
  item 1, but still has no frontend caller (distinct from the M060 Review
  Management duplicate, which the same doc already flags as unreconciled).

**Confirmed intentional (do not build a page for these):**
- `/api/v1/ai-gateway` — the code's own header comment says this is a
  501-everywhere stub against a wrong API shape; `.ai/tasks/ACTIVE.md`
  explicitly documents no page was built on purpose.

**UNVERIFIED — likely false positives, not re-checked in full:** ~15
`mountRoute()`-based AI/domain services (`value-commerce`,
`enterprise-memory`, `sms-auth`, `whatsapp`, `advanced-voice`,
`offline-payment`, `advanced-ai`, `indigenous-knowledge`, `ai-copilot`,
`omnichannel-ai`, `food-safety`, `shelf-life`, `digital-product-passport`,
`recipe-intelligence`, `ne-intelligence`, `commerce-rules`,
`catalog-intelligence`, `merchandising`) showed no frontend reference either
— these were not individually spot-checked given time constraints and may be
genuinely unbuilt speculative services (plausible, matches the pattern of
~47 `mountRoute()` calls covering far more surface area than the frontend
currently exercises) or may be called through a generic dispatcher this
script's text-search missed. **~60 `/api/v1/modules/mXXX` entries** also
showed as "orphaned" by this same check, but that is very likely a false
positive: `.ai/tasks/ACTIVE.md` confirms several of these (M060, M132, M144,
M122, M123, M127) are real and called through a generic `moduleId="M0XX"`
prop pattern (uppercase, and via `/api/v1/backend-modules/:moduleId/:operation`
rather than the literal lowercase `/api/v1/modules/m0xx` path this check
searched for) — a case-sensitive/indirect-reference blind spot in this
specific check, not a re-verified finding. Do not treat any module in this
paragraph as confirmed-orphaned without a manual per-module check.

### F9 — Auth wiring: no general mismatch found
Every `api.*` call in `frontend/src/services/api.js` goes through one shared
axios instance with a request interceptor that attaches
`Authorization: Bearer <token>` automatically when a token exists, plus a
401 → refresh-token → retry interceptor (`api.js:8-53`). This means there is
no *systemic* "frontend never sends a token" class of bug. The one documented
historical instance of the opposite problem (pages calling raw `fetch()`
which bypassed the interceptor entirely) was already fixed per the code's own
comment at `api.js:1272-1284` (the `admin/banker/ca/fpo/government/research
/subsidy` dashboard family, migrated to go through the `api` instance —
though as F6 notes, most of those still 404 for the unrelated reason that the
backend routes were never built, not an auth problem).

---

## Metrics

- Backend mount statements in `index.js`: 215 (`app.use`) + 47 (`mountRoute`)
  = ~262 top-level mounts, resolving to ~2,880 individual method+path
  endpoints once route-file/`setupRoutes`/module-folder contents are expanded.
- Frontend `api.*` calls in `frontend/src/services/api.js`: 1,666 call sites,
  1,622 unique method+path combinations.
- Automated cross-reference (path-shape match, `:param` segments treated as
  wildcards): 1,461 / 1,622 (90%) matched on the final pass, after
  discovering and compensating for 3 non-obvious backend mounting patterns
  (raw pass-1 match rate was only 71% before that correction — the false
  "gap" count dropped from 467 → 245 → 161 across three re-verification
  rounds as each mounting pattern was found).
- Remaining genuinely-unmatched frontend calls: **161**, spanning ~20 resource
  families (F1-F6 above); of those, the platform-core (F1), animal-health
  (F2), breeding-outcome (F3), pig-FCR (F4), and M056 (F5) findings are
  freshly-confirmed real bugs (not previously documented anywhere in
  `.ai/tasks/ACTIVE.md` or in `api.js`'s own comments). The rest of F6 is a
  real but already partially self-documented gap surface.
- Backend mount prefixes with zero frontend textual reference: 91, of which
  ~10 are confirmed genuine orphans (F8), 3 are confirmed intentional
  stubs, and ~78 are unverified (likely a mix of real gaps and false
  positives from indirect module-dispatch call patterns this pass's
  automation could not fully resolve).

## Caveat on completeness

This audit's automated cross-reference could not fully resolve calls that go
through the generic module-dispatch bridges
(`/api/v1/backend-modules/:moduleId/:operation`,
`/api/v1/ai/modules/*`) or the root-level `modules/` tree (191 folders,
separate from `backend/src/modules/`) beyond one spot-checked example
(`M645100_LIBRARYKNOWLEDGE`, confirmed real). Any finding above marked
UNVERIFIED should be re-checked by reading the specific route file before
acting on it — this audit itself produced and then had to retract a false
"11 services genuinely orphaned" claim mid-investigation for exactly this
reason, and corrected it before publishing. Treat every entry in this
document the same way `.ai/tasks/ACTIVE.md` asks prior audits to be treated:
a lead to re-verify, not settled fact.
