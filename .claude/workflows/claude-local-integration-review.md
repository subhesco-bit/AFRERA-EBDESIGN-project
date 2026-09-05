# Claude Local Integration Review

Use this workflow to bring legacy visual work into the Claude review loop and connect it to the existing AI backbone.

## Sequence

1. Export a non-destructive visual context packet:
   `powershell -ExecutionPolicy Bypass -File scripts/claude/Export-ClaudeVisualContext.ps1`
2. Run `visual-ui-converter` against `.ai/staging/claude-visual/manifest.json`.
3. Run `code-auditor` against changed files and the generated conversion review.
4. Run `architect-reviewer` against the conversion review, existing coordinator, route mounting, and data contracts.
5. Resolve only findings with a verified owner and validation command.
6. Run the narrow validation command for each changed slice, then the frontend/backend build and tests available in the relevant package.

## AI backbone boundary

Claude remains the current coordinator boundary. Provider-specific engines such as ChatGPT, DeepSeek, Grok, Copilot, or future providers must be adapters behind the existing coordinator/provider service, with explicit configuration, timeout, rate-limit, cost, safety, and audit behavior. UI artifacts must call the application API, not provider SDKs directly.

## Public information boundary

Public notices, subsidies, grants, government technologies, and research documents require a separate ingestion adapter with source URL, publisher, publication date, retrieval timestamp, content hash, extraction status, and review status. The filter layer may recommend records, but DPR, equipment, procurement, finance, and logistics workflows must consume verified records and retain provenance.

## Completion evidence

Do not report a component, page, route, provider, or ingestion source as complete without source evidence, an integration path, and an executable check. Keep generated packets under `.ai/staging/` and review conclusions under `.ai/reviews/`.