---
agent: bug-auditor
status: warn
findings: 4
---

# Bug Audit — Runtime Bugs, Logic Errors, Edge Cases

## Summary

Scope: full repo (`backend/src`, `frontend/src`), with priority on
`backend/src/services/` per the request to hunt for copy-paste TDZ
(temporal-dead-zone) self-reference bugs of the same shape as the
already-fixed `insuranceClaimsService.js:331` (`const aiResponse = await
aiAPI.generateRecommendation(aiResponse)`).

**That specific bug class is now contained.** A repo-wide static scan (custom
Node script matching `const/let X = [await] f(...)` and checking whether `X`
appears as a genuine argument token inside its own initializer, across all
`.js/.jsx/.ts/.tsx` files, ~450 files) found 18 backend + 3 frontend
candidates. All were manually verified to be false positives — matches came
from string/regex literals (`'critical'`, `/jhum|shifting/i`, template-literal
IDs like `` `hp-fallback-${Date.now()}` ``), SQL query text (column/table
aliases named `pricing`/`policies`), or legal arrow-function parameter
shadowing (`this.queue.find(item => item.id === id)`). All 34 other call
sites of `aiAPI.generateRecommendation(...)` across `subsidyService.js`,
`soilTestingService.js`, `sharedInfraService.js`, `preSeasonOrderService.js`,
`greenhouseService.js`, `governmentSchemeService.js`,
`farmerTrainingService.js`, `dynamicPricingService.js`, and
`insuranceClaimsService.js` itself consistently use a separately-named
`aiRequest` builder object — none reproduce the self-reference mistake.

While chasing that pattern, the scan surfaced a different, real copy-pasted
anti-pattern (fabricated "success" responses on empty DB results — see
Finding 2) plus a genuine concurrency bug in newly-added freight-pooling code
(Finding 1) and an infrastructure gap (Finding 3). No crash-on-boot or
crash-on-first-call bugs were found elsewhere in the areas reviewed.

## Findings

### Finding 1 — Race condition + missing double-booking guard in freight pool joins
- **Severity:** Medium
- **Location:** `backend/src/services/freightPoolingService.js:96-127` (`joinPoolWindow`)
- **Description:** `joinPoolWindow` reads the window and the current pooled
  weight (`SELECT COALESCE(SUM(weight_kg)...)`), computes `newTotal` in JS,
  and only *then* checks `newTotal > vehicle_capacity_kg` before inserting a
  new `freight_pool_shipments` row — all as separate, unlocked queries with no
  transaction (`BEGIN`/`COMMIT`) or row lock (`FOR UPDATE`). Two concurrent
  requests joining the same window will both read the same pre-join total,
  both pass the capacity check, and both insert — silently exceeding
  `vehicle_capacity_kg` (a classic TOCTOU race). Separately, nothing marks a
  shipment's `shipments.status` as consumed once it joins a window (only a
  `UNIQUE(window_id, shipment_id)` constraint on the pool-shipments table
  prevents joining the *same* window twice); the same `shipment_id` can be
  joined to two *different* open pool windows, double-allocating its weight.
  A concurrent double-join into the same window would also throw an
  unhandled unique-constraint violation from Postgres, which the route
  (`backend/src/routes/freightPoolingRoutes.js:50-57`) forwards as a raw
  500-shaped Postgres error message rather than a clean validation error.
- **Remediation:** Wrap the read-check-insert in a single transaction using
  `SELECT ... FOR UPDATE` on the `freight_pool_windows` row (or an
  `INSERT ... SELECT` with a `WHERE` capacity guard) so capacity checks are
  atomic under concurrency. Additionally, either add a partial unique index /
  application check preventing a `shipment_id` already present in any
  *open* pool window from joining another, or flip `shipments.status` to a
  "pooled" state on join (and validate against it) so a shipment cannot be
  double-allocated across windows.

### Finding 2 — "Test-mode" DB-miss fallback fabricates fake success responses that leak into production
- **Severity:** Medium
- **Location:** `backend/src/services/consumerHealthService.js` (7 sites:
  lines 74-88, 209-218, 259-268, 348-357, 428-437, 510-519, 601-610);
  `backend/src/services/arVrService.js` (7 sites: `createExperience`
  ~62-84, `publishExperience` ~160-171, `createAsset` ~220-233,
  `createInteractionPoint` ~320-333, `createSession` ~400-413, `endSession`
  ~445-458, analytics recorder ~505-518); `backend/src/services/giIntelligenceService.js:66-90`
  (same shape, one site checked).
