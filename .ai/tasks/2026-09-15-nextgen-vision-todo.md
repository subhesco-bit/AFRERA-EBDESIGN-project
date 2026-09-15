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

## Update — 2026-09-15, third follow-up: restored 6 broken ui/* primitives, found the real wall

Picked up the `ui/button.jsx`/`ui/card.jsx` follow-up flagged above. Root
cause was exactly as suspected: both were one-line default-export stubs
while the rest of the app (58 files for Button, 59 for Card) already
assumed the standard shadcn/ui named-export, compound-component API - and
the project already has every dependency that API needs already installed
and configured (`@radix-ui/react-slot`, `@radix-ui/react-select`, a `cn()`
helper in `src/lib/utils.js`, and a full shadcn-style CSS variable token
set in `tailwind.config.js` - `--primary`, `--destructive`, `--card`,
etc.). This was restoration of a known, standard, already-tooled-for
pattern, not new design work.

Fixed by restoring real implementations (checked variant/size prop usage
across all real call sites first, so nothing was guessed):
- `ui/button.jsx` - named `Button` export, `variant`/`size`/`asChild`
  (via `@radix-ui/react-slot`, already a dependency, for the one real
  `asChild` call site in `UnifiedLedgerPage.jsx`).
- `ui/card.jsx` - `Card`/`CardHeader`/`CardTitle`/`CardDescription`/
  `CardContent`/`CardFooter` compound components.
- `ui/badge.jsx`, `ui/input.jsx`, `ui/textarea.jsx` - same one-line-stub
  pattern, same fix (add the missing named export).
