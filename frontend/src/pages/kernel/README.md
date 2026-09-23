# AFRERA Kernel pages — real, routed, live data

24 pages (`/kernel`, `/kernel/body`, `/kernel/brain`, … `/kernel/warehouse`)
wired into `frontend/src/config/routes.js` (`publicRoutes`) and rendered
through the app's normal `<Routes>` in `App.jsx` — no changes to
`App.jsx` were needed since `publicRoutes` is already mapped there.

Each page fetches real data from `backend/src/routes/afreraKernel.js`
(mounted at `/api/v1/afrera-kernel` by `DynamicRouteLoader`), which calls
the pine-shadow kernel ported into `backend/src/lib/` this session
(105/105 Jest tests passing). Nothing here is static placeholder text —
every number, status badge, and list comes from a real backend call.

Shared infra:
- `useKernelApi.js` — `useKernelGet(path)` / `useKernelPost()` hooks over
  the existing `services/api.js` axios instance.
- `KernelShell.jsx` — loading/error/title shell + `StatGrid` /
  `StatusBadge` used by every page.

Read-only by design: no page or route here writes state, matching the
kernel's own constitution (E3: "AI cannot write rupees. Propose only.").
`platform.jsx` and `companion.jsx` use small demo data snapshots (no
live DB-backed books/orders exist yet) — see `demoBooks()` in
`afreraKernel.js` and `DEMO_BOOKS` in `companion.jsx`.
