# EBDESIGN Library — Complete Operating Workflow

## Purpose

The EBDESIGN Library is the control and knowledge layer for the existing product. It does not replace application source code and it does not create a parallel product. Its job is to maintain a complete, searchable, versioned understanding of the physical repository and its relationships.

## 1. File entry points

Files can enter through:

1. Existing repository discovery.
2. Developer-created or modified source files.
3. Frontend page/component creation.
4. Database/schema/migration changes.
5. Generated reports and system artifacts.
6. Controlled document/import workflows.
7. AI-generated artifacts, always marked as AI-generated until reviewed.

Every new artifact is reconciled before it is treated as library truth.

## 2. Ingestion lifecycle

```text
DISCOVERED
  -> IDENTIFIED
  -> HASHED
  -> CLASSIFIED
  -> METADATA EXTRACTED
  -> RELATIONSHIPS DISCOVERED
  -> INDEXED
  -> AI-ENRICHED
  -> REVIEWED WHEN REQUIRED
  -> ACTIVE
```

The normal operation is non-destructive. Existing files are not deleted or overwritten by indexing.

## 3. Identity and versioning

Every indexed file receives a stable Library Item ID derived from its path and content identity. The content SHA-256 is retained for integrity and change detection.

A modification creates a new observed content state; the library records the change instead of erasing historical knowledge.

Minimum lifecycle states:

- DISCOVERED
- ACTIVE
- MODIFIED
- SUPERSEDED
- ARCHIVED
- RESTORED
- DELETE_REQUESTED
- PURGED

Deletion is a controlled lifecycle operation, not a blind filesystem command. Before purge, the system checks dependencies, retention/hold requirements, ownership and recovery policy.

## 4. Arrangement hierarchy

```text
PRODUCT
  -> PLATFORM
    -> DOMAIN
      -> SYSTEM
        -> SUBSYSTEM
          -> MODULE
            -> COMPONENT
              -> FILE
```

A file may also participate in cross-cutting relationships such as API, database, security, workflow, AI and integration dependencies.

## 5. File classification

The library classifies, at minimum:

- source
- frontend page
- frontend component/style
- backend controller/service/route/model
- API specification
- database/migration
- test
- configuration
- documentation
- asset
- generated artifact
- backup/legacy artifact
- unknown/unclassified

Unknown does not mean ignored. Unknown artifacts remain visible and are placed into a review queue.

## 6. Page indexing

Frontend pages are first-class library artifacts. Each page should be linked where discoverable to:

- route
- module
- API
- service
- permissions
- data model
- workflow
- related components
- tests

A page that exists without discoverable backend/API relationships is not automatically marked broken; it is marked for reconciliation.

## 7. AI operating layer

AI operates on top of the library rather than replacing it.

### AI discovery

When a user asks for a capability, AI first searches the library for existing implementations, related modules, APIs, pages, services, schemas and documentation.

```text
USER INTENT
  -> LIBRARY SEARCH
  -> SEMANTIC MATCH
  -> STRUCTURAL MATCH
  -> DEPENDENCY GRAPH
  -> EXISTING CAPABILITY
  -> REUSE / ENHANCE / WIRE / NEW
```

### AI fast extraction

AI should build a compact retrieval context rather than loading the entire repository into a model context window.

```text
QUESTION
  -> INTENT
  -> ENTITY / MODULE IDENTIFICATION
  -> METADATA FILTER
  -> ACCESS CONTROL
  -> KEYWORD + SEMANTIC SEARCH
  -> DEPENDENCY EXPANSION
  -> CURRENT VERSION SELECTION
  -> RELEVANT EXCERPTS
  -> ANSWER / ACTION
```

This enables fast operation while reducing irrelevant context.

### AI impact analysis

For a proposed change, AI identifies:

- direct files affected
- modules affected
- pages affected
- API contracts affected
- database dependencies
- downstream consumers
- tests requiring updates
- security/privacy implications
- production risk

### AI duplicate and orphan analysis

AI may flag:

- exact duplicates
- near duplicates
- semantic duplicates
- obsolete versions
- orphan files
- conflicting specifications
- suspicious parallel implementations

AI recommends action; it does not silently delete production artifacts.

### AI summarisation

For every major library item, AI may generate and refresh:

- purpose
- business capability
- technical role
- dependencies
- consumers
- change summary
- risk summary
- relevant documentation references

These summaries remain derived metadata and must never silently replace authoritative source code or controlled domain records.

## 8. Security and access

Library retrieval must enforce the same access boundaries as the underlying artifact. A document being indexed does not make it readable by every user or AI agent.

Sensitive material must retain classification and access metadata.

## 9. Medical, biological and regulated knowledge

Where the product contains nutrition, medical, veterinary, biological, laboratory or similar domain information, the library distinguishes source material from AI-derived interpretation and reviewed/approved knowledge.

AI can accelerate extraction and comparison, but authoritative content requires the applicable professional or governance review.

## 10. Continuous reconciliation

The control plane periodically compares physical state with library state:

```text
FILESYSTEM
  <->
LIBRARY INDEX
  <->
DATABASE KNOWLEDGE
  <->
DEPENDENCY GRAPH
  <->
AI INDEX
```

The reconciliation report must expose additions, modifications, removals, unreadable files, duplicate identities, broken relationships and unclassified artifacts.

## 11. Production hardening flow

```text
LIBRARY COMPLETE
  -> FILE/PAGE RECONCILIATION
  -> PRIORITY QUEUE
  -> HARDEN
  -> TEST
  -> RE-INDEX
  -> IMPACT CHECK
  -> NEXT ITEM
```

The queue is evidence-driven. A five-item batch may be used for controlled implementation, but the library is indexed globally before batch selection.

## 12. Completion gates

### Library completeness

```text
all discoverable files
    =
indexed files + explicit scan exceptions
```

No unexplained file is allowed to disappear from the inventory.

### Product completeness

A module/page is not complete merely because files exist. Completion requires the applicable layers to be present and wired, including business logic, API/backend integration, validation, authorization, data handling, error states, testing and production controls.

## 13. AI performance principle

The library exists to make the software itself faster to operate and easier to evolve:

- retrieve only relevant context
- reuse existing capabilities
- avoid duplicate implementation
- detect impact before changes
- surface dependencies immediately
- find the correct current version
- identify gaps automatically
- produce concise operational context

The goal is **fast, correct retrieval and safe action**, not merely a larger catalogue.
