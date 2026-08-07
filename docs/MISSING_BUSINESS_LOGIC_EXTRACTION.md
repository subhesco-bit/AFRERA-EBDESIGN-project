# Missing Business Logic Extraction from v42 HTML

This document extracts the 8 critical business logic functions identified in the audit report from the `afrera_platform_v42.html` prototype.

## 1. corpCreditEligible (Finance Domain)

**Purpose:** Corporate credit gating for B2B buyers

**Original Logic:**
```javascript
function corpCreditEligible(turnoverCr, vintageYrs) {
  if (turnoverCr >= 5 && vintageYrs >= 3) {
    return { term: "net60", why: "Turnover ≥₹5Cr and 3+ years vintage — full NET 60 eligible" };
  }
  if (turnoverCr >= 1 && vintageYrs >= 1) {
    return { term: "net30", why: "Meets the NET 30 threshold" };
  }
  return { term: "net0", why: "New or small account — pay-on-delivery until a track record builds" };
}
```

**Credit Terms:**
- `net0`: Pay on delivery (0 days)
- `net30`: NET 30 (30 days credit)
- `net60`: NET 60 (60 days credit)

**Implementation Requirements:**
- Input: annual turnover in crores, business vintage in years
- Output: credit term eligibility with explanation
- Use in: Corporate procurement checkout flow

---

## 2. floorBenchmark (Pricing Domain)

**Purpose:** Peer floor-price comparison for farmers setting MAP-A

**Original Logic:**
```javascript
function floorBenchmark(categoryOrName) {
  const q = (categoryOrName || "").toLowerCase();
  if (!q) return null;
  
  const vals = [];
  CATALOG.forEach(p => {
    if (p.off) return;
    if (p.cat.toLowerCase().includes(q) || p.n.toLowerCase().includes(q)) {
      vals.push(p.floor);
    }
  });
  
  if (vals.length < 2) {
    return { min: null, max: null, avg: null, count: vals.length, note: "not enough data" };
  }
  
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  
  return { min, max, avg, count: vals.length };
}
```

**Implementation Requirements:**
- Input: product category or name
- Output: min, max, average floor prices from peer farmers
- Privacy: Never expose individual farmer data, only aggregates
- Minimum data threshold: 2+ data points required
- Use in: Farmer pricing tools, MAP-A setting

---

## 3. ecoLogisticsMiles (Logistics/ESG Domain)

**Purpose:** Emissions/ESG calculation per logistics lane

**Original Logic:**
```javascript
function ecoLogisticsMiles(ctx) {
  if (ctx.kind !== "booking") {
    return { score: 60, why: "No lane chosen for this transaction." };
  }
  
  const lane = TM_LANES.find(l => l.k === ctx.lane) || TM_LANES[0];
  const shortest = Math.min(...TM_LANES.map(l => l.km));
  
  if (lane.km <= shortest * 1.15) {
    return { score: 95, why: lane.o + " → " + lane.d + " (" + lane.km + "km) is at or near the shortest corridor lane on record." };
  }
  
  const extra = Math.round((lane.km - shortest) / shortest * 100);
  const score = Math.max(10, 95 - extra);
  const reason = extra + "% longer than shortest lane — extra emissions penalty.";
  
  return { score: Math.max(10, Math.min(100, score)), why: reason };
}
```

**Implementation Requirements:**
- Input: transaction context with lane selection
- Output: ESG score (0-100) with explanation
- Logic: Compare chosen lane to shortest available lane
- Penalty: Points deducted for longer routes
- Use in: ESG scoring, sustainability analytics

---

## 4. harvestPoints (Farmer Loyalty Domain)

**Purpose:** Loyalty/incentive economics for buyers

**Original Logic:**
```javascript
const HS_TIERS = [
  ["🌱", "Seed", 0],
  ["🌿", "Sprout", 100],
  ["🌳", "Sapling", 300],
  ["🏔️", "Grove", 600],
  ["👑", "Forest Patron", 1000]
];

function harvestTier(pts) {
  let t = HS_TIERS[0];
  for (const x of HS_TIERS) {
    if (pts >= x[2]) t = x;
  }
  return t;
}

function harvestPoints() {
  const orders = DataStore.records.filter(r => r.type === 'order').length;
  const subs = DataStore.records.filter(r => r.type === 'subscription').length;
  const gifts = DataStore.records.filter(r => r.type === 'gift_order').length;
  return orders * 50 + subs * 120 + gifts * 40;
}
```

