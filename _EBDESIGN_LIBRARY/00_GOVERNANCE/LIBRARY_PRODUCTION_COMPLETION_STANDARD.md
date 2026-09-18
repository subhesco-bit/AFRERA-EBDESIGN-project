# EBDESIGN LIBRARY — PRODUCTION COMPLETION STANDARD

## Purpose

The library is completed **before feature expansion**. It is the intelligence, identity, dependency, relationship and readiness layer for the existing project. It does not replace the physical codebase.

## Non-negotiable preservation rules

1. Existing source files remain authoritative for execution.
2. Existing library records are preserved.
3. No deletion, relocation or silent overwrite of existing artifacts.
4. Every discovered project artifact must be classifiable as known, mapped, generated, unresolved or quarantined.
5. Every generated library artifact must itself be registered.
6. Physical path, identity and provenance must remain recoverable.
7. Ambiguous artifacts are not guessed; they are marked UNKNOWN/UNRESOLVED.

## Completion hierarchy

### Component

A component is production-ready only when its purpose, inputs, outputs, dependencies, validation, error states, security expectations and tests are known.

### Module

A module record must identify its business purpose and relationships to data, services, APIs/routes, UI, workflows, permissions, tests and dependent modules. Presence of files alone is not completion.

### System

A system is complete only when its participating modules form an end-to-end business capability and the required cross-module contracts, failure paths and observability are known.

### Product

The project is product-complete only when user journeys can operate end-to-end across domains without undocumented manual wiring.

## Required library coverage

The reconciliation process must cover, where present:

- module cards
- service cards
- component cards
- API/route records
- UI/page records
- database/schema/migration records
- dependency records
- relationship records
- workflow records
- test records
- security/authentication/authorization records
- AI capability records
- data/provenance records
- lifecycle/recovery records
- unresolved/gap records
- audit records

## Production readiness states

Use explicit states rather than a single completion percentage:

- DISCOVERED
- CATALOGUED
- MAPPED
- STRUCTURALLY_PRESENT
- PARTIAL
- INTEGRATION_GAP
- PRODUCTION_HARDENING
- VERIFIED
- PRODUCTION_READY
- BLOCKED
- UNKNOWN
- QUARANTINED

## Required reconciliation outputs

`tools/library-production-readiness.js` generates an additive inventory under `99_AUDIT/` containing:

- physical module inventory
- library inventory context
- service/route/frontend/migration counts
- structural module capability matrix
- missing structural capabilities
- production gate definitions

This report is evidence for subsequent hardening work; it must not be interpreted as a claim that a module is production-ready merely because its directory exists.

## Development rule after library completion

Only after the library has reconciled the existing project should implementation proceed in this order:

**preserve → classify → reconcile → identify gap → production-harden existing capability → wire → test → verify → enhance → innovate.**

New features must attach to existing identities, domains, data contracts and workflows instead of creating parallel systems.
