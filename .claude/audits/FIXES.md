# FIXES.md — Canonical Repair Queue

Consolidated from the 9 ported audit reports (`AUDIT_BUGS.md`, `AUDIT_CODE.md`,
`AUDIT_DB.md`, `AUDIT_DOCS.md`, `AUDIT_INFRA.md`, `AUDIT_PERF.md`,
`AUDIT_SECURITY.md`, `AUDIT_SEO.md`, `AUDIT_UI.md` — see `PROVENANCE.md`).
Deduplicated across reports where two auditors hit the same code. Every item
is re-verified against **this branch's current code** before being marked
fixed — audit findings are treated as leads, not facts, until checked here.

**Status legend:** ⬜ Open · 🔧 In Progress · ✅ Verified Resolved · ❌ Won't Fix (reason given)

**Rule:** nothing is deleted from this file when resolved — it moves to
Verified Resolved with the commit/verification that closed it. New defects
found while fixing get appended immediately, not tracked separately.

---

## Already resolved (verified before this file was created)

| # | Finding | Source | Status |
|---|---|---|---|
| R1 | 150 static route imports, zero code-splitting | AUDIT_PERF #1 | ✅ This branch uses `config/routes.js` with 118 `React.lazy()` calls, 0 direct page imports. Verified via `grep -c "= lazy(" frontend/src/config/routes.js` → 118, `grep -c "^import.*from '../pages"` → 0. |
| R2 | Tauri desktop CI job has no `src-tauri/` scaffold to build | AUDIT_INFRA #1 | ✅ `frontend/src-tauri/` exists on this branch with `Cargo.toml`, `build.rs`, `icons/` (added in commit `30894395`, already an ancestor of this branch). |
| R3 | TDZ self-reference bug in `insuranceClaimsService.js:331` | AUDIT_BUGS (context) | ✅ Verified fixed — `aiRequest`/`aiResponse` correctly separated at lines 30/48 and 119/133. |
| R4 | 43 missing page imports + undefined `SharedInfraPage` crash | (this session, pre-audit) | ✅ All pages exist, `SharedInfraPage.jsx` (227 lines) properly lazy-imported and routed. |

---

## CRITICAL

