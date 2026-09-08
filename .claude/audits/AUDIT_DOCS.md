---
agent: doc-auditor
status: fail
findings: 11
---

# Doc Auditor Report — EBDESIGN

Audit date: 2026-09-08 (re-verified same day, second pass — see "Re-verification note" below)
Branch: `audit/ui-api-fix`

## Re-verification note (second pass, same session day)

This report was already refreshed once earlier today. Since the repo has multiple sessions actively committing/uncommitting work concurrently, every headline count was re-run rather than trusted from the prior pass. Findings 1-11 below are unchanged in substance and remain valid; the numbers moved slightly (all upward) between the two passes purely from other sessions' in-flight edits, which is itself evidence supporting Finding 1 (docs frozen at a point-in-time estimate cannot keep pace with a repo this volatile) and Finding 10 (see refinement below — `.vibecheck/` does partially exist now, but `truthpack/` still does not):

| Metric | First pass (this session, earlier) | Second pass (just now) | Delta |
|---|---|---|---|
| Frontend `.jsx` pages | 387 | 387 | none |
| Backend route files | 338 | 338 | none |
| `app.use(` mounts in `index.js` | 224 | 224 | none |
| Backend services (`*.js`) | 610 | 613 | +3 (new untracked `clinicalNutritionDecisionSupportService.js`, `medicalCodingReferenceService.js`, `clinicalNutritionDecisionSupportService.test.js`) |
| DB migrations (`*.sql`) | 415 | 418 | +3 (new untracked `9998_ai_response_feedback.sql` and two `9999_*` files) |
| Test files (`*.test.js`) | 792 | 809 | +17 |
| Stub tests (`test0`-`test725`) | 726 | 726 | none |
| `_EBDESIGN_LIBRARY` files | 11 | 11 | none |
| `.ai/handoffs/` freshest file | `2026-09-05-ai-platform-hardening.md` | multiple files now stamped `Sep 7 19:06` (`DATABASE_MIGRATION_EXECUTION_PLAN.md`, `DEVIN_FILE_INVENTORY_MAPPING.md`, `GITHUB_PR_TEMPLATE.md`, `INFRASTRUCTURE_UNBLOCKING.md`, `PHASE_4_TO_PHASE_5_HANDOFF.md`, `TWO_PORT_EXECUTION_GUIDE.md`) | handoffs directory is even fresher than first noted — strengthens Finding 9 |
| `.ai/tasks/ACTIVE.md` | referenced as current | confirmed still the same file, last modified Sep 6 19:23, 1500+ lines | unchanged, still the right pointer |

No finding is retracted. All four core docs (`CLAUDE.md`, `.ai/PROJECT_CONTEXT.md`, `.ai/architecture/CURRENT_IMPLEMENTATION.md`, `.ai/architecture/CODEBASE_MAP.md`) still self-declare `**Last Updated:** 24 August 2026` verbatim, confirmed via direct re-grep this pass, and the latest commit on the branch remains `5e2eb01b` (`git log -1` timestamp `Mon Sep 7 22:40:43 2026`).

## Summary

The project's canonical "read this first" documents — `CLAUDE.md` and the three core `.ai/architecture/` status docs — are frozen at **24 August 2026** and have not been updated across **78 commits** made since 2026-08-25 (verified via `git log --since="2026-08-25" --oneline | wc -l`). In that window the repo went through several documented boot-blocker and domain-fix passes (finance/insurance, ERP, platform/identity, agriculture core, and a general "resolve all boot/build-blocking bugs" pass). None of that is reflected in the numbers new contributors are told to trust.

Every headline metric in `CLAUDE.md` / `.ai/PROJECT_CONTEXT.md` / `.ai/architecture/CURRENT_IMPLEMENTATION.md` / `.ai/architecture/CODEBASE_MAP.md` under-counts the current repo, several by 2-4x, and the "0% test coverage" claim is now actively false and actionably misleading in the other direction (hundreds of the "test files" that would fix the number are auto-generated no-ops). `.ai/tasks/ACTIVE.md` and the newer files under `.ai/handoffs/` are meaningfully fresher and should be the pointer new agents are told to trust instead of the frozen architecture docs.

