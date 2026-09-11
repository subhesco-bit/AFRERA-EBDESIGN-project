# MAIN → CLONE Reconciliation — Phase 3

## Status

Implemented on `chatgpt-clone/main-reconciliation-phase-1`.

## Functional slice closed

### Village external demand → SUBH supply orchestration

The reconciled database layer is now backed by executable service/API behavior:

- active village supply catalogue
- household demand
- village-common demand
- Agro OS demand
- demand prioritization
- outstanding supply-plan aggregation
- SUBH supply orders
- order lines
- transactional order totals
- authenticated API access

## API surface

- `GET /api/v1/village-supply/catalog`
- `POST /api/v1/village-supply/demands`
- `GET /api/v1/village-supply/villages/:villageId/plan`
- `POST /api/v1/village-supply/orders`

The dynamic route loader discovers route files under `backend/src/routes`, so this route participates in the existing auto-discovery architecture.

## Security

All endpoints require the existing authentication middleware. The operational API also enforces owner isolation for ordinary users.

## Transaction integrity

Supply-order creation uses an explicit PostgreSQL transaction. Any failed order-line write rolls the order back rather than leaving a partially-created order.

## Verification status

Focused Jest coverage was added for demand-layer validation, priority validation, parameterized catalogue filtering, and transactional rollback behavior.

Full repository CI has not been represented as passing unless an actual GitHub Actions run reports success.

## Next reconciliation target

Continue from persistence/API into the existing ERP, FPO, farmer, production, harvest, aggregation, logistics, marketplace, buyer, payment and settlement workflows. Each capability must be traced from schema → service → route → authorization → UI/consumer → integration → tests before being considered implemented.
