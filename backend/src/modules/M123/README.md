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

**Frontend note**: `frontend/src/pages/PoultryManagementPage.jsx` calls
`poultryAPI`, a separate legacy service — not confirmed to be this module.
This module's actual frontend reachability is unconfirmed as of this pass;
it may duplicate that legacy poultry service, which would be worth
reconciling as separate follow-up work (same shape as the M060/
productReviewService duplication found and documented earlier this
session). Reachable via `/api/v1/backend-modules/M123/:operation`
regardless. Needs real flock telemetry for the placeholder metrics; tracked
in `.ai/tasks/ACTIVE.md`.
