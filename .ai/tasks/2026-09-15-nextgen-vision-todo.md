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

## Immediate next action

Stage 0 and Stage 1a (auth) are the only items above that are concrete,
unblocked by missing infrastructure/credentials, and match what the source
document itself calls the prerequisite step. Recommend starting there.
