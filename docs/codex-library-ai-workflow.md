# EBDESIGN Library AI Workflow

Generated: 2026-09-12

## Purpose

The EBDESIGN Library is an active intelligence layer for the project. It gives AI systems fast, structured project knowledge before they answer, modify code, merge features, generate media, or recommend production changes.

## Library Data Available To AI

Every indexed file has:

- `library_id`: stable file identity
- `source_label`: EBDESIGN, local backups, worktrees, or Documents/GitHub
- `source_role`: current project, backup source, agent worktree, or GitHub source
- `absolute_path` and `relative_path`
- `basename`, `extension`, `file_type`
- `bytes`, `modified`
- `category`: UI, API, service, database, docs, tests, build output, dependency cache, etc.
- `feature_key`: ecommerce, dietitian nutrition, image/cartoon generation, dynamic pricing, voice farmer, mobile app, desktop app, and more
- `workflow_role`: API entrypoint, business logic, user surface, reusable UI, data model, verification, deployment, support artifact
- `hash_status` and `sha256` where bounded-size hashing is safe
- `review_required`
- `content_summary`
- `text_preview` for safe text files
- activity status through the active ledger: baseline, created, changed, deleted, moved/renamed candidate, Git working-tree status

## Fast Response Design

1. Use summary endpoints first for dashboards and chat context.
2. Use feature matrix endpoints to choose the right module group before searching files.
3. Use file search with small limits for interactive UI.
4. Use activity search only when the AI needs current file movement or edit risk.
5. Use full CSV/snapshot files only for offline batch jobs, audits, or merge preparation.
6. Never ask an LLM to read 650k files directly. Retrieval must filter by feature, category, workflow role, path, and activity state.

## Application AI

Application AI uses the Library during normal product operations:

- Find the right module, route, service, UI page, database asset, or test before acting.
- Explain project structure with cited source paths.
- Route user requests to the correct feature track.
- Prevent duplicate work by checking existing versions first.
- Warn when a requested change touches active, deleted, moved, or duplicate-name files.
- Give farmers, sellers, buyers, administrators, and operators answers using verified project/domain modules.

## Analytic AI

Analytic AI uses the Library for project intelligence:

- Count modules, feature tracks, duplicate filenames, review-required files, and active movement.
- Detect hotspots where many agents created versions of the same feature.
- Rank merge priorities by source coverage, file count, workflow role, and activity state.
- Identify performance risk, dependency bloat, build output leakage, missing tests, stale backup files, and orphan modules.
- Support cost optimisation by tracking AI feature usage points, expensive workflows, and duplication.

## Next-Gen Generative AI

Generative AI uses the Library only after retrieval:

- Image generation and cartoon generation use product records, feature paths, moderation rules, and cost controls from the Library.
- Dietitian, nutrition, natural therapy, and farmer advisory flows use domain modules and guardrails from the Library.
- Voice farmer workflows use local-language, low-literacy, and step-by-step UX context from indexed modules.
- Code generation uses retrieved file identities and activity state before proposing edits.
- UI generation uses existing components and routes before creating new ones.

## Agentic AI Workflow

Agents must follow this loop:

1. Retrieve feature context from the Library.
2. Check duplicate-name and duplicate-feature candidates.
3. Check active ledger status for files being touched.
4. Rename same-name/different-content variants before merge.
5. Create one production version from the strongest features.
6. Add or update tests.
7. Rebuild and smoke-test.
8. Regenerate the Library index.
9. Run the activity tracker.
10. Refresh `_ACTIVE_PROJECT/current`.

## Speed Rules

- Use cached summary JSON for page load.
- Stream large CSV and JSONL files; never load them fully in API routes.
- Cap API search responses.
- Keep dependency caches and generated build outputs indexed as metadata, not AI context.
- Send only relevant snippets to AI.
- Prefer deterministic classification before LLM reasoning.
- Use the active ledger to avoid rescanning all files during every chat request.

## Production Upgrade Path

For enterprise scale, store this Library in a database:

- PostgreSQL tables for file identity, source roots, features, workflow roles, duplicate groups, and activity events
- pgvector or another embedding index for semantic retrieval
- Redis/cache layer for dashboard counts and top feature tracks
- background workers for scan, hash, preview, embedding, and activity jobs
- immutable audit log for created, changed, moved, deleted, promoted, and archived files