**Point System:**
- Regular orders: 50 points each
- Subscriptions: 120 points each
- Gift orders: 40 points each

**Tiers:**
- Seed: 0 points
- Sprout: 100 points
- Sapling: 300 points
- Grove: 600 points
- Forest Patron: 1000 points

**Implementation Requirements:**
- Input: user's transaction history
- Output: total points, current tier, next tier
- Use in: Loyalty program, gamification

---

## 5. allocScore (Order Allocation Domain)

**Purpose:** Order-to-farmer allocation scoring

**Original Logic:**
```javascript
function allocScore(lot, dest) {
  const parts = [];
  
  // FDI component (30% weight)
  const f = fdiFor(lot.farmer);
  const fdiPts = Math.round(f.score * 0.30);
  parts.push(["FDI grade " + f.grade, fdiPts, 30]);
  
  // Quality grade (20% weight)
  const gradePts = lot.grade === "A" ? 20 : 12;
  parts.push(["Quality grade " + lot.grade, gradePts, 20]);
  
  // Distance penalty (20% weight)
  const dist = (REGION_DIST[lot.region] || {})[dest] || 1500;
  const distPts = Math.round(Math.max(0, 20 - (dist / 2400) * 20));
  parts.push([dist + " km to destination", distPts, 20]);
  
  // Price headroom (15% weight)
  const margin = (lot.adv - lot.floor) / lot.adv;
  const fairPts = Math.round(Math.min(15, margin * 25));
  parts.push(["Price headroom above farmer floor", fairPts, 15]);
  
  // Freshness (15% weight)
  const freshPts = lot.perish ? 15 : 10;
  parts.push(["Freshness: " + (lot.perish ? "perishable" : "durable"), freshPts, 15]);
  
  const total = fdiPts + gradePts + distPts + fairPts + freshPts;
  return { total, parts, fdi: f };
}
```

**Scoring Components:**
- FDI grade: 30% weight
- Quality grade: 20% weight (A=20pts, B=12pts)
- Distance: 20% weight (penalty for long distances)
- Price headroom: 15% weight (margin above floor price)
- Freshness: 15% weight (perishable=15pts, durable=10pts)

**Implementation Requirements:**
- Input: farmer lot, destination
- Output: allocation score with component breakdown
- Use in: Order allocation algorithm

---

## 6. compostPlan (Circular Economy Domain)

**Purpose:** Residue → compost planning

**Original Logic:**
```javascript
const SOIL_ADJUST = {
  "Looks tired / low yield": { mult: 1.15, note: "Slightly higher organic matter dressing" },
  "Normal / average": { mult: 1.0, note: "Standard base dressing" },
  "Recently fallow / rested": { mult: 0.85, note: "Lower dressing — residual fertility likely still present" }
};

const COMPOST_RATES = {
  "Vermicompost": { qty: 500, unit: "kg", role: "Primary organic base" },
  "Farmyard Manure": { qty: 2000, unit: "kg", role: "Bulk organic matter" },
  "Neem Cake": { qty: 100, unit: "kg", role: "Pest repellent + slow N" },
  "Bone Meal": { qty: 50, unit: "kg", role: "Phosphorus source" },
  "Rock Phosphate": { qty: 40, unit: "kg", role: "Long-term P" }
};

function compostPlan(crop, acres, soilCond) {
  const mult = (SOIL_ADJUST[soilCond] || SOIL_ADJUST["Normal / average"]).mult;
  return Object.entries(COMPOST_RATES).map(([name, r]) => ({
    name,
    qty: Math.round(r.qty * acres * mult * 100) / 100,
    unit: r.unit,
    role: r.role
  }));
}
```

**Soil Condition Adjustments:**
- Tired soil: +15% input quantities
- Normal soil: baseline (1.0x)
- Fallow soil: -15% input quantities

**Base Rates (per acre):**
- Vermicompost: 500kg
- Farmyard Manure: 2000kg
- Neem Cake: 100kg
- Bone Meal: 50kg
- Rock Phosphate: 40kg

**Implementation Requirements:**
- Input: crop type, acreage, soil condition
- Output: customized compost plan with quantities
- Use in: Circular economy advisor

---

## 7. schemeExpiryStatus (Subsidy Domain)

**Purpose:** Scheme deadline exposure monitoring