| # | Finding | Location | Source | Dependency | Status |
|---|---|---|---|---|---|
| C1 | Desktop nav menus keyboard-inaccessible — 7 `group-hover`-only dropdowns | `frontend/src/components/Header.jsx` (~lines 32-229) | AUDIT_UI #1 | none | ⬜ Open |
| C2 | 21 hand-rolled modals with no `role="dialog"`, no focus trap, no Escape | `frontend/src/pages/*.jsx` (21 files, see AUDIT_UI #2 for list) | AUDIT_UI #2 | none | ⬜ Open |
| C3 | Terraform step in CI has no working AWS auth — will fail `terraform init`, blocking `frontend`/`desktop`/`mlflow_deploy` jobs | `.github/workflows/ci.yml:262-271` | AUDIT_INFRA #2 | none | ⬜ Open |

## HIGH

| # | Finding | Location | Source | Dependency | Status |
|---|---|---|---|---|---|
| H1 | Hardcoded fallback JWT signing secret — full auth bypass if `JWT_SECRET` unset | `backend/src/services/authService.js:28,133` | AUDIT_SECURITY #1 | none — fix first, everything auth-adjacent depends on this being sound | ⬜ Open |
| H2 | Broken access control (IDOR) on product mutation — any authenticated user can edit/delete any product | `backend/src/services/productService.js:476-501,221-328`; same shape in `formService.js:388-407` | AUDIT_SECURITY #2 | after H1 (auth core should be solid first) | ⬜ Open |
| H3 | Blocking synchronous file I/O on login/register/forms/analytics request paths | `backend/src/services/authService.js` (`readAuthStore`/`writeAuthStore`), `formService.js`, `analyticsService.js` | AUDIT_PERF #2 | after H1 (touches same file) | ⬜ Open |
| H4 | Unbounded `Map` growth (memory leak) in `realtimeMonitoringService` | `backend/src/services/realtimeMonitoringService.js` (`stopMonitoring`, lines 130-148) | AUDIT_PERF #3 | none | ⬜ Open |
| H5 | Fragile test-mode pattern: implicit reassignment of hoisted function declarations (41 occurrences, ESLint `no-func-assign`) | `iotIntegrationService.js`, `knowledgeGraphService.js`, `multilingualService.js`, `predictiveAnalyticsService.js`, `valueCommerceService.js` | AUDIT_CODE #1 | none | ⬜ Open |
| H6 | `database/pool.js` is a 2,339-line connection proxy embedding a full mock DB + 20+ leftover `console.log` debug lines | `backend/src/database/pool.js` | AUDIT_CODE #2 | before H3 fix touches `readAuthStore` test-mode paths | ⬜ Open |
| H7 | FK columns without a covering index — 58 FKs, only 23 indexes in base schema | `backend/src/database/migrations/000_base_schema.sql` | AUDIT_DB #1 | none — additive migration only | ⬜ Open |
| H8 | `docker-compose.yml` provisions ~4% of schema (49/1,104 tables), no auto-migrate step | `backend/docker-compose.yml:16` | AUDIT_DB #2 | none | ⬜ Open |
| H9 | Form labels not programmatically associated with controls (~31 files, 217 inputs/32 with `id`) | frontend-wide, e.g. `components/LaboratoryERP/SampleRegistration.jsx:137-199` | AUDIT_UI #3 | none | ⬜ Open |
| H10 | No per-page `<title>`/meta description — every route shares one static tag set | `frontend/index.html`, `frontend/src/App.jsx` routes | AUDIT_SEO #1 | after C1/C2 if `Header`/page shells change | ⬜ Open |
| H11 | No JSON-LD structured data anywhere | `frontend/`, `backend/` | AUDIT_SEO #2 | after H10 (same per-page head work) | ⬜ Open |
| H12 | `OPEN_ITEMS.md` documents `validate-resolution-rules.js` as broken/unwired; script + CI both contradict this (script was rewritten, CI runs it unconditionally) | `docs/OPEN_ITEMS.md:213-230`, `tools/validate-resolution-rules.js`, `.github/workflows/ci.yml:166` | AUDIT_DOCS #1 + AUDIT_INFRA #4 (merged, same finding) | needs a real CI run to confirm pass/fail before editing docs | ⬜ Open |
| H13 | README documents `ANTHROPIC_API_KEY` env var that doesn't exist anywhere in code | `README.md:166-168` | AUDIT_DOCS #2 | none | ⬜ Open |

## MEDIUM

| # | Finding | Location | Source | Status |
|---|---|---|---|---|
| M1 | Auth endpoints use generic 100/min rate limiter, not the dedicated `authRateLimit` (5/min) | `backend/src/middleware/rateLimiter.js:24-28`, `index.js:345,410` | AUDIT_SECURITY #3 | ⬜ Open |
| M2 | `middleware/security.js` (CSRF/XSS/SQLi/AES helpers, 297 lines) never imported anywhere — completely dead | `backend/src/middleware/security.js` | AUDIT_SECURITY #4 | ⬜ Open |
| M3 | OAuth2 `state` param generated but never validated on callback (OAuth CSRF) | `authService.js:870-883,1125-1146` | AUDIT_SECURITY #5 | ⬜ Open |
| M4 | Insecure-by-default JSON file fallback for entire auth system when Postgres unavailable, no lockout logic in fallback path | `authService.js:51-90` | AUDIT_SECURITY #6 | ⬜ Open |
| M5 | 150-module scaffold ~half unimplemented placeholders (82/150 stub `service.js` ≤10 lines) | `backend/src/modules/M001-M150` | AUDIT_CODE #3 | ⬜ Open |
| M6 | `index.js` 899-line monolithic route bootstrap, 6 overlapping ecommerce route groups + 3 ERP route sets | `backend/src/index.js:440-539` | AUDIT_CODE #4 | ⬜ Open |
| M7 | 551 `no-unused-vars` warnings concentrated in ~7 services | backend-wide (ESLint) | AUDIT_CODE #5 | ⬜ Open |
| M8 | Backend lint script has no `--max-warnings` gate (frontend does) | `backend/package.json:11` | AUDIT_CODE #6 | ⬜ Open |
| M9 | `no-case-declarations` (20) + `no-return-await` (26) ESLint violations | various services | AUDIT_CODE #7 | ⬜ Open |
| M10 | README env var walkthrough covers ~12 of ~40 real vars (missing OAuth/Twilio/ERP/security notes) | `README.md:134-176` vs `backend/.env.example` | AUDIT_DOCS #3 | ⬜ Open |
| M11 | No `frontend/.env.example` despite `VITE_API_URL` being required | `frontend/` | AUDIT_DOCS #4 | ⬜ Open |
| M12 | README "Project Structure" section drastically out of date (missing `docs/`, `DOCUMENTATION/`, `afrera/`, `infra/`, `tools/`, 100+ root spec files) | `README.md:76-104` | AUDIT_DOCS #6 | ⬜ Open |
| M13 | 49 stub modules self-report `Status: ABSENT`, no top-level index of which | `backend/src/modules/M0**/README.md` | AUDIT_DOCS #8 | ⬜ Open |
| M14 | `afrera/` second doc tree with unfilled placeholder clone URL, unexplained relationship to real app | `afrera/README.md` | AUDIT_DOCS #9 | ⬜ Open |
| M15 | Race condition + missing double-booking guard in freight pool joins (TOCTOU, unlocked read-check-insert) | `backend/src/services/freightPoolingService.js:96-127` | AUDIT_BUGS #1 | ⬜ Open |
| M16 | "Test-mode" DB-miss fallback fabricates fake HTTP 201 success responses that could leak into production (15 call sites, 3 services) | `consumerHealthService.js`, `arVrService.js`, `giIntelligenceService.js` | AUDIT_BUGS #2 | ⬜ Open |
| M17 | ~29 orphaned duplicate schema files not used by `migrate.js` or anything else | `backend/src/database/*.sql` | AUDIT_DB #3 | ⬜ Open |
| M18 | `database/models/` dead unused model layer (478 lines, 0 references) | `backend/src/database/models/` | AUDIT_DB #4 | ⬜ Open |
| M19 | N+1 write-loop patterns in checkout/sync/IoT paths (merged: DB #5 + PERF #4 — same code, two auditors) | `orderService.js:267-277`, `valueCommerceService.js:408-424`, `offlineSyncService.js:164-176` (failedIds branch only), `offlinePaymentService.js:254-267`, `iotSensorService.js:164-166` | AUDIT_DB #5 + AUDIT_PERF #4 | ⬜ Open |
| M20 | `migrate.js down` doesn't roll back anything — just deletes the tracking row | `backend/src/database/migrate.js:139-154` | AUDIT_DB #8 | ⬜ Open |
| M21 | Migration runner auto-repairs and silently re-executes regex-rewritten failing SQL | `backend/src/database/migrate.js:109-136` | AUDIT_DB #9 | ⬜ Open |
| M22 | PWA manifest duplicate/drifted: `manifest.json` (orphaned, unreferenced) vs `manifest.webmanifest` (live) — merged: INFRA #3 + SEO #6 | `frontend/public/manifest.json`, `manifest.webmanifest` | AUDIT_INFRA #3 + AUDIT_SEO #6 | ⬜ Open |
| M23 | No production deployment step anywhere in CI pipeline (`docker` job builds but never pushes; no real k8s manifests for app) | `.github/workflows/ci.yml` (`docker`, `mlflow_deploy` jobs) | AUDIT_INFRA #8 | ⬜ Open |
| M24 | No `og:image`/`twitter:image` — shared links render with no preview | `frontend/index.html:20-29` | AUDIT_SEO #3 | ⬜ Open |
| M25 | Broken favicon reference (`/vite.svg` doesn't exist) | `frontend/index.html:5` | AUDIT_SEO #4 | ⬜ Open |
| M26 | No `robots.txt`/`sitemap.xml` | `frontend/public/` | AUDIT_SEO #5 | ⬜ Open |
| M27 | Icon-only action buttons frequently have no `aria-label` | frontend-wide (286 buttons, 21/565 files use `aria-label`) | AUDIT_UI #4 | ⬜ Open |
| M28 | Icon-only buttons use sub-AA-contrast gray (`text-gray-400`, ~2.8:1) for actionable icons | same files as M27 | AUDIT_UI #5 | ⬜ Open |
| M29 | 81 grids hard-code column count with no responsive breakpoint | frontend-wide | AUDIT_UI #6 | ⬜ Open |
| M30 | Fixed `BottomNav` has no reserved layout space, can overlap page/footer content | `frontend/src/components/Layout.jsx:33-40`, `BottomNav.jsx:14` | AUDIT_UI #7 | ⬜ Open |
| M31 | Footer social links have no `aria-label` and are dead `href="#"` placeholders | `frontend/src/components/Footer.jsx:21-32` | AUDIT_UI #8 | ⬜ Open |

## LOW

| # | Finding | Location | Source | Status |
|---|---|---|---|---|
| L1 | Route-level auth middleware ordering bug — `adminMiddleware` used without `authMiddleware` first, so route is permanently 401 (fails closed, not exploitable, but fragile) | `backend/src/services/orderService.js:778` | AUDIT_SECURITY #7 | ⬜ Open |
| L2 | Regex/blocklist SQLi+XSS filters trivially bypassable if ever wired in (currently dead code per M2) | `backend/src/middleware/security.js:183-256` | AUDIT_SECURITY #8 | ⬜ Open |
| L3 | Tauri CSP disabled (`null`) with broad filesystem + unrestricted-host network scope | `tauri.conf.json` | AUDIT_SECURITY #9 | ⬜ Open |
| L4 | `"crypto": "^1.0.1"` listed as npm dependency — deprecated shim shadowing Node's built-in (merged: SECURITY #10 + PERF #5's crypto item) | `backend/package.json` | AUDIT_SECURITY #10 + AUDIT_PERF #5 | ⬜ Open |
| L5 | Rate limiters key on `req.ip` without confirmed `trust proxy` config — spoofable via `X-Forwarded-For` behind a reverse proxy | `backend/src/middleware/rateLimiter.js:35,67,92` | AUDIT_SECURITY #11 | ⬜ Open |
| L6 | Near-zero frontend test coverage (1 test file / 572 source files) despite vitest configured | `frontend/src` | AUDIT_CODE #8 | ⬜ Open |
| L7 | Monolithic low-modularity files: `api.js` (3,040 lines currently, 242 functions), backend `index.js` already covered by M6 | `frontend/src/services/api.js` | AUDIT_CODE #9 (line count re-verified: 3,040 not 2,947 — audit was against stale branch, current count updated here) | ⬜ Open |
| L8 | No static typing on frontend (0 `.ts`/`.tsx` files, no PropTypes) | `frontend/src` | AUDIT_CODE #10 | ⬜ Open |
| L9 | No process-level `unhandledRejection`/`uncaughtException` handlers — one overlooked `.catch()` anywhere can crash the whole monolith | `backend/src/index.js` | AUDIT_BUGS #3 | ⬜ Open |
| L10 | 150 module READMEs contain literal `\n` instead of real newlines | `backend/src/modules/M0**/README.md` | AUDIT_DOCS #7 | ⬜ Open |
| L11 | README database section understates schema surface (points to 1 file, 31 exist) | `README.md:270` | AUDIT_DOCS #10 | ⬜ Open |
| L12 | `docs/OPEN_ITEMS.md` (most current gap register) not linked from README | `README.md` | AUDIT_DOCS #11 | ⬜ Open |
| L13 | README documents nonexistent `test:e2e` command | `README.md:364-371` | AUDIT_DOCS #5 | ⬜ Open |
| L14 | Migration filename numeric-prefix collisions (not a correctness bug — informational hygiene) | `backend/src/database/migrations/` | AUDIT_DB #7 | ⬜ Open |
| L15 | Transaction handling duplicated ad hoc in 6 services instead of using existing `withTransaction()` helper | 6 services, see AUDIT_DB #6 | AUDIT_DB #6 | ⬜ Open |
| L16 | Superseded workflow file still committed (`backend/.github/workflows/ci-cd.yml`, self-marked "NEVER RUNS") | `backend/.github/workflows/ci-cd.yml` | AUDIT_INFRA #5 | ⬜ Open |
| L17 | Node version drift: Docker `node:18-slim` vs CI `NODE_VERSION: '20'` | `backend/Dockerfile:6`, `.github/workflows/ci.yml:35` | AUDIT_INFRA #6 | ⬜ Open |
| L18 | No `.dockerignore` for backend build context | `backend/` | AUDIT_INFRA #7 | ⬜ Open |
| L19 | Local dev secrets + obsolete `version:` key in `docker-compose.yml` | `backend/docker-compose.yml` | AUDIT_INFRA #9 | ⬜ Open |
| L20 | 2 CI gates advisory (`continue-on-error: true`) masking known unresolved issues (random() calls, 2 unguarded modules) | `.github/workflows/ci.yml:212-225` | AUDIT_INFRA #10 | ⬜ Open |
| L21 | Unused heavy backend deps: `aws-sdk` v2, `elasticsearch`, `apollo-server-express`+`graphql` | `backend/package.json` | AUDIT_PERF #5 | ⬜ Open |
| L22 | Unused frontend dep `socket.io-client` | `frontend/package.json` | AUDIT_PERF #6 | ⬜ Open |
| L23 | Negligible `React.memo`/`useMemo` usage at 150-module scale, no list virtualization | `frontend/src` | AUDIT_PERF #7 | ⬜ Open |
| L24 | `DataTable` primitive has no horizontal-scroll wrapper (currently dead code, 0 call sites) | `frontend/src/components/common/DataPrimitives.jsx:250-286` | AUDIT_UI #9 | ⬜ Open |
| L25 | `<select>`/`<input>` unbroken 2-col grids inside narrow modals | e.g. `SeedVaultPage.jsx:254` | AUDIT_UI #10 | ⬜ Open |
| L26 | No `eslint-plugin-jsx-a11y` in lint pipeline | `frontend/package.json` | AUDIT_UI #11 | ⬜ Open |
| L27 | No canonical URL tags | `frontend/index.html` | AUDIT_SEO #7 | ⬜ Open |

## INFORMATIONAL (no action required — recorded for completeness)

| # | Finding | Source |
|---|---|---|
| I1 | No SQL-injection vectors found; identifier interpolation properly allowlisted | AUDIT_DB #10 |
| I2 | TDZ self-reference bug class confirmed isolated to the one already-fixed line (21 scan candidates, 100% false positive) | AUDIT_BUGS #4 |
| I3 | `<img>` usage minimal but clean — all 6 tags have `alt` | AUDIT_UI #12 |

## Not audited yet

`dep-auditor` and `api-tester` (2 of the project's 11 defined auditor types) never ran on the stale branch — no `AUDIT_DEPS.md`/`AUDIT_API.md` exist. Dependency vulnerability scanning (`npm audit`) and live endpoint/contract testing are gaps in this queue, not zero-finding clean bills.

---

## Execution order (per dependency column above, and the process below)

1. **Security core first** (H1 → H2 → M1 → M3 → M4 → L1 → L5): JWT secret, then IDOR, then everything else auth-adjacent, since later fixes assume the auth core is sound.
2. **Reliability** (H4, M15, M16, L9): memory leak, race condition, fake-success paths, crash handlers — independent of each other, can interleave.
3. **Database** (H7, H8, M17-M21, L14-L15): indexes and compose fix first (additive, safe), then N+1/model cleanup.
4. **Backend hygiene** (H5, H6, M5-M9, L4, L21): test-mode pattern, pool.js, stub modules, lint gates.
5. **Infra/CI** (C3, H12, M22-M23, L16-L20): Terraform auth, docs/CI reconciliation, manifest cleanup.
6. **Frontend a11y** (C1, C2, H9, M27-M31, L24-L26): nav keyboard access and modals first (blocks all downstream keyboard/SR use of the app), then labels, then contrast/responsive/misc.
7. **SEO** (H10 → H11 → M24-M26, L27): per-page head management first since JSON-LD/canonical depend on it.
8. **Docs** (H13, M10-M14, L10-L13): can run in parallel with anything else, lowest risk.
9. **Perf polish** (L7, L22-L23): after the above, since some of this (api.js split) touches files everything else also edits.

Each item moves ⬜ → 🔧 → ✅ with a one-line verification note (what was checked, what test/build confirmed it) when closed. New defects discovered mid-repair are appended to the relevant severity table immediately, not tracked separately.