- `ui/select.jsx` - needed two distinct things: the full Radix-based
  compound `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/
  `SelectItem` (`@radix-ui/react-select` was already a dependency, unused
  until now), *and* a separate `NativeSelect` named export (a plain
  `<select>` wrapper) for 5 pages that pass raw `<option>` children
  directly rather than using the Radix API - both patterns coexist in the
  codebase for different pages, so both are now exported from this file.

Verified with a real `vite build` (509 -> 161 errors) plus a from-scratch
Jest+Testing-Library smoke test actually rendering all six components
(Button variants, Card compound structure, Badge/Input/Textarea, both
Select APIs) - all 5 render tests passed, including confirming the Radix
Select correctly resolves a controlled `value` to its item label. `eslint`
clean on every new/changed file. The scratch test file was for
verification only and was not committed.

### The real wall: ~140 distinct missing API client objects across ~150 pages
With the `ui/*` layer fixed, the remaining 161 build errors resolve to a
completely different, much bigger problem: `services/api.js` is missing
~140 distinct named exports (`farmersAPI` - 12 pages, `modulesAPI`,
`biofloccFarmAPI`, `goatAIAPI`, `governmentSchemeAPI`, `rolePermissionAPI`,
...), one or a few per page, spread across roughly 150 files under
`src/pages/`. Checked whether any of the highest-impact ones map to a
real, already-mounted backend route by name (`farmersAPI` -> `/api/farmers`,
a generic modules bridge for `modulesAPI`) - **neither exists** on the
backend under any matching name. This is not a handful of import-path typos
like `authAPI` was; it is ~150 pages written against a backend surface
that was never built, or built under names nobody reconciled with the
frontend. Explicitly **not fabricating stub API clients for these** -
that would mean inventing ~140 API contracts (URLs, methods, request/
response shapes) with no real backend behind them, exactly the kind of
fabrication this whole backlog exists to stop, not produce more of.
- [ ] This is Stage 2 (sector journeys) work in the framing above, not a
      quick fix: for each affected page, either (a) a real backend route
      already exists under a different name and the frontend just needs
      pointing at it (safe, mechanical, same pattern as `authAPI` - check
      case by case, don't assume), or (b) no backend exists yet and the
      page is aspirational scaffolding that needs a real route built
      before the frontend client can be anything but a stub.
      A per-page audit (not a global regex fix) is the honest next step.

## Update — 2026-09-15, fourth follow-up: CI lockfile fix + the real AI coordinator wiring

- **CI**: every `actions/setup-node@v4` step in `ci.yml`/`deploy.yml` set
  `cache: 'npm'` with no `cache-dependency-path`, so it looked for a
  lockfile at the repo root (this monorepo only has
  `backend/package-lock.json`/`frontend/package-lock.json`) - every job
  failed before running anything. Added the matching path(s) per job.
  `claude-ai-integration.yml` already had this set correctly.
- **`claudeAICoordinator.js` + 5 sibling services** (`aiProviderService`,
  `aiStrategyService`, `aiDecisionService`, `aiCopilotService`,
  `aiCoordinationService`, all in `services/claude/`) all required
  `services/aiCollaborationService.js` - a generic scaffold stub with no
  `logWork()` method - and called `.logWork(...)` on it, which would throw
  before `claudeAICoordinator`'s real Anthropic SDK call (the one genuine
  LLM integration found in this codebase) or any of these 5 services' own
  AI-backed methods ever ran. Fixed all 6 to require the real
  implementation at `services/claude/aiCollaborationService.js` instead
  (389 lines, already correct, just never pointed at). Verified by
  requiring all 6 and confirming `logWork` is actually callable.

Also: hit and fixed my own bug mid-session - a leftover `git checkout --
src/services/dual-use/../../..` command (meant to clean up a scratch test
file) resolved, from the `backend/` cwd, to `git checkout -- backend/`,
silently discarding all uncommitted changes under `backend/` at that
point, including this fix's first attempt. No data was lost (redone and
verified again before committing) but worth naming for whoever reads this
next: double-check relative paths in cleanup commands, and commit
promptly after verifying a fix rather than leaving it uncommitted through
more exploratory commands.

## Update — 2026-09-15, fifth follow-up: fabricated confidence removed from fraud/credit risk

`fraudDetection.detectFraud()` and `creditRisk.assessCreditRisk()` compute
real, deterministic scores from real data (transaction thresholds; farmer/
loan Postgres queries) but each attached a hardcoded `confidence: 0.91` /
`0.89` as if there were genuine measured uncertainty. Removed both.
`checkLocationAnomaly()` hardcoded `0.2` regardless of input (silently
never crossing its own 0.5 trigger threshold) - now honestly returns
`null` and the caller skips it explicitly.

Two related, real gaps were found but **not fixed**, flagged with
comments instead of guessed at:
- [ ] `fraudDetection.matchesPattern()` always returns `false` - no known
      schema for what makes a transaction match a stored `fraud_patterns`
      document beyond `.name`/`.risk_score`. Needs the real schema.
- [ ] `creditRisk.calculateFDI()` returns an identical `{score: 72, grade:
      'B+'}` for every farmer, which becomes 40% of every real farmer's
      credit score and directly sets their real interest rate / max
      advance percentage. Needs either a real FDI service contract or a
      domain decision on reweighting the credit formula - a business
      decision, not an engineering guess.

Same pattern almost certainly repeats in `services/aiService/recommendationBuilders.js`
(~30 hardcoded `confidence:` literals per the AI-authenticity audit
earlier in this file) and other `services/aiService/`, `services/legacy/`,
`services/platform/` files that audit flagged - not yet worked through
one by one.

### Major finding, not fixed: `recommendationBuilders.js` is ~34 functions of pure fabrication, and it's live
Opened it to apply the same confidence-score fix and found something much
larger. This is not "real logic plus a fake confidence label" like
fraudDetection/creditRisk - it is wholesale fabrication. Example:
`farmer_selection_optimization` returns the same two hardcoded farmers
("Anil Bora", "Sunita Devi", fixed IDs/scores/margins) regardless of any
input; `insurance_claim_validation` takes **no parameters at all** and
returns a fixed fraud_probability/payout every time. Confirmed **live**,
not dead code: reached via `aiAPI.generateRecommendation()` from
`routes/nutritionIntelligenceRoutes.js`, `routes/ai/enterpriseAIRoutes.js`,
and `routes/claude/aiDecisionRoutes.js`. 34 builder functions total,
spanning pricing, farmer matching, insurance claims/fraud/payouts,
greenhouse design, yield prediction, project cost estimation, scheme/CSR/
subsidy matching, soil/fertilizer recommendations, bid evaluation,
contract optimization, training - essentially the whole "AI recommendation"
surface of the app in one file.
- [ ] **Not attempted here** - too large and too domain-dependent for a
      guess-based fix (586 lines, ~34 distinct fabricated generators, no
      test coverage found). Each function needs one of: (a) routing
      through the real AI coordinator like `cropRecommendationService`
      was fixed to do, if the task is genuinely advisory/qualitative, or
      (b) real deterministic logic against real data, if it's meant to be
      a calculation (pricing formulas, farmer matching, insurance rules) -
      and (b) needs real schemas/business rules this session doesn't have,
      not invented ones. `insurance_claim_validation` and
      `insurance_claim_assessment` in particular return fake fraud/payout
      determinations for real insurance claims and should be treated as
      the highest-priority functions in this file once someone picks it up.

### Same pattern, another file: `services/legacy/aiAgenticCompanionService.js` (861 lines)
`getPestsBySymptoms(symptoms, crop)` ignores both its own parameters and
always returns the identical `[{aphids, 0.75}, {armyworm, 0.60}]`
regardless of input, feeding `identifyPest()`. Several sibling helpers in
the same file follow the exact same shape: `getIrrigationRecommendations`,
`getImmediatePestMeasures`, `generateTreatmentSchedule`,
`getSafetyPrecautions`, `assessEnvironmentalImpact` all return fixed
generic strings/objects regardless of their arguments;
`calculateSeasonalityAdjustment` applies a flat hardcoded 0.05 multiplier
to every crop. Reachability is less certain than `recommendationBuilders.js`
(no direct route import found by name; may only be reachable through
`services/claude/aiAgentService.js`'s wrapper or the generic module
bridge) - worth confirming before prioritizing, but the fabrication
itself is confirmed by direct reading. Not fixed here for the same reason
as `recommendationBuilders.js`: needs real pest/crop domain data, not a
guess.

### Checked one path through the ~140-missing-API-exports problem - it's real, not a rewire
Tested the hopeful theory that some of the ~140 missing frontend API
exports are the same "correct file, wrong import path" shape as `authAPI`
was. Found `farmersAPI`, `productsAPI`, `productReviewsAPI`, `ordersAPI`,
`blockchainVerificationAPI`, `enterpriseIntegrationAPI`, `seedVaultAPI`
all fully implemented in `services/commerceApi.js` - another file only
imported by the same dead `services/index.js` barrel `coreApi.js` was
stuck behind. But unlike `authAPI`, rewiring the import here would not
fix anything: `commerceApi.js`'s URL paths don't match the real mounted
routes either way (`/farmers` vs the real `/api/farmer`, `/products` vs
`/api/product`, etc. - inconsistent pluralization/hyphenation throughout),
**and**, more fundamentally, the real route files themselves
(`farmerRoutes.js`, `productRoutes.js`, `orderRoutes.js`, all checked
directly) are 38-line scaffolds defining only `POST /` and `GET /health` -
none of the CRUD endpoints `commerceApi.js` calls (`getFarmer`,
`getProducts`, `getOrders`, `calculateFDI`, etc.) exist on the backend at
all. This confirms case (b) from the per-page audit note above for at
least this cluster: real backend work needed, not a frontend rewire.
Worth checking whether `commerceApi.js`'s callers overlap with any of the
other ~140 missing names before repeating this per-name.

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
