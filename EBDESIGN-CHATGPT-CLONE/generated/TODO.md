# AFRERA Evidence Based Completion Backlog

Generated from 27 canonical capabilities and 169 inventoried repository files.

A candidate file is discovery evidence only. Completion requires verified evidence for every gate.

## Stage 0

### CAP-001 Canonical concept to runtime registry

- Status: partially_working
- Priority: critical
- Owner: architecture
- Outcome: Every concept is traceable from source through runtime, tests and telemetry.
- Next action: Run the clone audit and adjudicate every ambiguous match.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md, frontend/src/App.jsx
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-002 Module contract and lifecycle governance

- Status: partially_working
- Priority: critical
- Owner: architecture
- Outcome: Every module declares ownership, dependencies, contracts, migrations, health and lifecycle.
- Next action: Populate canonical module records from repository evidence.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

## Stage 1

### CAP-003 Unified identity and session authority

- Status: partially_working
- Priority: critical
- Owner: identity-security
- Outcome: One identity contract serves login, refresh, MFA, recovery, revocation and protected APIs.
- Next action: Reconcile all auth implementations and prove one end-to-end token contract.
- Candidate evidence: .ai/SESSION_COMPLETION_SUMMARY_SEPTEMBER_3.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-004 Contextual authorization

- Status: partially_working
- Priority: critical
- Owner: identity-security
- Outcome: Server-enforced role and policy decisions protect every consequential action.
- Next action: Create endpoint authorization inventory and negative tests.
- Candidate evidence: .ai/FINAL_PHASE_SUMMARY_AND_LAUNCH_AUTHORIZATION.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-005 Canonical data ownership and lineage

- Status: partially_working
- Priority: critical
- Owner: data-architecture
- Outcome: Every entity and metric has one source of truth, owner, retention rule and lineage.
- Next action: Execute migrations in a disposable database and reconcile schema ownership.
- Candidate evidence: database/README.md, database/registry/DATABASE_ARCHITECTURE_REGISTRY.json, database/registry/DATABASE_FOUNDATION_CHECKPOINT.txt
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-006 Versioned API contract standard

- Status: partially_working
- Priority: high
- Owner: platform-api
- Outcome: APIs use consistent validation, errors, idempotency and versioning.
- Next action: Generate route catalogue and measure conformance.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-007 Durable workflow orchestration

- Status: partially_working
- Priority: critical
- Owner: workflow-platform
- Outcome: Consequential journeys enforce transitions, approvals, timers, retry, compensation and audit evidence.
- Next action: Implement the professional workflow contracts in workflow-catalog.json.
- Candidate evidence: workflows/bug-fix.md, workflows/full-audit.md, workflows/new-feature.md, workflows/pre-commit.md, workflows/pre-deploy.md, workflows/release-prep.md, .ai/INTEGRATION_REPAIR_WORKFLOW.md, .ai/VERIFICATION_WORKFLOW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-008 Unified ERP control system

- Status: partially_working
- Priority: critical
- Owner: enterprise-finance
- Outcome: Operational transactions post auditable accounting, tax, inventory and reconciliation consequences.
- Next action: Trace order-to-cash and procure-to-pay through ledger evidence.
- Candidate evidence: database/README.md, database/registry/DATABASE_ARCHITECTURE_REGISTRY.json, database/registry/DATABASE_FOUNDATION_CHECKPOINT.txt
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

## Stage 2

### CAP-009 Agriculture lifecycle journey

- Status: partially_working
- Priority: critical
- Owner: agriculture-product
- Outcome: Plot to settlement operates as one seasonal, evidence-backed journey.
- Next action: Prove plot-plan-finance-procure-operate-monitor-harvest-grade-store-sell-settle.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-010 Marketplace commerce journey

- Status: partially_working
- Priority: critical
- Owner: commerce-product
- Outcome: Discovery through seller settlement is transactional, trustworthy and reversible.
- Next action: Prove comparison, checkout, payment, fulfilment, return, refund and settlement.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-011 Insurance protection journey

- Status: partially_working
- Priority: high
- Owner: insurance-product
- Outcome: Need analysis through claim appeal is suitable, explainable and auditable.
- Next action: Implement exclusions comparison, servicing, evidence, survey, payout and appeal states.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-012 Rural finance and lending journey

- Status: partially_working
- Priority: high
- Owner: financial-services
- Outcome: Eligibility through repayment and recovery uses consented, explainable underwriting.
- Next action: Prove cash-flow assessment, sanction, disbursement, monitoring and dignified recovery.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-013 Suitability and comparison layer

- Status: proposed_future
- Priority: high
- Owner: consumer-protection
- Outcome: Offers are ranked by user-controlled criteria with exclusions, affordability and reasons.
- Next action: Define sector-neutral comparison contract and regulated-sector adapters.
- Candidate evidence: .ai/6REPO_COMPARISON_MATRIX.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-014 Logistics control tower

- Status: partially_working
- Priority: high
- Owner: logistics-operations
- Outcome: Load planning through settlement includes custody, ETA confidence and exception recovery.
- Next action: Prove capacity match, tracking, cold-chain exception, delivery and settlement.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-015 Evidence Passport

