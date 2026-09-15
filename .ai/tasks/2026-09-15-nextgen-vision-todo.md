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
- [x] Inventory response/error shape variance across `backend/src/routes/`
      (419 files, corrected count — not 107). **Done, ninth follow-up
      below.**
- [x] Pick one standard (status envelope, error code format) and apply it to
      newly-touched routes going forward; do not mass-rewrite working routes
      without cause (CLAUDE.md: "Do not rewrite working code without
      documented technical reason"). **Done** — standard is already the
      de facto majority convention (see below); documented rather than
      enforced by rewrite, per the rule just quoted.

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
- [x] Design the actual `Button`/`Card`/(likely other `ui/*` primitives -
      not yet enumerated) component API by reading a representative sample
      of call sites first, then implement it once and let all ~500 error
      sites resolve together, rather than special-casing importers.
      **Done, see third follow-up below** - 6 primitives restored, error
      count dropped 509 → 161.
- [x] Get a full, categorized error list (509 errors truncated in terminal
      output after the first handful) to check whether other root causes
      exist beyond `ui/button.jsx` and `ui/card.jsx` before committing to
      "fix these two files and the count drops to ~0." **Done** - the
      remaining 161 are a single distinct root cause (missing frontend API
      client exports), documented separately below, confirmed by a fresh
      local `npm run build` as of the seventh follow-up (still 161, all
      `MISSING_EXPORT` from `services/api.js`).
- [x] Until this is fixed, **`npm run build` has likely never produced a
      working production bundle in this environment** - **confirmed still
      true**: current `npm run build` still fails (161 `MISSING_EXPORT`
      errors), just past the point this session's fixes got it to.

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
**Update (seventh follow-up, below): fixed.** `getPestsBySymptoms()` and
`predictDroughtRisk()` were the genuinely dangerous fabrications (both
ignored their real inputs and returned fixed fake results); the
`confidence` literals in `getCropSelectionAdvice`/`predictYield`/
`forecastRevenue` were removed; the generic-advice helper methods
(`getSafetyPrecautions`, `assessEnvironmentalImpact`, etc.) were reviewed
and left as-is (static best-practice text, not false numeric precision);
`optimizeCosts`/`calculateSeasonalityAdjustment` got strengthened FIXME
comments rather than being gutted, since their guessed constants feed
real formulas with no honest substitute available yet. See the seventh
update below for full detail.

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

## Update — 2026-09-15, sixth follow-up: finished the confidence-fabrication sweep, CI mostly green

Fixed two more real fabrication instances, found the sweep's natural end,
and fixed a second, separate CI break.

- `priceOptimization.js`: removed hardcoded `confidence: 0.82`; made
  `getCompetitorPrices()` honestly return `[]` instead of an identical
  hardcoded price list for every product (verified the caller already
  falls back gracefully to `currentPrice` when empty, so this is a safe
  drop-in fix, not a guess); left `calculatePriceElasticity()` (-1.2 for
  every product) and `calculateMarginImpact()` (fixed 0.25/0.28 margins,
  ignoring its own arguments) with strengthened FIXME comments rather
  than restructured - both need real historical price/demand and cost
  data this session doesn't have.
- `recommendationEngine.js`: the three recommendation-source functions
  were already honest (return `[]`, genuinely unimplemented, not
  fabricated) - but the result still attached a fake `confidence: 0.78`
  and an explanation string that unconditionally claimed to have used
  "purchase history, similar users, and current market conditions" even
  though those sources never contribute anything. Removed the fake
  confidence; the explanation now says so honestly when the list is empty.

**Checked and found NOT fabricated** (worth recording so this isn't
re-audited from scratch): `core/decisionEngine.js` and `core/erpAgents.js`,
both flagged in the original AI-authenticity audit for hardcoded
`confidence` values, turned out on inspection to be a real, hand-authored
rule engine where `confidence: 0.8`/`0.85`/`0.9` are declared per-rule
weights on real computed proposals (real cash-flow shortfalls, real
peaking-product counts from real context data) - a legitimate design
choice, not a fake ML score. `decisionEngine.js` even has its own comment
recording that a *previous* session already fixed a real instance of this
exact fabrication pattern there (a hardcoded 0.94 replaced with a real
accuracy statistic). No change made to either file.

This closes out the specific list of hardcoded-confidence files named in
the original AI-authenticity audit earlier in this document. The two
large, confirmed-live fabrication files (`recommendationBuilders.js`,
`aiAgenticCompanionService.js`) remain open, flagged above, needing real
domain data rather than a guess.

**Second CI break found and fixed**: once the workflow `cache-dependency-path`
fix (above) let jobs actually reach `npm ci`, `frontend/package-lock.json`
turned out to be out of sync with `package.json` (missing
`@testing-library/dom@10.4.2`, a peer dep of `@testing-library/react`) -
`npm ci` requires exact sync and was failing every frontend-touching job.
Reproduced locally (`rm -rf node_modules && npm ci` failed the same way),
regenerated the lockfile with `npm install`, confirmed `npm ci` then
succeeds from a clean `node_modules`. Backend's lockfile had no
equivalent drift.

As of this update, real CI runs on the PR: `Security Audit`, `Test GitHub
Integration`, `Validate Claude AI Integration`, and `Claude AI Integration
Test` all pass. `Build Verification`/frontend build still fails on the
already-documented, pre-existing, much larger `services/api.js`
missing-export gap (161 remaining errors, not caused by anything in this
backlog's fixes) - tracked above, not re-documented here.

## Update — 2026-09-15, seventh follow-up: `aiAgenticCompanionService.js` fabrication fixed

Reconsidered the "too large, skip" call on this file from the previous
update, after successfully proving the same honest-marking pattern scales
to `recommendationBuilders.js`'s 34 functions. Read the full 861-line file
method-by-method (constructor through the final helper) and found the
fabrication is much narrower than it first looked - most of the ~30 small
helper methods (`getSafetyPrecautions`, `getWaterEfficiencyTips`,
`getImmediatePestMeasures`, etc.) return generic-but-true agricultural
best-practice text, not false numeric precision, so they were left alone
(same treatment given to static-template content elsewhere in this
backlog). The genuinely dangerous/misleading pieces were narrower and
fixable without domain data:

- `getCropSelectionAdvice()`: removed three hardcoded `confidence` literals
  (0.85 / 0.90 / 0.75) attached to every response's soil/seasonal/market
  recommendations regardless of the actual data matched.
- `predictYield()`: removed a hardcoded `confidence: 0.78` on every
  prediction, unrelated to the real soil/weather/management factors
  computed just above it.
- `forecastRevenue()`: removed a hardcoded `confidence: 0.72` on every
  forecast, same pattern.
- `getPestsBySymptoms()`: used to ignore both its `symptoms` and `crop`
  parameters and always return the identical `[{aphids, 0.75},
  {armyworm, 0.60}]`, feeding directly into `identifyPest()`'s response.
  Now honestly returns `[]` (no real symptom-matching implemented) -
  verified `identifyPest()`'s `.map()` over the result degrades safely to
  an empty `potential_pests` array rather than crashing.
- `predictDroughtRisk()`: the most actively harmful case found - it
  ignored both `weatherForecast` and `soilMoisture` and always returned
  `risk_level: 'low', probability: 0.2`, i.e. a fabricated reassurance
  that could tell a farmer their real drought risk is low regardless of
  the real forecast. Now honestly returns
  `{risk_level: 'unknown', probability: null, configured: false, reason}`.
- `optimizeCosts()` (fixed 0.85/0.90/0.88 cost-reduction factors applied
  to real farmer cost data) and `calculateSeasonalityAdjustment()` (fixed
  5% bump ignoring the `crop` param) were left functional with
  strengthened FIXME comments, same treatment as
  `priceOptimization.js`'s `calculatePriceElasticity`/
  `calculateMarginImpact` - removing them would break the real formulas
  they feed into, and there's no honest constant to substitute without
  real cost/seasonality data this session doesn't have.

Traced all real consumers first: three re-export aliases
(`services/aiAgenticCompanionService.js`, `services/ai/...`,
`modules/M675100_AIAGENTICCOMPANION/backend/service.js`) just point at
this same file, and `services/claude/aiAgentService.js`'s
`ai_confidence` field reads from `claudeAICoordinator`'s response, not
from anything touched here - confirmed unaffected. Added
`src/services/legacy/__tests__/aiAgenticCompanionService.test.js` (6
tests, all passing) locking in the new honest behavior. `node -c` and
eslint both clean.

This closes the second (and last) of the two large confirmed-live
fabrication files flagged in the sixth update - both
`recommendationBuilders.js` and `aiAgenticCompanionService.js` are now
fixed.

## Update — 2026-09-15, eighth follow-up: M060 README was itself fabricated, plus a real dead-code bug it led to

Picked up the `M060 review system vs legacy/productReviewService.js
duplication` item flagged in the sixth update (itself quoting a claim
attributed to `ACTIVE.md`). First surprise: `ACTIVE.md` as it exists in
this checkout (92 lines) contains no such note - the claim traces back to
`backend/src/modules/M060/README.md` instead, which turned out to be the
real problem.

**The README itself was fabricated, not just stale.** It described M060 as
"Product review/rating service with AI sentiment-analysis hook," claimed a
specific dated fabrication fix ("Fixed a real fabrication bug 2026-08-29:
`getProductContext()` returned a hardcoded `{category:'grains',
average_rating:4.2}`..."), and claimed it was reachable via
`/api/v1/backend-modules/M060/:operation`. Verified all three false:
- `getProductContext` doesn't exist anywhere in the repo (`grep -rl` finds
  only the README mentioning it) - the claimed fix describes code that was
  never real.
- `git log` on `service.js` shows exactly two versions ever: both generic
  auto-generated CRUD templates (`this.table = 'input_supply'`), neither
  containing review/rating/sentiment logic. `MODULES_REGISTRY.js`
  independently confirms M060 as `"Input Supply Chain", status: "❌
  SKELETON", progress: 0` - consistent with the real code, not the README.
- `/api/v1/backend-modules/...` appears in ~15 module READMEs but in zero
  actual route-mounting code (`index.js`, `routes/`) - `modules/M060/routes.js`
  is not required anywhere. M060 is genuinely unreachable at runtime.

**This fabricated README produced a real, live bug.**
`services/legacy/productReviewService.js` (the actual, mounted, working
review service at `/api/v1/product-reviews`) had a merge block at its tail
that `require('../../modules/M060/service')` and destructured
`createReview`/`getProductReviews` off it, with a comment claiming these
"collided with different signatures" with the real review methods. Since
M060 never had those methods (only generic CRUD), the destructuring
silently produced `createReviewSimple`/`getProductReviewsSimple` as
`undefined` - and `Object.assign` pollution added 21 unrelated, unrelated-
domain method names (`getAll`/`getById`/`create`/`update`/`delete`/
`createBulk`/`search`, merged three times over from M060 + M052
`crop_diseases` + M058 `crop_insurance`, all equally generic) onto the
real review service's exports. Confirmed via repo-wide grep that nothing
anywhere calls any of these 21 polluted names or the two `undefined`
aliases - dead, but actively misleading about what this service does.

**Fixed**: removed the entire dead merge block, replaced with a comment
documenting what was verified and why it's gone. Updated the two
re-export wrapper files' (`services/productReviewService.js`,
`services/commerce/productReviewService.js`) comments that referenced the
now-removed merge. Rewrote `modules/M060/README.md` to describe the real
module (Input Supply Chain skeleton, unmounted) instead of the fabricated
one, with the verification trail so a future session doesn't have to
redo it.

**Verified**: `node -c` and eslint clean on all three JS files;
`productReviewService.test.js` still 9/9 (including "exposes the full
real API surface, not a stub," unaffected since it doesn't test the
removed pollution); confirmed real methods (`createReview`,
`getProductReviews`, etc.) still present via the prototype after the
edit, confirmed `createReviewSimple`/`getAll`/etc. are now genuinely gone
from the exports.

**Found but not fixed** (separate, pre-existing, genuinely out of scope
here): `M060`'s own test suite (`modules/M060/__tests__/M060.test.js`) has
9 failing tests unrelated to this fix - `TypeError: DatabaseError is not a
constructor` in `service.js`'s own error handling. Confirmed via
`git diff` that this session touched none of `service.js`/`controller.js`/
its test file, so this is pre-existing breakage in a module the registry
already marks 0%-complete and that has no live callers. Not worth chasing
given it's unreachable at runtime either way - flagging for whoever
eventually works Stage 0 or decides to build out Input Supply Chain for
real.

**Implication worth flagging for Stage 0**: this is a second confirmed
instance (after the `aiAgenticCompanionService.js`/`recommendationBuilders.js`
work) of a README/doc claim that doesn't just overstate completeness but
describes code that never existed. Worth treating per-module READMEs with
the same skepticism as the ~150 `.ai/*COMPLETE*` reports once Stage 0
starts, not just the top-level docs.

## Immediate next action

**Stage 0** (concept-runtime matrix) remains the most durable investment:
this session's spot-audits (UI components, 7 AI-fabrication files, and now
M060's README) keep finding the same pattern - undercounted-but-real
surface area, real code sitting unmounted next to fabricated placeholders,
and now fabricated documentation describing code that was never written -
faster than a full manual mapping would, but a real matrix is what turns
"this session happened to sample this file" into something durable other
sessions (Claude or otherwise) can trust instead of re-auditing from
scratch each time.

The `ui/button.jsx`/`ui/card.jsx` component-API gap (previously listed
here as the second open thread) is done - see the third follow-up above.

## Update — 2026-09-15, ninth follow-up: API response-shape inventory (Stage 1c)

Picked up Stage 1c, scoped exactly as written: an inventory + a standard
pick, explicitly not a rewrite. Method: grep-based statistical survey
across all 419 real route files (corrected count, not the doc's original
107) rather than reading each file, since the item only asks for "a short
list of the distinct conventions in use."

**Findings, each backed by a real count, not an impression:**
- **Dominant convention (the de facto standard)**: `{success: true/false,
  data/error: ...}` envelope - 384 files contain `success: true`, 149
  contain `success: false` (a route using an `asyncHandler`/shared-error-
  middleware pattern can legitimately have one without the other, so
  these aren't meant to sum to 419).
- **Error field naming is already consistent**: of all `res.status(4xx/5xx
  ).json({...})` error bodies, 906 use an `error:` key vs. 2 using
  `message:` - no real inconsistency here despite Stage 1c's framing
  expecting one.
- **Minority convention, ~10 files**: `hrRoutes.js`,
  `roleManagementRoutes.js`, `gdprComplianceRoutes.js`,
  `integrationStatusRoutes.js`, `infrastructureMonitoringRoutes.js`,
  `finance/gstRoutes.js`, `aiTrainingEvaluationRoutes.js`,
  `claude/moduleRegistryRoutes.js`, `agriculture/farmerHealthRoutes.js`,
  `sapModuleArchitectureRoutes_merged.js` - all confirmed by direct read
  to return the bare resource on success (`res.json(result)`, no envelope
  at all) and `{error: message}` on failure. A shared frontend API client
  written against the dominant `{success, data}` shape would read
  `response.data.data` and get `undefined` against any of these ten -
  a real, findable integration hazard for whoever eventually builds the
  ~140 missing frontend API clients flagged elsewhere in this backlog.
- **One legitimate exception, not an inconsistency**: `stripeWebhookRoutes.js`
  returns `{received: true, eventType}` - correct for a webhook ack, not
  something to converge with resource-returning API routes.

**Standard**: keep the existing majority `{success, data/error}` envelope
(no code changes needed to make it "official" - it already is the de
facto standard) and use it for any new/touched route. Per CLAUDE.md's own
rule against rewriting working code without documented technical reason,
the ~10 minority-shape files are not touched here - noted so a future
session building the missing frontend API clients checks each target
route's actual shape rather than assuming the majority envelope, instead
of rediscovering this list file-by-file at integration time.

## Update — 2026-09-15, tenth follow-up: the entire live order/cart/payment system was disconnected

While investigating Stage 1d ("an order/payment path" as one of the 3
highest-risk flows to test), found `backend/src/__tests__/orderRoutes.test.js`
failing 8/8 and traced it to the same class of bug as the original auth
fix, but on a much more consequential system.

**The bug**: `index.js` mounted `routes/orderRoutes.js` at `/api/order` -
a 38-line auto-generated scaffold whose `POST /` just returns
`{message: 'Route operational'}` with no order ever created. Meanwhile
`services/legacy/orderService.js` - 881 real lines, Postgres-backed, with
real stock checks, real per-item GST via `gstService`, a real cart, and a
real payment flow - already had its own complete, working Express router
(`router` in its exports) that was **never mounted anywhere**. Confirmed
via `git log` this wasn't a recent regression and via grep that nothing
else requires the scaffold except the one stale test file. The entire
live order/cart/payment system - arguably the most business-critical
single piece of this platform - has been unreachable at runtime.

**Fixed**: `index.js` now requires `{ router } = require('./services/legacy/orderService.js')`
instead of the scaffold. Verified safe before touching: no frontend code
currently calls `/api/order` under any path (nothing to break), the real
router loads cleanly and its own error handling means a crash inside a
handler becomes an HTTP error response, not a process crash. Smoke-tested
standalone (real `authMiddleware`/JWT verification, not a stub): no auth
→ 401 `NO_TOKEN`, bad token → 401 `INVALID_TOKEN`, valid token → reaches
real business logic.

**Second bug found via that same smoke test**: with a valid token but no
live Postgres, 10 of `orderService.js`'s 11 exported functions threw a
raw `TypeError: Cannot read properties of null (reading 'query')` instead
of a clean error - only `getCart()` had the `if (!pg) throw new
Error('Database connection not available')` guard the file's own pattern
established. Added the identical guard to the other 10
(`addToCart`/`updateCartItem`/`removeFromCart`/`clearCart`/`createOrder`/
`getOrderById`/`getUserOrders`/`updateOrderStatus`/`processPayment`/
`calculateDiscount`), mechanical and consistent with existing code, not a
new pattern invented for this fix.

**Added real test coverage**: `services/legacy/__tests__/orderService.test.js`
(12 tests) - the 10 DB-unavailable-guard cases, plus two real business-
logic paths with a mocked Postgres (`createOrder` rejects an empty cart;
`createOrder` rejects a quantity exceeding real stock). All passing,
eslint clean, `node -c` clean on every touched file.

**Left alone, documented rather than fixed**: `routes/orderRoutes.js`
itself (now truly dead - unreachable except by its own stale test) got
a deprecation comment mirroring the one already on `routes/authRoutes.js`
from the original auth fix, rather than deletion, per this session's
established conservative-deletion practice. `__tests__/orderRoutes.test.js`
(8/8 failing, pre-existing, untouched) was not rewritten or deleted: it
encodes a response contract (`PUT /:id` for status, `DELETE /:id` to
cancel, a `{success, data}` envelope) that was never real for *either*
the scaffold or the actual `orderService.js` router (which uses
`PUT /:id/status`, has no cancel-via-DELETE, and returns the bare order
object per the Stage 1c minority-shape finding above) - fixing it
properly means either rewriting the test against the real contract or
adding real `DELETE`/generic-`PUT` endpoints to `orderService.js`, both
real design decisions outside a bug-fix's scope. Flagged here instead of
left as a silent mystery.

**Implication**: this is the second time this session (after
`services/authService.js` vs `dual-use/authService.js`) that "index.js
mounts a scaffold instead of the real implementation next to it" turned
out to be real and high-value. Worth treating as a standing hypothesis
for Stage 0: for every route mounted from `routes/*.js`, check whether a
same-domain, more complete implementation exists under `services/` (or
`services/legacy/`) that isn't the one actually wired in.

## Update — 2026-09-15, eleventh follow-up: the live frontend was rendering a blank page - two real crashes fixed

User asked to see the current app running. Booted the real Vite dev
server (`npm run dev`) and loaded it in headless Chromium - **it rendered
completely blank** (a 4KB body, nothing visible). Not a hypothesis, a
directly observed failure. Two distinct, real, application-breaking bugs
found and fixed via that same browser session, verifying each one before
moving to the next:

**Bug 1 - one static import crashed the entire module graph.**
`App.jsx` lazy-loads every page except one: `import ModuleRuntimePage from
'./pages/ModuleRuntimePage'` (static, not `lazy()`). `ModuleRuntimePage.jsx`
imports the still-missing `modulesAPI` named export from `services/api.js`
(part of the already-documented 161-error gap). Because it was a *static*
import, that one broken module took down the entire app's module graph on
load - every route, not just `/module/:moduleId` - confirmed via the
browser's own `pageerror` event:
`"The requested module '/src/services/api.js' does not provide an export
named 'modulesAPI'"`. Fixed by making it `lazy()` like every other page in
the file (already wrapped in `<RouteSuspense>` at its one usage site, so
no further change needed there) - contains the still-real, still-open
`modulesAPI` gap to its own route instead of crashing the whole app for
every user on every page.

**Bug 2 - the app has never had a Router.** With bug 1 fixed, a second,
separate crash appeared immediately: `"useLocation() may be used only in
the context of a <Router> component."` `App.jsx` calls `useLocation()`
and renders `<Routes>`/`<Route>` (react-router-dom), but `main.jsx` -
confirmed as the real entry point via `index.html`'s `<script
src="/src/main.jsx">` - never wrapped `<App />` in a `<BrowserRouter>` (or
any Router) at all. `git log` on `main.jsx` shows only 2 commits, neither
about routing - this isn't a lost regression, the wrapper appears to have
never existed. Fixed by adding `<BrowserRouter>` around the existing
provider tree in `main.jsx`.

**Result, verified in the same browser session**: title changed from
generic to `"Home - AFRERA Agriculture Platform"`, rendered body grew
from ~4KB to ~173KB, and a real header (nav menu: Marketplace, Farmer
Portal, Pricing, Finance/ERP, Stakeholders, Logistics, Insurance...),
sidebar, and footer (contact info, quick links, social icons) now render
- screenshot sent to the user directly. One remaining non-fatal console
error (`multilingualAPI.getLanguages is not a function`) is already
caught internally by `MultilingualProvider` and doesn't crash anything -
not fixed here, flagged as a smaller follow-up. Confirmed no regression:
`npm run build` still fails with exactly 161 errors (the same pre-existing
missing-API-export count, not increased) - these two fixes are dev-time
*runtime* crashes, unrelated to and not fixed by the production build gap,
and vice versa.

**Why this matters more than the abstract "161 build errors" framing
elsewhere in this doc**: those errors block a *production build* from
being produced at all, which sounds severe but is also somewhat abstract
without a running instance to check against. This finding is different in
kind - it's proof that even *if* a build had succeeded, or in `npm run
dev` as actually used during development, the deployed app would have
shown every single visitor a blank white page. This was probably the
single highest-severity issue found this entire session, and it was
invisible to every prior audit (including this session's own) because
none of them actually loaded the page in a browser until asked to.

## Update — 2026-09-15, twelfth follow-up: third instance of the "real service, never mounted" pattern - multilingual

While the browser session from the eleventh update was still open, the
remaining non-fatal console error (`multilingualAPI.getLanguages is not a
function`) turned out to be the same class of bug as the order-system fix
(tenth update), a third confirmed instance:

- `frontend/src/components/Multilingual/MultilingualProvider.jsx` calls
  `multilingualAPI.getLanguages/getPreferences/getContent/
  updatePreferences/translate/detect` from `services/componentApi.js`.
- That file's actual `multilingualAPI` had only two unrelated methods
  (`getTranslations`/`updateTranslations`, called by nothing) pointed at
  `/i18n/:lang`, an endpoint that doesn't exist anywhere on the backend -
  **and** every method referenced a bare `api` identifier that was never
  imported in this file, a guaranteed `ReferenceError` on first real use
  (same bug shape as the `modulesAPI` crash, just not yet fatal to the
  page since `MultilingualProvider` already catches its own init errors).
- Meanwhile `backend/src/services/legacy/multilingualService.js` - 821
  real lines, Postgres-backed, with real language detection, translation,
  content-translation storage, user preferences, and pronunciation guides
  - already implements exactly the six methods needed
  (`/languages`, `/preferences` GET+PUT, `/content`, `/translate`,
  `/detect`), with `/translate`'s body shape (`text`, `source_language`,
  `target_language`) matching the frontend caller exactly. Never mounted
  in `index.js`.

**Fixed**: mounted `multilingualService.js`'s router at `/api/multilingual`
in `index.js` (same pattern as the order fix). Rewrote `componentApi.js`'s
`multilingualAPI` against the real endpoints, using the same
`AUTH_BASE`-style absolute-URL pattern `coreApi.js` established for the
`/api/v1`-vs-bare-`/api` mismatch (`MULTILINGUAL_BASE`). Also fixed the
identical missing-`api`-import bug in the same file's `conversationalAIAPI`/
`voiceAIAPI` (their endpoint paths are unverified against a real mount -
not part of this fix - but they no longer throw `ReferenceError` on first
use).

**Verified**: `node -c`/`@babel/parser` clean on all touched files, eslint
clean. The real backend router loads cleanly and was smoke-tested
standalone (mirroring the order-fix method, since a full `npm run dev`
boot of the 400+-route server hung indefinitely past "Critical services
loaded" in this sandbox - a separate, pre-existing, unrelated environment
issue not investigated further here): public `GET /languages` reachable
without auth, protected endpoints correctly return 401 without a token
and reach real logic with one, and all failure paths (DB unavailable)
return clean HTTP error responses rather than crashing.

**Implication, sharpened further**: this is now three for three
(`dual-use/authService.js`, `legacy/orderService.js`,
`legacy/multilingualService.js`) - every time this session checked whether
a "missing" frontend API integration had a real, substantial backend
implementation sitting unmounted nearby, it did. Stage 0 should treat this
as close to a certainty rather than a hypothesis to spot-check: for the
remaining ~140 missing exports, check `services/legacy/*.js` (and
`services/<domain>/*.js`) for a same-domain file with its own `router`
export before assuming real backend work is needed from scratch.

## Update — 2026-09-15, thirteenth follow-up: systematic sweep - 42 real services mounted in one batch

Turned the "three for three" hypothesis from the twelfth update into a
full sweep instead of finding a fourth instance by accident. Ran:
`grep -rl "module.exports = {" services/legacy/*.js | xargs grep -l
"router,"` to find every `services/legacy/*.js` file exporting a real
`router` (45 files), then cross-referenced each against `index.js` by
name. **All 45 were unmounted.**

Investigated each before touching anything, not just mounted blindly:
- **2 excluded, legitimately real elsewhere**: `farmerValueService.js`
  and `nutritionIntelligenceService.js` both already have a dedicated,
  real `routes/*.js` file that calls their exported functions directly
  with a different integration style (not "mount the whole router") -
  confirmed by reading both route files in full. Not touched.
- **3 were scaffold swaps**, same shape as the order fix: `routes/productRoutes.js`,
  `routes/iotIntegrationRoutes.js` (both the identical 38-line "Route
  operational" template) and `routes/predictiveAnalytics.js` (explicit
  "Placeholder route module" comment) were mounted at `/api/product`,
  `/api/iotintegration`, `/api/predictiveanalytics` instead of the real
  `productService.js`/`iotIntegrationService.js`/`predictiveAnalyticsService.js`
  routers sitting unused right next to them. Swapped, same pattern as
  `index.js`'s order-router fix (require the real file, destructure
  `.router`, keep the existing variable name so the `app.use` line
  doesn't need to change).
- **1 excluded as already covered**: `custodyEventRoutes.js` matches
  `/Routes\.js$/i`, so it's already auto-discovered and mounted at
  runtime by `index.js`'s own `discoverServiceEmbeddedRoutes()`
  (`core/dynamicRouteLoader.js`) - confirmed by reading that loader's
  filter regex. Adding it manually too would've been a genuine duplicate
  mount, so it was deliberately left out (this also explains why the
  other 44 weren't already covered by that same mechanism: it only
  matches filenames ending in `Routes.js`, and every other one of these
  is named `*Service.js`).
- **39 were pure new mounts**: real, verified-loadable services with no
  existing route at any checked path, mounted fresh at `/api/<name>`
  (lowercase, no separators, matching the existing `/api/order`,
  `/api/multilingual` convention) - see `index.js`'s batch-mount block
  for the full list (advancedAI, aiCopilot, arVr, biodiversity,
  blockchainTraceability, catalogIntelligence, commerceRules,
  consumerHealth, conversationalAI, digitalProductPassport,
  enterpriseControl, enterpriseMemory, erp, financial, foodIntelligence,
  foodSafety, form, giIntelligence, indigenousKnowledge,
  institutionalProcurement, insurance, knowledgeGraph, laboratoryERP,
  logistics, merchandising, millCircuit, moduleCatalog,
  neProductIntelligence, offlinePayment, offlineSync, omnichannelAI,
  organicTraceability, recipeIntelligence, shelfLife, smsAuth,
  v42Intelligence, valueCommerce, voiceAI, whatsapp).

**Verification, since a full `npm run dev` boot hangs in this sandbox**
(see below): (1) every one of the 42 confirmed to `require()` cleanly in
isolation before being added: 41 individually + custodyEvent's exclusion
reasoned separately. (2) `node -c` clean on the full `index.js` after the
batch edit - this also catches duplicate `const` identifiers, which a
naive batch edit could easily have introduced. (3) A synchronous
`require('./src/index.js')` (which runs every top-level `require` in the
file, including all 42) completed without throwing. (4) A standalone
Express app mounting all 42 routers together (bypassing the full
`index.js` boot) confirmed: no Express-level mount errors, real JWT auth
enforcement on protected endpoints (401 without a token on
`/api/iotintegration/iot-devices`), a real public endpoint reachable
without auth, real webhook payload validation on `/api/whatsapp/webhook`,
and clean (non-crashing) error responses when the database is
unavailable - with one exception noted below. (5) `git diff` confirms
nothing outside `index.js` (plus the earlier README/comment corrections)
was touched to make this work - no fabricated glue code, just wiring.

**One collision-check false-negative worth recording for whoever does
this again**: the initial pass checked candidate mount paths only against
`index.js`'s exact string-literal `app.use('/api/...')` calls. Before
committing to the 3 swaps, each of the 5 raw path collisions found this
way was individually read and classified (2 real/legitimate, 3 scaffolds)
- a purely mechanical path-collision check would have missed that
distinction and either skipped 3 real fixes or, worse, proposed
overwriting 2 legitimate implementations.

**Found via the batch smoke test, not fixed here**: `productService.js`'s
`getCategories()` (and likely other of its functions - not individually
audited) lacks the `if (!pg) throw new Error('Database connection not
available')` guard that `getProducts()` in the same file already has,
producing a raw `TypeError: Cannot read properties of null (reading
'query')` instead of a clean error when the database is down - the exact
same gap already found and fixed across all of `orderService.js` in the
tenth update. Flagged here rather than fixed, since a full sweep of all
42 newly-reachable services for this same gap is its own bounded task,
not a natural extension of a mounting fix.

**Separate, pre-existing, NOT fixed here**: a full `npm run dev` /
`node src/index.js` boot in this sandbox hangs indefinitely right after
logging `✅ Critical services loaded`, never reaching `server.listen()`.
Confirmed via `git diff` that none of this session's changes touch the
code between those two points (`cacheService.init()`, `jobService.init()`,
`routeLoader.discoverAndMountRoutes()`,
`routeLoader.discoverServiceEmbeddedRoutes()`,
`serviceLoader.mountServiceRoutes()`) - most likely `cacheService.init()`
attempting a Redis connection with no timeout, since Redis isn't running
in this sandbox either (matching Postgres). This is why verification here
used isolated Express apps instead of a real server boot + `curl`, same
as the order and multilingual fixes' standalone smoke tests. Worth a
real fix (a connect timeout) for whoever next needs a full local boot in
an environment without Redis.

**Updated implication for Stage 0**: "real service, never mounted" is
not a hypothesis anymore - it was the actual state of every single
`services/legacy/*.js` file with its own router (45 of 45; 3 swaps + 39
new mounts + 2 legitimately-already-real + 1 already-covered by the
dynamic loader = 45). The natural next sweep is the same check against
`services/<domain>/*.js` (non-legacy) and `services/*.js` (root level),
which weren't covered by this pass.

## Update — 2026-09-15, fourteenth follow-up: extended the sweep to root-level services, found and fixed a real path+method mismatch too

Ran the same "real router, never mounted" check against root-level
`services/*.js` (not `services/legacy/`): 7 files matched
(`advancedMedicalCodingService.js`, `advancedVoiceAI.js`, `authService.js`,
`clinicalNutritionDecisionSupportService.js`, `formService.js`,
`offlineSyncService.js`, `productService.js`).

**4 excluded**: `authService.js` is the already-known-deprecated one (not
the real mounted `dual-use/authService.js` - see the very first fix this
session). `formService.js`/`offlineSyncService.js`/`productService.js`
at root level are near-byte-identical duplicates of the
`services/legacy/` versions already mounted (or, for `productService.js`,
swapped in) in the thirteenth update - confirmed via `diff`, differing
only in `require('../..')` vs `require('../')` path depth. Same
duplication pattern already handled for `productReviewService.js`
earlier this session; not touched (mounting the root copy too would
create genuine duplicate/conflicting routes, not a fix).

**3 genuinely new, non-duplicate, real services, mounted**:
`advancedMedicalCodingService.js`, `advancedVoiceAI.js`,
`clinicalNutritionDecisionSupportService.js` - none exist under
`legacy/` under any name. `advancedMedicalCodingService.js` has a
confirmed real frontend consumer, `pages/AdvancedMedicalCodingPage.jsx`
(`api.get('/advanced-medical-coding/code-systems')` etc. against the
`/api/v1`-based `api` instance) - mounted at the exact matching path,
`/api/v1/advanced-medical-coding`. The other two have no confirmed
frontend caller yet; mounted at `/api/advanced-voice-ai` and
`/api/clinical-nutrition` (same "real and safe to expose, even without a
confirmed caller yet" reasoning as the 39 services in the thirteenth
update).

**A second, more interesting bug found investigating consumers**:
`components/Layout.jsx` carries a comment from a prior investigation -
"ChatInterface and VoiceAssistant were fully built (real
conversational-ai/voice-ai API calls) but had no parent page rendering
them... authMiddleware on /conversational-ai/sessions and
/voice-ai/voice-sessions" - and it's right on both counts, worse than
just "unmounted":
- The real backends (`services/legacy/conversationalAIService.js`,
  `services/legacy/voiceAIService.js` - both already mounted in the
  thirteenth update, but at `/api/conversationalai`/`/api/voiceai`, no
  hyphen) needed the hyphenated paths `Layout.jsx` already documented -
  **changed** to `/api/conversational-ai`/`/api/voice-ai` to match.
- `frontend/src/services/componentApi.js`'s `conversationalAIAPI`/
  `voiceAIAPI` (only partially fixed in the twelfth update - the
  undefined-`api` bug was fixed, but the methods themselves were never
  checked against real callers) called entirely fictional methods
  (`sendMessage`/`getConversationHistory`,
  `transcribeAudio`/`generateSpeech`) that don't exist in either real
  component. The real callers - `ChatInterface.jsx`:
  `getDomains()`/`createSession(data)`/`respond(sessionId, message)`/
  `endSession(sessionId, data)`; `VoiceAssistant.jsx`:
  `createSession(language)`/`getPreferences()`/`sendCommand(data)`/
  `endSession(sessionId)` - were checked directly against both real
  components' source and the real backends' route handlers (exact body
  shapes: `{domain_id, language}`, `{message, context}`,
  `{resolution_status, ...}`, `{language}`,
  `{session_id, transcript, command_type, parameters}`). Rewrote both
  API objects to match on both ends exactly.

**Verified**: `node -c`/`@babel/parser` clean, eslint clean on all
touched files (backend and frontend). Backend: all 3 new services
confirmed to `require()` cleanly; a standalone Express app mounting the
real `conversationalAIService.js`/`voiceAIService.js` routers at the
corrected hyphenated paths confirmed the exact frontend call shapes
reach real backend logic - `GET /domains` public and reachable without
auth, `POST /sessions` and `POST /voice-sessions` enforce real JWT auth
(401 without a token, reach real logic with one) and return clean
(non-crashing) errors when the database is down.

This closes the loop `Layout.jsx`'s own comment opened: two fully-built
UI features (a floating chat widget and a floating voice assistant,
mounted globally for every logged-in user) that were completely
non-functional end-to-end - wrong frontend methods calling paths that
didn't exist, backed by services that weren't mounted even if they had -
are now wired correctly on both ends.

## Update — 2026-09-15, fifteenth follow-up: closed out the services-sweep - domain subfolders are stale duplicates, deliberately untouched

Finished the "natural next sweep" flagged at the end of the thirteenth
update: `services/<domain>/*.js` (non-legacy subfolders - `agriculture/`,
`ai/`, `commerce/`, `finance/`, `food/`, `logistics/`, `platform/`, plus
a few `<name>Service>/index.js` package-style folders). Found ~50 more
files exporting a real `router`.

**Checked every one against `legacy/` and root before considering
mounting any of them** (same discipline as the thirteenth/fourteenth
updates) - and every single one had a same-named duplicate already in
`services/legacy/` or root `services/`. Diffed a representative sample
across domains to confirm this wasn't a coincidence of naming:
- `commerce/orderService.js` vs the already-mounted `legacy/orderService.js`:
  missing the `if (!pg) throw new Error('Database connection not
  available')` guard added in the tenth update - the domain-folder copy
  predates that real fix.
- `agriculture/biodiversityService.js` vs `legacy/biodiversityService.js`:
  missing `requireRole`/`PLATFORM_STAFF_ROLES` role-based access control
  present in the legacy version - a real security difference, not just
  formatting.
- `platform/multilingualService.js` vs the already-mounted
  `legacy/multilingualService.js`: carries extra test-mock-reassignment
  code not in the canonical version.

**Conclusion: these domain subfolders are an older, frozen snapshot**,
not independent implementations and not currently-active work - `git log`
on all three sampled files shows only one shared commit
(`c39316fe`, "RECOVER: Extract 2,699 genuinely-new files from old
branches/worktrees"), a batch archival/recovery commit, not recent or
ongoing edits. The `legacy/` copies are demonstrably the ones that have
kept receiving real fixes since. **Deliberately not mounted or modified**:
mounting a domain-folder duplicate would serve a strictly worse (missing
security controls, missing bug fixes) version of something already
correctly mounted from `legacy/` in the thirteenth/fourteenth updates,
and this repo already carries real, separate work from another AI
session (documented earlier in this backlog) that these older snapshots
could plausibly intersect with - reorganizing or touching them isn't this
sweep's call to make.

This closes the "real service, never mounted" investigation thread for
now: `legacy/` and root-level `services/*.js` are fully swept (thirteenth
and fourteenth updates), and the domain-subfolder duplicates are
confirmed stale and correctly left alone. Nothing further to mount along
this specific line of investigation.

## Update — 2026-09-15, sixteenth follow-up: productService.js's real gaps closed, plus a route-shadowing bug

Followed up on the thirteenth update's own flagged item: `productService.js`
had the same missing-DB-null-guard gap as `orderService.js`, found via its
batch smoke test. Checked all 8 exported functions; `getProducts()` and
`getProductById()` already had the guard, the other 6
(`createProduct`/`updateProduct`/`deleteProduct`/`getCategories`/
`getStates`/`searchProducts`) didn't. Added it, mechanical and consistent
with the file's own existing pattern.

**Writing the regression test surfaced a second, more interesting bug**:
manually exercising `GET /search` showed it hitting `getProductById()`
instead of `searchProducts()`. Root cause: `router.get('/:id', ...)` was
registered at line 524, `router.get('/search', ...)` at line 599 - Express
matches routes in registration order, and `/search` is a single path
segment, so `/:id` (with `id='search'`) caught every request before the
real `/search` handler was ever reached. (`/categories/list` and
`/states/list` were unaffected - two path segments, don't match the
single-segment `/:id` pattern - confirmed by testing all three.)
`searchProducts()` itself was real and correct; it was simply
unreachable through the live API. Fixed by moving the `/search` route
registration above `/:id`, with a comment explaining why order matters
here specifically (most of this router's other routes don't care about
order, so the fix is deliberately narrow, not a general reordering).

Added `services/legacy/__tests__/productService.test.js` (7 tests): the
6 DB-unavailable-guard cases, plus a route-ordering test that inspects
`router.stack` directly to assert `/search` is registered before `/:id`
- this would have caught the shadowing bug before it shipped, and
catches a regression if someone re-adds a route in the wrong order later.
All passing, `node -c`/eslint clean.

Given a fresh, cheap pattern to check for, swept all 42 newly-mounted
routers' route path lists for the same shape (a static single-segment
path registered after a `/:id`-style dynamic one). 2 candidates
(`formService.js`'s `/templates`, `moduleCatalogService.js`'s
`/assistant`) - both checked by hand and confirmed false positives:
`/templates` is actually registered *before* `/:id` in that file, and
`/assistant` is `POST` while the colliding `/:id` is `GET` (different
HTTP methods don't collide regardless of path order). No further
instances of this bug found in this batch.

## Update — 2026-09-15, seventeenth follow-up: closed a latent double-mount risk, found real evidence commerceApi.js is the missing link

**Safety fix, precautionary**: `index.js` also runs a completely separate
auto-discovery mechanism (`DynamicRouteLoader.discoverAndMountRoutes`,
`core/dynamicRouteLoader.js`) that independently walks `routes/` and
auto-mounts anything it finds at `/api/v1/<name>`, unaware of what
`index.js`'s own static `app.use()` calls already did. The 4 scaffold
files swapped out in the thirteenth/sixteenth updates
(`orderRoutes.js`/`productRoutes.js`/`iotIntegrationRoutes.js`/
`predictiveAnalytics.js`) still exist on disk (kept for their own
pre-existing test files) and still export a valid, mountable Express
router - meaning this loader could independently rediscover and mount
the *fake* "Route operational" scaffold a second time, at a different
path, alongside the real one. Attempted to verify empirically whether
this actually happens; the loader hangs/times out scanning 400+ real
route files in this sandbox (unrelated pre-existing issue, same root
cause suspected as the full-boot hang documented in the thirteenth
update) so this couldn't be proven either way in reasonable time. Given
the ambiguity, took the safe path regardless: added these 4 filenames to
`_isMountableRouteFile()`'s existing explicit-exclusion list (it already
hard-excludes several other known files by name) - minimal, matches an
established pattern in the same function, and removes the risk whether
or not it was real.

**Investigating a stale comment surfaced the real missing piece**:
`pages/SellerProductFormPage.jsx` carries an 11-day-old comment (commit
`8c8d06c2`, 2026-09-04 - well before this session, not a live/concurrent
edit) claiming "the real endpoint (POST /api/v1/products,
productService.createProduct) has existed all along." Checked this
claim directly: `_toMountSegment()` in the dynamic loader strips
`Routes` and does not pluralize, so even if the loader *had* auto-mounted
the old scaffold, it would land at `/api/v1/product` (singular), not
`/api/v1/products` (plural) as the comment claims - the claim doesn't
match anything real found anywhere in this repo. Given this session's
running theme (confident-sounding comments describing code that was
never actually verified), treating it as unverified, not as evidence of
a real, currently-existing `/api/v1/products` mount to preserve.

**What the investigation did confirm, and is still open**: `services/commerceApi.js`
(real, complete, correct-shaped `productsAPI`/`ordersAPI`/`farmersAPI`/
`seedVaultAPI`/`blockchainVerificationAPI`/`enterpriseIntegrationAPI`/
`productReviewsAPI`) is only imported by the already-documented-dead
`services/index.js` barrel. Meanwhile **22 real, live pages** (`CartPage`,
`CheckoutPage`, `OrderDetailPage`, `PaymentProcessingPage`,
`ProductDetailPage`, `SellerProductFormPage`, `SeedVaultPage`,
`BlockchainVerificationPage`, `EnterpriseIntegrationPage`, and ~13 more
using `farmersAPI`) all import these same-named objects from
`services/api.js` instead - which either doesn't define them at all
(`productsAPI`, `farmersAPI`, `productReviewsAPI` - the literal
MISSING_EXPORT build errors already tracked) or defines a thinner,
wrong-shaped version that doesn't match what the real pages call
(confirmed directly against `CartPage.jsx`/`EnterpriseIntegrationPage.jsx`/
`SeedVaultPage.jsx`/`BlockchainVerificationPage.jsx`'s actual method
calls vs. `api.js`'s actual exports - real, reachable, would-crash
mismatches, not a hypothesis). `commerceApi.js`'s method shapes for
`productsAPI`/`ordersAPI` already match the real, now-mounted
`productService.js`/`orderService.js` routers from the thirteenth/
sixteenth updates almost exactly (`getCategories`→`/categories/list`,
`addToCart`→`POST /cart`, etc.) - `commerceApi.js`'s own path prefixes
still need the same `_BASE`-absolute-URL fix already used for
`multilingualAPI`/`conversationalAIAPI` (it currently assumes `/products`/
`/orders` resolve under the generic `/api/v1` base, which doesn't match
the real `/api/product`/`/api/order` mounts). **Not fixed in this
update** - scoped as its own follow-up given the number of pages and API
objects involved (this is the concrete, now-well-understood shape of the
"~140 missing exports" item tracked since early in this backlog).

## Update — 2026-09-15, eighteenth follow-up: started closing the missing-exports gap for real, 161 → 157 build errors

Picked up the follow-up flagged at the end of the seventeenth update.
Fixed the pieces with a confirmed real backend, verified end-to-end
against actual route handlers rather than guessed:

- **`productsAPI`** (didn't exist in `api.js` at all): added, matching
  `services/legacy/productService.js`'s real routes exactly -
  `getProducts`/`getProduct`/`createProduct`/`updateProduct`/
  `deleteProduct`/`getCategories`/`getStates`/`searchProducts`.
- **`productReviewsAPI`** (didn't exist): added, matching the real (not a
  scaffold, predates this session) `routes/productReviewRoutes.js` -
  `getReviews`/`getStats`/`createReview`.
- **`ordersAPI`** (existed, but only `getOrders()`/`createOrder()` against
  a nonexistent `/orders` path): rewritten to the full real
  `orderService.js` contract - `getCart`/`addToCart`/`updateCartItem`/
  `removeFromCart`/`clearCart`/`createOrder`/`getOrder`/`getOrders`/
  `updateOrderStatus`/`processPayment`. Confirmed via grep that no
  existing caller relied on the old thin signature in an incompatible
  way (`Generated/Page2.jsx`'s `getOrders(filter)` call is compatible).
  No `cancelOrder` - the real backend has no cancel endpoint; not
  fabricated.
- **`productMediaAIAPI`** (existed, but only two methods nothing called,
  pointed at a path that doesn't exist): rewritten to match the real,
  already-implemented (not a scaffold) `routes/productMediaAIRoutes.js` -
  added `generateImage()`, the method `ProductDetailPage.jsx` actually
  calls.
- **Named `{ api }` export** added alongside the existing default export:
  `AdvancedMedicalCodingPage.jsx` imports it directly and calls relative
  paths against it, which already resolve correctly against the real
  `advancedMedicalCodingService.js` mounted specifically at
  `/api/v1/advanced-medical-coding` in the fourteenth update - this was
  a one-line fix once that backend existed.

All five use the same `UNVERSIONED_BASE` (`API_BASE_URL` with `/api/v1`
stripped) absolute-path pattern already established for
`multilingualAPI`/`conversationalAIAPI`/`voiceAIAPI`, since the backend
mounts these routes unversioned.

**Verified**: `@babel/parser`/eslint clean; `npm run build` error count
dropped from 161 to 157 (the 3 previously-missing named exports plus the
`api` named export, each counted once per importing file); a live
headless-browser pass over `/products/:id`, `/cart`, `/sell/new-product`
(redirects to Login as a protected route, correctly) showed zero
JS errors from any of the rewritten API objects - only the
already-documented, unrelated multilingual network-error noise from no
backend running in this sandbox.

**Remaining missing exports** (`farmersAPI`, `modulesAPI`,
`climateMonitoringAPI`, `competitorAPI`, and the rest of the ~140) were
not attempted here - each needs the same per-export verification just
done for products/orders (real backend check, real caller check, path
verification), and `farmersAPI` specifically was already confirmed in
the seventeenth update to have no matching real backend
(`routes/farmerRoutes.js` is a 38-line scaffold with nothing real behind
it in `services/legacy/`). Worth picking up incrementally, one verified
export at a time, rather than batching further guesses.

## Update — 2026-09-15, nineteenth follow-up: one more verified export, two more checked and correctly left alone

Continued the incremental approach from the eighteenth update.

- **`modulesAPI`** added: `ModuleRuntimePage.jsx`'s one call,
  `getModules()`, reads `response.data.modules` - matches
  `services/legacy/moduleCatalogService.js`'s real `GET /` handler
  (`{success, modules, generatedAt}`) exactly, already mounted at
  `/api/modulecatalog` in the thirteenth update. Also added
  `getModule(id)`/`getOverview()` from the same real router's
  `GET /:id`/`GET /overview`, not yet called by any page but real and
  free to expose alongside `getModules`. Build errors: 157 → 155.

- **`climateMonitoringAPI`** checked, not fixed:
  `services/legacy/climateMonitoringService.js` exists and is real
  (`droughtMonitoring`/`floodMonitoring`/`diseaseForecasting`/
  `climateRisk`/`agroMeteorology`) but exports plain functions, not an
  Express router - it was correctly absent from the thirteenth update's
  sweep (which only found files exporting `router`). The mounted
  `routes/climateMonitoringRoutes.js` is the usual 38-line scaffold.
  Fixing this means *writing new route handlers* that call these
  functions and match what `ClimateMonitoringDashboardPage.jsx` expects
  (`getStatus`/`getAlerts`/`getDroughtData`/`getFloodData`/
  `generateReport` - none of which map obviously 1:1 to the five real
  function names), not remounting an existing complete router. That's a
  different, riskier class of change than every fix in this backlog so
  far (writing glue/business logic vs. wiring up something already
  complete) - flagged for real design attention, not rushed.

- **`competitorAPI`** checked, not fixed: no real backend found under
  any name (`competitor`, `competitive`) in `services/legacy/`, root, or
  domain subfolders. Genuinely needs backend work from scratch.

Build error count now at 155 (started this backlog thread at 161).

## Update — 2026-09-15, twentieth follow-up: farmersAPI - the biggest single win in this thread, plus a fifth "real but unmounted" file

Went looking for `farmersAPI`'s real backend the same way as every prior
fix - and found it, in the same shape as `farmerValueRoutes.js`
(twelfth update): a real, standalone route file, `routes/farmerRoutes_merged.js`
(116 lines), calling the real `services/legacy/farmerService.js`
directly (not mounting its own router-in-a-router), complete with its
own dated bug-fix comments ("FIXED 2026-08-15: ... has always returned
'Farmer not found' for every real farmer", "FIXED 2026-08-15: ... 401'd
on every call") - sitting unmounted next to the usual 38-line
`routes/farmerRoutes.js` scaffold that was live instead. Swapped in
`index.js`.

`getFarmerById`/`getFarmers`/`calculateFDI`/`addFarmerCertification`/
`getFarmerCertifications`/`getFPOs` match `commerceApi.js`'s
`farmersAPI` shape exactly. Added `farmersAPI` to `api.js` with these 6
methods. **Important scope note, not glossed over**: the 12 real pages
that import `farmersAPI` call ~28 distinct methods between them: the
other ~22 (`getFields`, `getHarvestScore`, `getMarketPrices`,
`getBenchmarks`, `getDemandForecast`, `savePricingModel`, etc.) belong
to entirely different domains (field management, harvest scoring,
market pricing/analytics) that this investigation didn't touch and have
no confirmed backend yet - adding only the 6 verified ones fixes the
*build* (the export now exists) and makes the farmer-directory calls
actually work, but pages calling the other methods will still fail at
runtime until each is checked the same way. Not fabricated to make the
number look bigger.

Also found and fixed the same missing-DB-null-guard gap as
`orderService.js`/`productService.js`: all 13 of `farmerService.js`'s
exported functions fetched `getPostgreSQL()` without checking it,
including the farmer wallet subsystem (deposit/withdraw/transfer/
balance/bank-linking) this same file implements. Added the guard to the
8 that needed it directly; the other 5 wallet functions call
`getFarmerWallet()` (now guarded) before touching `pg` themselves, so
they're covered transitively - verified this by reading each function's
body, not assumed. Added 13 tests.

**Verified**: `node -c`/eslint clean on all touched files; 13/13 new
tests passing; standalone smoke test confirms the real router - auth
enforcement (401 without a token), and clean `"Database connection not
available"` errors (not raw TypeErrors) on every endpoint checked.
`npm run build` error count: 155 → 143, the single largest drop from one
fix in this whole backlog thread (farmersAPI was imported by more pages
than any other single missing export).

## Update — 2026-09-15, twenty-first follow-up: `_merged.js` is a whole naming convention, not a one-off - 15 more real routers mounted

`routes/farmerRoutes_merged.js` (twentieth update) and
`routes/marketplaceEnhancements_merged.js` (already known-real from
earlier this session) turned out not to be isolated cases:
`find routes -iname "*_merged.js"` found **97 files** using this exact
naming convention, 96 of them unmounted anywhere.

**Filtered before touching anything**, since the pattern isn't uniform:
- ~35 of the 96 are themselves auto-generated placeholders with `_merged`
  just appended to the module name (confirmed by reading a sample,
  e.g. `climateAdvisoryRoutes_merged.js` - 20 lines, "Placeholder route
  module", identical shape to the scaffold it would "replace"). Filtered
  out mechanically: kept only candidates at least 20 lines larger than
  the scaffold currently mounted under the same name.
- Of the ~24 that passed that filter, checked each with an isolated
  `require()`: 4 threw real errors (`decisionSupportRoutes_merged.js`,
  `pigRoutes_merged.js`, `sheepRoutes_merged.js`: "protect(Livestock)Router
  is not a function"; `weatherRoutes_merged.js`: "queryValidator is not a
  function") - genuine bugs in those specific files (likely a missing or
  renamed middleware import), **not mounted, not fixed here** - a
  different, real bug to chase separately, not something to paper over.
- The remaining candidates not yet individually re-verified after the
  script timeout (`seedVaultRoutes_merged.js`,
  `libraryRoutes_merged.js`, `platformCoreRoutes_merged.js`,
  `riskPricingRoutes_merged.js`, `poultryRoutes_merged.js`,
  `aiOperationIntelligenceRoutes_merged.js`,
  `completeAIIntegrationRoutes_merged.js`, and several smaller ones)
  are flagged for the next pass, not assumed either way.

**Mounted 15 confirmed-clean, confirmed-substantial swaps** (same
require-path-only pattern as every prior scaffold swap):
`logisticsEnhancements`, `projectSystemsRoutes`,
`ecommerceMarketingRoutes`, `aiBrainRoutes`, `farmerPortalEnhancements`
(land records, crop plans, government-data sync - a large real farmer
subsystem), `aiSelfHealingRoutes`, `insuranceEnhancements`,
`recoveredFinanceRoutes`, `nutrientValueSalesRoutes`, `unifiedAIRoutes`,
`visionRoutes`, `marketplaceEnhancements`, `regionalVarietyRoutes`,
`dprGenerationRoutes`, `ecommerceBusinessSalesRoutes`.

**Verified**: `node -c` clean; eslint clean; a synchronous
`require('./src/index.js')` (running every one of these swapped
requires as part of the full app) printed "LOAD ATTEMPT COMPLETED"
without throwing - the process not exiting afterward is the same
pre-existing Redis-connection hang already documented in the thirteenth
update, confirmed unrelated by isolating and individually
require()-testing all 15 files first (each completes in well under a
second on its own). A combined standalone smoke test across 4 of the 15
(`farmerPortalEnhancements`, `marketplaceEnhancements`, `aiBrainRoutes`,
`insuranceEnhancements`) confirmed real auth enforcement (401 without a
token) and clean error handling with no database connected - one even
surfaced a clearer error message than this session's own pattern
("PostgreSQL pool is not initialised. Call database/connection.initialize()
during boot before serving requests.").

**Not done in this update, flagged for next time**: the 4 confirmed-broken
merged files (real bugs, not mounted); the ~8 not-yet-individually-verified
substantial candidates; and a fresh `npm run build` error count (frontend
API client wiring for any of these 15 newly-real backends wasn't checked
in this update - that's its own investigation per file, same as
`farmersAPI`/`productsAPI` before it).
