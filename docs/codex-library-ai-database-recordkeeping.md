# Library AI Database And Recordkeeping

Generated: 2026-09-12

## Critical Rule

No AI action should be invisible. Every Library-assisted AI workflow must record the file context used, model call, generated output, safety decision, cost event, and evaluation result.

## Production Tables

Migration: `backend/src/database/migrations/055_library_ai_recordkeeping_schema.sql`

- `library_file_sources`: source roots such as EBDESIGN, local backups, worktrees, and Documents/GitHub
- `library_file_records`: one current identity record per indexed file
- `library_file_activity_events`: immutable ledger for created, changed, deleted, and moved/renamed candidate files
- `library_ai_workflow_runs`: one run per AI task, search, merge, generation, analysis, or enhancement workflow
- `library_ai_retrieval_context`: exact file records and snippets sent into AI context
- `library_ai_model_calls`: provider, model, token counts, latency, prompt hashes, and status
- `library_ai_generated_outputs`: generated text, code, image, cartoon, recommendation, report, or workflow output provenance
- `library_ai_safety_decisions`: moderation, medical/nutrition guardrail, farmer advisory guardrail, privacy, and policy decisions
- `library_ai_cost_events`: estimated and billable usage for the cost optimisation layer
- `library_ai_eval_results`: quality, safety, regression, factuality, performance, and integration test outcomes

## File Record Format

```json
{
  "library_id": "EBDLIB-4D429B3409A27D94",
  "source_label": "EBDESIGN",
  "source_role": "current-primary-project",
  "absolute_path": "C:/Users/DIYA GOEL/Downloads/EBDESIGN/backend/src/routes/libraryRoutes.js",
  "relative_path": "backend/src/routes/libraryRoutes.js",
  "basename": "libraryRoutes.js",
  "file_type": "backend-route",
  "bytes": 12345,
  "modified_at": "2026-09-12T09:00:00.000Z",
  "category": "backend_route",
  "feature_key": "library-knowledge",
  "workflow_role": "api-entrypoint",
  "hash_status": "hashed",
  "sha256": "content hash when bounded",
  "review_required": true,
  "content_summary": "type=backend-route; category=backend_route; feature=library-knowledge; workflow=api-entrypoint",
  "activity_status": "git_changed"
}
```

## AI Workflow Run Format

```json
{
  "workflow_type": "agentic-merge",
  "feature_key": "dynamic-pricing",
  "objective": "Merge best dynamic-pricing variants into one production module",
  "status": "completed",
  "input_summary": "User requested unified production enhancement",
  "output_summary": "Merged route, service, UI, tests, and Library records",
  "latency_ms": 18420
}
```

## Retrieval Context Format

```json
{
  "run_id": "workflow UUID",
  "library_id": "EBDLIB-4D429B3409A27D94",
  "rank": 1,
  "relevance_score": 0.9821,
  "retrieval_query": "dynamic pricing farmer cost optimisation",
  "source_label": "EBDESIGN",
  "relative_path": "backend/src/services/dynamicPricingService.js",
  "feature_key": "dynamic-pricing",
  "workflow_role": "business-logic",
  "citation_text": "Path and content summary used by AI",
  "content_excerpt": "Small bounded excerpt only"
}
```

## Speed Architecture

- Dashboard loads from summary JSON or cached database aggregates.
- Interactive search uses indexed columns and capped response sizes.
- AI prompt context uses top-ranked retrieval rows, not raw folders.
- Full CSV and JSONL are streamed only by batch jobs.
- Activity ledger prevents expensive full rescans during every AI response.
- Prompt hashes and output hashes avoid storing sensitive full prompts where not required.
- Cost records support the cost optimisation layer and prevent uncontrolled AI usage.

## Audit Requirements

Every AI workflow must answer:

- Which files were used?
- Which file versions were active?
- Which model was called?
- What did it cost?
- What safety checks were applied?
- What output was generated?
- Which tests or evaluations passed?
- Which files changed afterward?

## Database Upgrade Path

The current filesystem Library is operational for local development. Production should sync these records into PostgreSQL, then add semantic retrieval with embeddings and cached aggregates for fast Application AI, Analytic AI, and Generative AI response times.
