# Cold Storage Module — Phase 1 Implementation Roadmap
## NEIA × UNEP / FOLU Operationalization

**Timeline:** 12 weeks (Months 1-3 = September - November 2026)

---

## WEEK 1-2: FOUNDATION SETUP

### Technical Infrastructure

**Backend Services:**
```
1. Clone coldStorageCoordinator.js (extends claudeAICoordinator.js)
2. Implement 5 Claude AI Decision Analyzers:
   - demandValidator.js
   - supplyOptimizer.js
   - farmerPriceModeler.js
   - energyPredictor.js
   - natureSafeguardMonitor.js

3. Database Setup:
   - Execute migrations: 1001-1015 (cold storage schema)
   - Configure node monitoring database
   - Setup MRV metrics tables

4. API Routes:
   - /api/cold-storage/demand/*
   - /api/cold-storage/supply/*
   - /api/cold-storage/storage/*
   - /api/cold-storage/thermal/*
   - /api/cold-storage/logistics/*
```

**Frontend Components:**
```
1. Create Dashboard Components (React):
   - ColdStorageOverview.jsx (6-dimensional view)
   - DemandPipeline.jsx (buyer inquiries + validation)
   - FarmerDashboard.jsx (personalized income + market)
   - BuyerDashboard.jsx (supply + logistics + traceability)
   - NodeMonitoring.jsx (real-time temperature + energy)

2. Forms:
   - BuyerInquiryForm.jsx
   - FarmerProductionForecast.jsx
   - HarvestNotification.jsx
   - ShipmentTracking.jsx
```

### Demand Infrastructure

**Buyer Intake System:**
```
1. Create buyers table + form
2. Implement demand signal capture (inquiry → trial → repeat)
3. Connect to Claude validation engine
4. Setup buyer communication templates (WhatsApp/Email)
```

**Product Catalog:**
```
1. Distinctive foods database
   - Bhut Jolokia (chili)
   - Kachai Lemon (citrus)
   - Naga Tree Tomato (exotic)
   - Large Cardamom (plantation)
   - Chak Hao (rice)
   - Others (GI-certified varieties)

2. Product profiles:
   - Thermal requirements (storage temp, humidity)
   - Shelf life (pre-cool → storage → transport duration)
   - Quality metrics (grading, defects)
   - Market channels (specialty retail, chefs, institutional, digital)
```

---

## WEEK 3-4: PILOT NODE DEPLOYMENT (Manipur)

### First Production Node Setup

**Location:** Manipur (Imphal region)
**Capacity:** 50 tonnes
**Timeline:** Week 3-4

**Infrastructure:**
```
1. Storage Structure:
   - Insulated room (50T capacity)
   - Separate zones for different products (min 2 zones)
   - Relative humidity control
   - Temperature monitoring (8 sensors minimum)

2. Refrigeration System:
   - Cascade architecture (LT + MT/HT circuits)
   - Compressor: 7.5 kW minimum
   - VSD-controlled (load matching)
   - Low-GWP refrigerant (R452B or equivalent)

3. Energy System:
   - Solar PV: 5 kWp (provides 40% average load)
   - BESS: 10 kWh (critical loads + short outages)
   - Thermal Storage: Ice-bank system (3-4 hours continuity)
   - Grid connection: Primary supply

4. Monitoring:
   - Temperature: 8 sensors (distributed)
   - Humidity: 4 sensors
   - Energy: Power meter (real-time consumption)
   - GPS: Tracking (incoming reefers)
```

**Staffing:**
```
- Node Manager (1): Overall operations + FPO coordination
- Refrigeration Technician (1): Equipment maintenance
- Quality Checker (1): Grading + pre-cool protocols
- Data Operator (1): System monitoring + reporting
```

**FPO Partnerships:**
```
- Engage 4 FPOs (agricultural producer groups)
- Each FPO: 30-50 farmers
- Total farmers: 120-200
- Training: Pre-cool protocols, aggregation, traceability
```

### Demand Activation (Bhut Jolokia)

