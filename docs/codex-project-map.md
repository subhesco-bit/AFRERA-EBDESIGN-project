# Codex Project Rescue Map

Generated: 2026-09-11T20:37:50.268Z

## Executive Read

AFRERA is a real multi-target platform, but the repository is mixed with generated reports, dependency caches, build outputs, backups, and agent/tooling workspaces. The useful product core is:

- Web app: React 18 + Vite in `frontend/src`
- Mobile app: Capacitor Android wrapper in `frontend/android`
- Desktop app: Tauri wrapper in `frontend/src-tauri`
- API platform: Node/Express backend in `backend/src`
- Database: PostgreSQL-first canonical assets in `database`
- Infra: Docker, Render, GitHub Actions, Kubernetes, Terraform, and nginx assets
- Architecture registry: `docs/registry` and `database/registry`

## Verified Platform Targets

| Target | Present |
|---|---:|
| Web | yes |
| Mobile Android | yes |
| Desktop Tauri | yes |
| Backend API | yes |
| Database assets | yes |

## Core Runtime Counts

| Area | Count |
|---|---:|
| Frontend pages | 1109 |
| Frontend components | 479 |
| Frontend services | 20 |
| Backend routes | 751 |
| Backend services | 641 |
| Backend module files | 1957 |
| Database assets | 9 |
| Infra/deployment assets | 165 |
| Android wrapper files | 402 |
| Tauri wrapper files | 21 |

## Category Inventory

| Category | Files |
|---|---:|
| dependency_cache | 355609 |
| automation_tooling | 16366 |
| backup_or_archive | 12674 |
| uncategorized | 10667 |
| data_or_registry | 6808 |
| project_documentation | 4155 |
| agent_workspace_noise | 3951 |
| build_output | 2590 |
| backend_module | 1957 |
| backend_tests | 1443 |
| frontend_page | 1109 |
| frontend_runtime | 974 |
| backend_database | 831 |
| backend_route | 751 |
| backend_service | 641 |
| frontend_component | 479 |
| historical_report | 428 |
| mobile_android_wrapper | 402 |
| frontend_tests | 325 |
| shared_config_or_manifest | 284 |
| infra_deployment | 165 |
| backend_runtime | 115 |
| registry_documentation | 36 |
| backend_middleware | 28 |
| log_or_report_output | 25 |
| desktop_tauri_wrapper | 21 |
| frontend_api_client | 20 |
| database_asset | 9 |
| frontend_routing_config | 6 |
| frontend_state | 4 |

## Largest Top-Level Buckets

| Path | Files |
|---|---:|
| New folder | 174258 |
| .claude | 150366 |
| frontend | 47775 |
| backend | 39679 |
| node_modules | 5707 |
| backups | 2526 |
| _EBDESIGN_LIBRARY | 983 |
| modules | 494 |
| .ai | 447 |
| _SQL_INFRA | 81 |
| docs | 77 |
| tools | 38 |
| DOCUMENTATION | 32 |
| .vs | 30 |
| .system-audit | 22 |
| blobs | 19 |
| .cursor | 13 |
| infra | 10 |
| database | 9 |
| _audit | 9 |
| .github | 8 |
| scripts | 8 |
| .vibecheck | 7 |
| workflows | 6 |
| .audit | 3 |
| .vscode | 3 |
| .devin | 2 |
| config | 2 |
| .consolidation_work | 1 |
| .dockerignore | 1 |

## Keep / Use

- `frontend/src/pages`, `frontend/src/components`, `frontend/src/services`, `frontend/src/config/routes.js`
- `backend/src/index.js`, `backend/src/routes`, `backend/src/services`, `backend/src/modules`, `backend/src/database`
- `database/migrations/canonical`, `database/registry`, `database/docs`
- `frontend/capacitor.config.json`, `frontend/android`, `frontend/src-tauri`
- `docker-compose*.yml`, `Dockerfile`, `.github/workflows`, `infra`, `render.yaml`, `nginx.conf`
- `docs/registry`, `docs/API_DOCUMENTATION.md`, `docs/DESIGN_SYSTEM.md`, `docs/architecture`

## Treat As Junk Or Evidence

- `node_modules`: dependency cache, never source of truth
- `frontend/dist`: generated output, rebuild from source
- `backups`: recovery-only
- Root `*_REPORT.md`, `*_STATUS.md`, `*_SUMMARY.md`, `*_CHECKLIST.md`: evidence/planning, not runtime
- `.claude`, `.devin`, `.ai`, `.audit`, `.vibecheck`: agent workspace output
- One-off fixer/generator scripts in root: use only after reading and verifying

## Build Notes

- Frontend build currently succeeds with `npm run build` from `frontend`.
- Backend entry files pass `node --check`, but runtime API health still depends on service loading and configured databases.
- The mobile and desktop apps are wrappers around the same Vite web build, so hardening the web runtime improves all three targets.

Full file-level inventory: `docs/codex-file-map.csv`
Machine-readable summary: `docs/codex-project-map.json`
