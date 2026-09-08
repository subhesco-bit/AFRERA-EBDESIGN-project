---
agent: perf-auditor
status: warn
findings: 7
---

# Performance Audit — EBDESIGN Platform (re-run)

## Summary

Scope: `frontend/src/**` (App.jsx, `config/routes.js`, `router/`, `modules/M001`–`M150`, component tree, `vite.config.js`) and `backend/src/**` (services, `index.js`), audited for bundle-size bloat, inefficient rendering, blocking synchronous I/O on hot paths, and memory-leak-prone patterns. `git status`/`git diff` were re-checked fresh at the start of this run (branch `audit/ui-api-fix`, several files mid-edit by other concurrent sessions) and the repo was re-audited as it actually sits right now, not from memory of the prior report.

This audit **supersedes** the previous `AUDIT_PERF.md`, which described a structure (`frontend/src/modules/M001`–`M150` statically imported into a 1,342-line `App.jsx`, zero `React.lazy`, an unbounded-Map leak with no fix) that **no longer matches the codebase**. Both `node_modules` trees are now installed, so this run additionally executed a real `npm run build` in `frontend/` to measure actual chunk sizes rather than relying on static inference — the previous report explicitly could not do this.

**Headline finding, newly root-caused this run:** the CLAUDE.md-documented "chunk > 1000 kB" build warning is **still present** (`dist/assets/js/pages-*.js` = 1,600.81 kB / 310 kB gzip), but not for the reason the old audit described. Route-level code splitting is now real — every page in `config/routes.js` (183 routes) and every `M0xx` module is wrapped in `React.lazy(() => import(...))`. However, `vite.config.js`'s `manualChunks` function contains `if (id.includes('/pages/')) return 'pages'`, which forces **every** lazily-imported module under `src/pages/` back into one single physical output chunk regardless of route. The lazy-loading refactor is real but currently inert for that chunk: whichever page the user visits first still triggers a 1.6 MB single download, because Rollup collapses all ~227 page chunks into one file by directory-name matching before the lazy boundaries can take effect. This is a real, currently measured regression path, not a stale/theoretical finding.

Also newly found: `App.jsx`'s M001–M150 module-route loop calls `lazy(() => import(...))` **inside the component's render body** (inside `Array.from({length:150}, ...)` in the JSX return), rather than at module scope like `config/routes.js` does correctly. This creates a brand-new lazy-wrapped component type on every render of `App`, which can force React to remount whichever module route is currently active (losing component state, replaying effects, re-flashing the Suspense fallback) any time `App` re-renders for an unrelated reason (auth state change, location change, etc.).

On the positive side, several items from the prior audit are now confirmed **fixed on the live code path**: `authService`/`formService` sync `fs.readFileSync`/`writeFileSync` on the login/register/forms hot path have been converted to `fs.promises` in the actual mounted files (`services/dual-use/authService.js`, `services/legacy/formService.js`); the `realtimeMonitoringService` unbounded-`Map`-growth leak is fixed in the file that routes actually require (`services/legacy/realtimeMonitoringService.js` now calls `.delete(monitorId)` in `stopMonitoring`); `socket.io-client` is no longer dead weight (now imported by `frontend/src/services/realTimeService.jsx`); the bad `"crypto": "^1.0.1"` npm-shim dependency has been removed from `backend/package.json`; and memoization usage has grown substantially (67 `useMemo`/`useCallback` call sites, up from 7). All frontend `setInterval` call sites (8, up from 2) still correctly pair with `clearInterval` in a `useEffect` cleanup.

Two findings from the prior audit remain genuinely open and unchanged: the checkout-path N+1 sequential-query loop in the live `orderService.js`, and unused heavy backend dependencies (`aws-sdk`, `elasticsearch`, `apollo-server-express`, `graphql`). One is now downgraded: the unbounded-Map leak pattern still exists verbatim in a **duplicate, unrequired** file (`backend/src/services/realtimeMonitoringService.js`, distinct from the fixed `services/legacy/` copy) — dead code today, but a live risk again if anyone ever wires it.