**Market Research:**
```
1. Identify 6-8 specialty retail buyers (Delhi/NCR)
2. Schedule tasting events (product demonstration)
3. Facilitate trial orders (minimum 100kg)
4. Document repeat demand signals (2-4 weeks)
```

**Claude Integration:**
```
1. Feed buyer inquiries → demandValidator
2. Score each buyer's repeat probability
3. Only proceed with supply commitment if confidence ≥70%
4. Daily dashboard: Demand pipeline visualization
```

---

## WEEK 5-8: PILOT CYCLE 1 (Bhut Jolokia)

### Supply Chain Cycle

**Timeline:** 6 weeks (1 production cycle)

**Week 5: Production Signal**
```
1. Demand validation complete (buyers confirmed)
2. Send production forecast to FPOs
   - Volume: 8,000-10,000 kg target
   - Planting: Not needed (existing crop)
   - Harvest timing: Coordinate with buyer delivery dates
   - Quality spec: Grade 1 (large, consistent color, heat)

3. FPO confirms farmer participation
4. Farmer harvest planning begins
```

**Week 6: Pre-Harvest Management**
```
1. Pre-cool protocols prepared
   - Equipment check (ice water + baskets)
   - Temperature target: 8-10°C within 4 hours of harvest
   - Staff trained

2. Aggregation center prepared
   - Grading standards: Grade 1, 2, 3 separated
   - Traceability logs: Origin farmer recorded
   - Packaging: Standard crates, labeled
```

**Week 7: Harvest → Aggregation → Pre-Cool**
```
1. Farmers harvest (coordination with FPO)
2. Bring to aggregation node same day
3. Pre-cool immediately (cascade refrigeration)
4. Grade + pack (48 hours)
5. Transfer to storage (8-10°C, 85% RH)

MONITORING:
- Temperature: Maintained ±1°C (alert if deviation)
- Quality: Visual inspection (defects, color, firmness)
- Traceability: Farmer → FPO → Node (logged)
- Food safety: No chemical residue (visual check)
```

**Week 8: Storage → Dispatch**
```
1. Buyer order trigger (real-time or forecast-based)
2. Pick product from storage
3. Load reefer vehicle
4. Temperature: Maintain 8-10°C during transport
5. Delivery to buyer (within 36 hours)

MONITORING:
- Reefer temperature: Real-time GPS + cold chain monitor
- ETA: GPS tracking + communication
- Quality on arrival: Buyer assessment (grade conformance)
- Traceability: From farm to buyer (scannable QR)
```

### Claude AI Decision Support

**Daily Decisions:**
```
1. demandValidator: Any new inquiries → score confidence
2. supplyOptimizer: Product ready → optimize dispatch route + timing
3. farmerPriceModeler: Buyer price confirmed → calculate farmer guarantee
4. energyPredictor: Weather → forecast cooling demand + BESS dispatch
5. natureSafeguardMonitor: Track cultivation continuity (farmer planning next year?)
```

**Dashboards Updated Real-Time:**
```
- System Manager: Node status, alerts, decisions
- Farmers: Income to date, next order timing, quality feedback
- Buyers: Supply availability, delivery ETA, traceability
```

---

## WEEK 9-12: REVIEW + CYCLE 2 PLANNING

### Measurement & Validation

**Week 9-10: Data Collection**

**Food Loss Measurement:**
```
Baseline: Farm-gate baseline loss (0%)
Actual loss:
- Harvest → Aggregation: Visual defects + weight loss (measure %)
- Aggregation → Pre-cool: Same (measure time + temperature integrity)
- Pre-cool → Storage: Monitor quality + rejection rate
- Storage → Dispatch: Monitor quality + rejection rate
- Transport: Measure quality on buyer arrival
- Total loss: ___% (target ≥30% reduction not achievable in 1 cycle; measure baseline)
```

**Farmer Income Realization:**
```
Farm-gate baseline: ₹80-100/kg (market distress price)
Buyer price: ₹200-250/kg (retail commitment)
Farmer guarantee: ₹150/kg (60% of buyer price, minus cost)
Farmer actual realization: ₹___ per kg
- Compare vs baseline (target ≥50% improvement)
- Document farmer income statement (season total)
```

