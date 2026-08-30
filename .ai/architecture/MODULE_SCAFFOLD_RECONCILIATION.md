# Module Scaffold Reconciliation

**Written:** 2026-08-29, closing a gap flagged across multiple gap-index passes this session.

## The conflict

Two directory trees both claim to be "the module system," and no prior
document said which one is canonical:

1. **Root `modules/`** — 203 entries, but only **5** follow the numbered
   module pattern: `M001_PLATFORM_CORE/` … `M005_PERMISSION_MANAGEMENT/`.
   Each has a full scaffold — `backend/`, `frontend/`, `docs/`, `tests/`,
   `ui/`, and a `module.json` manifest (moduleId, version, dependencies,
   discovery keywords/capabilities). Real service code inside
   (`backend/service.js`, 259–448 lines each) — not stubs.
2. **`backend/src/modules/`** — **86** entries, `M001`–`M150`+, bare numeric
   names, no manifest, no `docs/`/`tests/`/`ui/` scaffold. Each is just
   `controller.js` + `service.js` + `routes.js` + `index.js` (+ optional
   `model.sql`).

## The answer: `backend/src/modules/` is canonical

Verified by how the running application actually discovers and serves
modules, not by which tree looks more "finished":

- `backend/src/index.js` auto-scans `backend/src/modules/` at boot
  (`generatedModuleRoot`) and exposes every module found there via
  `/api/v1/backend-modules/:moduleId/:operation` — confirmed working this
  session for dozens of modules (M005, M060, M122, M132, M141, M144, and
  more).
- The root `modules/` tree has **zero** auto-discovery, **zero** route
  mounting, and is never `require()`'d by `backend/src/index.js` except in
  one specific case (below). It is invisible to the running server.
- Every real frontend page that talks to a numbered module
  (`EnvironmentManagementPage.jsx` → `moduleId="M005"`, `pondAPI` →
  `/backend-modules/M132/*`, etc.) targets `backend/src/modules/`, never the
  root tree.

## The one real link between the two trees

`backend/src/modules/M001/service.js` is a **thin delegator** — it exists
only to preserve `controller.js`'s call shape, and forwards every call to
`modules/M001_PLATFORM_CORE/backend/service.js`, which holds the actual
merged, Claude-compatible implementation (`initializePlatformDeployment`,
`getDetailedMetrics`, `updateDeploymentConfiguration`, `getHealth`). This is
the **only** module where real logic lives in the root tree and is reachable
through the canonical one. M002–M005 in the root tree have no such
delegator and are not reachable from the running app at all — they are
real, substantial, orphaned code with no live consumer.

## Practical rule going forward

- **New module work** goes in `backend/src/modules/M0XX/` — that's what
  gets served.
- **Never assume a module in the root `modules/` tree is dead code just
  because it isn't auto-discovered** — M001_PLATFORM_CORE proves real work
  can live there and still be reachable through a delegator. Check for a
  delegator in `backend/src/modules/` before concluding a root-tree module
  is orphaned.
- **M002_USER_MANAGEMENT, M003_ORGANIZATION, M004_ROLE_MANAGEMENT,
  M005_PERMISSION_MANAGEMENT** (root tree) are real, unreachable code — not
  yet reconciled. Each has a `backend/src/modules/` counterpart already
  wired independently (M003 Tenant Management, M004 Organization
  Management — note the name mismatch with M003_ORGANIZATION vs M003 Tenant
  Management, a second naming collision worth resolving before merging
  either pair). Flagged for a dedicated follow-up pass, not resolved here —
  merging risks losing real logic on either side without careful diffing.
