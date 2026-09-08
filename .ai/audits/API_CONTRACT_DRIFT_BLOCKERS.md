# API Contract Drift Blockers

Reviewed 2026-09-03 against `backend/src/index.js` and `backend/src/routes`.

The two requested entries from `docs/registry/21_API_CONTRACT_DRIFT.md` are now resolved without inventing business data:

- `/api/enterprise/organizations/current/integrations`: the frontend uses the shared API service, whose `/api/v1` base resolves the mounted canonical adapter. The adapter uses the verified integration query only when authenticated `organization_id` exists; otherwise returns `400`.
- `/api/financial/overview`: reads the authenticated farmer's existing loans and advances.
- `/api/financial/loans`: reads the authenticated farmer's existing loans with the existing service method.
- `/api/financial/loan-products`: the frontend no longer requests or renders fabricated products. The backend retains an explicit `501` for callers because no verified service or schema exists.
- `/api/operations/overview`: aggregates the eight existing operations CRUD list queries; it does not invent KPIs.
- `/api/v1/${resource}`: removed from the frontend hook; callers must provide a canonical `/api/v1/...` path.
- `/api/v1/errors/log`: writes client error payloads through the existing logger; no persistence is claimed.
- `/api/v1/notifications/subscribe` and `/api/v1/notifications/unsubscribe`: development/test-only in-memory adapter; production returns explicit `501` until persistence exists.

No business data or durable persistence was invented for these blockers. The generated registry reports no remaining API contract drift entries; the boundary checker still reports unrelated FE-05 hardcoded color-token violations.
