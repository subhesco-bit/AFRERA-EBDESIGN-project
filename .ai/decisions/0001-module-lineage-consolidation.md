# Decision 0001: Dual Module-Lineage Consolidation

**Date:** 2026-09-12
**Status:** ADOPTED — applies to every `M0xx` / `M0xx_NAME` folder pair under `backend/src/modules/`

## Context

Investigation found two parallel lineages sharing module numbers:

- **Plain numeric** (`M001/`, `M002/`, `M003/`...) — statically `require()`'d and `app.use()`'d
  in `backend/src/index.js`, serving real traffic at `/api/v1/backend-modules/M0xx`. Hand-audited;
  several have README notes documenting a specific date a "this is just scaffolding" assumption
  was checked and corrected, with fabrication bugs found and fixed.
- **Name-suffixed** (`M001_PLATFORM_CORE/`, `M002_USER_MANAGEMENT/`...) — code is stub-quality,
  but each carries a rich `module.json` manifest (ports, API contracts, keywords, AI-agent
  discovery metadata) and is the identifier space used by a real subsystem:
  `backend/src/core/moduleRegistry.js`, a dynamic AI-agent module loader driven by
  `libraryKnowledgeService`, instantiated from `backend/src/core/aiOrchestrator.js`. This
  contains genuine engineering (a documented, fixed circular-dependency bug between
  `M002_USER_MANAGEMENT` and `M003_ORGANIZATION`) — not scaffolding.

Neither lineage is disposable. The orchestrator/registry chain, however, is currently dead: its
only caller (`backend/src/routes/visionRoutes_merged.js`) is never mounted in `index.js`. So one
real feature (AI-agent dynamic module discovery) is fully built but unreachable.

## Decision

For every module number with both a plain and a name-suffixed folder:

1. **One folder per module going forward**, named with the descriptive suffix
   (`M0xx_DESCRIPTIVE_NAME`) — this is already the identifier space the orchestrator/registry and
   `module.json.moduleId` use, so keeping it avoids a second rename pass later.
2. **Code provenance:** the plain-numeric folder's `service.js`/`controller.js`/`routes.js`/
   `model.sql` — the hand-audited, currently-serving implementation — becomes the code in the
   unified folder. The name-suffixed folder's stub code is superseded, never the reverse.
3. **Metadata provenance:** the name-suffixed folder's `module.json` (manifest, ports, API
   contracts, AI-agent discovery fields) is kept as-is in the unified folder. Nothing about *why*
   the module exists or what it's for gets dropped.
4. **`index.js` route mounts are updated to the new path, keeping the exact same mounted URL**
   (`/api/v1/backend-modules/M0xx`) — no external API contract changes.
5. **The AI-orchestrator chain gets wired into `index.js` startup** (or an explicit, documented
   decision to defer that with a tracked follow-up) so the dynamic-module-discovery feature stops
   being dead code and becomes an actual, reachable capability — not deleted, not left orphaned.
6. **Nothing is deleted until the unified version is verified** (`node --check`, existing tests,
   and — where a route changed — a request against the mounted path). The superseded folder is
   removed only after that verification passes, and via a normal, reviewable git commit (fully
   reversible via history), never a bulk/silent delete.
7. Modules with only one lineage (no name-suffixed counterpart) are unaffected by this decision —
   they continue through the placeholder-fill process (`tools/codex-placeholder-fill.js`),
   restricted to cases with no second subsystem behind them.

## Why

The user's objective is a single, well-organized project with zero loss of content, concept, or
uniqueness. Deleting either lineage outright would lose something real: the audited live code on
one side, or the AI-agent discovery subsystem's manifest/identity on the other. Consolidating into
one folder per module, keeping the real code and the real metadata, and finishing the wiring that
was left undone, satisfies "zero missing" without leaving two competing, half-real copies forever.

## Scope

Applies module-pair-by-module-pair, verified each time before deletion. Tracked in
`.ai/tasks/ACTIVE.md`. Piloted first on M001/M002/M003 (already investigated in this session),
then scaled to the full set once the pilot is verified.
