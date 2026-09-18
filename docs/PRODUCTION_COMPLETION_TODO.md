# EBDESIGN production completion backlog

This is the controlling engineering backlog for the reconstruction. User mandates are requirements, while completion decisions are based on executable evidence. A capability is complete only when its canonical implementation, persistence, security, lifecycle, audit/provenance, user or operator workflow, failure behavior, and acceptance tests all pass.

Whole-project boundaries, source authority, national sell/buy flows, AI/ERP integration, and duplicate policy are reconciled in `PROJECT_CONCEPT_RECONCILIATION_20260915.md`. Use that map before adding another domain implementation.

## P0 — release integrity

- [x] Establish one canonical authentication service and retire parallel implementations.
- [x] Establish one canonical geofencing service and retain compatibility delegates.
- [x] Establish the governed AI provider gateway and connect the AI chat client.
- [x] Establish exact double-entry accounting with period locks, reversals, idempotency, reports, and immutable audit.
- [x] Establish effective-date GST rules and filing/payment lifecycles.
- [x] Route GST liability postings through the canonical accounting lifecycle.
- [ ] Execute migrations against a production-equivalent PostgreSQL instance and retain the migration transcript.
- [ ] Remove the repository production-audit blockers: 390 broken imports and 1,623 placeholder files reported at the current baseline.
- [ ] Run full repository unit, integration, security, accessibility, performance, and browser acceptance gates.

## P0 — AI platform separation and trust

- [x] Define seven governance classes and domain-specific autonomy/evidence bindings for food, health guidance, weather, MEP engineering, pricing, ERP, science, robotics, and quantum.
- [ ] Enforce these bindings at each mutation and generated advisory endpoint, with calibrated signal evidence and named authority where ACT is permitted.

- [x] Keep AI Backbone isolated behind a versioned gateway contract.
- [x] Prevent ERP modules and clients from receiving provider credentials.
- [x] Enforce authentication, role checks for administration, rate limits, provider allow-listing, bounded timeouts, and sanitized failures.
- [x] Attach library grounding and provenance to generated responses.
- [x] Add durable AI request/run storage with tenant, actor, model, prompt-template version, token usage, latency, policy decision, provenance, and outcome.
- [ ] Add prompt-injection and data-exfiltration guardrails with adversarial acceptance tests.
- [ ] Add model evaluation suites, quality thresholds, drift monitoring, budget controls, and provider failover policy.
- [ ] Fund the configured OpenAI project and pass a live generation smoke test; the current account returns `credit_balance_exhausted`.

## P1 — advanced intelligence domains

- [ ] Frontier-model registry: capability negotiation, model lifecycle, modality constraints, residency policy, fallback policy, and evaluation-based promotion.
- [ ] Agentic AI: durable plans, bounded tools, checkpoints, approval policies, compensation, replay, and cross-module acceptance scenarios.
- [x] Artificial Scientist foundation: hypotheses, protocols, experiment runs, checksummed artifacts, reproducibility, formal review, operator UI, and governed AI assistance.
- [x] Quantum + AI control plane: validated optimization jobs, classical baseline, provider-neutral quantum adapter contract, constraints, feasibility verification, provenance, and honest provider availability.
- [x] Robotics and humanoid control plane: device registry, missions, safety interlocks, telemetry, simulator adapter, two-person approval, emergency stop, audit, operator UI, and AI-assisted planning.
- [ ] Generative AI: governed text, image, document, and structured generation with persistence, safety policy, cost tracking, and versioned outputs.

## P1 — ERP-wide integration

- [ ] Inventory every ERP module and assign an accountable canonical service, schema, API, UI, and AI capability contract.
- [ ] Replace generic `analyze*AI` endpoints with domain schemas, grounded inputs, measurable outputs, and human/action gates.
- [ ] Connect procurement, inventory, sales, production, quality, maintenance, HR/payroll, projects, treasury, assets, and BI through balanced accounting events.
- [ ] Add tenant/company authorization and segregation-of-duties checks to every financial mutation.
- [ ] Add outbox/inbox events, retries, reconciliation, and dead-letter operations for cross-module workflows.
- [ ] Add period-end workflows for receivables, payables, bank reconciliation, inventory valuation, depreciation, payroll, GST reconciliation, close, consolidation, and audit export.

## P1 — rural value-chain and industry engines

