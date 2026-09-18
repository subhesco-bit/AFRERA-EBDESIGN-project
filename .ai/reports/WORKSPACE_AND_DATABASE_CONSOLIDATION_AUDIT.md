# Workspace & Database Consolidation Audit

**Date:** 2026-09-12
**Author:** Claude Code
**Scope:** Whole working folder (`C:\Users\DIYA GOEL\Downloads\EBDESIGN`), measured, not estimated.
**Status:** Findings + proposed structure. **No files were moved or deleted producing this report.**

> **Update 2026-09-12 (later the same day): §2 has been executed and two of its
> claims were wrong. See [§2 corrections](#2-corrections-after-implementation)
> and `database/README.md`, which is now the authoritative connection story.
> `blobs/` has also been deleted (3.78 GB freed), so §1 and the Phase 1 totals
> are that much out of date.**

---

## 0. Read this first — the safety constraint

At audit time the working tree held **672 modified** and **1,213 untracked** files.
A large amount of real work is uncommitted. **No cleanup step below may run until that is
committed or branched.** Losing it would cost far more than the disk space cleanup recovers.

---

## 1. What is actually on disk

Total working folder: **~13.8 GB**, 250 files at the repo root alone.

| Directory | Size | Files | What it is |
|---|---:|---:|---|
| `blobs/` | 3,874 MB | 19 | Interrupted Ollama model download (Gemma 4 26B, 21% complete). **Not project code** — self-documented in `blobs/_WHAT_IS_THIS.md`. Already gitignored. |
| `_EBDESIGN_LIBRARY/` | 3,075 MB | 996 | Card catalog / library. Real infrastructure, gitignored (largest CSV 204 MB > GitHub 100 MB hard limit). |
| `New folder/` | 1,952 MB | 174,393 | Scratch: nested git worktrees, cloned repos, installer binaries, forensic backup snapshots. Already gitignored. |
| `.git/` | 1,475 MB | 22,649 | Bloated history. |
| `_MERGE_LAB/` | 1,248 MB | 28,226 | **Active** consolidation workspace (Phase 1). Not junk yet — see §4. |
| `_UNIFIED_PROJECT/` | 478 MB | 9,414 | Full parallel copy of the repo. |
| `backend/` | 438 MB | 39,777 | Canonical. |
| `frontend/` | 415 MB | 47,916 | Canonical. |
| `_ACTIVE_PROJECT/` | 295 MB | 9,398 | Second full parallel copy of the repo. |
| `docs/` | 212 MB | 104 | Mostly untracked regenerable audit dumps (94 MB `codex-file-map.csv`, 68 MB quarantine manifest, 28 MB library index). |
| `.system-audit/` | 121 MB | 22 | One-off audit output. |
| `_SQL_INFRA/` | 22 MB | 81 | Numbered SQL scaffold (00_CONTROL … 14_REPORTS), mostly empty folders. |
| `_audit/` + `.audit/` | 24 MB | 13 | Two more audit output dirs. |
| `.ai/` | 10 MB | 449 | Shared agent intelligence. Canonical, but sprawling (40+ subdirs). |
| `shared/`, `tests/` | 0 | 0 | **Empty directories at root.** |

### Root-level sprawl

250 files at repo root: **164 `.md`**, **30 `.js`**, 9 `.ps1`, 8 `.txt`, 8 `.json`, 7 `.sh`,
5 `.yml`, 5 `.csv`, 3 `.html`, 3 `.bat`, 2 `.py`, 1 `.pdf`, 1 `.log`, 1 `.conf`.

There is **no root `package.json`**, so none of the 30 root `.js` files are reachable through
an npm script. They are one-off repair tools — `FIX_ALL_SYNTAX_ERRORS.js`,
`FIX_ALL_ORPHAN_BRACES.js`, `DISABLE_ALL_UNDEFINED_CALLS.js`, `RESTORE_BROKEN_ROUTES.js`,
`GENERATE_ALL_MODULES.js`, `SKELETON_MODULE_GENERATOR.js`, etc. Several of them caused the
damage documented in §5.

---

## 2. The database problem (the main finding)

The instinct that "there are multiple databases that should be one" is correct, but the
duplication is not where it looks. It is in **identity**, not engines.

### 2a. Seven different PostgreSQL identities for one logical database

| Declared in | Port | Database | User | Container |
|---|---|---|---|---|
| `docker-compose.yml` | 5432 | `afrera_prod` | `afrera_user` | `afrera-postgres` |
| `docker-compose.dev.yml` | 5432 | `ebdesign_db` | `postgres` | `ebdesign-postgres-dev` |
| `docker-compose.full.yml` | 5432 | `ebdesign_db` | `postgres` | `ebdesign-postgres` |
| `docker-compose.database.yml` | 5432 | `subh_dev` | `subh_admin` | `subh-postgres` (pg **16**, others pg 15) |
| `docker-compose-postgres.yml` | 5432 | `ebdesign` | `ebdesign_user` | `ebdesign-postgres` |
| root `.env` | 5432 | `afrera_prod` | `afrera_user` | — |
| **`backend/.env` (what the app actually loads)** | **15432** | **`ebdesign_prod`** | `postgres` | — |
| code fallback (`advanced_pool.js`) | 5432 | `afrera_db` | `postgres` | — |

Consequences, all verifiable:

1. **The application points at a database no compose file creates.** `backend/.env` uses port
   **15432**; every compose file publishes **5432**. This is a large part of why CLAUDE.md has
   said "PostgreSQL not running" for weeks.
2. **Five separate data volumes** (`postgres_data`, `redis_data`, `subh_postgres_data`, …) across
   four network names (`afrera-network`, `ebdesign-dev`, `ebdesign-net`, `ebdesign-network`).
   Whichever compose file you start defines "the" database; migrations run against that volume
   and are invisible to the other four.
3. **Container-name collision:** `docker-compose.full.yml` and `docker-compose-postgres.yml` both
   name the container `ebdesign-postgres` while pointing at *different* databases
   (`ebdesign_db` vs `ebdesign`).
4. All five bind port 5432, so only one can run at a time.

### 2 corrections after implementation

Two claims above are wrong and are corrected here rather than silently edited,
because other documents quote them.

**Correction 1 — "the application points at a database no compose file creates"
is false, twice over.**

- `docker-compose-postgres.yml` *did* publish port 15432 (`"15432:5432"`); the
  table above recorded its container-side port. `backend/.env` was written to
  match that file. The pairing was still broken, but for a different reason:
  that compose file creates database `ebdesign`, while `backend/.env` asked for
  `ebdesign_prod`.
- The application was never reading `backend/.env`'s target anyway.
  `src/index.js` loads `.env.local` **before** `.env`, and dotenv does not
  overwrite an already-set variable, so `.env.local` won:
  `afrera_user@localhost:5432/afrera_prod`.

**Correction 2 — the real defect was app-vs-migrations, not app-vs-compose.**

`npm start` resolved `DATABASE_URL` → `afrera_prod`. `npm run migrate` called a
bare `dotenv.config()` (loading only `.env`, not `.env.local`) and then ignored
`DATABASE_URL` entirely, reading `DB_*` → `ebdesign_prod` on port 15432. **The
two entry points connected to different databases.** Even with both running,
the app would have found zero tables. That, not "PostgreSQL not running", is
the core of the long-standing "migrations created but not executed" symptom.

**What was done (2026-09-12)**

- `backend/src/config/database.js` — new single resolver
  (`DATABASE_URL` > `PG_*` > `DB_*` > canonical defaults). All 8 modules that
  open a connection now use it, so the two entry points cannot diverge again.
  Both print their resolved target at startup.
- Canonical identity chosen: **`ebdesign` / `ebdesign_user` / 5432**, matching
  what `backend/.env.example` and `migrate.js`'s own code defaults already said.
  Nothing was running and no volume held data, so the choice cost nothing.
- 5 compose files → 1, with optional services behind profiles
  (`tools` / `full` / `app` / `prod`). The other four are in
  `infra/legacy-compose/` with a README of what was carried across. Validated
  with `docker compose config` on every profile.
- Env files reconciled: `backend/.env`, `backend/.env.local`, root `.env`,
  `.env.docker` (`.bak-preconsolidation` copies kept beside each).
- 4 strategic services converted from `new Pool()` to the shared pool proxy.
  Zero services now construct a pool.
- **Three transaction bugs of the same class fixed** — `BEGIN`/`COMMIT` issued
  through a *pool* rather than a single client, so the work ran outside the
  transaction and `ROLLBACK` did nothing: `migrate.js`,
  `executeMigrationsComplete.js`, and `gdprService.rightToBeForgotten`
  (which could leave a user permanently half-anonymised with no audit row).
- `executeMigrationsComplete.js` also called `db.query()` on `./connection`,
  which exports no `query` — it could never have run. Repointed at the pool
  proxy; its three `db.end()` calls (also nonexistent on the proxy) now call
  `connection.close()`.
- **Boot blocker fixed, unrelated to the database:** `backend/src/index.js` had
  a duplicate `const libraryAIWorkspaceRoutes` (lines 55 and 597) — a hard
  `SyntaxError` that stopped the server and every integration test from even
  parsing.
- Optimisation: `migrations/zzzz_20260912_fk_performance_indexes.sql` adds the
  43 missing foreign-key indexes across 28 tables, guarded so it skips tables
  or columns the surviving schema does not have. Migration preflight: 743
  files, **0 blockers**.

**Not verified end to end.** Docker was not running during this work, so no
migration was actually applied and no query was executed against a live
database. Everything above is verified by syntax check, `docker compose
config`, the project's own migration preflight, and by resolving both entry
points' targets in Node — not by a working server.

### 2b. The access layer is *not* as bad as it looks — do not "fix" it blindly

Three modules look like three parallel database layers. They are not:

- `backend/src/database/connection.js` — the single real pool (~800 imports). Canonical.
- `backend/src/database/pool.js` — a lazy **proxy over `connection.js`** (~197 imports). It exists
  deliberately, to stop 42 services each opening their own 10-connection pool against a
  `max_connections=100` server. Its header documents this. **Keep.**
- `backend/src/database/dbConnection.js` — a **query builder over `connection.js`** (46 imports),
  147 lines. **Keep.**

The genuine duplication is **36 files calling `new Pool()` directly**. Of those, most are tests
and migration scripts; only **6 are live services** —
`services/legacy/assetAccountingService.js`, `services/legacy/projectSystemsService.js`,
`services/strategic/{contractFarming,governmentSubsidy,householdProcurement,preSeasonPurchase}Service.js`.
Those 6 are the only real fix here.

### 2c. Migrations

- **746 files in one flat directory** (`backend/src/database/migrations/`).
- Duplicate numeric prefixes: `014_` ×4, `015_` ×2, `016_` ×2 — execution order is undefined.
- Sort hacks in production filenames:
  `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql`.
- Unnumbered files mixed in (`gdpr_schema.sql`, `mfa_schema.sql`, `unified_ai_schema.sql`).
- Sub-buckets: `repairs/` (15), `failed/` (11).
- **Five migration directories total**: `backend/src/database/migrations`, `backend/migrations`,
  `database/migrations/canonical`, `.ai/migration`, `_SQL_INFRA/03_MIGRATIONS`.
- Plus ~31 loose `.sql` schema files sitting directly in `backend/src/database/`, and one
  `model.sql` inside each of ~115 module folders.

### 2d. Every data store in the system

| Store | Where | Status |
|---|---|---|
| PostgreSQL | primary | 7 conflicting identities (§2a) |
| MongoDB | `connection.js`, lazily loaded | one consumer (`aiBackboneService`) |
| Redis | `database/redis.js` | cache |
| Elasticsearch | compose only | not wired |
| JSON file-stores | `auth_store.json`, `form_store.json`, `schema-decisions.json` | gitignored, act as real persistence |
| SQLite | `_EBDESIGN_LIBRARY/16_AI_CONTEXT/knowledge_graph.db` (2.4 MB) | agent knowledge |
| SQLite | `.vibecheck/provenance/attestations.db` | tooling |

---

## 3. The AI/agent knowledge stores — five parallel copies

This is the part that should become **one** database shared by Claude, ChatGPT and Copilot
rather than parallel copies:

1. `_EBDESIGN_LIBRARY/` — 3 GB, 996 files, 40+ numbered top-level folders with **overlapping
   numbering** (two `00_`, three `01_`, two `02_`, two `03_` …). Card catalog.
2. `_EBDESIGN_LIBRARY/16_AI_CONTEXT/knowledge_graph.db` — 2.4 MB SQLite + `build_knowledge_graph.js`
   + `query.js`. This is the closest thing to a real agent database that already exists.
3. `.ai/` — 449 files across 40+ subdirs (architecture, decisions, handoffs, history, tasks,
   reports, staging, recovery, wave1-evidence, …). Human/agent-readable markdown.
4. `.vibecheck/truthpack/` — **completely empty.**
5. `docs/codex-*.json|csv` — 212 MB of generated indexes (file map, library index, merge matrix).

### Critical governance gap

Both `CLAUDE.md` and `.claude/CLAUDE.md` declare a **mandatory** TRUTHPACK-FIRST protocol listing
13 required files (`product.json`, `routes.json`, `env.json`, `schemas.json`, …) in
`.vibecheck/truthpack/`. **That directory contains zero files.** Every rule in that protocol is
currently unenforceable, and every agent is free-associating instead of verifying.

Meanwhile a root `TRUTHPACK.json` (13.6 KB, dated 2026-09-01) exists outside the protocol path and
**contradicts the codebase**: it claims 300 migrations; there are 746 files. It also claims ~500
tables and "all migrations created, none executed".

---

## 4. Parallel project copies

| Copy | Files | Verdict |
|---|---:|---|
| root `backend/` + `frontend/` | 5,256 + 1,962 tracked | **Canonical** (confirmed in `.ai/tasks/ACTIVE.md`) |
| `_ACTIVE_PROJECT/current/` | 9,398 | Full untracked duplicate of the repo |
| `_UNIFIED_PROJECT/current/` | 9,400 | Second full untracked duplicate (differs from the first by 2 files) |
| `New folder/GitHub/AFRERA-EBDESIGN-project/` | — | Another full clone, with its own 3 migration dirs |
| `New folder/EBDESIGN.worktrees/…` | — | Nested git worktree + its own 3 migration dirs |
| `New folder/claude_reorg_backup_20262808/` | — | Backup snapshot with its own migration dirs |

**`_MERGE_LAB/` is different and must not be deleted yet.** Its README calls it temporary, but
`.ai/tasks/ACTIVE.md` shows Phase 1 consolidation is *in progress* and depends on it: 9,496 feature
tracks, 2,702 conflict groups, 46,907 disambiguated files, and the `intel-*.json` symbol-diff
reports live there. Deleting it now destroys the evidence base the consolidation is running on.
It becomes removable when Phase 1 exit criteria are met.

---

## 5. Module folders — generator damage

`backend/src/modules/` holds **543 directories**. Two structural problems:

1. **33 numeric stems have both a bare `M0xx` and a named `M0xx_NAME` folder**
   (M001, M002, M003, M004, M005, M100–M105, M108, M109, M200, M205, M206, M208, M300, M301,
   M306, M308, M309, M400 …). `.ai/decisions/0001` audited 22 of these pairs and closed them by
   *wiring routes*, not by merging folders — so the folder-level duplication is still present.

2. **158 folders have machine-mangled names** — a generator appended `100` to the module number:
   `M100100_LOGISTICSENHANCEMENT`, `M18100_POULTRY`, `M18100_INSURANCECLAIMS`,
   `M697100_ESCROW`, `M652100_ARVR`, … Two distinct modules can collide on the same mangled stem
   (`M18100` appears twice). These were produced by the root-level generator scripts.

   **157 of the 158 are not referenced from `index.js`, `routes/`, or `core/`** — but they are
   **not empty**. `M100100_LOGISTICSENHANCEMENT` contains a 455-line `LogisticsProviderPage.jsx`.
   This is unwired real work, not dead code. It must be **renamed and wired, or merged into its
   correct module** — never bulk-deleted.

3. Root `modules/` holds **196 directories, all of which also exist in `backend/src/modules/`**.
   191 are byte-identical; **5 have diverged** and must be merged before the root copy is retired.

---

## 6. Proposed target structure

```
EBDESIGN/
├─ README.md                 # the only narrative doc at root
├─ CLAUDE.md                 # agent entry point
├─ package.json              # workspace root (currently missing)
├─ docker-compose.yml        # ONE compose file
├─ docker-compose.override.yml   # local dev deltas only
├─ .env.example              # single source of env var names
│
├─ apps/
│  ├─ backend/
│  └─ frontend/
│
├─ database/                 # ONE database home
│  ├─ migrations/            # renumbered, no duplicate prefixes, no 9999_zzz
│  ├─ seeds/
│  ├─ schema/
│  └─ README.md              # the one true connection story
│
├─ packages/                 # shared code (replaces empty shared/)
│
├─ infra/                    # docker, nginx, deploy, CI
│
├─ docs/
│  ├─ architecture/
│  ├─ runbooks/
│  └─ archive/               # the 164 root .md status reports land here
│
├─ tools/                    # the 30 root .js scripts, with a package.json
│
├─ .ai/                      # agent intelligence (kept, pruned)
│  ├─ PROJECT_CONTEXT.md
│  ├─ AGENT_PROTOCOL.md
│  ├─ decisions/
│  ├─ tasks/
│  └─ archive/
│
└─ .vibecheck/truthpack/     # POPULATED — 13 files, generated, not hand-written
```

Everything else (`_ACTIVE_PROJECT`, `_UNIFIED_PROJECT`, `_MERGE_LAB`, `_SQL_INFRA`, `_audit`,
`.audit`, `.system-audit`, `.consolidation_work`, `New folder`, `blobs`, root `modules/`,
`DOCUMENTATION/`, `_EBDESIGN_LIBRARY/`) either merges into the above, moves outside the repo, or
is retired once its Phase-1 role is finished.

---

## 7. Recommended sequence

### Phase 0 — Make cleanup safe (do first, nothing else before it)

1. Commit or branch the 672 modified + 1,213 untracked files.
2. Tag the current state (`pre-cleanup-2026-09-12`) so anything can be recovered.

### Phase 1 — Free 6 GB with zero code risk

3. Move `blobs/` (3.9 GB) out of the project folder entirely — it is an Ollama cache, nothing
   references it.
4. Move `New folder/` (1.95 GB, 174k files) to an external archive drive.
5. Delete the regenerable audit dumps in `docs/` (212 MB, untracked), `.system-audit/` (121 MB),
   `_audit/`, `.audit/` — they are outputs of scripts still present in `tools/`.
6. `git gc --aggressive --prune=now` on the 1.47 GB `.git`.

### Phase 2 — Fix the database identity (highest value, ~1 day)

7. Pick one canonical identity. Recommend `ebdesign_dev` / `ebdesign_user` / port `5432`.
8. Collapse 5 compose files into `docker-compose.yml` + `docker-compose.override.yml`. Keep the
   full stack (mongo/redis/rabbitmq/elasticsearch) behind compose profiles rather than
   separate files.
9. Reconcile `backend/.env` (port 15432 → 5432) with the compose file, and regenerate
   `.env.example` from the union of all env files.
10. Convert the 6 live services still calling `new Pool()` to `require('../database/pool')`.
    Leave `connection.js` / `pool.js` / `dbConnection.js` alone — they are one layer, not three.
11. Write `database/README.md` stating the single connection story, and delete every contradicting
    claim from the 164 root markdown files as they are archived.

### Phase 3 — Migrations (~1 day)

12. Inventory all 5 migration directories; identify which of the 746 files ever executed.
13. Renumber into a single ordered sequence with no duplicate prefixes and no `9999_zzz` hacks;
    keep a mapping file so history stays traceable.
14. Fold the ~31 loose `.sql` files in `backend/src/database/` into that sequence.
15. Prove it: run the full sequence against a clean container and record the resulting table count.

### Phase 4 — One agent knowledge database

16. Promote `_EBDESIGN_LIBRARY/16_AI_CONTEXT/knowledge_graph.db` to the single agent knowledge
    store, fed by a build step rather than hand-edited.
17. **Generate `.vibecheck/truthpack/`** (all 13 files) from the live codebase — routes from the
    Express router tree, env from the env files, schemas from the migrations. This is what makes
    the mandatory protocol in both CLAUDE.md files actually enforceable, and it is what gives
    Claude, ChatGPT and Copilot one shared source of truth instead of three private ones.
18. Delete root `TRUTHPACK.json` once the generated pack supersedes it (it is already wrong).
19. Archive `.ai/` down to the documents actually in the protocol; move the rest to `.ai/archive/`.

### Phase 5 — Root and module hygiene

20. Move 164 root `.md` files to `docs/archive/` (keep README.md + CLAUDE.md).
21. Move 30 root `.js` + 9 `.ps1` + 7 `.sh` into `tools/` with a real `package.json`.
22. Merge the 5 diverged root `modules/` dirs into `backend/src/modules/`, then retire root
    `modules/`.
23. Rename the 158 mangled module folders to their correct numbers, merging where two collide,
    and wire the ones holding real content. **Merge, never delete.**
24. Resolve the 33 bare-vs-named module folder pairs by merging content, then remove the empty side.

### Phase 6 — Close Phase 1 consolidation

25. Only when `.ai/tasks/ACTIVE.md` exit criteria are met: retire `_MERGE_LAB/` (1.25 GB),
    `_ACTIVE_PROJECT/` and `_UNIFIED_PROJECT/` (773 MB), after diffing each against canonical
    so nothing unique is lost.

### Expected result

~13.8 GB → **~1.5 GB**, 250 root files → **~12**, 7 database identities → **1**,
5 compose files → **1 (+override)**, 5 migration dirs → **1**, 5 knowledge stores → **1**.

---

## 8. Open decisions needed

1. **Canonical database name** — `afrera_prod`, `ebdesign_prod`, `ebdesign_db`, or `subh_dev`?
   The repo currently uses all four. This blocks Phase 2.
2. **Keep MongoDB / Elasticsearch / RabbitMQ?** MongoDB has exactly one consumer;
   Elasticsearch is declared in compose but not wired. Dropping unused engines removes a whole
   class of "not running" noise.
3. **Where does `_EBDESIGN_LIBRARY` live?** 3 GB, gitignored, with a 204 MB CSV that cannot go in
   git. Options: external drive + manifest in repo, Git LFS, or object storage.
4. **`_MERGE_LAB` retirement date** — tied to Phase 1 exit criteria; needs an owner.
