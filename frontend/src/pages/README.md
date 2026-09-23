# Status: these 21 pages are NOT pine-shadow ports

`index.tsx` and the 20 pages named after pine-shadow's real routes
(`body.tsx`, `brain.tsx`, `cells.tsx`, `charter.tsx`, `companion.tsx`,
`economy.tsx`, `flows.tsx`, `ledger.tsx`, `library.tsx`, `ligaments.tsx`,
`lots.tsx`, `mesh.tsx`, `modules.tsx`, `nerve.tsx`, `organism.tsx`, `os.tsx`,
`platform.tsx`, `pulse.tsx`, `share.tsx`, `systems.tsx`, `trade.tsx`,
`vet.tsx`, `warehouse.tsx`) were created in an earlier session before
pine-shadow's real source was read. They are generic placeholder
components (static text, no data) that happen to share pine-shadow's
route names. They were never rechecked against pine-shadow's real
`src/routes/*.tsx` + `src/components/*` (25 route files, 45 components),
and should not be cited as ports.

## Why they weren't force-ported

Pine-shadow's frontend is a TanStack Router + Zustand + PGLite app.
This project's frontend is React Router v6 (see `frontend/src/main.jsx`).
A line-by-line port of TanStack route files would not run in this stack
without a rewrite anyway — the router APIs, data-loading pattern
(`createServerFn`), and state management (Zustand stores per pine-shadow
module) are all different. Porting the *routing shell* verbatim would
have produced code that looks like a port but doesn't actually integrate,
which is the exact failure mode this whole integration effort was meant
to fix on the backend.

## What's real and ready to wire up

The backend logic these pages *should* eventually call is real and
tested (105/105 Jest tests passing): `backend/src/lib/{body,brain,vet,
lattice,os,library,tokens,systems,modules,share,flows,erp,organism}/`.
Building real pages for this React Router app means:

1. Add API routes (`backend/src/routes/`) that call the ported kernel
   functions (e.g. `GET /api/v1/lattice/stats` → `lattice.latticeStats()`,
   `POST /api/v1/brain/decide` → `brain.brainDecide(...)`).
2. Rewrite these 21 files as real React Router pages that fetch from
   those routes and render the real data (bridge integrity %, brain
   tissue verdicts, vet coding proposals, flow walk results, etc.)
   instead of the current static placeholder text.

Neither step was done in this pass — see
`.ai/COMPLETE_INTEGRATION_REPORT.html` for the full gap accounting.