- [ ] Launch the premium marketplace across all 28 states and 8 union territories: North East farmers and producers must reach buyers throughout India, while suppliers from every state can onboard. Model verified district coverage, languages, institutions, local foods, seasonality, transport corridors, schemes, and assisted channels per jurisdiction; never infer individual religion from geography.
- [x] Add a national coverage registry that separates all-India market scope from locally verified services and gives the North East early validation priority.
- [x] Extend the seller state dimension nationally and secure the e-commerce listing origin against the seller's account-linked address; wire browse, origin selection, seller listing, edit and soft-delete on the shared marketplace page.
- [ ] Complete the reverse marketplace for farmers and verified family members: household products, machinery, seeds, fertilizers, pipes, drip systems, pumps and repair/second-life options with supplier-funded discounts, subsidy separation, stock, delivery, finance, tax, accounting and claims/returns.
- [ ] Connect national product discovery, buyer delivery addresses, cross-state fulfillment feasibility, GST place-of-supply, payment, claims, returns, and farmer earnings in one verified order journey.
- [ ] Complete MasterChef recipe lifecycle: verified ingredients, substitution, yield, nutrient and cost calculation, batch/serving basis, local availability, seasonal menus, allergens, culturally respectful preferences, occasion bundles, and marketplace publication.
- [ ] Complete dietitian, natural therapy, NutriTest, supportive veterinary, poultry and fish guidance with evidence, uncertainty, escalation to licensed clinicians/veterinarians, and no autonomous diagnosis, prescribing or treatment.
- [ ] Complete AI engineer for MEP with source standards, site loads, versioned design calculations, coordinated drawings/BOM/cost, safety constraints, and licensed-engineer approval before construction.
- [ ] Complete AI agriculturist/scientist and weather advisories with source time/location, observation-vs-grid provenance, forecast verification against outturn, thresholds, alerts, and action ownership.
- [ ] Implement shared API/UI contracts across responsive web, Capacitor Android/mobile, Tauri desktop, PWA and basic-phone IVR/SMS; verify the same account, permissions, state and workflow on each surface.
- [ ] Finish institutional village commerce lifecycle; current profile/demand scoring foundation lacks RFQ, quotations, milestones, quality, escrow, fulfillment and operator UI.
- [ ] Finish shared-capacity lifecycle; current reservation/ranking foundation lacks slot conflict detection, expiry/waitlist promotion, cancellation policy, multimodal carrier integration and operator UI.
- [ ] Finish rural insurance lifecycle; current quote/FNOL foundation lacks secured routes, issuance, endorsements, premium accounting, claim stages, settlement, grievance and operator UI.

- [ ] Create a shared knowledge-flow contract: source authority, effective date, geography, season, language, consent, confidence, decision owner, operational action, financial effect, and measured outcome.
- [ ] Apply cost optimization to procurement, production, storage, processing, packaging, finance, insurance, marketing, fulfillment, returns, shared assets, energy, and labour without sacrificing safety or statutory constraints.
- [ ] Build contextual recommendation and merchandising using season, location, regional availability, lead time, shelf life, dietary needs, religion/culture, taste, budget, inventory, and fulfillment feasibility.
- [ ] Build special-occasion bundles, checkout add-ons, upgrades, ancillary products, and transparent value explanations using airline and travel-industry merchandising patterns.
- [ ] Build capacity reservation, wait-list, cancellation, rescheduling, service-class, and yield-management primitives for cold chain, logistics, machinery, processing units, laboratories, and shared infrastructure.
- [ ] Build multimodal fulfillment selection across local delivery, courier, road, rail, air, pooled freight, cold chain, pickup, and assisted village delivery using cost, time, risk, capacity, perishability, and service quality.
- [ ] Build market-data ingestion from authorized APIs/feeds with source terms, timestamps, anomaly detection, normalization, regional basis adjustment, and dynamic-price explainability. Do not scrape or republish data without permission.
- [ ] Build banking and treasury workflows: customer accounts, KYC, payments, escrow, receivables, reconciliation, cash forecasting, credit controls, lender integrations, and audit.
- [ ] Build lending workflows: eligibility, consented cash-flow underwriting, pre-season booking/finance, limits, disbursement, repayment schedules, delinquency, restructuring, collateral/guarantee, subsidy linkage, and fair-lending controls.
- [ ] Build corporate-grade insurance ERP for farmer delivery: product configuration, quotations, underwriting, policy issuance, endorsements, premium accounting, reinsurance, claims/FNOL, evidence, survey, fraud controls, settlement, grievance, and regulatory reporting.
- [ ] Build marketing and advertising workflows: audience consent, localized campaigns, offers, attribution, experimentation, budget/cost controls, and marketplace fairness.
- [ ] Build village freelancer commerce for artisans, craftspeople, tailors, service workers, FPOs, Panchayats, institutional buyers, and CSR sponsors with capabilities, quotations, samples, production milestones, quality, escrow, logistics, and dispute resolution.
- [ ] Build second-life equipment workflows linking donation/CSR, resale, inspection/grading, parts, refurbishment, repair networks, warranty, finance, logistics, commissioning, and lifecycle impact.

## P2 — operational readiness

- [ ] Define SLOs, structured observability, alerting, tracing, dashboards, backup/restore drills, disaster recovery, and runbooks.
- [ ] Add deployment environments, secret rotation, database rollback strategy, signed artifacts, dependency scanning, and release approvals.
- [ ] Validate accessibility, localization, privacy, retention, statutory records, and India-specific compliance with named owners and review dates.
- [ ] Produce role-based training, operator manuals, support workflows, and production acceptance sign-off.

## Completion evidence required for every unchecked item

1. Canonical source and duplicate/delegate disposition recorded in the library transaction ledger.
2. Database migration and rollback/compatibility analysis.
3. Authenticated, authorized, validated API and non-generic user workflow.
4. Immutable audit/provenance with tenant and actor identity.
5. Unit, integration, negative-security, and end-to-end acceptance tests.
6. Operational documentation, monitoring, and an explicit unavailable/degraded state.
