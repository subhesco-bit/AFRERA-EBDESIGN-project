# AFRERA Unified Project Conversion

Generated: 2026-09-12

## Goal

Convert the scattered working outputs from Codex, Copilot, Claude, Devin, Visual Studio, ChatGPT, local backups, worktrees, and generated caches into one canonical AFRERA project that can be hardened, enhanced, tested, and published.

## Canonical Source

The canonical working source is:

`_ACTIVE_PROJECT/current`

This folder is generated from the full repository map and keeps active source, platform code, backend routes/services/modules, frontend pages/components, Android shell files, Tauri shell files, infrastructure, useful docs, and selected tools. It excludes dependency caches, local editor folders, agent cache folders, generated builds, backups, blobs, and old copied folders.

## Current Consolidation Result

- Full enterprise Library index: 512,239 active records
- Useful consolidated source: 9,396 files
- Consolidated source size: 294.2 MB
- Quarantine candidates: 379,127 files
- Review-required support files: 34,466 files

## Unified Rules

1. All future work should target the root project and be regenerated into `_ACTIVE_PROJECT/current`.
2. Agent-specific folders such as `.claude`, `.ai`, `.cursor`, Visual Studio cache folders, local worktrees, and backup folders are not canonical source.
3. Useful agent output must be promoted into normal project folders: `frontend`, `backend`, `modules`, `database`, `infra`, `docs`, `tools`, `.github`.
4. No feature is production-ready just because a page exists. A feature needs route alignment, auth/rate limit boundary, data model, test path, UI path, and observability.
5. Future AI features must be provider-abstracted: prompt-only fallback first, provider-backed generation second, audit/cost tracking always.
6. Duplicate filenames must never be merged by name alone. Same-name files are only duplicates when their content hash matches.
7. Same-name/different-content files must be renamed into `_MERGE_LAB/features/<feature>/<source>__<sha12>__<original-name>` before evaluation.
8. The final project keeps one integrated production module per feature; temporary copied versions are deleted or archived only after tests prove the merged result.

## Duplicate Merge Evidence

- Merge candidates scanned: 62,293 files
- Same-name/different-content conflict files: 45,852
- Conflict filename groups: 2,408
- Feature tracks found: 7,985
- Merge matrix: `docs/codex-feature-merge-matrix.md`
- Rename plan: `docs/codex-duplicate-rename-plan.csv`

## Enhancement Status Added In This Pass

- North East India Variety Directory extracted into 142 ecommerce product records.
- Marketplace now has a North East Varieties tab using those products.
- Marketplace AI workflow panel shows image creator prompt, cartoon prompt, dietitian/nutrition guardrail, and dynamic pricing tiers for each variety.
- Product media AI backend now exposes a cartoon route.
- Product media AI backend now has `/api/v1/ai/product-media-ai` compatibility.
- Nutrition intelligence backend now has `/api/v1/nutrition-intelligence` compatibility.
- Frontend API now has provider status, image, cartoon, nutrient video, wellness, diet profile, recipe, product nutrition, nutrition score, and value-per-nutrient methods.
- EBDESIGN Library is now operational through a real backend route layer, not a placeholder.
- Library Operations server starts the library independently at `http://127.0.0.1:3100` for immediate browse/search/verify/AI-context use.
- Library indexer was hardened for large files using bounded text previews and streamed content hashing.

## Library Operational Status

- Operational route mounts: `/api/library`, `/api/library-knowledge`, `/api/v1/library`
- Live operational server: `node tools/codex-library-ops-server.js`
- Frontend Library route: `/library`
- Enterprise Library roots: `EBDESIGN`, `EBDESIGN.local-backups`, `EBDESIGN.worktrees`, `Documents/GitHub`
- Active Library records: 512,239 files with stable IDs, source labels, type, size, hash status, workflow role, feature key, summary, and bounded text preview
- Latest lifecycle ledger run: 154,293 events recorded across changed, entered, and left-system file states
- Library AI workspace routes: `/api/library-ai-workspace`, `/api/ai/library-workspace`, `/api/v1/ai/library-workspace`
- Library AI workspace supports provider-neutral context packets for ChatGPT, Claude, Copilot, Devin, and local coding agents
- Operational smoke report: `docs/codex-library-operational-smoke-report.md`

## Remaining Future Compatibility Work

- Move source control to a clean `codex/unified-project` branch with only canonical files.
- Physically quarantine old agent/cache/backup folders after clean install/build/test from `_ACTIVE_PROJECT/current`.
- Add provider-backed OpenAI image/cartoon generation only after secrets, storage, moderation, and queue handling are configured.
- Replace static nutrition calculator food examples with verified product nutrition data.
- Replace dynamic pricing placeholders with `market_price_history`, public-data extraction, GI status, seasonality, stock, logistics, and demand signals.
- Add Playwright flows for marketplace, AI Product Studio, Nutrition Calculator, Diet Recipes, Public Data Extractor, Dynamic Pricing, Farm Costing, mobile shell, and desktop shell.