- **Description:** Each of these handlers does the real DB write, then
  checks `if (!result || ... || Object.keys(result).length === 0)` and, on a
  miss, builds a `fallback` object by echoing `req.body`/params with a fake
  synthetic id (e.g. `` `hp-fallback-${Date.now()}` ``), calls
  `pool.setTestData(...)`, and returns/responds as if the create succeeded
  (HTTP 201 + the fabricated object). `pool.setTestData` (defined in
  `backend/src/database/pool.js:2294-2308`) is a guarded no-op outside test
  mode: `if (!(NODE_ENV === 'test' || USE_TEST_DB === 'true')) return false;`.
  That means in production, if the real `INSERT ... RETURNING *` ever comes
  back with zero rows for any reason (driver hiccup, an added
  `ON CONFLICT DO NOTHING`, a future migration, a transient replica read),
  the code path fabricates a fake ID and tells the client "created"
  (HTTP 201) with data that was never persisted anywhere — silent data loss
  disguised as success. Today this path is effectively unreachable for the
  plain `INSERT ... RETURNING *` statements in these functions (a bare insert
  either returns a row or throws, caught separately), which is why it hasn't
  surfaced yet, but it is a live landmine: any future change that adds a
  conditional insert, a trigger that can skip the row, or a retried/partial
  write will make this path fire silently in production with no error logged
  and no way for the client to tell the difference from a real save.
- **Remediation:** Gate the entire fallback branch behind
  `NODE_ENV === 'test' || USE_TEST_DB === 'true'` (matching the guard already
  used inside `pool.setTestData` itself) so a production DB-miss instead
  falls through to a real 500/502 error. Do not synthesize a fake persisted
  ID for a caller in production.

### Finding 3 — No process-level `unhandledRejection` / `uncaughtException` handlers
- **Severity:** Low
- **Location:** repo-wide (confirmed via grep across `backend/**/*.js`, no
  matches); entry point `backend/src/index.js`.
- **Description:** The backend is a single Node process hosting ~150
  services plus an in-process `EventEmitter`-based signal bus
  (`backend/src/core/signalBus.js`), background jobs
  (`backend/src/jobs/loadMandiPrices.js`), and websocket handling
  (`backend/src/websocket/socketServer.js`). `signalBus.js` itself is
  carefully defensive (`_safeEmit` catches both sync throws and async
  rejections from subscribers so one bad handler can't take down the bus —
  good pattern, no bug there), but nothing catches a rejection that occurs
  outside of an Express route's try/catch or outside a signal-bus-wrapped
  handler (e.g., a fire-and-forget async call, a rejected promise inside a
  `setInterval`/`setTimeout` callback, or a background job invoked without
  `.catch()`). Since Node 15, an unhandled promise rejection terminates the
  process by default. In this monolith, that means one overlooked `.catch()`
  anywhere in a non-request code path can crash the entire platform (all
  ~150 services, not just the offending one) rather than degrading a single
  request.
- **Remediation:** Add `process.on('unhandledRejection', ...)` and
  `process.on('uncaughtException', ...)` handlers in `backend/src/index.js`
  that log via the existing `logger` and perform a graceful shutdown (or, at
  minimum, prevent a silent hard crash with no log line), consistent with
  the defensive posture already shown in `signalBus.js`.

### Finding 4 — Confirmed: TDZ self-reference bug class is isolated to the already-fixed line
- **Severity:** Informational (pass)
- **Location:** N/A — negative finding, reported for audit completeness.
- **Description:** See Summary. No other instance of `const X = await
  f(...X...)` (the exact shape of the fixed `insuranceClaimsService.js:331`
  bug) exists anywhere in `backend/src` or `frontend/src`.
- **Remediation:** None required.

## Metrics

- Files scanned by automated TDZ self-reference sweep: ~450 (`backend/src`
  + `frontend/src`, all `.js/.jsx/.ts/.tsx`, `node_modules` excluded)
- `aiAPI.generateRecommendation(...)` call sites cross-checked: 35 (34 use
  `aiRequest` correctly + the 1 already-fixed line)
- TDZ scan candidates found: 21 (18 backend + 3 frontend) — all confirmed
  false positives after manual review
- Services manually read in full for this audit: `equipmentExchangeService.js`,
  `freightPoolingService.js`, `glutWarningService.js`,
  `returnLoadBoardService.js`, `recoveredFinanceService.js` (diff),
  `consumerHealthService.js` (fallback sites), `arVrService.js` (fallback
  sites), `resolveFarmerId.js`, `signalBus.js`, `pool.js` (test-pool gating,
  `setTestData`)
- Routes manually read in full: `freightPoolingRoutes.js`,
  `trackDartRoutes.js`, `equipmentExchangeRoutes.js`,
  `recoveredFinanceRoutes.js` (diff)
- Frontend files reviewed: `BankPassportPage.jsx`, `FarmerKycPage.jsx`
  (scan-flagged, confirmed false positive), `offlineQueue.js` (scan-flagged,
  confirmed false positive)
- New findings: 3 actionable (1 medium concurrency bug, 1 medium data-integrity
  anti-pattern spanning 3 files/15 call sites, 1 low infra gap) + 1
  informational negative-result finding
- False-positive rate of automated TDZ scan: 100% (21/21) — pattern
  confirmed contained to the one already-fixed occurrence
