# Library Batches — arrangement, recovery, completion

**Created:** 14 September 2026
**Rule:** nothing is deleted. Consolidation means arranging and merging; residue is
recovery material, never cleanup. See `memory/project-library-arrangement-doctrine`.

Every figure below was measured against the running index, not estimated.

---

## Status board

| Batch | Track | Depends on | Status |
|---|---|---|---|
| A1 Rebuild 13 models from surviving DDL | Recovery | — | **Cancelled — the premise was a false positive** |
| A2 Restore the 13 tables to live migrations | Recovery | A1 spec | Ready |
| A3 Repair 182 references that point at the wrong path | Recovery | — | **Ready** |
| A4 Triage the 354 targets that exist nowhere | Recovery | — | Ready |
| A5 Close 314 missing targets in `frontend/src/modules` | Recovery | A4 | Blocked on A4 |
| B1 Placement plan (read-only proposal) | Arrangement | — | **Ready** |
| B2 Register 347 undiscoverable modules | Arrangement | — | Ready |
| B3 Consolidate 14,031 identical data groups | Arrangement | B1 | Blocked on B1 |
| B4 Raise wireline coverage above 61.4% | Arrangement | — | **Paused** — resumes after B1 |
| C1 Bring the database into the library | Platform | B4 | Blocked on B4 |
| C2 Decide index storage: memory vs PostgreSQL | Platform | C1 | Deferred by owner |
| C3 Push 95 commits, merge the debug-scan branch | Platform | — | **Ready** |

Track A and Track B are independent and run in parallel. Track C follows.

---

## Track A — Recovery

### A1. Rebuild 13 models from surviving DDL — CANCELLED

**Do not do this.** The batch was written on a false positive and carrying it out
would have undone a deliberate engineering decision.

Two things were misread:

1. **The 13 requires are commented out.** `backend/_removed_2026-08-04/models/index.js`
   lists them under the heading `// Import other models (to be created)`:
   ```js
   // const UserProfile = require('./UserProfile');
   ```
   The reference extractor did not strip comments, so it read thirteen
   commented-out lines as live dependencies on missing files. The models were
   never removed by mistake — they were never written, and the file says so.

2. **The three surviving models are marked dead on purpose.** `User.js`,
   `Product.js` and `Order.js` each carry:
   > DEAD CODE — DO NOT USE. Verified unreachable: 0 importers outside this
   > directory … NOT completed deliberately. Finishing it would create a second,
   > competing persistence layer — two ORMs means two sources of truth for the
   > schema, which is exactly what the 17 duplicate table definitions already cost.

   The platform persists through raw `pg` SQL via `database/pool.js`; Sequelize
   is never initialised. Writing 13 Sequelize models would create precisely the
   competing layer that note exists to prevent.

**Fixed as a result.** `stripComments` now runs before reference extraction for
code, styles and SQL. Dangling references fell 33,246 → 32,690, and live targets
536 → 516. The false-positive rate was small and concentrated: 8 files, 20
targets, 13 of them this one file.

**What remains true.** The tables `user_profiles`, `addresses`, `categories`,
`states`, `order_items`, `cart`, `farmers`, `fpos`, `loans`, `policies`,
`shipments`, `contracts` and `assets` are defined only in backup migrations and
in none of the 923 live `.sql` files. Whether the live schema should carry them
is a real question — but it is a schema question, answered in SQL, and has
nothing to do with the Sequelize models. Tracked as A2.

### A1-original. Rebuild 13 models from surviving DDL

**Evidence.** `backend/_removed_2026-08-04/models/index.js` requires 16 models.
Three were recreated and are live at `backend/src/database/models/`: `User`,
`Product`, `Order`. The other 13 exist **nowhere in the catalogue** — 0 copies
across all 128,174 files in all three zones. Their tables survive only in backup
migrations under `backend-frontend-api-implementation-stats_20260909_2217/`.

| Model | Table | Domain |
|---|---|---|
| UserProfile | `user_profiles` | Platform |
| Address | `addresses` | Commerce |
| Category | `categories` | Commerce |
| State | `states` | Platform |
| OrderItem | `order_items` | Commerce |
| Cart | `cart` | Commerce |
| Farmer | `farmers` | Agriculture |
| FPO | `fpos` | Agriculture |
| Loan | `loans` | ERP / finance |
| Policy | `policies` | Compliance / insurance |
| Shipment | `shipments` | Logistics |
| Contract | `contracts` | ERP |
| Asset | `assets` | ERP |

These are the core entities of the e-commerce and farmer platform. The DDL is the
rebuild specification.

**Done when.** 13 model files exist in `backend/src/database/models/`, each matching
its surviving table definition column for column; `models/index.js` resolves all 16
requires; the wireline pass reports 0 dangling references from that file.

### A2. Restore the 13 tables to live migrations

**Evidence.** 0 of 13 tables appear in any of the 923 live `.sql` files. The schema
was removed alongside the models, so A1 alone would leave models with no tables.

**Done when.** Each table has a live migration; the migration runner applies them
against the Docker PostgreSQL without error; `studySystems` shows the new migrations
wired by the schema wireline.

### A3. Repair 182 references that point at the wrong path

**Evidence.** Of 536 missing targets in the live project, 182 resolve to a file that
**does exist** elsewhere in the live tree — every one of them in `PRJ (live)`, none
needing a backup. These are broken paths, not missing work.

**Done when.** Each of the 182 imports points at the real file; no behaviour change;
the server still boots and `/health` returns 200.

### A4. Triage the 354 targets that exist nowhere

