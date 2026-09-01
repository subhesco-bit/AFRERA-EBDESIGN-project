# M141 - Orchard Management

Domain: Horticulture
Status: REAL (130-line service.js, real controller.js/routes.js)

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real, complete orchard CRUD (`listOrchards`, `getOrchard`,
`createOrchard`, `updateOrchard`, `deleteOrchard`) plus real production
tracking (`recordOrchardProduction`, `getOrchardProduction`,
`getOrchardAnalytics` — a genuine SQL aggregation, not a static
placeholder), backed by real `orchards`/`orchard_production` tables.
Reachable via `/api/v1/backend-modules/M141/:operation`. No fabrication
bugs found while verifying.
