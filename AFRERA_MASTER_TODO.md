# AFRERA Master TODO

**Source:** `AFRERA SHORT COMING AND FUTURE CONCEPT`  
**Branch:** `consolidated/final`  
**Architecture rule:** Multi-platform sectors operate under **one domain / one OS** — an India-first agro-economic operating system — not separate websites.

**Governing rules**
1. Nothing should be removed — only classify, map, connect, complete.
2. Do not scaffold. Done = real logic + endpoint + (ideally) test evidence.
3. Ecommerce ≠ Farmer; Insurance = corporate/ecosystem support, not retail underwriting.
4. Religion/caste/health/psychology: never silently inferred; voluntary consented constraints only; never for price/credit/employment/insurance eligibility discrimination.

---

## Stage 0 — Concept reconciliation (preserve + map)

- [x] Document assessment converted to this master TODO
- [x] Concept → runtime registry service (`conceptRuntimeRegistry.js`)
- [x] Multiplatform OS kernel — single domain, sector platforms (`osKernel.js`)
- [ ] Classify every Mxxx module: verified / partial / scaffolded / documented-only / disconnected / duplicated / conflicting / blocked / proposed
- [ ] Generate registry from code (scan modules + routes + services), not hand-only
- [ ] Reconcile claims in docs vs runtime health endpoints

---

## Stage 1 — Industry baseline (must pass before “next-gen AI”)

### 1.1 Single source of truth
- [x] Registry shape: concept → module → API → layer → status
- [ ] Auto-scan `modules/`, `backend/src/routes`, `backend/src/services` into registry
- [ ] Publish `GET /api/v1/os/registry` with classification counts

### 1.2 Authentication (one system)
- [x] Baseline TODO marks auth fixed on consolidated/final (bcrypt + real JWT)
- [ ] Verify login token accepted by all protected mounts in this branch
- [ ] Canonical token names: `accessToken` / `refreshToken` only in new clients
- [ ] MFA + device management (future baseline+)

### 1.3 State-driven workflows
- [x] Ecommerce O2C + checkout + RMA returns
- [x] Fulfillment saga (prior branch work)
- [ ] Payment / refund workflow (beyond simulated PG)
- [ ] Procurement / RFQ / tender state machines
- [ ] Contract lifecycle
- [ ] Cold-chain exception workflow
- [ ] Corporate insurance policy + claim desk (support platform done; insurer handoff rails)
- [ ] Loan disbursement / repayment
- [ ] Subsidy application (eligibility engine done; application FSM)
- [ ] DPR / engineering approval
- [ ] Grievance spine (cross-domain)
- [ ] Consent withdrawal
- [ ] Accounting reconciliation close

### 1.4 ERP as control system
- [x] Chart of accounts + double-entry spine (research-grade)
- [ ] Subledgers, cost centres, period close
- [ ] Tax determination + three-way match
- [ ] Bank reconciliation
- [ ] Inventory valuation linked to commerce commits
- [ ] Fixed assets + project costing
- [ ] SoD / approval matrix

### 1.5 Data & analytics integrity
- [ ] Canonical business events bus (typed contracts)
- [ ] Semantic metrics with source lineage
- [ ] Ban simulated/random metrics from dashboards
- [ ] Freshness + confidence on every KPI

### 1.6 Production verification
- [ ] Clean migration run (remaining 52 failures triage)
- [ ] Full Jest suite pass rate published
- [ ] E2E commerce checkout + return against live Postgres
- [ ] Backup restore drill

---

## Stage 2 — Sector excellence (native journeys under one OS)

Each sector = platform under **same domain**, different journey engine.

| Sector platform | Status | Next |
|-----------------|--------|------|
| **Farmer / Agro OS** | Layer + subsidy extract + disease/vet/nutrition AI | Full seasonal lifecycle FSM |
| **Ecommerce / Marketplace** | Checkout + RMA deep-fill | Trust graph, settlement |
| **Corporate Insurance** | Support platform (not retail sales) | Insurer/TPA rails |
| **Logistics** | Mode decision engine | Control tower + POD + exceptions |
| **Cold storage** | Bay allocate (enterprise 10x) | Temp exception workflow |
| **Finance / rural credit** | Spine + GST estimate | Underwriting + repayment FSM |
| **Engineering** | Structural/solar/MEP advisory | Standards library + approval |
| **Government schemes** | Computable subsidy rules | Application + grievance |
| **Health / nutrition** | Clinical protocols + safety floors | Full EMR-lite journey |
| **ERP enterprise** | Double-entry spine | Full control plane |

- [x] Explicit Ecommerce vs Farmer boundary
- [x] Insurance = corporate/ecosystem support model
- [ ] Sector Experience Composer (shared primitives, sector journey templates)
- [ ] Need-based navigation (“Sell crop”, “Claim loss”, “Book transport”)

---

## Stage 3 — Intelligent assistance (governed AI)

- [x] AI Backbone evidence gateway (provenance, policy version, confidence)
- [ ] Canonical model registry
- [ ] Permission-aware retrieval + knowledge graph
- [ ] Hallucination / drift monitoring
- [ ] Human-approval gates for consequential actions
- [ ] Outcome feedback → Benefit Realization Ledger
- [ ] Safe fallback when AI unavailable
- [ ] Every AI output: evidence passport fields

---

## Stage 4 — System intelligence

- [ ] Universal Life-and-Business Event Engine
- [ ] Exception Command Centre
- [ ] Trust Graph (transaction + dispute adjusted)
- [ ] Rules-as-Evidence (schemes/regulations versioned)
- [ ] Cross-sector comparison engine

---

## Stage 5 — Bounded autonomy

- [ ] Reflex system for pre-approved low-risk actions
- [ ] Immune system (fraud/quality/compliance response)
- [ ] Autonomous rural ops with approval thresholds

---

## Stage 6 — Futuristic (after baseline)

Personal/village digital twins, federated learning, climate autopilot, policy lab, etc. — **only after Stage 1 exit criteria**.

---

## Multiplatform = one OS (non-negotiable)

```
https://{single-domain}/
  /os              → kernel, registry, health
  /farmer          → agro production platform
  /market          → ecommerce platform
  /insurance       → corporate risk support
  /logistics       → logistics platform
  /finance         → finance / credit
  /engineering     → advisory engineering
  /erp             → control plane
  /gov             → schemes / grievance
```

All share: identity, ERP hooks, event bus, evidence, consent ledger, design system.

---

## Completed on this branch (evidence)

| Item | Location |
|------|----------|
| Master TODO | this file |
| Concept-runtime registry | `backend/src/os/conceptRuntimeRegistry.js` |
| OS kernel | `backend/src/os/osKernel.js` |
| OS routes | `backend/src/routes/osRoutes.js` |
| Ecommerce checkout+RMA | `services/ecommerce/*` |
| Farmer vs Ecommerce layers | `services/layers/*` |
| Corporate insurance | `services/insurance/corporateInsurancePlatform.js` |
| Subsidy eligibility | `services/research-grade/subsidyEligibilityEngine.js` |
| ERP double-entry spine | `services/research-grade/erpDoubleEntrySpine.js` |
| AI evidence gateway | `services/research-grade/aiBackboneEvidenceGateway.js` |
