# Token Optimization Operating Standard

This standard applies to ChatGPT, Claude and other agents working through the clone protocol. It reduces repeated analysis while preserving evidence quality.

The project-wide default is OpenAI execution through the existing Claude-authored supporting frameworks. Provider calls pass through established gateways and reuse registry, cache and decision evidence before generating new analysis.

## Default execution pattern

1. Read `registry/MEMOIZED.json` before repeating an architectural decision.
2. Use compact PowerShell batches for discovery, status, audits and verification.
3. Prefer existing generators, registries, caches and plugin operations over reproducing large content in conversation.
4. Read only relevant file sections after an initial search identifies exact paths and lines.
5. Summarize repetitive logs by unique failure signature, count and affected files.
6. Use the OpenAI Batch API only for asynchronous, noninteractive workloads whose latency and data-governance requirements allow it.
7. Reuse cached context only when its source revision and invalidation conditions still match.
8. Record durable decisions with evidence, scope, owner and invalidation conditions.
9. Use stratified verification only for low-risk repetitive populations. Verify critical security, identity, finance, insurance, migration and data-integrity paths completely.

## Measurement rules

Token reduction, cost discounts and confidence levels are measured results, not automatic properties. Every optimization report records the baseline, sample frame, method, exclusions and observed result. A 10 percent sample cannot claim 99 percent confidence without a defined population, random or stratified selection method, acceptable error bound and supporting calculation.

## Non-negotiable evidence

Optimization cannot skip the clone’s source, runtime, persistence, authorization, contract, journey, test or telemetry gates. Sampling may locate defects efficiently; it cannot certify high-impact paths that were not tested.