## Findings

### 1. [HIGH] Core status docs are 15 days / 78 commits stale and self-declare as "Last Updated: 24 August 2026"
**Location:** `CLAUDE.md`, `.ai/PROJECT_CONTEXT.md`, `.ai/architecture/CURRENT_IMPLEMENTATION.md`, `.ai/architecture/CODEBASE_MAP.md`
**Description:** All four carry the same `Last Updated: 24 August 2026` stamp. `CLAUDE.md` additionally states this stamp at the top of the file the START HERE protocol tells every new agent to read first. Meanwhile `git log --since="2026-08-25"` shows 78 commits, including five with messages naming concrete fixes (`Finance/Insurance domain: fix escrow auth gap...`, `ERP domain: fix duplicate /erp-dashboard route path...`, `FIX: Resolve all boot/build-blocking bugs found during end-to-end verification`, `Platform/Identity: fix org/tenant CRUD, unblock aiBackboneService boot...`, `Agriculture core batch: real AI crop advisory...`). None of these are reflected anywhere in the "Known Problems," "Current Status," or implementation-matrix sections of the four documents above.
**Remediation:** Update the `Last Updated` stamp and the numeric claims below in all four documents, or add an explicit "documents frozen at commit `2ef9fa06`, see `.ai/tasks/ACTIVE.md` and `.ai/handoffs/` for current state" pointer at the top of each so agents don't silently trust stale numbers.

### 2. [HIGH] Frontend page count is wrong by ~2.5-3x
**Location:** `CLAUDE.md` ("123/150 pages complete"), `.ai/PROJECT_CONTEXT.md` line 38, `.ai/architecture/CURRENT_IMPLEMENTATION.md` lines 44-57 (per-category table totaling "123/150", "82% complete")
**Description:** Actual count: `find frontend/src/pages -name "*.jsx"` returns **387** `.jsx` files (227 at the top level alone, before recursing into subdirectories). The docs' own per-category breakdown (Dashboard 15/20, User Management 10/10, Product Management 12/12, etc.) sums to a denominator of 150, which is not remotely close to the actual page inventory today.
**Remediation:** Regenerate the page inventory (`find frontend/src/pages -name "*.jsx" | wc -l` plus a route-mounted vs. orphaned breakdown) and replace the stale category table.

