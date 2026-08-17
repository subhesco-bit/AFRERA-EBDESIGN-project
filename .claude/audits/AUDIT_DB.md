---
agent: db-auditor
status: warn
findings: 10
---

## Summary

Audited for N+1 query patterns, missing indexes, unsafe raw SQL, and schema issues across the backend/db layer. Factored in the code audit's finding that `backend/src/database/pool.js` (2,339 lines) embeds an in-memory mock database, and the doc audit's finding that the schema actually spans many migration files rather than the single `schema.sql` the README claims.

## Findings

1. **High — Missing indexes on ~60% of foreign-key columns.** The base schema (`backend/src/database/migrations/000_base_schema.sql`) has 58 FK columns but only 23 indexes (~40% coverage). `cart`, `payments`, `wishlist`, `loans`, `contracts`, `agri_assets`, and others have unindexed FK columns, risking slow joins/lookups as data grows. Remediation: add indexes on all FK columns used in joins or lookups, prioritizing high-traffic tables (`cart`, `payments`, `orders`).

2. **High — `docker-compose up` alone only provisions ~4% of the real schema.** `docker-compose.yml` loads only `schema.sql` (49 tables) as the Postgres init script, versus 1,104 tables defined across 265 real migrations. A fresh environment stood up via `docker-compose up` without a separate migrate step will be badly out of sync with what the application code expects. Remediation: wire an auto-migrate step into `docker-compose.yml` (init container or entrypoint script) so a fresh stand-up matches production schema.

3. **Medium — 29 orphaned duplicate `*_schema.sql` files.** Under `src/database/`, not read by `migrate.js`, `docker-compose`, or any `require()` — dead weight that risks confusing future maintainers about which schema file is authoritative.

4. **Medium — Entirely unused `database/models/` layer (478 lines).** Dead code with no call sites found.

5. **Medium — N+1 write patterns (per-row loops instead of batch SQL).** Found in `orderService.js:267`, `valueCommerceService.js:408`, `offlineSyncService.js:165`, `offlinePaymentService.js:256`. Notably, `offlineSyncService.js`'s sibling `completedIds` branch right next to the N+1 code shows the correct bulk-write pattern already exists in the same file — the fix is to apply that same pattern consistently. Remediation: convert per-row loops to batch `INSERT ... VALUES (...), (...), ...` or equivalent bulk operations.

6. **Medium — Migration runner issues.** `migrate.js down` doesn't actually reverse a migration (it just deletes the tracking row, leaving schema changes in place); `tryAutoRepair()` silently regex-rewrites and re-executes failing migrations, which can mask real errors instead of surfacing them.

7. **Low-Medium — Transaction helper (`withTransaction()`) is underused.** Purpose-built to fix "44 unbounded multi-statement writes" per its own history, but is used in only 1 place; 6 services hand-roll `BEGIN`/`COMMIT`/`ROLLBACK` instead. Currently correct in those 6 spots but fragile to future edits — an easy place for a future change to accidentally drop the rollback path.

8. **Pass — No SQL injection found.** The only 3 dynamic-SQL identifier-interpolation sites (`outcomeResolver.js`, `withTransaction.js`, `geo.js`) all allowlist-validate identifiers before interpolating; all values are parameterized throughout.

9. **Informational — `pool.js`'s mock DB is confirmed test-only,** gated behind `NODE_ENV==='test' || USE_TEST_DB==='true'`. The real production path uses a proper shared `pg.Pool` via `connection.js`. However, this means the Jest suite never exercises real SQL: `pg` is separately mocked via `jest.config.js` `moduleNameMapper` (`src/test-mocks/pg.js`), a second, much dumber mock — so two different fakes stand in depending on import path, and neither validates real query correctness.

10. **Positive — CI does spin up real Postgres** and applies all 265 migrations with structural verification (table/index/FK count assertions). This validates schema *shape* is reachable, but does not validate that each service's actual query text is correct against that schema — a gap given finding #9.

## Metrics

- FK columns in base schema: 58 (23 indexed, ~40% coverage)
- Tables via `docker-compose` init script vs. real migrations: 49 vs. 1,104 (265 migration files)
- Orphaned duplicate schema files: 29
- Dynamic-SQL sites reviewed for injection risk: 3 (all safe)
- N+1 write sites found: 4
