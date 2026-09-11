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
