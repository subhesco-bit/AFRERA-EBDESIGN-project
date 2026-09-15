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

## Immediate next action

Stage 0 (concept-runtime matrix) is now the most valuable next step: this
session's spot-audits keep finding the same pattern (undercounted-but-real
surface area, real code sitting unmounted next to fabricated placeholders
solving the same crash) faster than any full manual mapping would, but a
real matrix is what turns "this session happened to sample this file" into
something durable other sessions (Claude or otherwise) can trust instead of
re-auditing from scratch each time.
