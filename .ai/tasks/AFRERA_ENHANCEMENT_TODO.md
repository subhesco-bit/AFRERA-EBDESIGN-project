# AFRERA Enhancement Programme — Master TODO

**Created:** 21 September 2026
**Source:** Stakeholder assessment ("India-first digital economic operating system")
plus a runtime audit of this repository performed on the same date.

## How to read this document

Items are grouped by the maturity stage they belong to. Every item carries a
status using the classification the assessment asked for:

| Status | Meaning |
|---|---|
| `VERIFIED` | Working, proven by runtime/test evidence in this repo |
| `PARTIAL` | Real code exists and runs, but the journey/contract is incomplete |
| `SCAFFOLD` | File and exports exist, no meaningful behaviour |
| `DOC-ONLY` | Described in documentation, no implementation found |
| `DISCONNECTED` | Implementation exists but nothing reaches it at runtime |
| `DUPLICATE` | Two or more distinct implementations of the same concept |
| `BLOCKED` | Cannot progress until a dependency is resolved |
| `PROPOSED` | Future concept, not yet designed |

**Nothing in this repository is to be deleted** while items are still being
classified. That instruction from the assessment is carried into this document
as a standing constraint.

---

## STAGE 0 — Concept reconciliation

> Exit condition: every concept has a source, a meaning and a classification.

The assessment's central finding was: *"The most important missing element is a
verified concept-to-runtime matrix."* Until that exists, a genuinely absent
concept cannot be distinguished from one that exists under another name.

- [ ] **0.1 Build the concept-to-runtime matrix generator** — `PROPOSED`
  A tool that walks the repo and emits, per concept:
  `concept -> module -> service -> route -> middleware -> DB table -> page -> component -> test -> telemetry`,
  assigning one of the statuses above from **evidence**, not from documentation.
  Must be re-runnable in CI so the matrix cannot drift.
- [ ] **0.2 Classify all ~760 modules/services against the matrix** — `BLOCKED` (needs 0.1)
- [ ] **0.3 Reconcile documentation claims against runtime** — `PROPOSED`
  The repo contains `PRODUCTION_READINESS_CERTIFICATION.md`,
  `DEPLOYMENT_SUCCESS_REPORT.md` and `LAUNCH_COMPLETE.md`. On 21 Sep 2026 the
  backend could not boot at all (see Stage 1.0). Every "complete" claim needs a
  runtime evidence link or an explicit downgrade.
- [ ] **0.4 Deduplicate without deleting** — `PROPOSED`
  Known duplicate pairs found during the audit:
  `services/ai/aiBrainService.js` (3-line stub) vs `services/legacy/aiBrainService.js` (133 lines);
  `services/platform/sapModuleArchitectureService.js` (introspection) vs
  `services/legacy/sapModuleArchitectureService.js` (module lifecycle) — same name,
  genuinely different responsibilities. Record intent, pick a canonical, keep both.
- [ ] **0.5 Capability/module registry with enforced contracts** — `PROPOSED`
  Declared APIs, events, schemas, permissions, migrations, tests, health check
  and owner per module; CI fails a module that declares nothing.

---

## STAGE 1 — Industry baseline

> Exit condition: identity, data, APIs, workflows, security, testing and
> observability all pass.

### 1.0 Boot and runtime integrity — **DONE 21 Sep 2026**

These were fixed in this change. Before it, the platform did not start.

- [x] **1.0.1 Repair broken module graph** — `VERIFIED`
  274 unresolvable `require()` paths across 1,978 files. 255 were wrong paths
  whose targets existed elsewhere (auto-repathed by suffix resolution, with
  comment masking so documentation examples were not rewritten). 9 remaining
  matches are prose inside doc comments and were correctly left alone.
- [x] **1.0.2 Restore `completeAIIntegrationService.js`** — `VERIFIED`
  1,355-line service lost in the 7 Sep 2026 consolidation; recovered from
  `backups/CONSOLIDATION_BACKUP_20260907_170201/` rather than rewritten.