**Original Logic:**
```javascript
const SCHEME_EXPIRY = [
  { id: "PM-FME", label: "PM-FME notified period", expiry: "2025-03-31" },
  { id: "AIF", label: "Agriculture Infrastructure Fund", expiry: "2028-03-31" },
  { id: "AHIDF", label: "AHIDF (already lapsed — tombstoned)", expiry: "2026-03-31" },
  { id: "OPGREENS", label: "Operation Greens (TOP to TOTAL)", expiry: "2027-03-31" }
];

function schemeExpiryStatus() {
  const now = Date.now();
  return SCHEME_EXPIRY.map(s => {
    const days = Math.round((new Date(s.expiry) - now) / 86400000);
    const state = days < 0 ? "LAPSED" : days <= 60 ? "EXPIRING SOON" : "ACTIVE";
    return { ...s, days, state };
  });
}
```

**Status Categories:**
- ACTIVE: >60 days until expiry
- EXPIRING SOON: 0-60 days until expiry
- LAPSED: Already expired

**Tracked Schemes:**
- PM-FME (Micro Food Processing Enterprises)
- AIF (Agriculture Infrastructure Fund)
- AHIDF (Animal Husbandry Infrastructure Development Fund)
- OPGREENS (Operation Greens)

**Implementation Requirements:**
- Input: current date
- Output: all schemes with days remaining and status
- Use in: Admin dashboard, scheme monitoring

---

## 8. complianceGaps (Governance Domain)

**Purpose:** Compliance readiness checking

**Original Logic:**
```javascript
const COMPLIANCE_RECORD = {
  fssaiLicence: "",
  grievanceOfficer: "",
  grievanceEmail: "",
  grievancePhone: "",
  nodalOfficer: "",
  gstin: "",
  updated: ""
};

function complianceGaps() {
  const need = [
    ["fssaiLicence", "FSSAI licence number"],
    ["grievanceOfficer", "Grievance Officer name"],
    ["grievanceEmail", "Grievance Officer e-mail"],
    ["grievancePhone", "Grievance Officer phone"],
    ["nodalOfficer", "Nodal Officer (IT Rules 2021)"],
    ["gstin", "GSTIN"]
  ];
  return need.filter(n => !String(COMPLIANCE_RECORD[n[0]] || "").trim()).map(n => n[1]);
}

function complianceReady() {
  return complianceGaps().length === 0;
}
```

**Required Compliance Fields:**
1. FSSAI licence number
2. Grievance Officer name
3. Grievance Officer email
4. Grievance Officer phone
5. Nodal Officer (IT Rules 2021)
6. GSTIN

**Implementation Requirements:**
- Input: compliance record object
- Output: list of missing compliance items
- Use in: Admin compliance dashboard, pre-launch checks

---

## Implementation Priority

Based on business impact:

1. **HIGH PRIORITY:**
   - `corpCreditEligible` - Directly affects B2B revenue
   - `floorBenchmark` - Critical for farmer pricing decisions
   - `allocScore` - Core order fulfillment logic

2. **MEDIUM PRIORITY:**
   - `harvestPoints` - Loyalty program enhancement
   - `schemeExpiryStatus` - Admin monitoring tool
   - `complianceGaps` - Governance requirement

3. **LOWER PRIORITY:**
   - `ecoLogisticsMiles` - ESG reporting
   - `compostPlan` - Circular economy feature

## API Endpoints to Create

All functions should be exposed via `/api/v1/decision-support`:

- `POST /api/v1/decision-support/corp-credit-eligible`
- `POST /api/v1/decision-support/floor-benchmark`
- `POST /api/v1/decision-support/eco-logistics-miles`
- `POST /api/v1/decision-support/harvest-points`
- `POST /api/v1/decision-support/alloc-score`
- `POST /api/v1/decision-support/compost-plan`
- `GET /api/v1/decision-support/scheme-expiry-status`
- `POST /api/v1/decision-support/compliance-gaps`

## Data Dependencies

These functions require:
- FDI scores and grades
- Product catalog with floor prices
- Farmer profiles and quality grades
- Regional distance matrix
- Transaction history
- Scheme database
- Compliance records

## Testing Strategy

Each function should have:
1. Unit tests with known input/output pairs
2. Edge case testing (empty data, boundary values)
3. Integration tests with real data
4. Performance tests for large datasets