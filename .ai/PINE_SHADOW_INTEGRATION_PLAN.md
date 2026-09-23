# Pine-Shadow → Consolidated/Final Integration Plan

**Objective:** Port pine-shadow's advanced domain models (Lattice, Organism OS, ERP, Vet, Flows) into consolidated/final's microservices architecture while preserving existing 140+ services and 192 modules.

**Date:** 2026-09-23  
**Status:** Planning phase

---

## 1. Missing Core Concepts (Not in consolidated/final)

### 1A. Lattice System (Graph/Network Theory)
**Files in pine-shadow:**
- `bridges-core.ts` - Core graph traversal engine
- `bridges-mesh.ts` - Mesh/network operations
- `concepts.ts` - Concept nodes and relationships
- `store.ts` - Lattice state management
- `walk.ts` - Graph walking algorithms

**What it does:**
- Models domain concepts as interconnected nodes
- Bridges connect concepts (one-to-many, many-to-many)
- Used for: product recommendations, supply chain tracing, farmer network analysis

**Missing in consolidated/final:**
- No graph database (PostgreSQL only)
- No concept node registry
- No bridge traversal engine

**Port approach:**
```
backend/src/services/lattice/
├── latticeEngine.js         (bridges-core + bridges-mesh)
├── conceptRegistry.js       (concepts + store)
└── latticeWalker.js         (walk algorithms)
```

**Use cases:**
- Map farmer networks (connected farmers → shared resources)
- Product lineage (crop → processing → market)
- Supply chain resilience (alternative routes)

---

### 1B. Organism OS (Living System Architecture)
**Files in pine-shadow:**
- `organism/boot.server.ts` - Organism initialization
- `organism/fns.ts` - Organism functions
- `organism/store.ts` - State management
- `organism/types.ts` - Type definitions

**What it does:**
- Treats platform as living organism with organs (subsystems)
- Organs have roles, dependencies, health
- Self-healing architecture

**Missing in consolidated/final:**
- No subsystem registry (organs)
- No health monitoring per subsystem
- No automatic fallback routing

**Port approach:**
```
backend/src/services/organism/
├── organSystem.js           (subsystem registry)
├── healthMonitor.js         (health checks per service)
└── adaptiveRouter.js        (route requests to healthy organ)
```

**Use cases:**
- If inventory service unhealthy → reroute to backup
- If marketplace down → fallback to direct farmer API
- Cross-subsystem health dashboard

---

### 1C. Brain/Decision Layer (Inference Engine)
**Files in pine-shadow:**
- `brain/atlas.ts` - Knowledge atlas
- `brain/decide.ts` - Decision making
- `brain/tissues.ts` - Mental tissues (patterns)

**What it does:**
- AI-driven decision engine
- Learns from past decisions
- Recommends actions based on context

**Missing in consolidated/final:**
- No decision registry (what decisions exist)
- No inference rules (when to decide X)
- No learning loop (improve recommendations)

**Port approach:**
```
backend/src/services/brain/
├── decisionAtlas.js         (decision registry)
├── inferenceEngine.js       (apply rules, get recommendations)
└── learningLoop.js          (feedback → better decisions)
```

**Use cases:**
- Farmer financial decision support
- Crop selection recommendations
- Weather-driven advisory

---

### 1D. Body/Operations Layer (Physical Execution)
**Files in pine-shadow:**
- `body/anatomy.ts` - Operational structure
- `body/actions.ts` - Executable actions
- `body/reflex.ts` - Automatic responses

**What it does:**
- Maps operational capabilities
- Triggers actions based on conditions
- Automatic reflexes (no deliberation)

**Missing in consolidated/final:**
- No operational capability registry
- No event-driven reflex system
- No action queuing

**Port approach:**
```
backend/src/services/body/
├── operationalAnatomy.js    (capability registry)
├── actionExecutor.js        (queue and execute actions)
└── reflexSystem.js          (event → immediate response)
```

**Use cases:**
- Automatic order acknowledgment (reflex)
- Stock threshold triggers (reflex)
- Farmer notification on price movement (reflex)

---

### 1E. Vet/Verification Layer (Quality Assurance)
**Files in pine-shadow:**
- `vet/lineage.ts` - Trace origin/chain of custody
- `vet/code.ts` - Quality codes/standards
- `vet/catalog.ts` - Verification catalog

**What it does:**
- Tracks product lineage (farm → market)
- Verifies quality against standards (IS codes, organic, etc.)
- Generates proof of authenticity

**Missing in consolidated/final:**
- No lineage tracking
- No quality standard registry
- No certificate generation

**Port approach:**
```
backend/src/services/vet/
├── lineageTracker.js        (farm-to-market tracing)
├── qualityValidator.js      (check against standards)
└── certificateGenerator.js  (proof of authenticity)
```

**Use cases:**
- Organic certification tracing
- IS code compliance verification
- Farmer reputation score (based on quality history)

---

