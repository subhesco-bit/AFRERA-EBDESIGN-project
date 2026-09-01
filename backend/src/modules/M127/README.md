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
`animalHealthAPI`, a separate legacy service.

**Confirmed 2026-08-31 (was previously unconfirmed):** `animalHealthAPI` ->
`/api/v1/animal-health` -> `routes/animalHealthRoutes.js` ->
`services/legacy/animalHealthService.js`, which writes to `animal_health_examinations`/
`animal_treatments`/`disease_outbreaks`/`quarantine_records`. This module writes to its own
`animal_health_records` table (keyed by `animal_id`, no shared key space with the other four)
and is reachable only via `/api/v1/backend-modules/M127/:operation` - no confirmed frontend
caller. Same shape as M123/poultryService: two genuinely separate, real, non-colliding systems,
not a dead duplicate. Reconciling which is canonical is a product decision, not a code merge.

Still needs real herd health telemetry for the placeholder metrics (herd-health-score,
immunity, disease-risk, outbreak-detection, vaccination-coverage, treatment-compliance) -
unrelated to the duplication question above, tracked separately in `.ai/tasks/ACTIVE.md`.
