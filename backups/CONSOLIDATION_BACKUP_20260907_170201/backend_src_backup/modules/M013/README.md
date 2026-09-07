# M013 - Authorization (CRITICAL PATH)

Real-time role-based access control service. `authorizations` table,
5-level role hierarchy (SUPER_ADMIN/ADMIN/MANAGER/SUPERVISOR/USER/GUEST),
permission caching. Reachable via `/api/v1/backend-modules/M013/:operation`
(the generic module-registry bridge, same pattern WaterManagementPage.jsx
uses). Corrected 2026-08-29 - README previously said "Auto-generated
module template. Domain: TBD," which was stale relative to the real
446-line service.js sitting next to it.