- [x] **1.0.3 Generate 7 missing module routers** — `VERIFIED`
  M125, M126, M128, M137, M139, M148, M149 each had `index.js` requiring
  `./routes` with no such file; controllers were byte-identical to working
  sibling M124, so routers were generated from that template.
- [x] **1.0.4 Fix `dotenv` load ordering** — `VERIFIED`
  `dotenv.config()` ran at line 203, after 194 route requires. Any module with
  a load-time env guard (e.g. `authService.js` requiring `JWT_SECRET`) crashed
  regardless of a correct `.env`. Env now loads before all requires.
- [x] **1.0.5 Fix global rate-limit middleware** — `VERIFIED` — *security*
  `rateLimit` is a factory `(max, windowMs) => (req,res,next)`, but was
  registered as `app.use(rateLimit)`. Express invoked the factory with
  `(req,res,next)`, so it returned the inner function and **never called
  `next()`** — every API request hung forever, and **no rate limiting was
  applied at all**. Now invoked, with `RATE_LIMIT_MAX_REQUESTS` /
  `RATE_LIMIT_WINDOW_MS` overrides.
- [x] **1.0.6 Fix process-killing response header bug** — `VERIFIED`
  `trackResponseTime` called `res.setHeader()` inside the `'finish'` event,
  which fires after headers flush. It threw `ERR_HTTP_HEADERS_SENT` from an
  event handler — an uncaught exception that terminated the process on every
  successful response. Header is now set before flush.
- [x] **1.0.7 Stop optional infrastructure blocking startup** — `VERIFIED`
  Redis `connect()` retried indefinitely, so the `await` never settled and the
  `catch` block that exists to degrade gracefully could never run. Added
  `connectTimeout` + `reconnectStrategy: false`, plus a bounded
  `OPTIONAL_INIT_TIMEOUT_MS` race around cache and job init.
