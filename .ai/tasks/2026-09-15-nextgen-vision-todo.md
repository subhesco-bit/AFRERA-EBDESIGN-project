# AFRERA Next-Gen Vision — TODO Backlog

**Source:** User-provided strategic assessment ("digital super-organism" vision),
2026-09-15. Converted from prose into an actionable, staged backlog per the
document's own recommended progression:

> Concept reconciliation → industry baseline → advanced AI → autonomous
> intelligence → futuristic ecosystem

**Ground rule carried over from every prior entry in `ACTIVE.md`:** nothing is
marked done without runtime evidence (boot log, live smoke test, passing
test, or reconciled data). A document claiming "100% complete" is not
evidence — this repo already has ~150 such documents in `.ai/` and root, and
the source assessment explicitly calls that out as the core problem, not a
solution. This backlog must not become another one.

**Reality check on scope:** the source document describes a multi-year,
national-scale platform (ERP, banking underwriting, insurance claims,
engineering CAD/BIM/CFD, federated learning, digital twins, IVR/SMS rural
channels, etc.). It cannot be "completed" in one session, and most of it
cannot be completed at all without: PostgreSQL/Mongo/Redis actually running,
real third-party credentials (banking, DigiLocker, PM-Kisan, payment
gateways), and business/legal decisions (chart of accounts, underwriting
policy, insurance terms) that are not engineering choices. Items below are
flagged `[infra]`, `[credentials]`, or `[business-decision]` where that
applies — those are blocked until the user supplies the missing input, not
things Claude can silently invent.

---

## Stage 0 — Concept Reconciliation (prerequisite for everything else)

Goal: one verified concept→runtime matrix. Exit condition: every concept in
the source doc's Table 1 has a classification (verified working / partial /
scaffold / doc-only / disconnected / duplicated / conflicting / blocked /
proposed) backed by an actual code/runtime check, not a prior report's claim.

- [ ] Build `.ai/architecture/CONCEPT_RUNTIME_MATRIX.md`: one row per concept
      from Table 1 of the source doc, columns = concept → module(s) → route
      file(s) → service file(s) → DB table(s) → frontend page(s) → test(s) →
      classification → evidence (file:line or command output).
- [ ] Reconcile the ~150 `.ai/*COMPLETE*`, `*FINAL*`, `*LAUNCH_READY*` reports
      against actual runtime state; mark each as either "matches reality" or
      "superseded/inaccurate" — do not delete, per CLAUDE.md, but stop trusting
      them as status source.
- [ ] Collapse duplicate module implementations found so far (e.g. the
      already-flagged M060 review system vs `legacy/productReviewService.js`
      duplication in `ACTIVE.md`) into one owner each, or document why both
      are intentionally kept.

## Stage 1 — Industry Baseline (must pass before any "advanced AI" work)