**Supply Chain Performance:**
```
1. Demand validation accuracy
   - Predicted: Buyer repeats order (yes/no) based on Claude score
   - Actual: Did buyer place repeat order?
   - Accuracy: ___% (target ≥70%)

2. Supply optimization
   - Predicted dispatch cost: ₹X
   - Actual cost: ₹Y
   - Efficiency: ___% savings vs baseline

3. Farmer price modeling
   - Predicted farmer will receive: ₹X/kg
   - Actual farmer received: ₹Y/kg
   - Accuracy: ___% (target ±10%)
```

**Nature & Climate:**
```
1. Biodiversity: Did 4 Bhut Jolokia farmers cultivate again?
2. Energy: Total kWh consumed / 8,000 kg produced = ___kWh/t
   - Target: ≤2.5 kWh/t (India baseline 3-4)
3. Refrigerant: Any leakage detected? (visual inspection + logs)
4. Carbon: Avoided food loss benefit vs refrigeration carbon
```

**Week 11: Analysis & Decision Gate**

**Success Criteria (Proceed to Scale):**
```
✓ Demand validation accuracy ≥70%
✓ Farmer income realization ≥50% of retail (vs baseline 20%)
✓ Food loss measured (baseline for Phase 2 target comparison)
✓ Energy intensity ≤2.5 kWh/t
✓ Food safety: Zero incidents
✓ Farmer retention: ≥80% commit to next cycle
✓ Buyer repeat: ≥60% of trial buyers place repeat orders
```

**If Success:** Proceed to Week 12 scaling plan
**If Concerns:** Diagnose and iterate (extend pilot 4 weeks)

**Week 12: Scaling Decision**

**Scenario 1: Pilot Successful**
```
DECISION: Scale to 4 production nodes (Manipur + Nagaland)

Immediate Actions:
1. Recruit 3 additional node managers + technicians
2. Procure 3 additional refrigeration systems
3. Engage 12 additional FPOs (3 per new node)
4. Launch second commodity (Kachai Lemon or Naga Tree Tomato)
5. Expand buyer network (8 → 15+ retail channels)
6. Deploy reefer fleet (4 vehicles for inter-node movement)

Timeline: 4 weeks (by end Month 4 / end Phase 1)
```

**Scenario 2: Demand Insufficient**
```
DECISION: Pilot commodity market doesn't exist OR buyer procurement process too slow

Corrective Actions:
1. Analyze demand validation failures (Claude prompts need refinement)
2. Switch to commodity with clearer demand (institutional buyer → schools)
3. Parallel test: Inbound food security flow (fish/meat) instead
4. Extend pilot 4 weeks

Timeline: Extend to Month 4
```

**Scenario 3: Operational Issues**
```
DECISION: Refrigeration system reliability OR pre-cool protocols not working

Corrective Actions:
1. Equipment upgrade (higher capacity / redundancy)
2. Staff retraining (protocols not followed)
3. Process redesign (aggregation timing issue?)
4. Extend pilot 4 weeks

Timeline: Extend to Month 4
```

---

## CLAUDE AI INTEGRATION (DETAILED SPECS)

### Service Implementation

**File:** `backend/src/services/coldStorageCoordinator.js`

