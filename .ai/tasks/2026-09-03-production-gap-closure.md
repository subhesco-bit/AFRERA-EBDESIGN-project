# Production Gap Closure - 2026-09-03

## Objective

Close the verified user-interface, frontend API, backend route, database, and production-hardening gaps in dependency order:

1. Discover and classify missing capabilities.
2. Repair frontend-to-backend contracts and authenticated data access.
3. Link every reachable feature into role-aware navigation.
4. Validate database migrations and service contracts against a disposable PostgreSQL instance.
5. Add regression, integration, and browser coverage.
6. Harden configuration, observability, security, deployment, and rollback procedures.

## Verified baseline

- Branch: `claude-enhancement`.
- Frontend production build completes from `frontend/` with only the existing Vite CJS deprecation warning.
- `node tools/frontend-boundaries.js --check` fails: 77 critical frontend network-boundary violations and 21 frontend API contract-drift endpoints.
- The generated measurements are in `docs/registry/19_FRONTEND_WIREFRAME.md`, `docs/registry/20_FRONTEND_BOUNDARIES.md`, and `docs/registry/21_API_CONTRACT_DRIFT.md`.
- The checker scanned 1,160 frontend files and found 137 total violations.
- After the remediation waves, the checker reports 117 total violations: 65 critical FE-01, 34 FE-02, and 18 FE-05.
- API contract drift decreased from 21 to 9 entries; the remaining entries are documented blockers, not fabricated routes.
- Six generated module pages now use verified CRUD contracts; 52 generic module calls remain blocked pending concrete module contracts.
- PostgreSQL migrations are documented as not executed; live database verification remains blocked until PostgreSQL is available.
- The checked-in `TRUTHPACK.json` is available, but `.vibecheck/truthpack/` is absent. Any missing truthpack data must be resolved before inventing product, route, schema, environment, or copy contracts.

## Completed in this slice

`frontend/src/pages/DisruptionPage.jsx` now uses `civilDisruptionAPI` and the verified `/api/v1/civil-disruptions` routes. This removes the singular-route 404s and manual `token` header path that bypassed the shared authentication and refresh interceptor.

Additional verified fixes completed in this work session:

- Corrected dashboard, blockchain, enterprise, and predictive API prefixes/mounting.
- Migrated WalletCard, login, registration, M006/M011, six generated module pages, collaboration, module operation, MFA, and GDPR surfaces to named API client methods.
- Added credential-free migration preflight and generated `docs/MIGRATION_PREFLIGHT.md` plus `.ai/audits/migration-preflight-latest.json`.
- Added route reachability and page import corrections, plus accessibility and missing loading/error states.

## Ordered work queue

### P0 - Contract and reachability closure

- [ ] Replace the remaining 65 critical frontend network-boundary violations with verified API client methods.
- [ ] Resolve the remaining 9 contract-drift endpoints by mapping to an existing route or documenting an explicit product/schema decision before implementation.
- [ ] Add route-level loading, error, empty, and unauthorized states to data-fetching pages.
- [ ] Verify sidebar, bottom navigation, role guards, and route declarations against the same route manifest.
- [ ] Add an automated check that imports every lazy page module and detects duplicate or unreachable paths.

### P1 - Backend and database integration

- [ ] Start disposable PostgreSQL, execute migrations in order, and record the resulting schema fingerprint; preflight currently reports 124 findings across 352 migrations.
- [ ] Run database-backed smoke tests for every mounted route group.
- [ ] Resolve known duplicate-table/schema decisions only from observed callers and migration results.
- [ ] Remove or quarantine routes that have no valid service/database contract.

### P1 - Claude-compatible transferability

- [ ] Keep route, schema, environment, and API contracts synchronized with the checked-in truthpack.
- [ ] Record each decision in `.ai/decisions/` and each implementation result in `.ai/handoffs/`.
- [ ] Require every handoff to include changed files, commands, evidence, blockers, and remaining acceptance criteria.

### P2 - Production hardening

- [ ] Add backend and frontend tests for authentication, authorization, tenant isolation, validation, retries, and failure states.
- [ ] Add browser checks for representative farmer, buyer, admin, and enterprise journeys.
- [ ] Verify secrets, CORS, rate limits, security headers, request IDs, structured logs, health/readiness checks, and graceful shutdown.
- [ ] Validate Docker/CI deployment, migration rollback, backups, restore drills, and monitoring alerts.
- [ ] Do not certify production readiness until P0 and P1 evidence is green and infrastructure-dependent checks have run.

## Acceptance gate

Production hardening is complete only when the boundary checker passes, frontend and backend builds/tests pass, migrations execute against a clean database, representative UI/API journeys succeed with real authentication, and the handoff contains reproducible commands and evidence.