- Status: proposed_future
- Priority: critical
- Owner: trust-governance
- Outcome: Important objects and decisions carry provenance, issuer, consent and verification status.
- Next action: Define immutable evidence envelope and verification lifecycle.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-016 Digital grievance spine

- Status: proposed_future
- Priority: critical
- Owner: consumer-protection
- Outcome: Complaints and appeals share acknowledgement, evidence, SLA, escalation and closure rules.
- Next action: Implement cross-domain grievance state machine and regulator handoff adapters.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-017 Government scheme rules engine

- Status: partially_working
- Priority: high
- Owner: government-integrations
- Outcome: Effective-dated cited rules compute eligibility, evidence, application and appeal.
- Next action: Convert priority schemes from content into executable versioned rules.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-018 Rural assisted and offline access

- Status: partially_working
- Priority: critical
- Owner: rural-experience
- Outcome: Low-bandwidth, offline, voice, SMS, IVR and assisted journeys preserve consent and auditability.
- Next action: Prove queue, conflicts, resumable transfer, shared-device privacy and recovery.
- Candidate evidence: frontend/src/App.jsx, frontend/src/index.css, frontend/src/main.jsx
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-019 Engineering intelligence chain

- Status: partially_working
- Priority: high
- Owner: engineering-platform
- Outcome: Calculations expose standards, assumptions, units, formula versions and professional approvals.
- Next action: Trace one cold-storage project from inputs through design, BOQ, checking and commissioning.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

## Stage 3

### CAP-020 Governed adaptive experience

- Status: proposed_future
- Priority: high
- Owner: experience-platform
- Outcome: Consented context adapts navigation and content without discriminatory inference or manipulation.
- Next action: Implement consent ledger, context profile, composer, explanations, reset and non-personalized mode.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-021 Governed AI nervous system

- Status: partially_working
- Priority: critical
- Owner: ai-governance
- Outcome: AI routing, retrieval, agents and memory are permission-aware, evaluated and human-governed.
- Next action: Inventory models, prompts, tools and fabricated outputs; require decision passports.
- Candidate evidence: .ai/100_PERCENT_INTEGRATION_CONFIRMED.md, .ai/100_PERCENT_INTEGRATION_VERIFICATION.sh, .ai/20_PHASE_EXECUTION_PLAN.md, .ai/6REPO_COMPARISON_MATRIX.md, .ai/ACTUAL_IMPLEMENTATION_VERIFICATION.md, .ai/AGENT_PROTOCOL.md, .ai/ALL_PHASES_READY_FINAL_SUMMARY_2026-09-18.md, .ai/AUTOMATED_GAP_CLOSURE_GENERATOR.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-022 Trusted analytics and benefit ledger

- Status: partially_working
- Priority: critical
- Owner: data-analytics
- Outcome: Metrics and recommendations connect verified source data to actual measured outcomes.
- Next action: Remove random business metrics and establish event, formula, freshness and reconciliation evidence.
- Candidate evidence: .ai/INTEGRATION_LEDGER.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-023 Trust graph

- Status: proposed_future
- Priority: high
- Owner: trust-governance
- Outcome: Reputation derives from verified identity, credentials, transactions, custody and corrected disputes.
- Next action: Define explainable, appealable trust factors and anti-retaliation controls.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-027 Ethical personalization constitution

- Status: proposed_future
- Priority: critical
- Owner: responsible-technology
- Outcome: Machine-enforced rules separate assistance from manipulation and prohibited discrimination.
- Next action: Codify prohibited inference, purpose limits, fairness tests and user controls.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

## Stage 4

### CAP-024 Personal economic digital twin

- Status: proposed_future
- Priority: medium
- Owner: decision-intelligence
- Outcome: Users can simulate farm, household and enterprise decisions before acting.
- Next action: Define scenario model only after baseline data and outcome validation are proven.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

### CAP-025 Village and cluster digital twin

- Status: partially_working
- Priority: medium
- Owner: regional-intelligence
- Outcome: Production, water, energy, storage, logistics and demand expose shared capacity gaps.
- Next action: Validate models, sources, uncertainty and planning decisions against one pilot cluster.
- Candidate evidence: modules/AUDIT_REPORT.md, modules/COMPREHENSIVE_FILE_AUDIT.md, modules/LIBRARY_REGISTRATION_SUMMARY.md, modules/MIGRATION_RESULTS.md, modules/MODULE_REGISTRY.json, modules/README.md, modules/SYSTEM_OVERVIEW.md
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

## Stage 5

### CAP-026 Bounded autonomous rural operations

- Status: proposed_future
- Priority: medium
- Owner: automation-governance
- Outcome: Pre-approved low-risk actions execute within explicit limits, oversight and reversal paths.
- Next action: Define autonomy tiers, approval thresholds, kill switch and compensation contracts.
- Candidate evidence: none found
- [ ] Source evidence verified
- [ ] Runtime reachability verified
- [ ] Persistence and transactional integrity verified
- [ ] Authorization verified
- [ ] API or event contract verified
- [ ] Complete journey and exceptions verified
- [ ] Automated test evidence verified
- [ ] Telemetry and outcome evidence verified

