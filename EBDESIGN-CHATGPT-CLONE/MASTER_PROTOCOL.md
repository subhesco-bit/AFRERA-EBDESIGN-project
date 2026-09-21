# ChatGPT Clone Master Protocol

## 1. Scope
This protocol governs work performed in `EBDESIGN-CHATGPT-CLONE/`.

## 2. Preservation
The existing EBDESIGN application is preserved. Clone work must not delete or silently replace existing application assets.

## 3. Independent infrastructure
Docker, CI/CD and infrastructure-as-code are developed and validated independently in the clone.

## 4. Four-hour work-log cadence
During active work, `.ai/WORK_LOG.md` is refreshed at least every four hours with factual progress, validation, blockers and next actions.

## 5. Review gate
A reviewable increment is announced to Claude AI after validation. Claude AI reviews the increment before it is eligible for main-tree integration.

## 6. Merge gate
Only approved changes may move from clone to the main tree. Review evidence and validation results must accompany the change.

## 7. Token optimization default

All agents follow `TOKEN_OPTIMIZATION.md` and consult `registry/MEMOIZED.json` before repeating analysis or architectural decisions. PowerShell batch discovery, generators, caching and grouped verification are preferred when they preserve the required evidence gates. High-impact paths receive complete verification rather than sampling.

## 8. AI execution architecture

OpenAI is the governed execution and model layer for the entire project. Existing Claude-authored frameworks remain the supporting architecture and are extended in place. Implementations use the established gateways, registries, workflow contracts, evidence gates and resilience controls instead of creating parallel provider-specific systems.
