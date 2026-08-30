# M122 - Cattle Registry

Domain: Livestock
Status: REAL core CRUD (528-line service.js) + extensive static-placeholder metrics

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real, complete registry CRUD (`registerCattle`,
`updateCattleHealth`, `getCattleBreed`, `getCattleLocation`,
`getCattleCount`, `getBreedDistribution`), backed by the real
`cattle_registry` table. Reachable live from
`frontend/src/pages/CattleRegistryPage.jsx` via the generic
`moduleId="M122"` operation panel.

**Placeholder** (see the disclosure comment at the top of `service.js`):
regional health patterns, nutritional requirements, environmental factors,
weight gain, feed efficiency, health/reproductive/milk-production metrics
and farmer-level summaries are all static regardless of the specific
animal/farmer. Needs real herd-record/weighing/health telemetry, not
better-looking fake numbers; tracked in `.ai/tasks/ACTIVE.md`.
`getBreedCharacteristics`, `getVaccinationSchedule` and
`getBreedHealthStandards` are legitimate static reference tables, not
fabrication.