### 1F. Flows/Workflow Engine (Process Execution)
**Files in pine-shadow:**
- `flows/catalog.ts` - Available workflows
- `flows/run.ts` - Workflow execution
- `flows/types.ts` - Workflow definition schema

**What it does:**
- Defines multi-step workflows (ecommerce, procurement, RFQ)
- Executes steps in sequence with branching
- Tracks workflow state and rollback

**Missing in consolidated/final:**
- No workflow definition format
- No step-by-step execution engine
- No compensation/rollback mechanism

**Port approach:**
```
backend/src/services/flows/
├── workflowEngine.js        (define & execute workflows)
├── stepExecutor.js          (execute individual steps)
└── compensationHandler.js   (rollback on failure)
```

**Use cases:**
- Ecommerce order flow (O2C: order → payment → fulfillment → delivery)
- Procurement flow (RFQ → bid → contract → PO → receipt)
- Loan flow (application → appraisal → approval → disbursement)

---

### 1G. ERP Platform (Financial & Operational)
**Files in pine-shadow:**
- `erp/atlas.ts` - ERP data model
- `erp/boot.server.ts` - ERP initialization
- `erp/fns.ts` - ERP functions
- `erp/kernel.ts` - Core ERP logic
- `erp/money.ts` - Financial calculations
- `erp/platform.ts` - Platform-level ERP

**What it does:**
- Double-entry accounting
- Subledgers (GL, AP, AR, Fixed Assets)
- Cost center tracking
- Tax determination (GST, etc.)

**Missing in consolidated/final:**
- No chart of accounts
- No subledger posting
- No GST workflow
- No period close procedures

**Port approach:**
```
backend/src/services/erp/
├── chartOfAccounts.js       (COA registry)
├── doubleEntryPosting.js    (debit/credit logic)
├── subledgerManager.js      (GL, AP, AR, FA)
├── gstEngine.js             (GST calculation & filing)
└── periodClose.js           (month/year close)
```

**Use cases:**
- Farmer financial statements
- Platform P&L tracking
- GST compliance
- Vendor settlement

---

### 1H. Share/Trade Layer (Commerce & Distribution)
**Files in pine-shadow:**
- `share/book.ts` - Trading ledger
- `share/catalog.ts` - Product catalog
- `share/gst.ts` - GST workflows
- `share/trace.ts` - Supply chain trace

**What it does:**
- Track buy/sell transactions
- GST calculation on each transaction
- Supply chain transparency

**Missing in consolidated/final:**
- No trading ledger
- No per-transaction GST
- No supply chain transparency

**Port approach:**
```
backend/src/services/share/
├── tradingLedger.js         (buy/sell tracking)
├── gstCalculator.js         (per-transaction GST)
└── supplyChainTrace.js      (farm → consumer)
```

**Use cases:**
- Transparent pricing (GST shown to buyer)
- Fair trade verification
- Farmer direct-to-consumer sales

---

## 2. Missing "Bridges" (Connections Between Domains)

**Bridge Types in pine-shadow:**

| Bridge | Source | Target | Function |
|--------|--------|--------|----------|
| lattice-brain | Concepts → Decisions | Suggest actions based on concept state |
| brain-body | Decisions → Operations | Execute decided actions physically |
| body-vet | Operations → Verification | Verify executed actions meet standards |
| vet-organism | Quality → Health | Update subsystem health based on quality |
| flows-erp | Workflow steps → GL posting | Auto-post transactions from workflow |
| organism-flows | Subsystem health → Workflow adjustment | Adapt workflow if subsystem unhealthy |

**Port approach:**

```
backend/src/services/bridges/
├── latticeBrainBridge.js    (concepts influence decisions)
├── brainBodyBridge.js       (decisions trigger operations)
├── bodyVetBridge.js         (operations logged for verification)
├── vetOrganismBridge.js     (quality updates subsystem health)
├── flowsErpBridge.js        (workflow transactions auto-posted)
└── organismFlowsBridge.js   (health affects workflow routing)
```

---

## 3. Missing Process Flows (Like Ecommerce)

### Ecommerce O2C (Order-to-Cash) - PRESENT
Consolidated/final has this (8-step fulfillment saga)

### Procurement Flow - MISSING
```
RFQ → Bid Collection → Bid Analysis → PO → Receipt → Invoice → Payment
```

### Loan Flow - MISSING
```
Application → Appraisal → Credit Check → Approval → Disbursement → Repayment Schedule
```

### Insurance Claim Flow - MISSING
```
Claim Submission → Verification → Adjudication → Settlement
```

### GST Invoice Flow - MISSING
```
Sale → GST Calculation → Invoice → GSTR-1 Filing → Tax Remittance
```

**Port approach:**

```
backend/src/services/flows/
├── ecommerceFlow.js         (order-to-cash, existing)
├── procurementFlow.js       (RFQ-to-payment)
├── loanFlow.js              (application-to-repayment)
├── insuranceClaimFlow.js    (claim-to-settlement)
└── gstInvoiceFlow.js        (sale-to-filing)
```

---

## 4. Port Roadmap (Priority Order)