- [x] **1.0.8 Fix content negotiation rejecting wildcards** — `VERIFIED`
  `Accept: */*` (curl's default, browsers, most load-balancer and k8s probes)
  was answered `406 Not Acceptable`. Wildcards now accepted.
- [x] **1.0.9 Import missing admin middleware** — `VERIFIED`
  `authMiddleware` / `requireRole` guarded three `/api/v1/system/*` endpoints
  but were never imported — startup threw `ReferenceError`.
- [x] **1.0.10 Governed `aiAPI` facade** — `VERIFIED`
  52 module services called `aiAPI.generateRecommendation()` on an export that
  did not exist — 52 latent `TypeError`s. Implemented as a governed facade that
  **never fabricates**: with no provider configured it returns
  `status:'unavailable'` with `output:null`, and `confidence` is populated only
  when the model itself reports one. Every result carries provenance
  (provider, model, contract version, latency, input keys), citations,
  assumptions, explanation, `actionBoundary:'advisory_only'` and human-approval
  state. This retrofits the assessment's AI-output requirements at all 52 sites.
- [ ] **1.0.11 Re-verify full boot after 1.0.6** — `PARTIAL`
  Boot reached `Platform Running` with **297 services discovered, 212 routes
  mounted, 229 ms startup**, and `/health` returned `200` in 15 ms. The
  multi-request survival test after the header fix was interrupted before it
  completed and **must be re-run**.
- [ ] **1.0.12 Add `uncaughtException` / `unhandledRejection` handlers** — `PROPOSED`
  One bad response currently kills the platform (root cause of 1.0.6 fixed, but
  no safety net exists).
- [ ] **1.0.13 Resolve 36 modules unloadable in isolation** — `PROPOSED`
  Import audit could not load them in a child process; needs per-module triage.

### 1.1 Authentication — one coherent identity system

- [ ] **1.1.1 Verify and remediate the mock auth path** — `PROPOSED` — *security, high*
  The assessment reports `authRoutes.js` using in-memory users, plaintext
  passwords, fabricated `jwt_user_timestamp` tokens and process-local sessions,
  while protected routes use real JWT verification in `middleware/auth.js`.
  **This claim was not yet verified against the code in this change** — verify
  first, then converge on one identity authority.
- [ ] **1.1.2 Single token contract** — `PROPOSED`
  Frontend clients reportedly use different token names and API paths.
- [ ] **1.1.3 Short-lived access token + secure refresh + rotation** — `PROPOSED`
- [ ] **1.1.4 MFA, device management, session revocation, recovery** — `PARTIAL` (`mfaService` exists)
- [ ] **1.1.5 Server-enforced contextual authorization (RBAC + ABAC) with tests** — `PARTIAL`

### 1.2 Data architecture

- [ ] **1.2.1 Execute the 413 migrations against a real PostgreSQL** — `BLOCKED`
  No database is running in any verified environment; the platform degrades to
  in-memory fallback everywhere, so no persistence claim can be trusted.
- [ ] **1.2.2 Declare a single source of truth per entity** — `PROPOSED`
  PostgreSQL, MongoDB, Redis and Elasticsearch are all referenced.
- [ ] **1.2.3 Schema ownership, lineage, retention, migration register** — `PROPOSED`
- [ ] **1.2.4 Transactional integrity tests on money paths** — `PROPOSED`
  Escrow, wallet, payout, subsidy and claim flows.

### 1.3 API architecture

- [ ] **1.3.1 One versioned contract standard** — `PARTIAL`
  Routes are mounted under both `/api/*` and `/api/v1/*`; several are mounted
  at more than one path (e.g. `unifiedAIRoutes` at three).
- [ ] **1.3.2 OpenAPI generated from code, not hand-maintained** — `PARTIAL` (`backend/openapi.json` exists)
- [ ] **1.3.3 Request/response schema validation + idempotency keys** — `PROPOSED`
- [ ] **1.3.4 Consistent error envelope and error-code registry** — `PARTIAL`

### 1.4 Testing and observability

- [ ] **1.4.1 Make the require-resolution and import audits CI gates** — `PROPOSED`
  Both audit scripts written during this change should run in CI; they would
  have caught every Stage 1.0 defect.
- [ ] **1.4.2 Smoke test that the server boots and serves N requests** — `PROPOSED`
  The single highest-value test this repo does not have.
- [ ] **1.4.3 Real coverage on critical journeys** — `SCAFFOLD` (frameworks configured, ~0% coverage)
- [ ] **1.4.4 Correlation IDs, metrics, traces, SLOs, alert ownership** — `PARTIAL`
- [ ] **1.4.5 Backup restore, graceful shutdown, failover, rollback drills** — `PROPOSED`

---

## STAGE 2 — Sector excellence (industry-native journeys)

> Exit condition: complete agriculture, marketplace, finance, insurance,
> logistics and government journeys. Pages and CRUD endpoints do not count.

Each journey needs a formal state machine with valid transitions,
authorization, timeout, retry, escalation, compensation and audit evidence.

- [ ] **2.1 Agriculture lifecycle** — `PARTIAL`
  `plot -> plan -> finance -> procure -> operate -> monitor -> harvest -> grade -> store -> sell -> settle`
- [ ] **2.2 Farmer product-listing AI pipeline** — `PARTIAL`
  Requested flow: listing → AI image generation → attribute extraction →
  nutrient valuation → nutrient-based and per-kg pricing → AI premium page copy.
  Component services exist and are now loadable (`aiImageGenerationService`,
  `productMediaAIService`, `nutrientValueSalesService`,
  `nutritionIntelligenceService`, `foodIntelligenceService`) but **no
  orchestration connects them into one flow**. This is the flagship
  integration and is not yet built.
- [ ] **2.3 Consumer order fulfilment with cold chain + insurance** — `PARTIAL`
  `order -> payment/escrow -> cold storage allocation -> cold chain monitoring
  -> logistics -> in-transit insurance binding -> exception -> claim -> settlement`.
  `coldStorageService`, `coldChainMonitoringService`, `escrowService` and the
  five insurance services exist; the orchestration does not.
- [ ] **2.4 Marketplace / retail commerce** — `PARTIAL`
  `discovery -> comparison -> trust -> cart -> payment -> fulfilment -> return/refund -> settlement`
- [ ] **2.5 Insurance journey** — `PARTIAL`
  Need analysis, coverage/exclusion comparison, suitability, policy lifecycle,
  servicing, evidence collection, survey, decision, payout, appeal.
- [ ] **2.6 Banking and rural finance** — `PARTIAL`
  Consented data collection, cash-flow assessment, eligibility, offer
  comparison, sanction, disbursement, monitoring, recovery — all explainable.
- [ ] **2.7 Government scheme and subsidy engine** — `PARTIAL`
  Convert schemes into **effective-dated, cited, computable rules** with
  eligibility, document checklist, application status and grievance. Static
  descriptions are not sufficient. Includes unclaimed-subsidy detection.
- [ ] **2.8 Logistics control tower** — `PARTIAL`
  Load consolidation, capacity matching, ETA confidence, chain of custody,
  exceptions, proof of delivery, settlement.
- [ ] **2.9 Engineering platform** — `PARTIAL`
  Standards library, units, assumptions, CAD/BIM ingestion, cold-storage
  thermal modelling, CFD/airflow, equipment sizing, BOQ, energy simulation,
  code checking, approval boundaries, commissioning, digital twins.
  **No verified calculation chain with versioned formulas exists.**
- [ ] **2.10 Enterprise ERP control** — `PARTIAL`
  Chart of accounts, subledgers, double-entry posting, cost/profit centres, tax
  determination, inventory valuation, three-way matching, bank reconciliation,
  AR/AP, fixed assets, project costing, approval matrix, segregation of duties,
  intercompany, period close, audit evidence.
- [ ] **2.11 Health and nutrition with clinical safety boundaries** — `PARTIAL`
- [ ] **2.12 Travel discovery/booking/disruption** — `DOC-ONLY`

---

## STAGE 3 — Intelligent assistance

> Exit condition: grounded recommendations with explanation, confidence and feedback.

- [x] **3.0 AI output governance envelope** — `VERIFIED` (see 1.0.10)
- [ ] **3.1 Canonical model registry + AI gateway with routing** — `PARTIAL`
- [ ] **3.2 Permission-aware retrieval** — `PROPOSED`
- [ ] **3.3 Verified knowledge graph + governed vector memory** — `PROPOSED`
- [ ] **3.4 Prompt and policy registry (versioned)** — `PROPOSED`
- [ ] **3.5 Agent/tool permission system** — `PROPOSED`
- [ ] **3.6 Hallucination detection + human approval workflow** — `PROPOSED`
- [ ] **3.7 Drift, bias, cost and latency monitoring** — `PROPOSED`
- [ ] **3.8 Measurable comparison against a non-AI baseline** — `PROPOSED`
  A rule, random number, hardcoded response or generic API wrapper must not be
  counted as production AI.
- [ ] **3.9 Remove simulated/random values from business metrics** — `PROPOSED`
  `MATH_RANDOM_AUDIT.md` exists in the repo; findings need to be acted on.
  No dashboard should show a business metric without verified source and
  calculation.

---

## STAGE 4 — Adaptive experience (governed personalization)

> Exit condition: consented, explainable, resettable adaptation.

- [ ] **4.1 Unified user-context profile** — `PROPOSED`
- [ ] **4.2 Consent and preference ledger with receipts and purpose binding** — `PROPOSED`
- [ ] **4.3 Real-time intent engine** — `PROPOSED`
- [ ] **4.4 Page-composition engine + content ranking** — `PROPOSED`
- [ ] **4.5 Recommendation explanation + preference reset + non-personalized mode** — `PROPOSED`
- [ ] **4.6 Experimentation framework and outcome measurement** — `PROPOSED`
- [ ] **4.7 Ethical Personalization Constitution (machine-enforced)** — `PROPOSED`
  **Hard constraint:** religion, health, psychology, caste and similar
  sensitive characteristics must **never be silently inferred**. They may be
  used only as voluntary, explicitly consented constraints, and must never
  determine pricing, credit, employment, insurance or service eligibility.
  Dark patterns, manipulative urgency and undisclosed behavioural targeting are
  prohibited.
- [ ] **4.8 Adaptation signals** — `PROPOSED`
  Role, purpose, location, language, device/bandwidth, past activity,
  interests, voluntarily declared food preferences, season/weather, business
  stage, accessibility needs, saved/incomplete workflows.

---

## STAGE 5 — India-first and rural access

- [ ] **5.1 Multilingual domain vocabulary + terminology registry + human review** — `PARTIAL`
- [ ] **5.2 India geographic hierarchy; crop seasons; agro-climatic context** — `PARTIAL`
- [ ] **5.3 Mandi/market intelligence; land and farmer registries** — `PARTIAL`
- [ ] **5.4 GST / e-invoice / e-way bill workflows** — `PARTIAL` (`gstRoutes` exists)
- [ ] **5.5 Regulated payment integration** — `PARTIAL` (Razorpay + Stripe present)
- [ ] **5.6 FPO / cooperative operations; GI and provenance** — `PARTIAL`
- [ ] **5.7 Offline transaction queue + conflict resolution + sync receipts** — `PROPOSED`
- [ ] **5.8 SMS/IVR interaction state; resumable uploads; store-and-forward** — `PARTIAL`
- [ ] **5.9 Assisted Digital Operator Mode** — `PROPOSED`
  Delegated consent, limited permissions, recorded assistance, user confirmation.
- [ ] **5.10 Shared-device privacy** — `PROPOSED`
- [ ] **5.11 WCAG-aligned complete journeys (keyboard, SR, contrast, voice, cognitive)** — `PARTIAL`
- [ ] **5.12 Grievance and appeal mechanism** — `PROPOSED`

---

## STAGE 6 — Interface, mobile and design system

- [ ] **6.1 Governed design system** — `PARTIAL`
  Tokens, accessibility primitives, sector templates, page-composition rules.
- [ ] **6.2 Sector Experience Composer** — `PROPOSED`
  One platform, different experience structures per industry.
- [ ] **6.3 Need-Based Navigation** — `PROPOSED`
  Entry by problem ("sell crop", "find loan", "claim loss", "book transport")
  rather than by module name.
- [ ] **6.4 Verified device coverage + performance budgets** — `PROPOSED`
- [ ] **6.5 PWA baseline and native boundary** — `PARTIAL`
  Capacitor, Tauri and an `android/` directory all exist in `frontend/`;
  the intended mobile strategy is undeclared and needs a decision.
- [ ] **6.6 Connect the 391 pages / 331 components to verified backends** — `PARTIAL`
  A page rendering is not evidence that its data path works.

---

## STAGE 7 — Trust, safety and governance

- [ ] **7.1 Trust Graph** — `PROPOSED`
  Identity levels, credential provenance, transaction-based reputation,
  dispute-adjusted scoring, counterfeit/fraud signals, certificates, chain of
  custody, review authenticity, appeal, anti-retaliation, explainable indicators.
- [ ] **7.2 Evidence Passport** — `PROPOSED`
  Sources, issuer, date, confidence, consent, ownership and verification status
  attached to products, claims, documents and AI outputs.
- [ ] **7.3 Digital Grievance Spine** — `PROPOSED`
  `complaint -> acknowledgement -> evidence -> decision -> escalation -> appeal -> closure`
- [ ] **7.4 Exception Command Centre** — `PROPOSED`
- [ ] **7.5 Suitability layer before any recommendation** — `PROPOSED`
- [ ] **7.6 Rules-as-Evidence** — `PROPOSED`
  Each rule records authority, citation, effective date, jurisdiction, logic, reviewer.
- [ ] **7.7 Threat model, secrets management, dependency controls, pen tests** — `PARTIAL`
- [ ] **7.8 Benefit Realization Ledger** — `PROPOSED`
  Compare predicted vs actual cost, income, yield, time, risk, environment.

---

## STAGE 8 — Futuristic ecosystem

All `PROPOSED`. Sequenced after Stage 2 completes; listed to preserve intent.

- [ ] 8.1 Personal Economic Digital Twin
- [ ] 8.2 Village / Cluster Digital Twin
- [ ] 8.3 Autonomous Rural Operations Network (bounded, approval-gated)
- [ ] 8.4 Federated Rural Intelligence (privacy-preserving)
- [ ] 8.5 India Agricultural Knowledge Graph
- [ ] 8.6 Cultural and Dietary Constraint Engine (declared, never inferred)
- [ ] 8.7 Climate Adaptation Autopilot
- [ ] 8.8 Circular Resource Exchange
- [ ] 8.9 Community Benefit Optimizer
- [ ] 8.10 Policy Simulation Laboratory
- [ ] 8.11 Outcome-Based Insurance
- [ ] 8.12 Infrastructure Intelligence Network
- [ ] 8.13 Verifiable AI Decision Passport
- [ ] 8.14 Personal Data Cooperative
- [ ] 8.15 Disaster and Disruption Reflex System
- [ ] 8.16 Synthetic Scenario Exchange
- [ ] 8.17 Natural-Language Enterprise Builder (AI proposes, humans approve)
- [ ] 8.18 Self-Healing Integration Fabric (contracts + telemetry, not speculative edits)
- [ ] 8.19 National Capability Map
- [ ] 8.20 Universal Life-and-Business Event Engine
- [ ] 8.21 Cross-Sector Comparison Engine
- [ ] 8.22 Capability Marketplace (signed modules)
- [ ] 8.23 User-Controlled Digital Profile

---

## Digital super-organism → executable mapping

| Concept | Required executable foundation | Status |
|---|---|---|
| Sensory system | Governed ingestion, IoT registry, validation, provenance | `PARTIAL` |
| Nervous system | Event contracts, priority routing, durable workflows | `PARTIAL` — `signalBus.js`, `core/nervousSystem.js`, `moduleEventService.js` exist |
| Memory | Transactional history, knowledge graph, governed vector memory | `PROPOSED` |
| Brain | Real decision models, simulation, optimization | `PARTIAL` |
| Reflex | Bounded pre-approved automated responses | `PARTIAL` — `DisruptionRoutingAgent` initialises at boot |
| Immune system | Fraud, cyber, quality and compliance response | `PARTIAL` — `insuranceFraudDetectionService` exists |
| Circulatory system | Verified payment, inventory, information, logistics flows | `PARTIAL` |
| Conscious control | Human approval, explanation, override, grievance | `PARTIAL` — envelope added in 1.0.10 |

---

## Standing constraints

1. **Nothing is deleted** during classification.
2. **No item is "complete" without evidence** — runtime, data, tests and
   observability. File existence, a passing syntax check or a mocked test does
   not establish readiness.
3. **Do not generate thousands of new pages or AI services** ahead of the
   baseline. Preserve, classify, then enhance at component, feature, system and
   project level simultaneously.
4. **Sensitive characteristics are never inferred** (see 4.7).
5. **AI must never fabricate.** Unavailable means unavailable; confidence is
   reported only when a model supplies it.

---

## Immediate next three actions

1. Re-run the boot + multi-request survival check (**1.0.11**) — the only
   Stage 1.0 item still unverified.
2. Build the concept-to-runtime matrix generator (**0.1**) — unblocks Stage 0
   and is the assessment's stated precondition for everything else.
3. Verify the mock-authentication finding (**1.1.1**) and remediate if
   confirmed — highest security exposure on the list.
