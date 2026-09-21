# AFRERA Next-Gen Maturity — Staged TODO

**Status: TRACKED, NOT COMPLETE.** This document converts the 2026-09-20
strategic vision assessment into an actionable TODO list. It is explicitly
**not** claiming any of this is done — that would repeat the exact
"100% complete" fabrication pattern this repo's own history shows and that
was cleaned up earlier this session (see `docs/consolidation-audit/` and
commit `bb7781c14`). Nothing here should be marked `[x]` without the same
kind of verification (real boot, real test, real invocation) used
everywhere else in this session's commit history.

**Scale reality check:** this vision describes a multi-year, national-scale
digital-economic-OS build (canonical AI model governance, a national
agricultural knowledge graph, village-level digital twins, federated
learning, an ERP general ledger with double-entry posting and audit
lineage, a workflow orchestration engine covering 20+ business processes,
etc.). No single session — this one included — completes this. The
honest, correct use of this document is: pick one small item, verify it
against the real codebase (not assume it's missing), implement or fix it
for real, verify again, commit, repeat. That is the exact method this
session already used for the ecommerceService.js and comprehensiveERPController.js
fixes below.

## Stage 0 — Concept reconciliation (in progress)

Goal: classify every concept as verified working / partially working /
scaffolded / documented only / disconnected / duplicated-but-distinct /
overlapping / conflicting / blocked / proposed-future. **Preserve
everything — nothing described here should be deleted**, only classified
and then fixed or built.

- [ ] Build the "verified concept-to-runtime matrix" the assessment calls
      the single most important missing piece: concept -> module -> route
      -> service -> DB table -> test -> telemetry, for at least the
      backend's 768 mounted routes and 544 modules as a starting scope.
      (This session's `.ai/plugins/audit-chain.js` and the controller/
      service call-resolution scanner built this session are real, reusable
      building blocks for this — not a fresh start.)
- [x] Real vs. fabricated inventory, first pass: 767→768 route-mount
      health verified via live boot (commit `3889245f0`, `00cb17c37`); real
      module.json status is confirmed unreliable as a completeness signal
      in either direction (see `.ai/tasks/ACTIVE.md`, "branch-content
      verification methodology" note) — line count and self-declared status
      cannot substitute for checking actual exported methods against actual
      callers.
- [x] One concrete case done end-to-end as a template for the rest: the
      "ERP capabilities are named but missing end-to-end logic" finding
      turned out to be a wrong-service-require bug, not missing logic —
      `comprehensiveERPController.js` now correctly wired to the real,
      1751-line `comprehensiveERPService.js` covering all 12 SAP-standard
      modules (commit `00cb17c37`). This is the pattern to repeat for other
      "named but not connected" findings before assuming logic needs to be
      built from scratch.

## Stage 1 — Industry baseline

### Authentication (flagged as "below baseline" — needs direct verification, not assumed)

- [ ] Verify the specific claim: does `authRoutes.js` really use in-memory
      users / plaintext passwords / fabricated `jwt_user_timestamp` tokens
      while protected routes use real JWT via `middleware/auth.js`? This
      session found `middleware/auth.js` already has real HS256-pinned JWT
      verification and a SKIP_AUTH fail-closed-in-production guard (see
      `.ai/tasks/ACTIVE.md`) — but `authRoutes.js` itself was not directly
      audited this session. Check before assuming the described gap still
      exists in `consolidated/final` specifically (this exact
      tree-vs-tree mistake already happened once this session with the ERP
      controller and cost real time to correct).
- [ ] Audit frontend token-name/API-path consistency across all clients
      (`frontend/src`, `afrera/afrera-*` scaffolds) — the assessment claims
      "multiple frontend clients use different token names and API paths."

### Dependency vulnerabilities (already tracked, not duplicated here)

- [ ] See `.ai/tasks/ACTIVE.md` item 1: backend 21 vulnerabilities (3 high),
      frontend 10 (3 high, 2 critical) — needs file-by-file `npm audit`
      review, not `--force`.

### Duplicate/parallel-route resolution (already tracked, not duplicated here)

- [x] freightPoolingService 3-way collision — resolved, commit `00cb17c37`.
- [ ] See `.ai/tasks/ACTIVE.md` item 4 (closed with certainty) and the
      Sep-19 `CLAUDE_DEVIN_MERGE_REPORT.md`'s "what's left" list (items
      1, 2, 6, 7, 8 — route reorg dedup, filename-candidate-group scan,
      blob-hash duplicate scan) for the broader systematic duplicate-route
      work the vision doc's "API architecture" baseline row calls for.

### One coherent API/data/testing/observability baseline

- [ ] API contract consistency audit (naming, response envelope, error
      shape) across the 768 mounted routes — not started.
- [ ] Migration execution status — `docs/consolidation-audit/` and
      `.ai/` historical docs repeatedly flag migrations as
      "created, not executed" against a real PostgreSQL instance; this
      session worked entirely in degraded/no-DB mode (confirmed via boot
      logs showing "Database initialization incomplete; degraded startup
      allowed"). Running migrations against a real DB and re-verifying
      end-to-end is a hard prerequisite for anything past Stage 1.
- [ ] Test-suite honesty audit: this session found and left in place a
      correctly-labeled `describe.skip` (marketplace.test.js, dated
      2026-08-30, real documented reason — stale schema assumption). Sweep
      for other skips/mocks that may be hiding rather than documenting
      real gaps, using the same "read the actual skip reason" method, not
      a blanket un-skip.

## Stage 2 — Sector-native journeys

Not started this session. Per the vision doc: agriculture lifecycle,
marketplace/retail, travel, insurance, banking, logistics, government
schemes, engineering, enterprise ERP, health/nutrition — each needs a real
state-machine-backed journey, not just CRUD endpoints. Recommend picking
ONE sector (agriculture, given it's the platform's core identity) and
building/verifying its full plot→plan→finance→procure→operate→monitor→
harvest→grade→store→sell→settle chain before generalizing the pattern to
other sectors.

## Stage 3 — Intelligent assistance (governed AI)

Not started this session. The vision doc's own list of required AI
governance primitives (model registry, AI gateway, evidence records,
confidence/uncertainty, citations, hallucination detection, human
approval, outcome feedback, drift/bias monitoring) is itself a multi-month
build. **Explicit constraint carried over from this session's standing
discipline: a rule, random number, hardcoded response, or generic API
wrapper must not be labeled "AI" or given a fabricated confidence score.**
The ecommerceService.js fix this session (commit `9c3033d3d`) is a direct,
real example of applying this exact rule: removed fabricated 0.85/0.5/0.3
confidence scores from deterministic heuristic code and replaced them with
an honest `method: 'deterministic_heuristics_not_model_prediction'` label
and `confidence: null`. Apply the same audit to every other
`*AIService.js`/`*aiAPI` file before trusting any of their confidence
scores.

## Stage 4 — System intelligence (cross-workflow AI)

Not started. Depends entirely on Stage 1-3 being real first.

## Stage 5 — Autonomous ecosystem (bounded execution)

Not started. Depends entirely on Stages 1-4.

## Stage 6 — Futuristic platform

Not started. The "Table 5" futuristic concepts (Personal Economic Digital
Twin, Village Digital Twin, Federated Rural Intelligence, National
Agricultural Knowledge Graph, etc.) are aspirational research-grade
projects, each individually comparable in scope to this entire platform.
Treat as a north star for architecture decisions (don't build Stage 1-3 in
a way that forecloses these), not as near-term work items.

## How to use this document

1. Pick exactly one unchecked item.
2. Verify against the actual current `consolidated/final` state first —
   do not assume the vision doc's description still matches reality (it
   may already be fixed, may be worse than described, or may be a
   different bug than assumed — this happened three times already this
   session).
3. Implement the real fix, no stubs, no fabricated success.
4. Verify with a real test, real boot, or real invocation — not just
   `node --check`.
5. Commit with the evidence in the message (what broke, what you checked,
   what proves it now works).
6. Check the box here and in `.ai/tasks/ACTIVE.md` if it's a
   cross-referenced item.

Do not batch-mark multiple items complete without doing step 2-4 for each
one individually. This document exists specifically to prevent the
"documentation says complete, runtime doesn't" gap the vision assessment
itself identifies as AFRERA's most important missing element.
