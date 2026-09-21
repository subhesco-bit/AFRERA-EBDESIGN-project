# Codex Junk Separation Plan

Generated: 2026-09-12T03:32:04.404Z

## Answer

Yes, this repository contains a very large amount of non-core material. The first pass identifies it as quarantine candidates, not deletion candidates. That distinction matters because dependency folders, generated outputs, backups, and agent workspaces can be removed only after CI can rebuild the project from source.

## File Buckets

- Keep and harden: 9,280 core/runtime files
- Quarantine candidates: 3,79,127 files
- Human review before moving: 34,466 files

## Quarantine Candidate Categories

- dependency_cache: 3,55,609 files, 3.1 GB
- backup_or_archive: 12,674 files, 69.5 MB
- agent_workspace_noise: 3,951 files, 50.7 MB
- build_output: 2,590 files, 48.1 MB
- historical_report: 428 files, 7.5 MB
- log_or_report_output: 25 files, 500.6 KB

## Largest Top-Level Areas

| Folder | Files | Size |
| --- | ---: | ---: |
| `New folder` | 1,74,258 | 1.9 GB |
| `.claude` | 1,50,366 | 1.1 GB |
| `frontend` | 47,775 | 421.4 MB |
| `backend` | 39,679 | 437.5 MB |
| `node_modules` | 5,707 | 52.7 MB |
| `backups` | 2,526 | 13.8 MB |
| `_EBDESIGN_LIBRARY` | 983 | 2.0 GB |
| `modules` | 494 | 1.2 MB |
| `.ai` | 447 | 9.6 MB |
| `_SQL_INFRA` | 81 | 21.6 MB |
| `docs` | 77 | 4.1 MB |
| `tools` | 38 | 354.4 KB |
| `DOCUMENTATION` | 32 | 986.0 KB |
| `.vs` | 30 | 106.6 MB |
| `.system-audit` | 22 | 120.8 MB |
| `blobs` | 19 | 3.8 GB |
| `.cursor` | 13 | 18.2 KB |
| `infra` | 10 | 3.3 KB |
| `_audit` | 9 | 12.5 MB |
| `database` | 9 | 706.5 KB |
| `scripts` | 8 | 58.9 KB |
| `.github` | 8 | 23.5 KB |
| `.vibecheck` | 7 | 3.0 MB |
| `workflows` | 6 | 1.5 KB |
| `.audit` | 3 | 681.1 KB |

## Recommended Separation Order

1. Keep source folders active: `frontend`, `backend`, `modules`, `_SQL_INFRA`, Android wrapper, Tauri wrapper, CI, and documentation that explains current architecture.
2. Convert dependency caches such as `node_modules`, generated build outputs, caches, and logs into rebuild-only artifacts.
3. Move backups, historical reports, and old agent workspaces into a quarantine archive after confirming no runtime imports point into them.
4. Review `automation_tooling`, registries, and uncategorized files before moving because some may encode module metadata or business workflows.
5. Only after a successful clean checkout, install, build, and test should the quarantine folders be deleted or excluded from the main branch.

## Generated Manifest

The file `docs/codex-junk-quarantine-manifest.csv` lists every quarantine candidate with path, category, size, modified time, and reason. It is intentionally non-destructive.