### 1a. Authentication — single coherent identity system [concrete, unblocked]
Confirmed still present in this checkout:
`backend/src/routes/authRoutes.js` mounted at `/api/auth`
(`backend/src/index.js:668`) alongside real JWT verification in
`backend/src/middleware/auth.js`.
- [ ] Read `authRoutes.js` and `middleware/auth.js` in full; confirm current
      state (in-memory users / plaintext passwords / fabricated token format
      claimed by the source doc — verify, don't assume).
- [ ] Decide and implement one identity authority: real password hashing
      (bcrypt/argon2), real JWT issuance matching what `middleware/auth.js`
      verifies, persisted users table (not in-memory).
- [ ] Audit frontend `services/` API clients for inconsistent token
      names/paths; converge on one contract.
- [ ] `[infra]` Requires Postgres reachable to persist users — falls back to
      a clearly-labeled dev-only store with a loud startup warning if DB is
      unavailable, never a silent mock.

### 1b. Data architecture
- [ ] Confirm which of the 96 migrations actually apply cleanly against a
      running Postgres instance `[infra]` — cannot verify without a DB;
      document exact blocker (`npm run migrate` output) rather than assuming.
- [ ] Establish one source-of-truth table per core entity (user, farmer,
      product, order) where duplicates exist.

### 1c. API contract consistency
- [ ] Inventory response/error shape variance across `backend/src/routes/`
      (107 files) — produce a short list of the distinct conventions in use,
      not a full rewrite.
- [ ] Pick one standard (status envelope, error code format) and apply it to
      newly-touched routes going forward; do not mass-rewrite working routes
      without cause (CLAUDE.md: "Do not rewrite working code without
      documented technical reason").

### 1d. Testing & observability floor
- [ ] Repo-stated status: "Test frameworks configured, 0% coverage." Pick 3
      highest-risk flows (auth, an order/payment path, one DB write path) and
      write real tests against them first, not broad shallow coverage.
- [ ] Confirm correlation IDs / structured logging exist or add minimal
      version for the flows above.

## Stage 2 — Sector Journeys (agriculture, marketplace, finance, insurance,
logistics, government schemes)
- [ ] For each sector, produce one real end-to-end journey (state machine +
      wired routes + persisted data + at least one passing integration test),
      starting with whichever sector the user prioritizes — do not fan out
      across all sectors in parallel.
- [ ] `[business-decision]` Insurance/banking underwriting rules, government
      scheme eligibility logic, and chart of accounts must come from the
      user/domain owner — Claude should not invent regulated business logic.

## Stage 3 — Trustworthy AI per component
- [ ] Define minimal AI evidence contract (source, confidence, model/prompt
      version, human-approval flag) and apply it to ONE existing AI service
      end-to-end before replicating the pattern elsewhere.
- [ ] `[credentials]` Real model calls require `ANTHROPIC_API_KEY` (or
      equivalent) configured — currently absent per CLAUDE.md "Known
      Problems." Flag any AI service found returning hardcoded/random output
      instead of a real call or an honest `not_configured` response (same
      pattern already used for `fetchGovernmentLandRecords` per ACTIVE.md).

## Stage 4 — System intelligence (event bus, knowledge graph, workflow
orchestration across sectors)
- [ ] Blocked on Stage 1–3 being real; do not build orchestration on top of
      mocked/duplicated services.

## Stage 5 — Bounded autonomous execution
- [ ] Blocked on Stage 4. Requires explicit approval-threshold policy from
      user before any agent is allowed to execute consequential actions.

## Stage 6 — Futuristic platform (digital twins, federated learning,
national knowledge graph, etc.)
- [ ] Out of scope until Stages 0–5 are verifiably real. Kept in this backlog
      as the source doc's Table 5/6 items, not discarded, per "nothing should
      be removed."

---

## Update — 2026-09-15, same-day follow-up

Ran a 4-way parallel audit (backend wiring, frontend wiring, AI-service
authenticity, database/duplication) against the actual code instead of
against any prior status doc. Corrected real counts, all confirmed by direct
inspection — every one of them understated relative to the CLAUDE.md
narrative, not inflated: **217 route files** (not 107), **286 services**
(not 140+), **409 migration files** (not 96, plus a `failed/` and `repairs/`
subfolder of already-known-broken ones), **203 module folders** (not ~198,
and 184 of ~192 sampled `service.js` files are 13-line re-export wrappers
around `backend/src/services/`, not independent implementations), **393
frontend page files** with **≥157 confirmed orphaned/unrouted** (~40%, not
the "123/150 complete" framing).

### 1a done: auth fix shipped and verified
Mounted the real `services/dual-use/authService.js` router (bcrypt, real
`jsonwebtoken`, rate limiting, JSON-file fallback store, 2FA, OAuth) at
`/api/auth` in place of `routes/authRoutes.js`'s in-memory/plaintext/fake-token
mock. Confirmed the severity was worse than assumed: the mock's fabricated
`jwt_<id>_<timestamp>` tokens were being **rejected** by the real
`jsonwebtoken`-based verifier in `middleware/auth.js`, which every protected
route already used — so authentication was broken end-to-end for anyone who
actually logged in through the live endpoint, not just insecure.

