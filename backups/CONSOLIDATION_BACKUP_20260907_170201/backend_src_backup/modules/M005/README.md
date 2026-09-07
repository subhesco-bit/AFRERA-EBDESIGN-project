# M005 - Environment Management

Domain: Platform Foundation
Status: REAL (218-line service.js, 49-line controller.js, real model.sql)

(2026-08-29) README previously said "Status: ABSENT" / "scaffolding" despite
already having real, complete CRUD: `createEnvironment`, `getEnvironment`,
`updateEnvironment`, `listEnvironments`, backed by a real `environments`
table. Reachable via the generic module bridge at
`/api/v1/backend-modules/M005/:operation`, and via `frontend/src/pages/EnvironmentManagementPage.jsx`
(a generic operation panel keyed on `moduleId="M005"`).

No bugs found while verifying — the static lookup tables
(`getEnvironmentBestPractices`, `calculateResourceRequirements`,
`getSecurityConfigurations`) are legitimate fixed config, not fabricated
data passed off as computed/AI output.
