# Artificial Scientist workflow

The canonical Artificial Scientist is a governed research workflow mounted under `/api/v1/artificial-scientist`. It records what was proposed, how an experiment must be reproduced, what was run, which artifacts were produced, who reviewed each decision, and every lifecycle transition. It does not represent AI text as experimental evidence or claim that a physical experiment ran.

## Lifecycle

- Hypothesis: `draft -> approved | rejected`, then `approved -> retired`.
- Protocol: `draft -> approved | superseded`, then `approved -> superseded`.
- Experiment: `draft -> approved | cancelled`, `approved -> running | cancelled`, then `running -> completed | failed | cancelled`.
- Run: `queued -> running | cancelled`, then `running -> succeeded | failed | cancelled`.

The service checks these transitions and migration `10003_artificial_scientist.sql` repeats the checks in PostgreSQL so scripts cannot bypass them. Approval of an experiment requires an approved, versioned protocol. Successful runs require a structured result summary; failed runs require a reason.

## Reproducibility contract

Every experiment and run supplies a code revision, runtime identifier, SHA-256 environment digest, integer random seed, and one or more dataset URIs with SHA-256 identities. Protocol content is versioned and checksummed. Run creation uses an idempotency key plus a request hash, preventing a retry from silently changing inputs.

Artifacts are immutable evidence references or inline records with verified SHA-256 checksums. Audit events are append-only. Reviews retain the reviewer, decision, comments, checklist, and timestamp.

## Access and endpoints

Authenticated `researcher`, `research_lead`, `admin`, and `super_admin` roles may read research records. Research authors can create hypotheses, experiments, runs, artifacts, and governed AI requests. Approval and formal review routes require `research_lead`, `admin`, or `super_admin`.

The route supports hypothesis creation/review, experiment and protocol review, run creation/transitions, artifact registration, record retrieval with audit/review history, and Artificial Scientist AI assistance. Existing R&D project routes remain compatible; the duplicate platform R&D service delegates to the live legacy R&D service rather than maintaining another in-memory copy.

## AI boundary

Artificial Scientist calls `aiGatewayService.run` with module `artificial-scientist` and a restricted capability. The gateway applies library context, provider governance, provenance, and safety metadata. Every returned success or provider failure is persisted as a checksummed `ai_output` artifact and remains subject to human review. The AI Backbone continues to own provider execution and is not merged into the research domain.