```javascript
class ColdStorageCoordinator extends ClaudeAICoordinator {
  
  // 1. DEMAND VALIDATOR
  async validateDemand(buyerData) {
    /*
    Input: Buyer inquiry {name, channel, product, volume, price, repeat_history}
    Processing: Call Claude with buyer signal pattern recognition
    Output: {confidence_score: 0-100, recommendation: 'PROCEED'|'INVESTIGATE'|'REJECT'}
    */
    const prompt = `
      You are the demand validator for NEIA Northeast India cold-chain system.
      
      BUYER SIGNAL:
      ${JSON.stringify(buyerData)}
      
      CONTEXT DATA:
      - Channel repeat rate: ${this.getChannelRepeatRate(buyerData.channel)}%
      - Comparable buyers repeat: ${this.getComparableBuyerRepeat(buyerData)}%
      - Product market maturity: ${this.getProductMaturity(buyerData.product)}
      
      DECISION GATE:
      Only HIGH confidence demands (≥70%) proceed to supply scaling.
      
      Provide:
      1. Confidence score (0-100)
      2. Key risk factors
      3. Recommended supply commitment (kg)
      4. Farmer price guarantee (₹/kg)
      5. Gate decision (PROCEED / INVESTIGATE / REJECT)
    `;
    
    const response = await this.callClaudeAPI(prompt);
    
    // Log decision for transparency
    await this.logDecision({
      type: 'demand_validation',
      input: buyerData,
      output: response,
      timestamp: Date.now()
    });
    
    return this.parseClaudeResponse(response);
  }

  // 2. SUPPLY OPTIMIZER
  async optimizeDispatch(currentState) {
    /*
    Input: Current inventory + routes + orders + constraints
    Processing: Multi-variable optimization
    Output: {dispatch_plan, thermal_settings, cost_forecast}
    */
    const prompt = `
      You are supply chain optimizer for NEIA cold logistics.
      
      CURRENT STATE:
      - Manipur node: ${currentState.manipur_stock} kg
      - Dimapur hub capacity: ${currentState.dimapur_available} tonnes
      - Active orders: ${JSON.stringify(currentState.active_orders)}
      - Fleet: ${currentState.fleet_available} vehicles available
      - Energy cost: ₹${currentState.energy_rate}/kWh
      
      OBJECTIVE:
      Minimize total cost (transport + energy + storage + spoilage risk)
      Subject to:
      - Delivery timing windows (buyer deadlines)
      - Temperature compatibility (no mixing)
      - Vehicle payload constraints
      - Energy efficiency targets
      
      Provide dispatch schedule:
      1. Which product from which node
      2. Vehicle assignment
      3. Thermal set-point
      4. Route + ETA
      5. Estimated cost
      6. Risk flagging (utilisation risk, thermal risk)
    `;
    
    const response = await this.callClaudeAPI(prompt);
    
    // Execute operational changes
    await this.updateDispatchSchedule(response);
    
    return response;
  }

  // 3. FARMER PRICE MODELER
  async calculateFarmerGuarantee(buyerPrice, costData) {
    /*
    Input: Buyer WTP (₹/kg) + system costs + farmer baseline
    Output: Farmer price guarantee (₹/kg)
    */
    const prompt = `
      You are farmer income optimizer for NEIA system.
      
      ECONOMICS:
      - Buyer price: ₹${buyerPrice}/kg
      - Storage cost: ₹${costData.storage}/tonne/day
      - Transport cost: ₹${costData.transport}/tonne
      - Energy cost: ₹${costData.energy}/tonne
      - Baseline farm-gate: ₹${costData.baseline}/kg
      - Target farmer margin: ${costData.target_margin}%
      
      Calculate:
      1. Total cost per kg (all stages)
      2. System margin required (profit)
      3. Farmer guarantee price (maximize within constraints)
      4. Income projection for farmer
      5. Farmer incentive strength (₹ gain vs baseline)
    `;
    
    return await this.callClaudeAPI(prompt);
  }

  // 4. ENERGY PREDICTOR
  async predictEnergyDemand(weatherForecast, productLoad) {
    /*
    Input: Weather forecast + planned storage products
    Output: Hourly energy forecast + BESS dispatch schedule
    */
    const prompt = `
      You are energy optimizer for NEIA cold storage.
      
      FORECAST:
      - Ambient temp: ${weatherForecast.ambient_hourly}
      - Solar generation: ${weatherForecast.solar_hourly} kWh
      - Products in storage: ${JSON.stringify(productLoad)}
      - BESS capacity: 10 kWh (current SOC: ${this.bess_soc}%)
      
      OBJECTIVE:
      - Minimize grid import
      - Maximize solar utilization
      - Maintain temperature (product integrity first)
      - Optimize BESS dispatch
      
      Provide:
      1. Hourly cooling demand forecast
      2. Compressor schedule (on/off/throttle)
      3. BESS discharge schedule
      4. Grid import forecast
      5. Cost forecast (₹)
      6. Renewable ratio (%)
    `;
    
    return await this.callClaudeAPI(prompt);
  }

  // 5. NATURE SAFEGUARD MONITOR
  async monitorBiodiversity(sourcing) {
    /*
    Input: Product sourcing data + cultivation history
    Output: Extraction risk flagging + conservation signals
    */
    const prompt = `
      You are biodiversity monitor for NEIA food system.
      
      SOURCING DATA:
      ${JSON.stringify(sourcing)}
      
      CONSERVATION RULES:
      - Distinctive varieties must have stable/growing cultivation
      - Wild harvesting ≤20% of supply
      - Market premium must flow to farmer incentive
      
      Analyze:
      1. Is farmer likely to cultivate next season? (probability)
      2. Market premium adequate to justify conservation? (yes/no)
      3. Extraction pressure (wild vs cultivated ratio)
      4. Cultivation diversity (is portfolio healthy?)
      5. Recommendations (scale / hold / retrain)
    `;
    
    return await this.callClaudeAPI(prompt);
  }

}
```

