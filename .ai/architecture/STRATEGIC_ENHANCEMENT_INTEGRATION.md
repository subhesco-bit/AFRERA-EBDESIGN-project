# Strategic Architecture Enhancement — Integration Record

**Integrates:** Claude Design artifact *EBDESIGN Strategic Architecture Enhancement Plan* (Sept 1, 2026)
**Into:** EBDESIGN clean-rebuild programme
**Reconciled against:** `tools/deep-scan.js` full-tree scan, 13 Sept 2026, 68,952 files indexed
**Status:** Governance rules ADOPTED · Metrics SUPERSEDED · Phasing REVISED

---

## 1. What this document does

The Sept 1 plan is the governing framework for this work. Its six rules are
adopted verbatim as the operating contract. Its *numbers* were estimates taken
before any full-tree measurement existed, and every one of them is wrong by a
factor of 3–5×. This record keeps the framework, replaces the figures with
measured values, and revises the phasing to match what the measurement shows.

Nothing from the plan is discarded silently. Each divergence is stated below
with the evidence that forced it.

---

## 2. Governance rules — ADOPTED

All six rules carry forward unchanged and bind every commit in this programme.

| Rule | Status | Note |
|---|---|---|
| **1. Preserve existing work** | Adopted, clarified | See §2.1 — preserve *features*, not *copies* |
| **2. Verify before modify** | Adopted, strengthened | Now backed by a queryable inventory instead of inspection-by-eye |
| **3. Database-first integration** | Adopted, elevated | This is the critical path, not a step. See §4 |
| **4. Atomic commits** | Adopted | One feature/fix per commit, `.ai/` reference in message |
| **5. Audit-ready documentation** | Adopted | This file is issued under it |
| **6. Zero hallucination** | Adopted, **currently violated** | See §2.2 — blocking defect |

### 2.1 Rule 1 clarification: preserve features, delete copies

