# M123 - Poultry Management

Domain: Livestock
Status: REAL core CRUD (431-line service.js) + extensive static-placeholder metrics

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real registration/update/count/distribution CRUD backed by
real tables, same pattern as M122 Cattle Registry (see the disclosure
comment at the top of `service.js`). Breed/vaccination/health-standard
lookups are legitimate static reference tables; performance, health,
mortality, weight-gain and farmer-summary metrics are static placeholders
regardless of flock/farmer ID.

**Frontend note (confirmed 2026-08-31, was previously unconfirmed):** `PoultryManagementPage.jsx`
calls `poultryAPI` -> `/api/v1/poultry` -> `routes/poultryRoutes.js` ->
`services/legacy/poultryService.js`, which writes to `poultry_flocks`/`poultry_egg_production`/
`poultry_feed_consumption`/`poultry_mortality`/`poultry_vaccination_records`. This module writes
to a completely separate `flock_registry_id`-keyed registry (only `poultry_health_records` as a
sub-table) and is reachable only via the generic `/api/v1/backend-modules/M123/:operation`
bridge - no confirmed frontend caller. Two genuinely separate, real, non-colliding systems (not
a dead duplicate the way `services/legacy/digitalTwinService.js` was - see `schema-decisions.json`).
Left as-is: reconciling which one is canonical needs a product decision (which is the real
flock registry going forward), not a code merge - the tables don't share a key space.
This module's actual frontend reachability is unconfirmed as of this pass;
it may duplicate that legacy poultry service, which would be worth
reconciling as separate follow-up work (same shape as the M060/
productReviewService duplication found and documented earlier this
session). Reachable via `/api/v1/backend-modules/M123/:operation`
regardless. Needs real flock telemetry for the placeholder metrics; tracked
in `.ai/tasks/ACTIVE.md`.
