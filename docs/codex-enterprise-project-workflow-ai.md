# AFRERA Enterprise Project Library Workflow

Generated: 2026-09-12T13:24:05.114Z

## Operational Principle

All project-bearing folders are now represented in the EBDESIGN Library as an active catalogue. Every file row records a stable `library_id`, name, source, path, size, file type, category, workflow role, feature key, content summary, safe preview text where available, and content hash for bounded-size files. Files are not blindly copied, because the machine has limited free disk and duplicate copying would increase risk.

## Indexed Sources

- EBDESIGN: 330728 files, role current-primary-project, path `C:\Users\DIYA GOEL\Downloads\EBDESIGN`
- EBDESIGN.local-backups: 6905 files, role local-backup-source, path `C:\Users\DIYA GOEL\Downloads\EBDESIGN.local-backups`
- EBDESIGN.worktrees: 163300 files, role agent-worktree-source, path `C:\Users\DIYA GOEL\Downloads\EBDESIGN.worktrees`
- Documents/GitHub: 11306 files, role github-documents-source, path `C:\Users\DIYA GOEL\Documents\GitHub`

## Industry-Standard Workflow

1. Ingest every project source into the virtual library index.
2. Classify files into UI, API, service, database, tests, infra, docs, agent workspace, backups, dependency caches, and build outputs.
3. Detect duplicate filenames by source and content hash. Same name is not treated as same purpose.
4. Promote useful candidates into `_MERGE_LAB/features/<feature>/` with renamed safe identities.
5. Ask Application AI to retrieve library context before every feature enhancement.
6. Use agentic AI to compare variants, generate a merge plan, implement one final production module, and write tests.
7. Use generative AI only through governed routes with cost tracking, moderation, provenance, and fallback behavior.
8. Validate web, API, mobile shell, desktop shell, database migration, CI, and security before marking a feature production-ready.
9. Run `node tools/codex-library-activity-track.js` after indexing, agent work, merges, cleanup, and deployments so created, changed, deleted, and moved-or-renamed candidate files are recorded in the Library ledger.

## Totals

- Files indexed: 512239
- Bytes represented: 16910627116
- Files hashed: 127629
- Large-file hashes deferred: 674
- Review-required files: 128303
- Duplicate basename groups: 33864

## Top Categories

| Category | Files |
| --- | ---: |
| dependency_cache | 359686 |
| automation_or_source | 25998 |
| source_control_metadata | 22995 |
| backup_or_archive | 17565 |
| backend_module | 16354 |
| data_or_registry | 10328 |
| test | 10004 |
| agent_workspace | 7951 |
| documentation | 6900 |
| database | 6807 |
| backend_service | 6318 |
| frontend_page | 5715 |
| backend_route | 4554 |
| uncategorized | 4316 |
| frontend_component | 3551 |
| build_output | 1226 |
| mobile_android | 1160 |
| infra_workflow | 356 |
| desktop_tauri | 204 |
| frontend_api_client | 183 |

## Top Feature Tracks

| Feature | Files | Sources | Recommended Action |
| --- | ---: | ---: | --- |
| ecommerce-marketplace | 81232 | 4 | evaluate-merge-enhance-test |
| workflow-ci-cd | 28220 | 4 | evaluate-merge-enhance-test |
| database-platform | 14777 | 4 | evaluate-merge-enhance-test |
| backend-runtime | 6890 | 4 | evaluate-merge-enhance-test |
| ai-chat-copilot | 5613 | 4 | evaluate-merge-enhance-test |
| mobile-app | 3648 | 4 | evaluate-merge-enhance-test |
| security-auth | 3196 | 4 | evaluate-merge-enhance-test |
| automation_or_source-index | 1722 | 4 | evaluate-merge-enhance-test |
| backend-index | 1593 | 4 | evaluate-merge-enhance-test |
| data_or_registry-module | 1458 | 4 | evaluate-merge-enhance-test |
| documentation-readme | 1423 | 4 | evaluate-merge-enhance-test |
| uncategorized-styles | 1350 | 4 | evaluate-merge-enhance-test |
| library-knowledge | 1326 | 4 | evaluate-merge-enhance-test |
| automation_or_source-misc | 1321 | 4 | evaluate-merge-enhance-test |
| backend-readme | 1297 | 4 | evaluate-merge-enhance-test |
| backend-module | 1296 | 4 | evaluate-merge-enhance-test |
| backend-model | 920 | 4 | evaluate-merge-enhance-test |
| dietitian-nutrition | 759 | 4 | evaluate-merge-enhance-test |
| voice-farmer | 636 | 4 | evaluate-merge-enhance-test |
| desktop-app | 604 | 4 | evaluate-merge-enhance-test |
| dynamic-pricing | 535 | 4 | evaluate-merge-enhance-test |
| agent_workspace-readme | 324 | 4 | evaluate-merge-enhance-test |
| agent_workspace-index | 315 | 4 | evaluate-merge-enhance-test |
| public-price-extraction | 295 | 4 | evaluate-merge-enhance-test |
| farm-costing | 268 | 4 | evaluate-merge-enhance-test |

## Application AI Support

The Library API should use this index as authoritative retrieval context for project questions, feature-gap detection, merge decisions, and workflow explanation. AI answers must cite source paths from the index rather than inventing project structure.

## Active File Ledger

The Library is an active project-system module. The file catalogue is the identity register, while `enterprise-file-activity-snapshot.jsonl` and `enterprise-file-activity-ledger.jsonl` track what happens over time. Any file entering the system, changing in place, leaving the system, or appearing as a moved/renamed candidate should be represented by a ledger event with its unique ID, name, type, size, source, workflow role, feature key, path, hash status, and content summary.

## Agentic AI Support

Agents should execute feature work through a controlled loop: retrieve context, compare duplicate variants, propose merge, implement, test, document, update library, and refresh active project.

## Next-Gen Generative AI Support

Generative features such as image creation, cartoon generation, dietitian flows, voice workflows, and dynamic pricing must be connected to this library context so outputs respect project modules, farmer usability, product data, domain policy, cost limits, and safety guardrails.
