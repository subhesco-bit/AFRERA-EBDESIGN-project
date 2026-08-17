---
agent: bug-auditor
status: warn
findings: 4
---

## Summary

Audited for runtime bugs, logic errors, and edge cases across `backend/src` and `frontend/src`. Ran a repo-wide static scan (~450 `.js/.jsx/.ts/.tsx` files) for the exact temporal-dead-zone self-reference pattern that caused the `insuranceClaimsService.js:331` crash (`const aiResponse = await aiAPI.generateRecommendation(aiResponse)`), and cross-checked all 35 `aiAPI.generateRecommendation(...)` call sites across 9 services. Found 3 additional real issues unrelated to that bug class.

## Findings

1. **Pass (informational) — TDZ self-reference bug class is contained.** 21 static-scan candidates were manually verified as false positives (string/regex literals, SQL aliases, legitimate arrow-param shadowing). All 35 `aiAPI.generateRecommendation(...)` call sites use a correctly-named `aiRequest` builder except the one already fixed. No other instance of this bug exists in the codebase.

2. **Medium — Concurrency race in freight pool capacity check.** `backend/src/services/freightPoolingService.js:96-127` (`joinPoolWindow`) does a read-check-insert capacity check with no transaction or row lock. A TOCTOU race lets concurrent joins exceed `vehicle_capacity_kg`, and nothing prevents the same shipment from being double-booked across different pool windows. Remediation: wrap the check-and-insert in a transaction with `SELECT ... FOR UPDATE` (or an equivalent row lock) on the pool-window row.

3. **High — Fake-success fallback silently discards data in production.** `consumerHealthService.js`, `arVrService.js`, and `giIntelligenceService.js` all contain a copy-pasted "test-mode fallback" (~15 call sites) that fabricates a fake ID and returns HTTP 201 "success" when a DB insert returns empty. The underlying persistence call (`pool.setTestData`) is a no-op outside test mode, so in production this path silently tells clients their data was saved when nothing was persisted. Remediation: fail loudly (500) when the real insert returns no row outside test mode; never let the test-mode stub path be reachable in production.

4. **Medium — No global unhandled-rejection/exception handlers.** No `process.on('unhandledRejection' | 'uncaughtException')` handlers exist anywhere in the backend. One missed `.catch()` outside a route handler can crash the entire ~150-service monolith process. Remediation: add top-level handlers in `index.js` that log and either gracefully shut down or alert, rather than allowing a silent/hard crash.

## Metrics

- Files scanned for TDZ pattern: ~450
- `aiAPI.generateRecommendation` call sites cross-checked: 35 (9 service files)
- False-positive candidates manually verified: 21
- Real actionable findings: 3 (1 High, 2 Medium)