Overall status: **warn**. The manualChunks/pages-bucketing issue is the most actionable, highest-leverage fix available (a one-line change unlocks the entire route-level splitting effort that's already been done everywhere else), so it's rated High despite being "just" a config bug.

## Findings

### 1. [High] `manualChunks` collapses all lazy-loaded pages back into one 1.6 MB chunk, defeating route-level code splitting
- **Location**: `frontend/vite.config.js:130-145` — `manualChunks: (id) => { ... if (id.includes('/pages/')) return 'pages'; ... if (id.includes('/modules/')) return 'modules'; ... }`. Confirmed against `frontend/src/config/routes.js` (183 `lazy(() => import('../pages/...'))` calls, all at module scope, correctly written) and a fresh `npm run build` in `frontend/`.
- **Description**: Every page component is properly wrapped in `React.lazy()`, so Rollup would naturally emit one small chunk per page — but the `manualChunks` function runs first and re-groups every module whose resolved path contains `/pages/` into a single named chunk (`'pages'`), and everything under `/modules/` into a single `'modules'` chunk. Rollup honors `manualChunks` over its own automatic chunking, so the lazy-loading boundaries are structurally present in the code but produce no bundle-size benefit for the largest chunk in the app. Measured real build output: `dist/assets/js/pages-BKqYFrgY.js` = **1,600.81 kB raw / 310.02 kB gzip / 194.82 kB brotli** — the single largest artifact in the build, and the one Vite's own warning calls out (`(!) Some chunks are larger than 1000 kB after minification`). A user visiting any single page (e.g. the login page) still downloads the entire pages bundle, containing all ~227 page components, on first navigation.
- **Remediation**: Remove (or narrow) the `/pages/` and `/modules/` buckets in `manualChunks` and let Rollup's automatic per-dynamic-import chunking handle them — i.e., delete the two `if (id.includes('/pages/'))` / `if (id.includes('/modules/'))` branches (or return `undefined` for those paths) so each `lazy()`-imported page/module gets its own chunk as originally intended by `config/routes.js`. Re-run `npm run build` after the change and confirm the warning is gone and no single non-vendor chunk exceeds ~300-500 kB. If some genuinely-shared code between pages needs to stay grouped (shared layout/utility imports), that can be handled by Rollup's automatic shared-chunk extraction without an explicit `/pages/` catch-all.

### 2. [Medium] `React.lazy()` called inside `App.jsx`'s render body for M001–M150 module routes, not at module scope
- **Location**: `frontend/src/App.jsx:210-228` — inside the JSX returned by the `App()` function component: `{Array.from({ length: 150 }, (_, i) => { ... const ModulePage = lazy(() => import(...)); return <Route ... element={<ModulePage />} /> })}`.
- **Description**: `React.lazy()` is meant to be called once, outside the render path (exactly how `config/routes.js` does it for the other 183 routes, at module top-level). Here it is called fresh on every render of `App` — every time `App` re-renders (auth state changes via `checkAuth()`, `user` updates, route changes, or any parent re-render), a brand-new `lazy()`-wrapped component object is created for all 150 module routes. Because React identifies component instances by reference equality of their type, if the currently-mounted route is one of the `/module/M0xx` routes, the next `App` render swaps in a new component type for the same route — React will unmount and fully remount that module page (losing any local state, replaying mount effects/data fetches, and re-showing the `Suspense` fallback), rather than reconciling it in place.
- **Remediation**: Hoist the 150 `lazy(() => import(...))` calls to module scope, either as a static array built once outside the `App` function (mirroring the pattern in `config/routes.js`) or via a small helper `const moduleComponents = Array.from({length:150}, (_, i) => lazy(() => import(...)))` defined once at the top of `App.jsx`, then reference `moduleComponents[i]` inside the JSX instead of calling `lazy()` there.

### 3. [Medium] N+1 sequential per-item queries still present in the live checkout path
- **Location**: `backend/src/services/legacy/orderService.js` (confirmed via `index.js:22` — `const orderService = require('./services/legacy/orderService')` — this is the file actually wired up, not the unused sibling copies at `services/orderService.js` / `services/commerce/orderService.js`), lines ~308-339: `for (const cartItem of cartItems) { ... await client.query(<stock check>) ... await client.query(<INSERT order_items>) ... }`, all inside a single `BEGIN`/`COMMIT` transaction on one pooled client (lines 285-343).
- **Description**: Unchanged from the prior audit's Finding #4. For a cart with N line items, checkout issues 2×N sequential round-trips (a stock re-check plus an `INSERT` per item) while holding one database connection/transaction open, in addition to the order-header insert and cart-delete. This directly adds to checkout latency and holds a pooled connection longer than necessary under concurrent checkout load.
- **Remediation**: Batch the stock check into a single `SELECT ... WHERE product_id = ANY($1)` and the inserts into a single multi-row `INSERT ... VALUES (...), (...), ...`, cutting 2N round-trips to 2 per checkout. Query-shape change only, no schema change needed.

### 4. [Low] Unbounded-`Map`-growth leak pattern still exists verbatim in an unused duplicate file
- **Location**: `backend/src/services/realtimeMonitoringService.js` (root, distinct from `backend/src/services/legacy/realtimeMonitoringService.js`) — `stopMonitoring()` at lines ~130-146 sets `monitor.status = 'stopped'` and re-`.set()`s it back into `this.activeMonitors` (line 140) without ever calling `.delete()`, identical to the bug the prior audit flagged.
- **Description**: The routes that actually reach a `realtimeMonitoringService` (`backend/src/routes/realtimeMonitoringRoutes.js:16`) `require('../services/legacy/realtimeMonitoringService')` — the **legacy** copy, which already has the fix (confirmed: `this.activeMonitors.delete(monitorId)` at line 146, with an inline comment noting the prior leak). A repo-wide `require()` search found zero callers of the root-level duplicate (`backend/src/services/realtimeMonitoringService.js`), and `index.js:337`'s own comment independently confirms this file "had zero callers anywhere in the app." So this is dead code today, not a live leak — but it's a landmine: the exact same bug it was already found and fixed for exists in a second, unwired copy that would reintroduce the leak the moment anyone requires it instead of the `legacy/` version (an easy mistake given the two files have identical class shapes and near-identical names).
- **Remediation**: Either delete the unused root-level `realtimeMonitoringService.js` duplicate (confirm zero references first, already done here), or apply the same `this.activeMonitors.delete(monitorId)` fix to it for consistency if it's being kept intentionally as a reference/fallback implementation.

### 5. [Low] Heavy backend dependencies still declared but unreferenced anywhere in `backend/src`
- **Location**: `backend/package.json` — `aws-sdk` (`^2.1500.0`), `elasticsearch` (`^16.7.3`, deprecated client), `apollo-server-express` (`^3.12.1`) + `graphql` (`^16.8.1`).
- **Description**: Unchanged from the prior audit. `grep -rl "require(['\"]aws-sdk['\"])" backend/src` and the same for `elasticsearch` both return zero matches against the now-fully-installed `backend/node_modules` (716 packages) — confirms these are genuinely unused, not just unresolved by a missing install as the prior audit had to assume. `aws-sdk` v2 in particular is a large monolithic package. Note: the previously-flagged `"crypto": "^1.0.1"` legacy shim dependency has been **removed** since the last audit — that part of this finding is resolved.
- **Remediation**: Run `npx depcheck` in `backend/` to double-confirm, then remove `aws-sdk`, `elasticsearch`, `apollo-server-express`, and `graphql` from `backend/package.json` if no near-term plan exists to use them.

### 6. [Low] `pages`/`components` manualChunks buckets also merge unrelated component code; no list virtualization at 227-page scale
- **Location**: `frontend/vite.config.js:141-143` (`if (id.includes('/components/')) return 'components'`); measured build: `dist/assets/js/components-BzOuPIiO.js` = 325.74 kB. Repo-wide: `react-window`/`react-virtualized` absent from `frontend/package.json` and unreferenced in source.
- **Description**: Same root cause as Finding #1 but for shared components rather than pages — less severe since 325 kB is below the 1000 kB warning threshold, but it's the same anti-pattern (a directory-name-based catch-all bucket rather than per-import chunking) and will keep growing linearly as more shared components are added. Separately, with 227 page components now in the tree, none of the list-heavy modules (Marketplace, Logistics shipment lists, IoT device lists) use a virtualization library, so any list that grows past ~100 rows in production data renders every row's DOM eagerly.
- **Remediation**: Lower priority than Finding #1 (same fix — narrow or remove the `/components/` manualChunks bucket — would apply here too, but the size is not yet at the warning threshold). Virtualization: adopt `react-window` for the highest-row-count list views before launch; not urgent for a static audit to prioritize further without live row-count data.

### 7. [Low] `frontend/src/services/realTimeService.jsx` — WebSocket polling fallback interval on top of `socket.io-client`
- **Location**: `frontend/src/services/realTimeService.jsx:438-447` — `const interval = setInterval(syncData, syncInterval); ... clearInterval(interval)` alongside the file's `socket.io-client` usage (resolves the prior audit's "unused dependency" finding — it's now genuinely wired here).
- **Description**: Not a bug — cleanup is present and correct (`clearInterval` confirmed at line 447) — but noting for completeness since this file is the resolution of a previously-flagged item: `socket.io-client` is real, live client code now, and it also retains a `setInterval`-based polling path (`syncData`) as an apparent fallback/complement to the socket connection. Worth a non-perf-blocking sanity check that both mechanisms aren't double-fetching the same data under normal operation, but no leak or missing cleanup found.
- **Remediation**: None required for this audit; flagged only as a reconciliation note, not a defect.

## Metrics

| Metric | Value |
|---|---|
| **Measured** production build (`npm run build`, this run) — largest JS chunk | `pages-*.js`: 1,600.81 kB raw / 310.02 kB gzip / 194.82 kB brotli |
| Vite's own "chunk > 1000 kB" build warning | **Still present** (1 chunk: `pages-*.js`) |
| Total measured JS chunks (production build) | 13 |
| Second-largest chunk | `vendor-*.js`: 345.12 kB raw / 112.98 kB gzip |
| `components-*.js` chunk size | 325.74 kB raw / 75.02 kB gzip |
| `modules-*.js` chunk size (M0xx modules bucket) | 65.85 kB raw / 5.92 kB gzip |
| Routes using `React.lazy()` in `config/routes.js` | 183 / 183, all at correct module scope |
| M001–M150 module routes using `lazy()` inside render body (bug) | 150 / 150 (`App.jsx:210-228`) |
| `manualChunks` buckets that re-collapse lazy boundaries | 2 (`/pages/`, `/modules/`; `/components/` also collapses but stays under the warning threshold) |
| `React.memo` usages, repo-wide (`frontend/src`) | 1 |
| `useMemo`/`useCallback` call sites, repo-wide (`frontend/src`) | 67 (up from 7 in the prior audit) |
| `react-window`/`react-virtualized` present | No |
| Frontend `setInterval` call sites / correctly cleaned up | 8 / 8 (100%) |
| Confirmed unbounded-Map leak, live code path (`services/legacy/realtimeMonitoringService.js`) | Fixed (`.delete()` present) |
| Confirmed unbounded-Map leak, dead duplicate (`services/realtimeMonitoringService.js`, root) | Present, 0 live callers |
| Backend services doing sync `fs.readFileSync`/`writeFileSync` on the actually-mounted request path | 0 (both `dual-use/authService.js` and `legacy/formService.js` confirmed converted to `fs.promises`) |
| Backend sync-fs pattern remaining in unrequired duplicate files | 2 (`services/authService.js`, `services/formService.js` — not required by `index.js`) |
| Confirmed N+1 sequential-query-in-loop pattern, live checkout path | 1 (`services/legacy/orderService.js`, 2 queries × N cart items) |
| Backend runtime dependencies declared / confirmed unreferenced in `backend/src` (fully installed, 716 pkgs) | 4 confirmed unused (`aws-sdk`, `elasticsearch`, `apollo-server-express`, `graphql`); prior `"crypto"` misuse now removed |
| `socket.io-client` referenced in `frontend/src` | Yes (`services/realTimeService.jsx`) — resolved since prior audit |
| Backend `compression()` middleware registered | Yes (`backend/src/index.js:556`) |
| `backend/node_modules` install state (this run) | Installed, 716 packages |
| `frontend/node_modules` install state (this run) | Installed |
| Production `npm run build` executed this run | Yes — succeeded, 3,699 modules transformed, ~1m13s |
