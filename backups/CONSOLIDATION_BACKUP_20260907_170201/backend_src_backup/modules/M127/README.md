# M127 - Animal Health Management

Domain: Livestock
Status: REAL core CRUD (391-line service.js) + extensive static-placeholder metrics

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real health-record and vaccination-scheduling CRUD backed by
real tables, same pattern as M122/M123 (see the disclosure comment at the
top of `service.js`). Disease-pattern/treatment-recommendation lookups are
legitimate static reference tables; herd-health-score, immunity,
disease-risk, outbreak-detection, vaccination-coverage and
treatment-compliance functions are static placeholders regardless of
farmer/animal-type.

**Frontend note**: `frontend/src/pages/AnimalHealthPage.jsx` calls
`animalHealthAPI`, a separate legacy service — not confirmed to be this
module. Same unconfirmed-reachability / possible-duplication caveat as
M123. Reachable via `/api/v1/backend-modules/M127/:operation` regardless.
Needs real herd health telemetry for the placeholder metrics; tracked in
`.ai/tasks/ACTIVE.md`.