### 3. [HIGH] Route file / route-mount counts are wrong by ~2-3x
**Location:** `CLAUDE.md` ("107 route files mounted"), `.ai/PROJECT_CONTEXT.md` line 28, `.ai/architecture/CODEBASE_MAP.md` line ~15 ("API route definitions (107 files)")
**Description:** `find backend/src/routes -name "*.js"` returns **338** route files; `grep -c "app.use(" backend/src/index.js` shows **224** mount calls in the entry point alone. The docs' "107 route files mounted" understates both the file count and the mount count substantially. Note also that current git status shows `backend/src/routes/commerce/sellerRankingRoutes.js` deleted and `backend/src/index.js` modified — the route inventory is actively moving and the doc was never a snapshot of a specific commit to begin with.
**Remediation:** Regenerate route inventory from `backend/src/index.js` mount calls (source of truth for "actually wired," per CLAUDE.md's own "VERIFY ACTUAL RUNTIME/INTEGRATION STATE" rule) rather than a raw file count, and update both docs together so they don't drift from each other (PROJECT_CONTEXT says 107, CODEBASE_MAP says 107 too, but neither matches reality).

### 4. [MEDIUM] Backend service count is wrong by ~4x
**Location:** `CLAUDE.md` ("140+ services implemented"), `.ai/PROJECT_CONTEXT.md` line 27 ("140 backend services implemented")
**Description:** `find backend/src/services -name "*.js"` returns **610** files. Even allowing for some being non-service helpers, this is far past "140+".
**Remediation:** Recount and update, or scope the claim explicitly (e.g., "140+ services documented in `_EBDESIGN_LIBRARY`" if that's what was actually meant, since the two numbers may have been conflated — see Finding 8).

### 5. [MEDIUM] Migration file count is internally inconsistent across docs, and wrong in all three variants
**Location:** `CLAUDE.md` ("96 migrations", "96 database migrations"), `.ai/PROJECT_CONTEXT.md` line 29 ("200 migration files"), `.ai/architecture/CURRENT_IMPLEMENTATION.md` line 68 ("96+" total migrations), `.ai/architecture/CODEBASE_MAP.md` ("96+ SQL migration files")
**Description:** The docs don't even agree with each other (96 vs. 96+ vs. 200), and actual count is **415** `.sql` files under `backend/src/database/migrations/` (427 total entries including non-.sql). Whichever number was intended, current reality is roughly 2-4x higher than any of the stated figures.
**Remediation:** Pick one canonical count generated by `find backend/src/database/migrations -name "*.sql" | wc -l` at doc-update time, and keep the three documents' numbers identical going forward (they describe the same fact and currently don't match each other, which is a red flag that this file gets hand-edited independently in each doc).

### 6. [HIGH] "0% test coverage" / "0/150 modules have test evidence" is now false, but the true state is more nuanced than a simple correction
**Location:** `CLAUDE.md` ("Test frameworks configured, 0% coverage, no tests written", "0% test coverage"), `.ai/PROJECT_CONTEXT.md` line 153 ("0/150 modules have test evidence"), `.ai/architecture/CURRENT_IMPLEMENTATION.md` lines 70-77 (Testing table: 0% coverage, 0 passing, 0 failing for all rows) and the per-module "Tests: None" lines throughout
**Description:** This needs correcting in **both directions**, which is why it's flagged HIGH rather than just "update the number":
- There are now **~792 files** matching `*.test.js` under `backend/src/`, which sounds like a huge coverage jump.
- But **726 of those** (`backend/src/__tests__/test0.test.js` through `test725.test.js`) are auto-generated placeholder stubs. Every one checked (`test0.test.js` read directly) contains only:
  ```js
  describe('Test0', () => {
    it('should pass', () => { expect(true).toBe(true); });
  });
  ```
  These files inflate any naive "test file count" metric to near-meaningless levels and must not be reported as coverage.
- Separately, there is a real and growing body of substantive tests: the task's own reference files (`backend/src/__tests__/governanceComplianceAuditDomain.test.js`, 133 lines; `backend/src/tests/unit/aiBackboneFallback.test.js`, 75 lines; `backend/src/tests/unit/coldStorageService.test.js`, 197 lines; `backend/src/tests/unit/logisticsDomain.test.js`, 166 lines; `backend/src/tests/unit/productReviewService.test.js`, 156 lines) plus dozens of pre-existing named tests (`authService.test.js`, `authService.security.test.js`, `cropRecommendationService.test.js`, `marketplace.test.js`, `insurance.test.js`, `decisionEngine.test.js`, `farmerHealthRoutes.test.js`, `e2e/farmer-journey.test.js`, and ~50 more) exercise real service/route logic.
**Remediation:** Update the "0% coverage" claim to reflect that real, non-trivial test coverage now exists for a growing subset of domains (auth, marketplace, insurance, decision engine, cold storage, logistics, governance/compliance audit, product reviews, AI backbone fallback). Simultaneously, flag the 726 `test0.test.js`...`test725.test.js` stub files as noise that should either be deleted, consolidated, or excluded from any coverage/file-count metric the docs report — as-is they make it impossible to tell real coverage from filler by looking at file counts alone, which is exactly the kind of "verify actual runtime/integration state" trap CLAUDE.md itself warns against.

### 7. [MEDIUM] Database table count claim ("523+ tables") cannot currently be verified against a running database, and the doc presents it as fact rather than a static-schema estimate
**Location:** `CLAUDE.md` ("PostgreSQL (523+ tables, 96 migrations)"), `.ai/PROJECT_CONTEXT.md` line 19 ("PostgreSQL database with 523 tables"), `.ai/architecture/CURRENT_IMPLEMENTATION.md` line 68 ("523+" tables, status "PENDING", "Executed: NO")
**Description:** `CURRENT_IMPLEMENTATION.md`'s own table marks this row status **PENDING** / Executed **NO**, i.e., the 523 figure is a count of `CREATE TABLE` statements across migration files, not a verified live schema. `CLAUDE.md`'s one-line summary ("523+ tables") drops that caveat entirely, presenting a static estimate as an operational fact. Given migrations count itself is wrong (Finding 5), the derived table count is unverified and likely stale too.
**Remediation:** Either regenerate the table count from current migration files and re-verify it matches `CREATE TABLE` occurrences, or rephrase `CLAUDE.md`'s summary to make clear this is an un-executed, un-verified static estimate (e.g., "~523 tables defined across migrations, not yet executed against a live database").

### 8. [MEDIUM] "_EBDESIGN_LIBRARY: 524 module documentation cards" does not match the actual directory contents
**Location:** `CLAUDE.md` ("_EBDESIGN_LIBRARY/ # Module documentation (524 cards)"), `.ai/PROJECT_CONTEXT.md` line 105-106 (structure diagram shows `00_CATALOG/`, `01_MODULES/`, `99_AUDIT/` as the library's shape)
**Description:** The actual `_EBDESIGN_LIBRARY/` tree has ~45 numbered top-level directories (`01_ACQUISITION`, `01_MODULES`, `02_PROCESSING_FLOOR`, `02_SERVICE_CARDS`, `03_ERP`, `05_UI`, `06_SKELETON_CARDS`, `07_DEPENDENCY_CARDS`, `07_TESTS`, `08_DOCUMENTATION`, `08_GAP_CARDS`, `09_DOCUMENTATION_CARDS`, `09_RESEARCH`, `11_COMPONENTS`, `11_DECISIONS`, `13_DATA`, `13_RECONCILIATION`, `15_EXECUTION`, `16_CONNECTION_INTELLIGENCE`, `17_LIFECYCLE`, `18_HISTORY`, `18_RECOVERY_COLLECTION`, `20_GENERATED`, `21_DOCUMENTATION`, `21_EXTERNAL_DEPENDENCIES`, `22_TESTS`, `23_PRESERVATION`, `24_ARCHIVE`, `25_DISCOVERY_INDEX`, `27_READER_SERVICES`, `29_DEACCESSION`, `99_AUDIT`, `_CONTROL`, ...) — none named `00_CATALOG` as `PROJECT_CONTEXT.md`'s diagram claims. More importantly, `find _EBDESIGN_LIBRARY -type f | wc -l` returns only **11 files total** (2 of them `.md`), almost all under `25_DISCOVERY_INDEX/` (audit/inventory JSON and CSV files, not module cards). The "524 cards" figure and the "00_CATALOG/01_MODULES/99_AUDIT" structure appear to describe a taxonomy that was planned or previously existed but is not what's on disk now.
**Remediation:** Either regenerate the library card inventory and correct the count/structure diagram, or — if the library content lives elsewhere (a prior branch, an external location) — say so explicitly instead of implying 524 populated card files exist in this checkout. This is a "DO NOT ASSUME A MODULE IS A SCAFFOLD" situation in reverse: the doc assumes a populated library that isn't there.

### 9. [LOW] `.ai/tasks/ACTIVE.md` and `.ai/handoffs/2026-09-05-ai-platform-hardening.md` are meaningfully fresher than the "read first" docs but aren't surfaced by the START HERE order
**Location:** `CLAUDE.md` START HERE section (steps 1-6)
**Description:** `.ai/tasks/ACTIVE.md` (1500 lines, entries dated 2026-08-29 onward, tracking real completed work like "Wire the 6 genuinely-orphaned backend services — DONE") and `.ai/handoffs/2026-09-05-ai-platform-hardening.md` (dated 2026-09-05, with concrete verified changes and test evidence) are both more current and more trustworthy than the frozen architecture docs read earlier in the START HERE sequence. As written, an agent following CLAUDE.md's numbered steps builds its mental model from the stale docs (steps 2-5) before ever reaching task/handoff state, and nothing tells it the earlier docs may already be contradicted by the later ones.
**Remediation:** Add a line to CLAUDE.md's START HERE section: "If `.ai/architecture/*` conflicts with `.ai/tasks/ACTIVE.md` or the most recent file in `.ai/handoffs/`, the more recent one wins — check `Last Updated` / file dates."

### 10. [LOW] `.vibecheck/truthpack/` does not exist, but both `CLAUDE.md` files mandate treating it as "the SINGLE Source of ALL Truth"
**Location:** `CLAUDE.md` and `.claude/CLAUDE.md`, "TRUTHPACK-FIRST PROTOCOL" sections
**Description:** `ls .vibecheck/truthpack` returns "No such file or directory." Both CLAUDE.md files instruct every agent to read `product.json`, `routes.json`, `env.json`, etc. from that path before writing code, and to treat disagreement with the truthpack as automatic hallucination. Since the directory doesn't exist, this instruction is currently unfollowable as written, and the mandated "Verified By VibeCheck" badge is being appended to responses (per instruction) without any truthpack file actually having been consulted, because none exist to consult.
**Update (re-verified this pass):** `.vibecheck/` itself is not entirely absent — it exists with `flow/` (containing `planning-artifacts/` and `implementation-artifacts/` subdirs), `isl-studio/`, `provenance/`, plus loose files `last-score.json`, `registry-cache.json`, and `sync-queue.json`. So some vibecheck tooling state is present and apparently in active use. But none of the 13 named truthpack files (`product.json`, `monorepo.json`, `cli-commands.json`, `integrations.json`, `copy.json`, `error-codes.json`, `ui-pages.json`, `deploy.json`, `schemas.json`, `routes.json`, `env.json`, `auth.json`, `contracts.json`) exist anywhere under `.vibecheck/`, confirmed via direct listing this pass — `truthpack/` as a subdirectory simply was never created. This makes the finding slightly worse than "the tool was never run": the surrounding vibecheck infrastructure (`registry-cache.json`, `sync-queue.json`, an ISL studio directory) is live and being written to, yet the one artifact both CLAUDE.md files hinge every code-writing decision on was never generated.
**Remediation:** Either regenerate the truthpack (`vibecheck truthpack`, per the doc's own escape hatch: "Run `vibecheck truthpack` to regenerate if you believe it is outdated") or remove/soften the mandatory protocol language until the directory is restored, so agents aren't instructed to silently comply with an unfulfillable rule.

### 11. [LOW] `CLAUDE.md` "Known Problems" section still lists issues that recent commits describe as fixed
**Location:** `CLAUDE.md` "KNOWN PROBLEMS" section ("Frontend routes not added for new components", "Services not initialized on startup"); cf. `.ai/architecture/CURRENT_IMPLEMENTATION.md` "Integration Issues" (same claims) and `.ai/tasks/ACTIVE.md` entries describing route-wiring work as done, plus commit `2ef9fa06` ("unblock aiBackboneService boot, wire admin page")
**Description:** The static docs list "frontend routes not added" and "services not initialized on startup" as open problems, while `.ai/tasks/ACTIVE.md` and recent commit messages describe specific instances of exactly this class of work being completed (route wiring, service boot unblocking). Without a per-item resolution log, it's not possible to tell whether the *specific* routes/services named in `CLAUDE.md` are still broken or whether the class of problem was fixed generally and the doc just wasn't touched.
**Remediation:** Either close out the specific items in `CLAUDE.md`/`CURRENT_IMPLEMENTATION.md` that `.ai/tasks/ACTIVE.md` shows as done, or convert "Known Problems" into a dated log (issue / opened / closed) instead of a static list that silently rots.

## Metrics

| Metric | Docs claim | Actual (verified this audit) | Source doc(s) |
|---|---|---|---|
| Frontend pages | 123/150 (82%) | 387 `.jsx` files under `frontend/src/pages` | CLAUDE.md, PROJECT_CONTEXT.md, CURRENT_IMPLEMENTATION.md |
| Backend route files | 107 | 338 files; 224 `app.use(` mounts in `index.js` | CLAUDE.md, PROJECT_CONTEXT.md, CODEBASE_MAP.md |
| Backend services | 140+ | 613 files under `backend/src/services` (610 at first pass this morning; +3 from untracked `clinicalNutritionDecisionSupportService.js`/`.test.js`, `medicalCodingReferenceService.js`) | CLAUDE.md, PROJECT_CONTEXT.md |
| DB migrations | 96 / 96+ / 200 (inconsistent between docs) | 418 `.sql` files (415 at first pass; +3 from untracked `9998_ai_response_feedback.sql` and two `9999_*.sql` files) | CLAUDE.md, PROJECT_CONTEXT.md, CURRENT_IMPLEMENTATION.md, CODEBASE_MAP.md |
| DB tables | 523+ (marked "PENDING/not executed" in one doc, stated as fact in another) | Unverified against a live DB; PostgreSQL not running | CLAUDE.md, PROJECT_CONTEXT.md, CURRENT_IMPLEMENTATION.md |
| Test coverage | 0%, 0/150 modules have test evidence | 809 `*.test.js` files exist (792 at first pass); 726 are auto-generated no-op stubs (`test0`–`test725` in `backend/src/__tests__/`, unchanged count); the remainder are real, substantive tests across auth, marketplace, insurance, decision engine, cold storage, logistics, governance/compliance audit, product reviews, AI backbone, and now clinical nutrition decision support | CLAUDE.md, PROJECT_CONTEXT.md, CURRENT_IMPLEMENTATION.md |
| Library cards | 524 cards, `00_CATALOG/01_MODULES/99_AUDIT` structure | 11 files total in `_EBDESIGN_LIBRARY` (2 `.md`); ~45 top-level dirs, none named `00_CATALOG` | CLAUDE.md, PROJECT_CONTEXT.md |
| Core docs freshness | "Last Updated: 24 August 2026" | 78 commits since 2026-08-25; latest commit 2026-09-07 | CLAUDE.md, PROJECT_CONTEXT.md, CURRENT_IMPLEMENTATION.md, CODEBASE_MAP.md |
| `.vibecheck/truthpack/` | Mandated as "SINGLE Source of ALL Truth" | `.vibecheck/` exists (`flow/`, `isl-studio/`, `provenance/`, cache/queue JSON files) and is actively written to, but no `truthpack/` subdirectory and none of the 13 named JSON files exist anywhere in it | CLAUDE.md, .claude/CLAUDE.md |

**Findings by severity:** HIGH: 4 · MEDIUM: 4 · LOW: 3
**Overall status:** FAIL — the documents new agents are told to read first (`CLAUDE.md`, `.ai/PROJECT_CONTEXT.md`, `.ai/architecture/CURRENT_IMPLEMENTATION.md`, `.ai/architecture/CODEBASE_MAP.md`) materially misstate current repo state on every headline metric checked, in a mix of understatement (pages, routes, services, migrations) and a claim that is now flatly wrong in the corrective direction too (test coverage — both "more real tests exist than claimed" and "most of the new test files are content-free stubs" are true simultaneously, and the docs currently capture neither nuance).
