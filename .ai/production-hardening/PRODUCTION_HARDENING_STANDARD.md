# EBDESIGN Clone — Production Hardening Standard

## Scope

This standard applies to every existing backend source file, frontend source file, page, module page, component, route, controller, service and database-facing source file in the clone.

## Engineering rule

**Preserve → understand → harden → integrate → validate.**

Existing business logic is not replaced by generic placeholders. A file is not considered production-hardened merely because it exists, compiles, or contains a nominal error handler.

## Backend acceptance layers

1. Authentication and authorization are explicit.
2. Input validation is performed at the trust boundary.
3. Business rules are enforced in services/domain logic, not only in UI code.
4. Database writes have transaction, consistency and idempotency behaviour where required.
5. Errors are classified, logged safely and mapped to stable API responses.
6. Sensitive data and secrets are never emitted to logs or source.
7. External integrations have timeouts, retries, backoff and failure handling where appropriate.
8. APIs have predictable status codes and response contracts.
9. Audit-sensitive operations produce an attributable audit trail.
10. Tests cover success, validation failure, authorization failure and dependency failure.

## Frontend/page acceptance layers

1. Route access is protected according to the actual business role.
2. Loading, empty, error and recovery states are explicit.
3. Forms validate before submission and display actionable errors.
4. API failures do not leave stale or contradictory state.
5. Mutating actions protect against duplicate submission where necessary.
6. Accessibility semantics and keyboard interaction are preserved.
7. Responsive behaviour is verified for supported breakpoints.
8. User-visible data is traceable to the correct API/domain operation.
9. Destructive or irreversible actions require appropriate confirmation.
10. Telemetry must not leak sensitive user information.

## Integration acceptance

A production page is considered wired only when its complete path is verified:

`page → component/state → API → route → controller → service → database/integration → business rule → audit/observability`

Cross-module workflows must identify their upstream and downstream dependencies and failure behaviour.

## Batch execution

Work is processed in small, reviewable batches. Each batch must record:

- files/pages changed
- reason for change
- tests executed
- integration checks executed
- unresolved findings
- rollback/recovery considerations

A batch must never be marked complete solely because a script ran successfully.

## AI enhancement gate

Advanced ChatGPT/AI features are applied **after** the production-hardening baseline. AI may assist with retrieval, recommendation, classification, prediction, generation, optimisation and workflow automation, but it must not bypass authorization, validation, audit controls or domain safety requirements.