### Claude Prompt Template (Demand Validation)

```
You are the DEMAND VALIDATOR for Lumiearth Foundation's cold-chain system serving Northeast India.

Your role: Distinguish real demand from exploratory interest. Only high-confidence signals should trigger farmer supply commitments.

BUYER SIGNAL:
- Company: ${buyer.name}
- Channel: ${buyer.channel} (specialty_retail | chef | institutional | digital)
- Product: ${buyer.product} (Bhut Jolokia | Kachai Lemon | etc)
- Inquiry Volume: ${buyer.inquiry_volume} kg
- Inquiry Tone: ${buyer.tone} (price_negotiating | product_curious | established_partnership | etc)
- Payment Terms: ${buyer.payment_terms}

HISTORICAL COMPARISON:
- This channel's repeat rate: 61% (specialty retail benchmark)
- Similar product market: ${similar_repeat}% repeat after trial
- This buyer's inquiry frequency: 3 in past 6 months
- Same buyer previously: Yes/No (has inquired before)

QUESTION:
Is this buyer likely to become a repeat customer (≥2 orders within 90 days)?

FRAMEWORK:
1. Demand Authenticity Score (0-100)
   - Trial order + repeat order = real demand
   - Trial order only = exploratory
   - Inquiry only = research signal
   
2. Risk Factors
   - Price negotiation (buyer cost-conscious?)
   - Volume commitment (flexible or fixed?)
   - Seasonality (does buyer need year-round or seasonal?)
   - Payment terms (cash on delivery or net 30?)
   
3. Recommended Actions
   - Supply commitment (if PROCEED)
   - Quality/specification focus
   - Pricing floor (farmer guarantee)
   - Contingency (if buyer doesn't repeat)

DECISION OUTPUT (JSON):
{
  "confidence_score": 0-100,
  "assessment": "Narrative of key factors",
  "recommendation": "PROCEED | INVESTIGATE | REJECT",
  "supply_commitment": "kg (if PROCEED)",
  "farmer_price_guarantee": "₹/kg",
  "farmer_income_projection": "₹/season",
  "risk_flags": ["price_sensitive", "seasonal_demand", "etc"],
  "decision_gate": "PROCEED | HOLD | REJECT"
}

CALIBRATION:
- Confidence ≥70%: PROCEED (farmer supply scaling)
- Confidence 50-70%: INVESTIGATE (pilot trial, don't scale)
- Confidence <50%: REJECT (not real demand, don't waste farmer effort)
```

---

## MEASUREMENT DASHBOARD (Frontend)

**Component:** `FarmerDashboard.jsx`