### Phase 1: Core Domain Models (Week 1)
- [ ] Lattice system (bridges-core, bridges-mesh, walk)
- [ ] Organism OS (organ registry, health monitoring)
- [ ] Brain decision layer (atlas, inference engine)
- [ ] Body operations layer (anatomy, action executor)

### Phase 2: Quality & Traceability (Week 2)
- [ ] Vet verification layer (lineage, quality validator)
- [ ] Share/Trade layer (trading ledger, supply chain trace)

### Phase 3: Financial & ERP (Week 3)
- [ ] ERP platform (chart of accounts, double-entry posting)
- [ ] GST engine (per-transaction GST, GSTR filing)

### Phase 4: Workflow & Bridges (Week 4)
- [ ] Flows/Workflow engine (multi-step execution)
- [ ] Bridge connectors (lattice-brain, brain-body, etc.)
- [ ] Procurement, Loan, Insurance, GST invoice flows

---

## 5. Implementation Strategy

### Per Module:
1. **Read** pine-shadow source (extract logic)
2. **Map** to consolidated/final microservices pattern
3. **Implement** as standalone Node.js service
4. **Test** against pine-shadow reference behavior
5. **Wire** into existing routes + services
6. **Document** bridges and integration points

### Example: Porting Vet Lineage

**Pine-shadow code (TypeScript):**
```typescript
// src/lib/vet/lineage.ts
export function traceLineage(productId: string): Lineage {
  return database.query(`
    SELECT farm, harvest, processing, distribution, retail
    FROM product_lineage WHERE product_id = ?
  `, [productId]);
}
```

**Consolidated/final port (Node.js):**
```javascript
// backend/src/services/vet/lineageTracker.js
async function traceLineage(productId) {
  const lineage = await database.query(`
    SELECT farm_id, harvest_date, processing_step, distributor, retailer
    FROM vet_lineage WHERE product_id = ?
  `, [productId]);
  return {
    advisory: true,
    productId,
    lineage,
    verificationUrl: `/api/v1/vet/lineage/${productId}`,
  };
}
module.exports = { traceLineage };
```

---

## 6. Files to Create

### Total: 45 new service files

**Lattice (4 files):**
- latticeEngine.js
- conceptRegistry.js
- latticeWalker.js
- latticeTypes.js

**Organism (4 files):**
- organSystem.js
- healthMonitor.js
- adaptiveRouter.js
- organismTypes.js

**Brain (4 files):**
- decisionAtlas.js
- inferenceEngine.js
- learningLoop.js
- brainTypes.js

**Body (4 files):**
- operationalAnatomy.js
- actionExecutor.js
- reflexSystem.js
- bodyTypes.js

**Vet (4 files):**
- lineageTracker.js
- qualityValidator.js
- certificateGenerator.js
- vetTypes.js

**Share (4 files):**
- tradingLedger.js
- gstCalculator.js
- supplyChainTrace.js
- shareTypes.js

**ERP (6 files):**
- chartOfAccounts.js
- doubleEntryPosting.js
- subledgerManager.js
- gstEngine.js
- periodClose.js
- erpTypes.js

**Flows (5 files):**
- workflowEngine.js
- stepExecutor.js
- compensationHandler.js
- procurementFlow.js
- loanFlow.js
- insuranceClaimFlow.js
- gstInvoiceFlow.js
- flowTypes.js

**Bridges (6 files):**
- latticeBrainBridge.js
- brainBodyBridge.js
- bodyVetBridge.js
- vetOrganismBridge.js
- flowsErpBridge.js
- organismFlowsBridge.js

**Routes (5 files):**
- latticeRoutes.js
- brainRoutes.js
- bodyRoutes.js
- vetRoutes.js
- flowsRoutes.js

**Tests (8 files):**
- lattice.test.js
- brain.test.js
- vet.test.js
- erp.test.js
- flows.test.js
- bridges.test.js
- lineage.test.js
- workflow.test.js

---

## 7. Expected Outcome

### Before (consolidated/final):
- Microservices architecture ✓
- 140+ services ✓
- 192 modules ✓
- Ecommerce flow ✓
- No living systems concepts ✗
- No graph/lattice thinking ✗
- No vet/lineage ✗
- No brain/decision layer ✗
- No bridges ✗

### After (consolidated/final + pine-shadow):
- Microservices architecture ✓
- 140+ services ✓
- 192 modules ✓
- Ecommerce flow ✓
- **+ Living systems concepts** ✓
- **+ Graph/lattice thinking** ✓
- **+ Vet/lineage/quality** ✓
- **+ Brain/decision layer** ✓
- **+ Bridges connecting domains** ✓
- **+ Procurement/Loan/Insurance flows** ✓
- **+ ERP with GST** ✓

---

## Next Step

Ready to start Phase 1 implementation?

Option A: Auto-generate all 45 service skeletons (2h)
Option B: Port Vet lineage first (30 min) → use as template for others
Option C: Port Lattice first (60 min) → foundation for other systems

Which phase 1 priority?

