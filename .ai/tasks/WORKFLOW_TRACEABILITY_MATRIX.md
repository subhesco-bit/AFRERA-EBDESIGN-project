# Workflow Traceability Matrix

**Generated from source inspection:** 2026-09-04  
**Status:** Descriptive baseline. A row is not complete until the UI, stepper, API, controller/route, service, database, auth, automated test, and browser evidence all exist.

| Workflow | Current UI | Shared stepper | Candidate API | Backend owner | Durable DB path | Current finding |
|---|---|---|---|---|---|---|
| Booking | `CheckoutPage`, `ColdStoragePage`, `MillCircuit` surfaces | Progress-only `JourneyStepper` | `/orders`, `/cold-storage/bookings`, `/mill-fpo/mill-circuit/bookings` | `orderService`, `coldStorageRoutes`, `millCircuitService` | Orders/cart and booking tables exist, but paths are separate | No single shared booking journey; needs real end-to-end test |
| Policy | `InsuranceManagementPage` | Not wired | `/insurance/policies`, `/insurance/quotes`, `/insurance/policies/:id/payments/:installmentNumber` | `insuranceService`, `insurancePolicyIssuanceService` | `policies` and `insurance_policies` are competing models | Contract reconciliation required before one journey can be authoritative |
| Claim | `InsuranceManagementPage` and `ClaimForm` placeholder | Not wired | `/insurance/claims`, `/insurance/claims/submit`, `/insurance/claims/:id/process` | `insuranceService`, `insuranceClaimsService` | `claims` exists; deeper AI service has in-memory claim assembly | Two claim paths; select and persist one canonical lifecycle |
| Logistics | `LogisticsPage`, `LogisticsProviderPage` | Not wired | `/logistics/shipments`, `/logistics/shipments/:id/tracking`, `/logistics/shipments/:id/status` | `logisticsService`, `logisticsEnhancementService` | `shipments`, `shipment_tracking`, temperature and fleet tables | Vendor booking returns a non-durable object and cannot be completion path |
| Loyalty | Harvest points display and loyalty redemption rule | Not wired | `/commerce-rules/harvest-points/:userId`, `/commerce-rules/loyalty-redemption` | `commerceRulesService` | Harvest points are derived from orders/subscriptions; redemption is a synchronous rule | Redemption has no durable wallet/ledger write; not complete |

## Required Trace Per Workflow

`UI -> useJourneyStepper -> API client -> authenticated route -> controller/handler -> domain service -> business rule -> transaction/database -> response -> UI state`

## Blocking Reconciliation Decisions

- Booking must choose one canonical booking aggregate instead of treating vendor demo data as a successful booking.
- Policy and claim must choose between the simpler `insuranceService` lifecycle and the deeper legacy enhancement lifecycle, then align schemas and routes.
- Loyalty redemption must call a durable wallet/ledger operation or explicitly remain a proposal; a computed response alone cannot claim redemption.
- Every workflow needs an authenticated owner/tenant check on reads and writes.