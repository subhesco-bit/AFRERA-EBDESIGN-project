# EBDESIGN Master Execution Plan

**Status:** Baseline and gap inventory in progress  
**Evidence rule:** Documentation, adapters, blueprints, scaffolds, and syntax checks do not count as implementation. A completed item needs a live code path, an exercised verification check, and recorded evidence.

## Evidence Status

- [x] Repository state frozen and baseline recorded
- [ ] All library folders, subfolders, files, owners, links, and orphan candidates indexed (audit rerun in progress)
- [x] `deepak%20final.md` reconciled against source, routes, schemas, and workflows
- [ ] Truthpack regenerated or its absence explicitly resolved
- [x] Frontend dependency and test baseline recorded
- [ ] Backend dependency and boot baseline recorded

## Execution Workstreams

### Dependency Migration

- [ ] Inventory direct and transitive breaking-major candidates from manifests and lockfiles
- [ ] Create compatibility matrix with current API usage, migration notes, and rollback point
- [ ] Migrate one dependency family at a time without force flags
- [ ] Run focused tests and builds after each family
- [ ] Confirm complete application remains green

### Shared Workflow Engine

- [x] Identify and preserve the existing stepper implementation and contracts
- [x] Implement shared validation, persistence, navigation, cancellation, errors, and completion state
- [ ] Remove mock-only completion paths
- [ ] Add authenticated API operation for every persisted step
- [ ] Add focused tests for forward, back, cancel, retry, validation, and completion behavior

### Workflow Completion

- [ ] Booking flow
- [ ] Policy flow
- [ ] Claim flow
- [ ] Logistics flow
- [ ] Loyalty flow
- [ ] Expand the matrix to every documented workflow after the first five

### Backend Traceability

- [ ] UI -> stepper -> API client -> authenticated route -> controller -> service -> business rule -> database -> response -> UI trace for each workflow
- [ ] Backend wireframe and API/controller/service/database map for every module
- [ ] Route mount and authentication verification
- [ ] Database schema/query compatibility verification
- [ ] Migration ordering, idempotence, and live database verification

### Platform Surfaces

- [ ] Determine whether native .NET MAUI is required by the product architecture
- [ ] If required, create a real solution, project, contracts, authentication, navigation, API layer, and initial workflows
- [ ] Rural-first SMS, IVR, voice, offline, and feature-phone architecture
- [ ] Multi-language implementation and locale coverage
- [ ] ERM and enterprise gaps: ERP, CRM, SCM, HR, Finance, Procurement, Governance, BI
- [ ] AI registry, RAG, memory, evaluation, and governance
- [ ] Security/GRC and data governance
- [ ] Payment, SMS, WhatsApp, GST, banking, IoT, and search integration verification
- [ ] Logistics, cold-chain, IoT, finance/DPR/subsidy, document/trust/traceability verification

### Quality and Operations

- [ ] Repair the two failing frontend test suites
- [ ] Complete frontend/backend test programme with evidence-based coverage
- [ ] Browser screenshots at desktop, tablet, and mobile breakpoints
- [ ] WCAG 2.2 AA keyboard, focus, forms, dialogs, semantics, touch-target, and error-state checks
- [ ] Responsive and mobile validation
- [ ] Reference-attachment comparison when actual attachments are available
- [ ] Performance engineering and bundle validation
- [ ] CI/CD, backup/DR, observability, and deployment validation
- [ ] Documentation, central tracker, dependency graph, and source-of-truth reconciliation

## Workflow Acceptance Matrix

| Workflow | UI | Stepper | API | Controller | Service | DB | Auth | Tests | Browser | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Booking | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Not verified |
| Policy | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Not verified |
| Claim | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Not verified |
| Logistics | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Not verified |
| Loyalty | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | Not verified |

## Definition Of Done

An item may be marked complete only when all applicable conditions are true:

1. The owning source files are identified and connected from an entry point or route.
2. The behavior uses real validation, persistence, authorization, and error handling.
3. No mock, placeholder, adapter-only, scaffold-only, or frontend-only completion path remains.
4. Database tables, columns, constraints, and migration order are verified against actual queries.
5. Automated checks exercise the behavior and pass in the current environment.
6. Browser or device evidence exists for user-facing behavior, including responsive and accessibility checks.
7. Documentation and the acceptance matrix link to the evidence and state blockers honestly.

## Known Baseline Blockers

- The expected `.vibecheck/truthpack/` directory is not present in the workspace and must not be silently invented.
- Project documentation says PostgreSQL, MongoDB, and Redis are not running; live database claims require infrastructure evidence.
- `deepak%20final.md` contains extracted requirements and prior analysis, not proof of implementation.
- Reference attachments are not currently available in the shared browser context.