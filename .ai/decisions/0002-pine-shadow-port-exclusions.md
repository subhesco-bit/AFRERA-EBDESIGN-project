# Decision 0002: pine-shadow files deliberately not ported

**Date:** 2026-09-23
**Status:** ADOPTED — final disposition of every remaining file the
"100% transfer and integration of pine-shadow" sweep flagged as not yet
resolved. Nothing in this list is deferred; each item below has either
been ported or is excluded for a documented, verified reason (same
standard applied to `auth/`/`app-data/`, see `backend/src/lib/auth/index.js`
header).

## Ported (no exclusion — listed for completeness)

- `src/lib/utils.ts` (`cn()`) — already present and correct at
  `frontend/src/lib/utils.js`, verified byte-for-byte equivalent logic.
- `src/lib/lattice/store.ts` — ported to `frontend/src/lib/latticeStore.js`
  and wired into `frontend/src/pages/kernel/mesh.jsx` (concept/bridge
  explorer with selection, filters, and a local "proposed bridge" draft
  list, backed by the real `/lattice/*` endpoints). This store is pure
  client-side Zustand+persist UI state with no server-function coupling,
  so unlike the four stores below it ports 1:1.
- `src/lib/os/catalog.ts`, `src/lib/os/os.test.ts` — full 132-item catalog
  port and Jest conversion (see commit `13b2def3c`), closing the last
  os/ gap and the last unconverted pine-shadow test file.

## Excluded — TanStack Start server-function client stores

- `src/lib/erp/store.ts` (233 lines)
- `src/lib/erp/platform-store.ts` (41 lines)
- `src/lib/modules/store.ts` (50 lines)
- `src/lib/organism/store.ts` (107 lines)

**Why excluded:** each imports mutation/query functions from a local
`./fns` module that, in pine-shadow, is a client-side wrapper around
TanStack Start's `createServerFn` RPC convention — the call *looks* like
a local async function but is transparently proxied across the network to
a co-located server function in the same Vite/TanStack Start build. This
project has no TanStack Start runtime and a hard client/server split
(separate `frontend/` Vite SPA and `backend/` Express API, talking over a
versioned REST contract). Porting these stores as-is would either require
faking a `./fns` RPC shim with no real transport underneath, or rewriting
every call site to hit REST endpoints instead — at which point the file is
no longer a port, it's a new implementation wearing the old file's name.

**What already does this job on this stack:** the real functional
requirement — client code triggering the ported ERP/Module-OS mutations
and rendering their results — is delivered by
`backend/src/routes/afreraKernel.js` (19 REST endpoints over the real
`erp/boot.server.js` / `erp/platform.server.js` / `modules/boot.server.js`
persistence ported this session) plus the 24 pages under
`frontend/src/pages/kernel/` and their `useKernelGet`/`useKernelPost`
hooks (`frontend/src/pages/kernel/useKernelApi.js`), which call those
endpoints over axios. Same job, REST instead of RPC, because REST is what
this stack actually has.

## Excluded — generic WebRTC multiplayer

- `src/lib/multiplayer/index.ts` (barrel export)
- `src/lib/multiplayer/p2p.ts` (570 lines)

**Why excluded:** a generic, application-agnostic full-mesh WebRTC
game-room implementation (`P2PRoom`, perfect-negotiation glare handling,
`defaultIceServers`), signaled through a `/api/rtc` relay endpoint that
does not exist in this project. Its own header comment points readers at
`.grok/skills/multiplayer-p2p/` for a reference signaling-relay
implementation — it is Grok-sandbox starter-kit infrastructure for
building realtime multiplayer demos on that platform, not AFRERA business
logic. Nothing in AFRERA's product surface (agriculture, ERP, insurance,
AI kernel) has a peer-to-peer multiplayer requirement. Cross-referenced
against `.ai/PROJECT_CONTEXT.md` and the full os/ catalog (132 items,
`backend/src/lib/os/catalog.js`) — no OS_ITEM names a P2P/multiplayer
capability, confirming this isn't an unbuilt AFRERA feature, just
platform scaffolding that ships with every Grok sandbox.

## Not revisited this session

- `src/lib/db.ts` + `src/lib/db.schema.test.ts` — PGLite/Kysely
  browser-embeddable schema layer, superseded on this stack by the real
  `pg`/Postgres `ensureSchema()` implementations in `erp/boot.server.js`,
  `modules/boot.server.js`, `organism/boot.server.js`. Flagged in the
  prior session's handoff as "not directly portable"; that conclusion
  still holds (this project's persistence is server-side Postgres only,
  there is no client-embedded database anywhere in the codebase to house
  a Kysely/PGLite port), so it is excluded on the same grounds as the
  four TanStack stores above, not merely undecided.
