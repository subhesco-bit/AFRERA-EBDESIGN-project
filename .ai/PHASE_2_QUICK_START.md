# Phase 2 Quick Start - Body & Share Services

**Estimated Time:** 1.5-2 hours  
**Difficulty:** Medium (building on Phase 1 foundation)  
**Dependencies:** Phase 1 complete ✅

---

## FILES TO CREATE (2 sets, 6 files total)

### Set A: Body/Operations Service (3 files, ~370 lines)

#### 1. actionExecutor.js (~150 lines)
**Location:** `backend/src/services/body/actionExecutor.js`

**Purpose:** Register and execute actions with queuing and history

**What to implement:**
- Action registry (id → {name, handler, config})
- Action queue (FIFO execution)
- Async execution with timeout
- Execution history (last 100 records)
- Compensation logic (rollback actions)

**Example usage:**
```javascript
executor.registerAction('send_sms', {
  handler: async (target, message) => {
    // Call SMS API
    return {sent: true, messageId: msg_123};
  },
  timeout: 5000,
});

await executor.execute('send_sms', 
  {target: '+919876543210', message: 'Harvest ready'});
```

#### 2. reflexSystem.js (~120 lines)
**Location:** `backend/src/services/body/reflexSystem.js`

**Purpose:** Event-driven immediate responses (no deliberation)

**What to implement:**
- Event listener registration (event → action)
- Auto-trigger actions when event fires
- No state checks (immediate response)
- Bypass decision layer
- Real-time logging

**Example usage:**
```javascript
reflex.on('inventory.stock_low', async (event) => {
  await executor.execute('send_sms', {
    target: event.farmerPhone,
    message: `Stock of ${event.product} is below ${event.threshold}`
  });
});

// When stock hits low level, SMS fires immediately
```

#### 3. operationalAnatomy.js (~100 lines)
**Location:** `backend/src/services/body/operationalAnatomy.js`

**Purpose:** Registry of operational capabilities and constraints

**What to implement:**
- Capability registry (what actions are available)
- Resource constraints (max concurrent executions)
- Action metadata (category, cost, latency)
- Dependency graph (action A requires B)
- Health per capability (which actions are online)

**Example usage:**
```javascript
anatomy.registerCapability('send_sms', {
  cost: 0.50,
  latency_ms: 500,
  concurrency_limit: 100,
  dependencies: ['telecom_gateway'],
  retry_policy: {max: 3, backoff: 'exponential'},
});
```

---

### Set B: Share/Trade Service (3 files, ~430 lines)

#### 1. gstEngine.js (~180 lines)
**Location:** `backend/src/services/share/gstEngine.js`

**Purpose:** GST calculation, compliance, and filing

**What to implement:**
- GST slab determination (5%, 12%, 18%, 28% based on HSN code)
- Intra-state vs inter-state calculation
- IGST/SGST/CGST breakup
- Reverse charge logic (B2B under certain conditions)
- GSTR-1 filing format
- E-way bill generation

**Example usage:**
```javascript
const gst = gstEngine.calculateGST({
  invoiceValue: 10000,
  hsnCode: 1001, // Rice
  sellerState: 'Assam',
  buyerState: 'Karnataka',
  buyerType: 'business', // business, consumer, exempt
});

// Returns: {
//   gstSlab: 5,
//   invoiceValue: 10000,
//   igst: 500,
//   sgst: 0,
//   cgst: 0,
//   totalTax: 500,
//   grossAmount: 10500,
//   gstrReportingFlag: 'normal',
// }
```

#### 2. tradingLedger.js (~150 lines)
**Location:** `backend/src/services/share/tradingLedger.js`

**Purpose:** Track buy/sell transactions and farmer credibility

**What to implement:**
- Transaction recording (buyer, seller, amount, date)
- Ledger entries (grouped by farmer/buyer)
- Credibility score calculation (transaction count, value, on-time)
- Dispute tracking
- Transaction history

**Example usage:**
```javascript
ledger.recordTransaction({
  type: 'sell',
  farmer_id: 'farmer_123',
  buyer_id: 'buyer_456',
  product: 'Rice',
  quantity: 100,
  unit_price: 100,
  total_value: 10000,
  payment_status: 'completed',
  on_time: true,
});

// Get farmer credibility
const score = ledger.getCredibilityScore('farmer_123');
// Returns: {
//   transactions: 45,
//   total_value: 450000,
//   on_time_rate: 0.98,
//   score: 92,
//   tier: 'Gold' // Bronze, Silver, Gold, Platinum
// }
```

#### 3. supplyChainTrace.js (~100 lines)
**Location:** `backend/src/services/share/supplyChainTrace.js`

**Purpose:** Multi-hop supply chain transparency

**What to implement:**
- Hop tracking (who handled product at each stage)
- Custody chain (farmer → aggregator → processor → distributor → retailer)
- Delay tracking (how long at each hop)
- Cost tracking (margin added at each hop)
- Transparency score