While verifying, found and fixed two more bugs blocking that same path:
- `database/connection.js`'s `initPostgreSQL()` never reset the module-level
  `pgPool` to `null` on a failed connection test, so `getPostgreSQL()` always
  returned a truthy-but-broken pool — every `if (!pg) fall back` check in the
  codebase (including the one the real auth router needs) silently never
  fired. Fixed.
- `backend/src/index.js` eagerly `require()`d `routes/index.js` at the top
  of the file for no reason (its only mount point was already commented out
  as dead), and that chain required a since-deleted
  `services/legacy/completeAIIntegrationService.js`, crashing the *entire*
  server at boot before any route mounted. A real 1355-line implementation
  of that file was found intact in a backup folder and initially restored,
  but **`origin/main` already carries its own (132-line, placeholder,
  fabricated-confidence-score) version of the same file** — per instruction,
  not overwriting work already on `main`; kept main's version as-is.

Verified end-to-end outside this sandbox's missing-Postgres/no-node_modules
constraints: installed backend deps, booted the real auth router standalone,
confirmed register → login → a protected route round-trips with real
bcrypt+JWT, a wrong password is rejected, and an old-format fake token is
correctly rejected. Existing `authRoutes.test.js` (9 tests, exercises the
now-unmounted mock directly) still passes unchanged.

### CI is red on `main` independent of any of this
All 5 checks (Lint, Frontend Tests, Build Verification, Security Audit,
Claude AI Integration Test) fail before running anything: `actions/setup-node@v4`
uses `cache: npm` but there's no lockfile at the repo root (`backend/` and
`frontend/` have their own). Confirmed pre-existing on `main` itself, not
introduced by this branch. Fix is understood (point `cache-dependency-path`
at both lockfiles, or run installs per-directory) but not applied here —
tracked as a follow-up, separate from this auth fix.

### Boundary going forward
`main` has moved 121 commits ahead of where this branch started, from
another AI session's work (placeholder-stub fixes, `.ai/` doc churn, a
4-agent coordination framework, etc.) — merged that in rather than working
from a stale base. Per explicit instruction: don't overwrite or "fix" files
another session already touched on `main` just because this audit disagrees
with the approach taken (e.g. the placeholder `completeAIIntegrationService.js`
above) — flag it here instead and work on gaps *not* already claimed.

## Update — 2026-09-15, second follow-up: frontend auth wiring + a giant pre-existing build break

Continued the same live-vs-dead-code audit pattern from the backend fix
onto the frontend, since the backend now issues correct tokens but nothing
guaranteed the frontend could actually use them.

### Frontend auth was *also* broken end-to-end, independently of the backend bug
- `LoginPage.jsx` and `RegisterPage.jsx` (the actual live login/register
  pages, reached from `App.jsx`) import `{ authAPI }` from
  `services/api.js` - a 5,300+ line grab-bag of hundreds of API objects
  that **never defines `authAPI` at all**. Every real login/register attempt
  crashed on render (`Cannot read properties of undefined`). The correct,
  complete `authAPI` (matching the real backend's `/auth/register`,
  `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/2fa/*`)
  already existed in `services/coreApi.js` - itself never imported by
  anything in the live app until this fix (same "correct but orphaned"
  shape as the backend's `authService.js` router). Fixed both pages' import.
- `coreApi.js`'s `authAPI` called its endpoints as `/auth/login` etc.
  relative to `apiClient.js`'s base URL, which is `.../api/v1` - but the
  real backend mounts auth unversioned at `/api/auth` (`backend/src/index.js`),
  like the large majority (213/221) of routes; only 8 use `/api/v1/*`.
  Fixed by building an explicit `/api/auth` base for auth calls only,
  rather than changing the shared client's base URL (unknown blast radius
  on whatever else already depends on `.../api/v1`).
- `apiClient.js`'s 401-refresh interceptor read `access_token`/`refresh_token`
  (snake_case) off the refresh response, but the real backend returns
  camelCase `accessToken`/`refreshToken` - so a successful refresh always
  stored `undefined` and silently broke re-authentication. Fixed to match.
