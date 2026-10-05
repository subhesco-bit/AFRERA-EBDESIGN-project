# Repair & launch readiness — 2026-10-05 (Claude)

Branch: `claude/youthful-babbage-bo7b2k`. Started from `0830fb7`, where the
last commit claimed "Tests: All passing / Ready for full deployment". Verified
state at that commit:

| Check | At `0830fb7` | After this work |
|---|---|---|
| `frontend` `npm ci` | **fails** (lockfile out of sync) | passes |
| `frontend` `vite build` | **fails** (`api.js` syntax errors) | passes |
| Frontend named imports that resolve | 194 broken | 0 broken |
| SPA renders | would crash (no `<Router>`) | renders, 0 page errors (headless Chromium) |
| Frontend tests | 54/55 | 55/55 |
| Backend `npm run lint` | 53 errors | 0 (and `no-undef` now enforced) |
| Backend boots | **crashes** on a missing module | boots in ~3 s (dev and production mode) |
| Fresh `npm run migrate` | **fails** at file 1 | all 409 migrations apply |
| `tools/schema-collisions.js` (CI gate) | 39 errors | passes |
| Migration preflight blockers | 6 | 0 |
| CI schema assertions (>=500 tables, >=2000 idx, >=500 FK, spot tables, >=280 crop terms) | n/a | 1464 / 4456 / 1010, all present, 286 |
| Frontend API calls that hit a mounted backend route | ~28% | ~90% (1684 / 1864) |
| Requests to any 404 / error path | hang forever | proper 404 / error JSON |
| Backend test suites failing | 28 | 24 (see "Not fixed") |

## Root cause

Commit `1ec392d` ("resolve: Batch 4 conflicts") merged `21bc33f`
(`audit/ui-api-fix`) into main. **The two histories share no common ancestor**
(`git merge-base 0b13d81 21bc33f` is empty), and for **1,081 files under
`backend/src` + `frontend/src` the merge took the incoming branch's version
wholesale**, discarding main's. The incoming branch is a Sept 5–6 snapshot plus
`21bc33f`'s own (broken) edits, so the merge silently rolled back the Sept 7–8
work: the working 1,572-line `index.js`, the Sept 7 security fixes
(`5e2eb01`: insurance-claim IDOR check, escrow auth, rural-finance schema),
Aug 30 migration fixes, etc. Batch 3 (`2204255`) did the same to `index.js`.

Smaller contributing regressions, all on the same branch:
- `21bc33f` replaced the curated `frontend/src/services/api.js` with a
  generated file that had syntax errors, dropped ~190 exports and read the auth
  token from the wrong localStorage key; also removed `<BrowserRouter>`.
- `21bc33f` rewrote `migrate.js`: numeric (not lexicographic) file order,
  stripped every `END;` (broke all PL/pgSQL bodies), non-atomic transactions,
  ignored `DATABASE_URL`/`PG_*`; and added `001_skeleton_complete_schema.sql`.
- `9e404c7` / `c39316f` ("recover" commits) overwrote fixed migrations with
  stale copies and re-added a renamed duplicate (`063` = `999`).
- `3a8bad0` made 13 aggregate route files export an empty router instead of
  their named routers (76 mounts were `undefined`).

## What was changed (all verified)

Frontend
- `services/api.js`: restored the curated version (`e2020d1`), re-added
  `warningAPI` and a named `api` export, added adapters for 7 auto-routed
  dashboards (real backend paths where they exist; unbacked methods marked
  "no backend route yet" so pages show an error state, not fake data).
- `services/componentApi.js` restored; `main.jsx` `<BrowserRouter>` restored;
  dead imports in `components/index.js`, `router/routes.jsx` fixed;
  `package-lock.json` regenerated.

Backend runtime
- `index.js`: restored main-lineage version (`7ff0055`); ported the API
  warning routes + response-standardizer middleware from `0830fb7`; honours
  `PORT` (was hard-coded 3003); removed a duplicate app-level auth limiter (the
  auth router already has one; the stack locked users out for 15 min).
- `middleware/apiResponseStandardizer.js`: response-time header no longer set
  after headers are sent (threw on every request); content negotiation accepts
  `*/*` (curl / health probes got 406); removed an `Access-Control-Allow-Origin: *`
  fallback that defeated the CORS allow-list.
- `utils/logger.js`: metadata is redacted structurally. It used to regex the
  stringified JSON and `JSON.parse` it back; any 6-digit number became
  `***OTP***`, `JSON.parse` threw inside the logger and the request 500'd
  (this broke registration). Regression tests added.
- `core/dynamicRouteLoader.js`: routes moved into `routes/<domain>/` by the
  Sept 7 consolidation are also exposed at their original flat paths.
- 13 aggregate route files: named routers attached to the exported router.
- Restored `services/legacy/completeAIIntegrationService.js` (deleted while
  still required); fixed moved `sapModuleArchitectureRoutes` path; fixed
  undefined identifiers (`logisticsEnhancementRoutes`, `advancedServiceGenerator`,
  `aiImageGenerationService`); `apiWarningRoutes` imported `requireRole`
  from a module that doesn't export it.

Database
- `migrate.js`: lexicographic order restored, transaction-marker stripping no
  longer removes `END;`, one client per migration, honours `DATABASE_URL`/`PG_*`.
- `001_skeleton_complete_schema.sql` moved to `database/drafts/` (see README).
- Reverse-applied `9e404c7`'s migration regressions (3-way, conflicts resolved
  keeping the newer fixes).
- Collisions resolved with additive `ADD COLUMN IF NOT EXISTS` merges (the
  repo's established policy), marked `merge-collision:<table>` in each file.
- Fixed: UUID/INTEGER FK mismatches, MySQL syntax in `9001`, stale `063`
  guarded, `migration_log` insert, idempotent triggers in `m028`/`m029`,
  new migration adding `user_profiles.phone/oauth_provider/oauth_id`
  (every registration failed without them).

## Not fixed — needs a decision (see PR description)

1. **Restore main's version of the remaining ~1,080 files from the Batch 4
   merge.** Attempted, but the bulk overwrite needs explicit owner approval.
   Until it is done, known live consequences include:
   - the Sept 7 security fixes are **not active** (`services/legacy/
     insuranceClaimsService.js`, `escrowService.js`, `ruralFinanceService.js`,
     `routes/insuranceEnhancements.js` are the pre-fix versions);
   - self-registered users get `status: 'pending'` and there is no activation
     endpoint, so they can never log in (`services/dual-use/authService.js`);
   - `financeInsuranceDomain.test.js` fails (expects the fixed services).
   Command (from repo root):
   `git diff --name-only 0b13d81 1ec392d -- backend/src frontend/src` lists the
   set; the classification script used is described in the PR.
2. 14 DB-backed integration suites (`src/tests/*Service.test.js`) self-register
   with `role: 'admin'` and expect a token. Secure registration never grants
   that, so every call is 401. They need a test helper that seeds an admin user
   and signs a JWT.
3. `services/__tests__/authService.test.js` (from recovery commit `c39316f`)
   tests functions the service never exported.
4. `/api/v1/erp/status` 500s (`erp_synced_at` column missing).
5. Required production secrets (the app refuses to start without them):
   `JWT_SECRET` (>=32 chars), `ENCRYPTION_KEY` (>=32), `OFFLINE_PAYMENT_SECRET`,
   `SYNC_SECRET`, and `FRONTEND_URL` or `ALLOWED_ORIGINS`.