```jsx
export function FarmerDashboard({ farmerId }) {
  const [farmer, setFarmer] = useState(null);
  const [income, setIncome] = useState({
    baseline: 0,
    realised: 0,
    improvement_pct: 0
  });
  const [marketAccess, setMarketAccess] = useState([]);

  useEffect(() => {
    // Real-time income tracking
    api.getFarmerOutcomes(farmerId).then(outcome => {
      setIncome({
        baseline: outcome.income_baseline_rupees,
        realised: outcome.income_realised_rupees,
        improvement_pct: ((outcome.income_realised_rupees - outcome.income_baseline_rupees) / outcome.income_baseline_rupees) * 100
      });
    });
  }, []);

  return (
    <div className="farmer-dashboard">
      {/* THIS SEASON INCOME */}
      <Section title="This Season Income">
        <Card>
          <Metric label="Production" value={`${farmer?.production_kg} kg`} />
          <Metric label="Quality Grade" value="Grade 1 (95% confirmed)" />
          <Metric label="Price Guaranteed" value={`₹${income.guarantee_per_kg}/kg`} />
          <Metric label="Total Income (projected)" value={`₹${income.projected}`} />
          <Metric label="vs Farm-Gate Baseline" value={`+${income.improvement_pct}%`} color="green" />
        </Card>
      </Section>

      {/* MARKET CONNECTION */}
      <Section title="Who's Buying Your Product">
        {marketAccess.map(buyer => (
          <BuyerCard key={buyer.id}>
            <h4>{buyer.name}</h4>
            <p>Next order: {buyer.next_order_date}</p>
            <p>Repeat confidence: {buyer.claude_confidence}%</p>
            <p>Your price: ₹{buyer.farmer_price}/kg</p>
          </BuyerCard>
        ))}
      </Section>

      {/* QUALITY & PROCESS */}
      <Section title="Quality Tracking">
        <ProcessStep status="completed">
          Pre-cool temperature: 9°C achieved (within 4 hours)
        </ProcessStep>
        <ProcessStep status="completed">
          Aggregation grading: Grade 1 confirmed
        </ProcessStep>
        <ProcessStep status="in-progress">
          Storage: Temperature 8-10°C maintained
        </ProcessStep>
        <ProcessStep status="upcoming">
          Dispatch to buyer: ETA 2 days
        </ProcessStep>
      </Section>
    </div>
  );
}
```

---

## PHASE 1 SUCCESS METRICS

**Target Completion Date:** November 30, 2026

| Metric | Target | Measurement |
|--------|--------|-------------|
| Demand Validation Accuracy | ≥70% | Predicted repeat = Actual repeat |
| Farmer Income Realization | ≥50% of retail | ₹ received vs ₹ retail equivalent |
| Food Loss Reduction | Baseline measured | Kg lost vs baseline (extend to ≥30% in Phase 2) |
| Energy Efficiency | ≤2.5 kWh/tonne | Real-time monitoring + monthly report |
| Food Safety | 100% compliance | Zero incidents; all products meet standards |
| Farmer Retention | ≥80% | % committed to next season |
| Buyer Repeat Rate | ≥60% trial→repeat | Trial orders converting to repeat |
| Biodiversity | Stable cultivation | 4 farmers continuing Bhut Jolokia next season |

---

## HANDOFF TO DEVIN (IF NEEDED)

At end of Week 12, if Phase 1 is successful, prepare handoff document:

**Content:**
1. Operational procedures (how each component works)
2. Decision logs (what Claude decided + outcomes)
3. Farmer feedback (what worked, what needs improvement)
4. Buyer feedback (quality, timeliness, pricing)
5. Energy data (actual kWh/t achieved)
6. Cost analysis (what cost more/less than expected)
7. Scaling plan (4 nodes deployment, team expansion)
8. Claude prompt refinements (improve accuracy for Phase 2)

**Format:** Markdown in `.ai/handoffs/COLD_STORAGE_PHASE_1_COMPLETION.md`

---

## CRITICAL SUCCESS FACTORS

1. **Claude API Configuration:** Ensure API key is valid; test daily
2. **Farmer Communication:** WhatsApp-based for accessibility (many farmers not on web)
3. **Buyer Relationships:** Regular communication; respond to feedback immediately
4. **Temperature Integrity:** Any deviation = immediate investigation (food safety first)
5. **Decision Transparency:** Every decision logged + explained to farmer/buyer
6. **Data Quality:** All measurements recorded (energy, temperature, loss, income)
7. **Safety Net:** If demand fails, have fallback (direct market training for farmers)

---

**Next Action:** Begin Week 1 infrastructure setup. Target: First node operational by Week 4.