- Backend-side: `authService.js`'s `refreshAccessToken()` fallback
  (no-Postgres) path looked up the user by `payload.email`, but a refresh
  token's JWT payload only carries `{userId, tokenType}` - no email - so
  refresh always failed with "User not found" in fallback mode. Added
  `getFallbackUserById()` and used it instead.
- Verified all four with a live register -> refresh -> protected-route round
  trip (backend) plus `eslint` on every changed frontend file.

### `services/api.js` itself was unparseable - blocking every page that touches it
While setting up a real `vite build` to validate the above (previously
never attempted in this environment), the build failed immediately on a
`SyntaxError` in `services/api.js`, unrelated to anything above:
- `export void visualizationAPI = {` and `export const void warehouseAPI2 = {`
  (two corrupted `export` statements - `void` where `const` belonged).
- A misplaced `export default api;` sitting in the middle of the file where
  `export const jurisdictionAPI = {` should have been - the export line was
  gone entirely, the object body simply continued under the wrong statement.

Fixed all three (typo correction + restored the missing declaration +
moved the default export to the actual end of the file). Confirmed with
`@babel/parser` that the file now parses cleanly.

### Then the real scale showed up: 509 build errors, not caused by any of this
With `services/api.js` parseable, a full `npx vite build` ran for the first
time and surfaced **509 errors**, none touching any file from this session's
changes. Root cause for the two clearest ones: `components/ui/button.jsx`
and `components/ui/card.jsx` are one-line stub components (`export default
function Button(props) {...}`) while the app-wide convention, used across
what is likely dozens-to-hundreds of pages, expects a full shadcn/ui-style
named-export API - `{ Button }` with variant/size props, and a compound
`{ Card, CardContent, CardHeader, CardTitle, ... }` where only `Card`
exists today, as a default export, with no sub-components at all. This is
a real component-API design gap, not a mechanical typo like the ones
above - **not fixed in this session**, flagged here instead:
- [ ] Design the actual `Button`/`Card`/(likely other `ui/*` primitives -
      not yet enumerated) component API by reading a representative sample
      of call sites first, then implement it once and let all ~500 error
      sites resolve together, rather than special-casing importers.
- [ ] Get a full, categorized error list (509 errors truncated in terminal
      output after the first handful) to check whether other root causes
      exist beyond `ui/button.jsx` and `ui/card.jsx` before committing to
      "fix these two files and the count drops to ~0."
- [ ] Until this is fixed, **`npm run build` has likely never produced a
      working production bundle in this environment** - worth confirming
      whether it ever succeeded elsewhere (a different Node/Vite version?)
      or whether this is net-new breakage from an unpinned Vite major
      version bump, before assuming it's long-standing.

### On the earlier ChatGPT-coordination question
User asked whether `.ai/CHECKPOINT.md` / `.ai/README.md` (added by the
other session, a "4-agent coordination: Claude + Devin + Visual Studio +
ChatGPT" framework, dated 2026-09-11) contained an instruction for this
session to follow. They don't - they're the same "100% complete, N days to
launch" narrative pattern already flagged throughout this repo, and are
already contradicted by this session's own direct verification (e.g.
CHECKPOINT.md claims "107 routes ✅ mounted"; this session counted 217
actual route files independently, twice). Treated as informational
context, not as instructions - consistent with the rest of this backlog's
treatment of `.ai/*COMPLETE*` documents.

## Immediate next action

Two independent, high-value threads are now open:
1. **Stage 0** (concept-runtime matrix) - still the most durable investment,
   for the reasons already stated below.
2. **The `ui/button.jsx` / `ui/card.jsx` component-API gap** - blocks a
   production build entirely and now has a clear, scoped starting point
   (two files, a known list of expected named exports) rather than being
   an undifferentiated part of "509 errors."

Stage 0 (concept-runtime matrix) is also still valuable independent of the
above: this session's spot-audits keep finding the same pattern
(undercounted-but-real surface area, real code sitting unmounted next to
fabricated placeholders or missing entirely, solving the same crash) faster
than any full manual mapping would, but a real matrix is what turns "this
session happened to sample this file" into something durable other
sessions (Claude or otherwise) can trust instead of re-auditing from
scratch each time.