**Evidence.** 354 of 536 have no candidate anywhere in the catalogue. 13 are the A1
models. The rest cluster in generator scripts that build paths at runtime — some are
template literals (`./M${moduleNum}.css`, `../services/$1`) that were never real
files and should be recorded as false positives rather than chased.

**Done when.** Every one of the 354 is classified: rebuild, false positive
(runtime-constructed path), or obsolete caller.

### A5. Close 314 missing targets in `frontend/src/modules`

**Evidence.** The single largest cluster of dangling references in the live project.

**Done when.** Each target is classified by A4's rules and the real gaps are filled.

---

## Track B — Arrangement

### B1. Placement plan — proposal only, nothing moves

**Evidence.** 126,642 files carry a call number; 35,479 sit under `Unassigned` in the
org chart. Moving a file rewrites every reference to it, so the plan is reviewed
before anything executes.

**Done when.** A reviewable file lists, per file to be moved: current address, target
address, new name if any, and every import that would need rewriting. Zero files
moved in this batch.

### B2. Register 347 undiscoverable modules

**Evidence.** 539 module-systems exist in the live project; 192 carry `module.json`.
344 of the 347 without one sit under `_UNIFIED_PROJECT/current/frontend`. Under the
two-wires contract a module without a manifest cannot be discovered.

**Done when.** Each has a `module.json` with `moduleId`, `category` and `discovery`;
the org chart's `Unassigned` count falls; none is invented — categories come from the
module's own content.

### B3. Consolidate 14,031 identical data groups

**Evidence.** 104,846 byte-identical copies hold 2.27 GB. The largest are data, not
code: `02_LINKAGE_CANDIDATES.csv` at 92.57 MB exists 8 times across all three zones.
No *system* is duplicated — every system differs somewhere — so this is file-level
consolidation only.

**Done when.** Each group has one canonical copy with the others linked to it by call
number. Nothing is deleted; redundant copies are recorded as pointing at the
canonical entry.

### B4. Raise wireline coverage above 61.4%

**Evidence.** 417,782 semantic edges, 77,775 of 126,642 files semantically wired.
Coverage by material: schema 87.3%, style 71.6%, doc 66.7%, manifest 61.8%,
code 57.8%, markup 57.2%, other 15.5%.

`code` is the weak one that matters: 20,388 `.js` and 13,127 `.jsx` files are reached
only by their shelf. Likely causes to check — dynamic route loading (this project
mounts routes by directory scan, not by import), test files, and scripts invoked by
npm rather than required.

**Done when.** Every material is above 75%, or the shortfall is explained by a
mechanism that genuinely carries no static reference, and that explanation is
recorded here.

**Paused mid-batch — resumes after B1.** Done so far: tests and
dynamically-mounted files are wired (`tests` 1,579 edges, `discovers` 2,148),
taking code to 58.4% and total coverage to 61.8% over 421,509 edges.

Two things were learned and should shape the rest of the batch rather than be
rediscovered:

1. **The remaining shortfall is largely a gap, not a wiring failure.** Tests
   such as `backend/src/__tests__/critical-phase1.test.js` are unwired because
   the code they import does not exist — `../services/financeService`,
   `../routes/marketplace…`. Those belong to Track A, not here. Chasing them as
   a coverage problem would hide a real one.
2. **Runtime is the constraint, not cleverness.** A second pass over 80,336
   source files cost 71s → 279s for +0.4%. Folded back, it is 171s. Any further
   wireline must reuse the source already in hand.

Next when resumed: index test candidates by directory instead of scanning every
same-stem match (stems like `service` and `index` match thousands, so ~9,000
tests each walk a long list), then reassess `other` at 15.5% — 3,645 assets that
are only ever reached when something references them.

---

## Track C — Platform

### C1. Bring the database into the library

**Evidence.** 12,602 `.sql` files are mapped and 87.3% are now wired by the schema
wireline, which traces 3,387 tables to the migration that creates each. Remaining
work is the live database itself — tables, columns and rows — rather than the files
that describe it.

**Done when.** Live schema is catalogued alongside the migrations, and a table
resolves to the migration that created it and the models that use it.

### C2. Index storage — memory or PostgreSQL

**Deferred by owner** until arrangement is complete. Recorded so it is not lost:
128,174 entries currently cost ~1.2 GB of heap and the server needs
`--max-old-space-size=3072`. That is the ceiling of an in-memory Map.

### C3. Push 95 commits, merge the debug-scan branch

**Evidence.** The branch `checkpoint/pre-clean-rebuild-20260913` is 95 commits ahead
of anything on the remote. `origin/claude/full-project-debug-scan-ks7j0v`
(commit `8314de04`, 24 files, +2944/−114) is still unmerged; it forks from the
09-08 baseline, so 20 of its 24 files conflict. Its genuinely new material is the
12 route-export fixes, ~139 API client objects, `completeAIIntegrationService.js`
and the Redis bounded retry — but its route files export a plain object, which
`dynamicRouteLoader.js` rejects, so it needs porting rather than merging.

**Done when.** Work is pushed, and the debug-scan branch's unique content is ported
in a form the dynamic loader actually mounts.

---

## Completed

| Batch | Result |
|---|---|
| Map every file | 128,174 entries, 3 zones, junk trees included |
| Live index | 465 ms propagation, verified over HTTP, 0 drift |
| `.jsonl` parsing | warnings 4 → 0; activity ledger yields 500 records |
| Call numbers | 126,642 issued, system-aware, 0 collisions |
| Content study | 104,846 redundant copies, 9,357 unique, read-only |
| System-level duplication | 1,511 systems, 1,511 fingerprints — none redundant |
| Wirelines per material | 417,782 edges, 0 uncatalogued |