Rule 1 ("do not rewrite Devin's work") and the standing objective ("zero junk,
zero duplicate files") appear to conflict. They do not, once measured.

The duplication is **not** inside Devin's implementation. It is in four
snapshot folders created by earlier cleanup attempts:

- 48,522 of 48,522 redundant copies tree-wide
- **only 563 of them** live inside the working `backend/` + `frontend/` tree

Deleting the snapshot folders removes zero features, because every file in them
is a byte-identical (SHA-256 verified) copy of a file that remains. Rule 1 is
therefore satisfied by deletion, not threatened by it.

The 284 genuine source duplicates *inside* the live tree are handled under the
standing merge rule: combine both sides, then remove the redundant copy. Never
delete outright.

### 2.2 Rule 6 is currently unsatisfiable — blocking defect

Rule 6 requires cross-referencing `.vibecheck/truthpack/` before writing code.
That directory **is empty**. Zero of the thirteen required files exist. The only
truthpack artifact is a stale root `TRUTHPACK.json` dated Sept 8.

Consequence: every "truthpack-verified" claim made in this project since the
directory emptied has been unverifiable. This must be regenerated before code is
written, or Rule 6 is decorative. Tracked as **BLOCKER-1**.

---

## 3. Metrics — SUPERSEDED

The plan's figures against measurement. Plan column is Sept 1; measured column
is the 13 Sept full-tree scan.

| Metric | Plan (Sept 1) | Measured (Sept 13) | Δ |
|---|---:|---:|---|
| Backend services | 226 | **649** | 2.9× |
| Backend route files | 154 | **690** | 4.5× |
| Route declarations | — | **8,245** | not previously counted |
| Frontend pages | 212 / 222 | **1,112** | 5.0× |
| Frontend components | 74 | **479** | 6.5× |
| Migrations | 349 | **773** | 2.2× |
| Tables created | 523 | **1,867** | 3.6× |
| Backend modules | ~130 | **2,283 files / 543 dirs** | — |
| Files transferred | 911 | **68,952 indexed** | 76× |
| Critical blockers | **0** | **≥3** | see §4 |
| Completion rate | 96% | **not computable as stated** | see §3.1 |
| Days to production | 5 | **not credible** | see §5 |

### 3.1 Why "96% complete" cannot be reproduced

Completion was measured by counting files that exist. The scan measures whether
those files contain behaviour. Across the live tree:

| Layer | Files | Stubs | >6KB (substantive) | Substance |
|---|---:|---:|---:|---:|
| backend-service | 649 | 153 | 309 | 48% |
| backend-route | 690 | 1 | 46 | **7%** |
| backend-module | 2,283 | 438 | 399 | 17% |
| frontend-page | 1,112 | 176 | 155 | **14%** |
| frontend-component | 479 | 227 | 47 | 10% |
| test | 1,122 | **1,040** | 29 | **3%** |
| migration | 773 | 0 | 108 | 14% |

Backend services are genuinely substantial — 309 files over 6KB is real work and
Rule 1 protects it. But 690 route files yielding only 46 substantive ones means
the API surface is mostly thin generated wrappers. And the test layer is 93%
stubs: **the 0% coverage figure was optimistic — the tests exist as files but
assert nothing.**

---

## 4. Blockers — the plan recorded zero; there are at least three

### BLOCKER-1 · Truthpack is empty
`.vibecheck/truthpack/` contains no files. Rule 6 cannot be honoured.
**Fix:** regenerate before any code is written.

### BLOCKER-2 · Backend does not boot
`node src/index.js` exits 1. It resolves 684 of 691 local requires, then dies on
seven paths left stale by an earlier reorganisation. All seven target files
exist at new locations:

| Required by index.js | Actual location |
|---|---|
| `./routes/gstRoutes.js` | `routes/finance/gstRoutes.js` |
| `./routes/enterpriseAIRoutes.js` | `routes/ai/enterpriseAIRoutes.js` |
| `./routes/equipmentExchangeRoutes.js` | `routes/commerce/equipmentExchangeRoutes.js` |
| `./routes/farmerHealthRoutes.js` | `routes/agriculture/farmerHealthRoutes.js` |
| `./routes/finance/costRoutes_merged.js` | `routes/costRoutes.js` |
| `./routes/platform/governanceModule_merged.js` | `routes/governanceModule.js` |
| `./routes/seedVaultRoutes_merged.js` | `routes/seedVaultRoutes.js` |

**Fix:** seven path corrections. This is the cheapest high-value fix in the
programme and everything downstream depends on it.

### BLOCKER-3 · No datastore has ever run
PostgreSQL (5432), Redis (6379) and the Docker daemon are all down. Zero of the
773 migrations have executed. No route has ever been exercised against a real
schema.

This is the true reason nothing works, and the plan's Rule 3 already predicted
it. The plan then scheduled it as one item in an 8-hour Phase 1; the measurement
says 1,867 tables across 773 unordered migrations with 172 tables defined more
than once is not an 8-hour job.

### Additional defects found by scan (not blockers, but load-bearing)

- **807 unresolved relative imports** across 628 live files. 314 of them are a
  single generator bug emitting the literal string `./${className}.css` —
  one pattern fix clears 39% of all broken imports.
- **172 table names created in more than one migration** — including `users`,
  `roles`, `user_roles`, `audit_logs`, `warehouses`. Migration order is
  undefined, so applying them as-is is non-deterministic.
- **Frontend appears barely wired to backend.** Only 3 distinct `/api/v1/` URLs
  found across 1,112 pages. *Caveat: the scanner's URL regex only matches
  literal paths and may be missing an axios `baseURL` indirection. Confirm
  before treating as fact.*

---

## 5. Phasing — REVISED

The plan's three phases are kept. Their contents change, because the plan
assumed a booting system with a live database and neither exists.

### Phase 0 — Reclaim and stabilise *(new; the plan had no equivalent)*
Not optional: the disk is at 95% with 27 GB free, and 2,414 MB is
byte-identical snapshot copies. There is not room to build without it.

- Checkpoint branch — **done**, `e5ee63e7`
- Canonical inventory database — **done**, `.ai/inventory/inventory.db`
- Delete four snapshot folders after harvesting their audit artifacts (2,414 MB)
- Investigate `_EBDESIGN_LIBRARY`: 996 files occupying 3,075 MB (~3 MB/file)
- Retire the ~60 overlapping scanner scripts superseded by the inventory
- Regenerate truthpack → clears **BLOCKER-1**

### Phase 1 — Make it run *(was "Infrastructure Activation", 8 h)*
- Seven path fixes → **BLOCKER-2** cleared, backend boots
- Fix the `${className}.css` generator bug → 314 imports resolved
- Stand up PostgreSQL + Redis
- Order and de-conflict 773 migrations; resolve 172 duplicate table definitions
- Execute migrations → **BLOCKER-3** cleared
- Verify: server boots, routes respond, schema matches

### Phase 2 — Make it true *(was "Quality & Completeness", 20 h)*
- Map every route against a real database round-trip — the AI Library module,
  built from observed runtime behaviour rather than filenames
- Merge the 284 genuine live-tree source duplicates under the merge rule
- Confirm or refute the frontend-wiring finding; wire what is genuinely unwired
- Replace the 1,040 stub tests with assertions on paths proven in Phase 1

### Phase 3 — Production hardening *(unchanged in intent)*
- Security audit, compliance gates, load testing, deployment readiness
- Then, and only then, the Opus 5 enhancement pass to international standard

### On "5 days to production"

Not credible, and the plan's own arithmetic shows why: it budgeted 42 hours
against 226 services. There are 649. It budgeted zero hours for a database that
has never run, 773 migrations that have never been ordered, and 1,040 tests that
assert nothing. No revised date is offered here — a date issued before the
database runs once would repeat the error this document exists to correct. A
defensible estimate becomes possible at the end of Phase 1.

---

## 6. Design consolidation

The plan does not cover UI. Three Claude Design canvases exist and are to be
consolidated into one system, per standing instruction:

- `.ai/design/Main.dc.html`
- `.ai/design/SellerPanel.dc.html`
- `.ai/design/UnifiedMarketplace.dc.html`
- plus `modules/M48100_BUYINGCLUB`

Scheduled after Phase 1, so the consolidated design targets real pages and real
endpoints rather than scaffolds.

---

## 7. Standing decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Rebuild **in place**; no new project folder | Two prior copy-folders produced 19k duplicates and zero working features; disk is at 95% |
| D2 | Delete snapshot folders after harvesting audits | SHA-256 proves zero unique content; reclaims 2,414 MB |
| D3 | Inventory database is the single source of structural truth | Replaces ~60 scattered scanner outputs |
| D4 | No completion percentage published without a substance measure | "96% complete" counted files, not behaviour |
| D5 | No production date until the database has run once | Every prior date was issued against unmeasured assumptions |

---

*Supersedes the metrics of the Sept 1 artifact. Governance rules remain in force.*
*Evidence: `.ai/inventory/inventory.db` · regenerate with `node tools/deep-scan.js` · report with `node tools/inventory-report.js`*
