# EBDESIGN — Production Re-Audit Standard

## Purpose

This standard applies to the existing application in `chatgpt-clone/foundation` before any advanced ChatGPT enhancement is introduced. Existing business logic is preserved; remediation is preferred over replacement.

## Completion model

A file is production-ready only when its applicable controls have been reviewed and the evidence is recorded. A page is production-ready only when UI, state, API/service integration, authorization, failure recovery and business workflow have been reviewed.

### File controls

- Correct responsibility and module ownership
- Input/output validation at trust boundaries
- Authentication and authorization where applicable
- Safe secrets/configuration handling
- Explicit error handling and safe error responses
- Transaction, idempotency and concurrency controls where applicable
- Database constraints and query safety where applicable
- External-service timeout/retry/circuit-breaker behaviour where applicable
- Structured logging and auditability
- Metrics/health/observability where applicable
- Performance and resource bounds
- Test coverage for critical behaviour
- No unresolved TODO/FIXME/HACK markers in production paths
- No accidental secret literals
- Dependency/configuration compatibility

### Page controls

- Correct route and module ownership
- Real API/service wiring
- Authentication/authorization
- Loading, empty, error and retry states
- Form validation and safe submission behaviour
- Duplicate-submit protection where applicable
- Responsive layout
- Keyboard/accessibility semantics
- User-safe error messages
- Optimistic updates only where rollback is defined
- Pagination/filter/search behaviour where applicable
- Analytics/audit events where appropriate
- Performance and cancellation of obsolete requests

## Integration controls

The minimum verified chain is:

`Page → Component/State → API → Route → Controller → Service → Database/External Service → Business Rule → Audit/Observability`

Cross-system dependencies must identify ownership and failure behaviour. Shared capabilities must be reused instead of duplicated.

## AI enhancement gate

Advanced AI work begins only after the baseline audit has produced an explicit finding set. AI additions must have:

- clear business purpose
- deterministic fallback for critical workflows
- provenance for retrieved/generated information
- permission-aware context retrieval
- human approval for consequential actions where required
- prompt/input/output validation
- model timeout and retry controls
- cost/rate controls
- audit trail
- protection against prompt injection and data leakage
- evaluation tests and regression checks

AI must enhance the existing product rather than silently replacing business rules.

## Re-audit cycle

`discover → classify → inspect → remediate → test → re-audit → approve → next file/page`

The repository-wide scanner in `tools/re-audit-production.js` creates an initial evidence set. Automated findings are not themselves proof of failure or success; each finding is reviewed against the file's actual responsibility.