**Example usage:**
```javascript
trace.recordHop({
  productId: 'prod_rice_001',
  hopNumber: 1,
  handler: {type: 'farmer', id: 'farmer_123'},
  action: 'harvest',
  quantity: 100,
  timestamp: '2026-09-01T10:00:00Z',
  nextHandler: 'aggregator_456',
});

// Get full trace
const chain = trace.getChain('prod_rice_001');
// Shows: farm → aggregator (2 days, 5% margin) → 
//        processor (1 day, 10% margin) → 
//        distributor (3 days, 8% margin) → 
//        retailer (1 day, 20% margin)
```

---

## IMPLEMENTATION APPROACH

### Step 1: Create actionExecutor.js (30 min)
1. Copy template structure from `brain/decisionEngine.js`
2. Implement ActionExecutor class
3. Add registerAction method
4. Add execute method with async/await
5. Add queue management
6. Add history tracking

### Step 2: Create reflexSystem.js (20 min)
1. Extend EventEmitter from Node.js `events`
2. Add `on(event, callback)` method
3. Add action auto-trigger logic
4. Test with inventory.stock_low event

### Step 3: Create operationalAnatomy.js (20 min)
1. Create capability registry
2. Add resource constraints
3. Add health tracking
4. Add dependency management

### Step 4: Create gstEngine.js (45 min)
1. Define GST slab table (HSN code → rate)
2. Implement calculateGST method
3. Add state determination logic (intra vs inter)
4. Add reverse charge rules
5. Test with examples

### Step 5: Create tradingLedger.js (30 min)
1. Create transaction recording
2. Implement credibility score algorithm
3. Add tier assignment logic
4. Test with sample transactions

### Step 6: Create supplyChainTrace.js (25 min)
1. Implement hop tracking
2. Create chain reconstruction
3. Add cost tracking
4. Calculate transparency score

---

## TESTING CHECKLIST

### Before Committing:

```bash
# Syntax check each file
node -c backend/src/services/body/actionExecutor.js
node -c backend/src/services/body/reflexSystem.js
node -c backend/src/services/body/operationalAnatomy.js
node -c backend/src/services/share/gstEngine.js
node -c backend/src/services/share/tradingLedger.js
node -c backend/src/services/share/supplyChainTrace.js

# Basic instantiation test
node -e "
const {ActionExecutor} = require('./backend/src/services/body/actionExecutor.js');
const executor = new ActionExecutor();
console.log('✓ ActionExecutor loads');
"
```

---

## GIT COMMIT PLAN

### Commit 2: Body & Share Services

```bash
git add backend/src/services/body/
git add backend/src/services/share/

git commit -m "feat(services): add body operations & share/trade systems

Body Services:
- actionExecutor.js: Queue and execute actions with history
- reflexSystem.js: Event-driven immediate responses
- operationalAnatomy.js: Capability registry and constraints

Share/Trade Services:
- gstEngine.js: GST calculation, GSTR filing, e-way bills
- tradingLedger.js: Transaction tracking, credibility scoring
- supplyChainTrace.js: Multi-hop transparency, cost tracking

Enables farmer notifications, GST compliance, and supply chain visibility.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## SUCCESS CRITERIA

After Phase 2 completion:
- [ ] All 6 files created and syntax-checked
- [ ] All 6 files instantiate without errors
- [ ] Basic functionality verified (no unit tests yet, manual testing OK)
- [ ] Commit completed
- [ ] `git log --oneline` shows 2 commits for Phase 1 & 2

**Files count:** 15 services + 3 docs = 18 files total  
**LOC:** 2,730 (Phase 1) + 1,100 (Phase 2) = ~3,830 lines  
**Completion:** 50% + 13% = **~63% of full integration**

---

## NEXT AFTER PHASE 2

### Phase 3: ERP Suite (3 hours, 6 files)
- chartOfAccounts.js
- doubleEntryPosting.js
- subledgerManager.js
- taxEngine.js
- periodClose.js
- bankReconciliation.js

### Phase 4: Workflow Flows (1.5 hours, 3 files)
- loanFlow.js
- insuranceClaimFlow.js
- gstInvoiceFlow.js

### Phase 5: Routes (1 hour, 6 files)
- latticeRoutes.js through flowsRoutes.js

### Phase 6: Bridges (1.5 hours, 6 files)
- Bridge connectors for cross-domain automation

### Phase 7: Tests (1 hour)
- Unit tests, integration tests, E2E tests

---

## CHECKPOINT

**After Phase 2:**
- Services: 5 (Phase 1) + 6 (Phase 2) = 11 of 15 core services ✓
- Workflows: 1 (Procurement) of 5 complete (3 more to add)
- Routes: 0 of 6 wired (Phase 5)
- Bridges: 0 of 6 (Phase 6)
- ERP: 0 of 6 (Phase 3)

**Ready to evaluate:** Should we continue to Phase 3 (ERP - the heavy work)?

Or pause for user feedback?

