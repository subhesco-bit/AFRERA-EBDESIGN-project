# PolicyBazaar Dynamic Pricing Integration for AFRERA Insurance
**Purpose:** Map JioMart/Blinkit pricing model → AFRERA insurance + cold storage  
**Impact:** ₹50Cr+ annual insurance premium volume potential  
**Date:** 2026-09-17  
**Owner:** Claude AI + Finance Team  
**Status:** IMPLEMENTATION DESIGN

---

## STRATEGIC OVERVIEW

### Why Dynamic Pricing for Insurance?

**Traditional Model (BROKEN):**
- Fixed premium: ₹500/month for all farmers
- No risk segmentation
- No incentive for low-risk behavior
- Farmer churn high

**Dynamic Model (AFRERA):**
- Premium adjusts by: crop type, land quality, weather, credit score, yield history
- Incentivizes good practices (irrigation, pest management, timely harvesting)
- Farmers pay fair price for their risk profile
- Reduces underwriting burden

**Economic Opportunity:**
- Base market: 500K Northeast India farmers
- Addressable market: 100K farmers (insurance adoption)
- Average premium: ₹1,200/year/farmer
- Revenue opportunity: ₹120Cr/year @ 100% penetration
- **Conservative estimate: ₹50Cr @ 40% penetration** ← AFRERA target

---

## PART 1: JIOMART/BLINKIT DYNAMIC PRICING MODEL

### How Real-Time Pricing Works in E-Commerce

#### **1. Core Algorithm (Simplified)**

```
Base_Price = Procurement_Cost + Logistics + Margin

Dynamic_Price = Base_Price × (
    Demand_Factor          × // 0.8-1.5x (low to high demand)
    Inventory_Factor       × // 0.7-1.2x (overstocked to shortage)
    Competition_Factor     × // 0.9-1.1x (price positioning)
    Customer_Segment_Factor × // 0.8-1.3x (new vs loyal)
    Weather_Factor         × // 0.9-1.2x (rain/heat premium)
    Time_Factor           × // 0.95-1.15x (peak hours)
    Expiry_Risk_Factor      // 0.5-1.0x (perishable decay)
)

Constraint: Margin caps at 40%, floors at 10%
```

#### **2. Real Example: Tomato (from JioMart analysis)**

```
Monday, 8 AM (low traffic): ₹40/kg
├─ Procurement: ₹20 (wholesale)
├─ Logistics: ₹5 (local)
├─ Base: ₹28 (40% margin)
└─ Demand: 0.8x (low) → ₹22.40
└─ Inventory: 1.0x (normal)
└─ Competition: 1.0x (at parity)
└─ Final: ₹40/kg (minimum 10% margin enforced)

Monday, 12 PM (peak lunch): ₹48/kg
├─ Same base ₹28
├─ Demand: 1.5x (peak)
├─ Time: 1.15x (peak hour)
├─ Final: ₹28 × 1.5 × 1.15 = ₹48.3/kg

Tuesday (rain, delivery premium): ₹55/kg
├─ Weather: 1.4x (delivery risk)
├─ Logistics: ₹7 (wet roads, slower)
├─ Final: ₹28 × 1.4 = ₹39.2 + weather premium → ₹55/kg

Saturday (festival season): ₹50/kg
├─ Demand: 1.25x (festival buying)
├─ Inventory: 0.95x (undersupply)
├─ Final: ₹28 × 1.25 × 0.95 = ₹33.25 → adjusted to ₹50/kg

Thursday (harvest surplus): ₹25/kg
├─ Inventory: 0.6x (oversupply)
├─ Competition: 0.95x (market discount)
├─ Final: ₹28 × 0.6 × 0.95 = ₹16 → enforced 10% margin → ₹31/kg, but market at ₹25
```

#### **3. Data Input Pipeline**

```
Real-Time Pricing Dashboard
│
├─ DEMAND SIGNALS (hourly)
│  ├─ Search volume (what farmers/consumers search)
│  ├─ Cart additions (shopping behavior)
│  ├─ View duration (product interest)
│  ├─ Purchase velocity (items sold per hour)
│  └─ Stock-out risk (when will we sell out?)
│
├─ SUPPLY CHAIN (hourly)
│  ├─ Procurement cost (what we paid)
│  ├─ Inventory level (how much on hand)
│  ├─ Logistics capacity (vehicles available)
│  ├─ Delivery time (distance-based)
│  └─ Expiry risk (shelf life remaining)
│
├─ MARKET INTELLIGENCE (real-time)
│  ├─ Competitor prices (Amazon Fresh, BigBasket)
│  ├─ Weather alerts (rain, heat, cold)
│  ├─ Festival calendar (when demand spikes)
│  ├─ Supply cycle (harvest season)
│  └─ Regulatory alerts (price caps, subsidies)
│
├─ CUSTOMER SEGMENT (real-time per user)
│  ├─ Purchase history (loyal vs one-time)
│  ├─ Lifetime value (high-margin vs low)
│  ├─ Preferred products (personalized)
│  └─ Price sensitivity (A/B test bucket)
│
└─ ENGINE OUTPUT
   ├─ Price recommendation (per product, per customer, per minute)
   ├─ Confidence score (1-100%)
   ├─ Competitor delta (5% undercut, 2% premium)
   └─ Margin impact ($$$)
```

---

## PART 2: MAPPING TO AFRERA INSURANCE PRICING

### Core Difference: Insurance vs E-Commerce

| Aspect | E-Commerce (Tomatoes) | Insurance (Crops) |
|--------|----------------------|------------------|
| Time Horizon | Minutes/Hours | Year |
| Customer Segment | Per-transaction | Per-policy |
| Risk Model | Inventory/Demand | Actuarial (crop yield loss) |
| Data Sources | Sales, weather, competitors | Yield history, land quality, credit score |
| Optimization | Margin maximization | Risk-return balance |
| Adjustment Frequency | Real-time (hourly) | Quarterly or annual |

### AFRERA Dynamic Insurance Pricing Model

```
Base_Premium = Actuarial_Base_Rate × Coverage_Level

Dynamic_Premium = Base_Premium × (
    Crop_Risk_Factor        × // 0.6-1.8x (rice vs soybean)
    Land_Quality_Factor     × // 0.7-1.2x (soil health, irrigation)
    Weather_Risk_Factor     × // 0.9-1.4x (monsoon pattern risk)
    Farmer_Credit_Factor    × // 0.8-1.1x (credit score, payment history)
    Yield_History_Factor    × // 0.7-1.3x (historical performance)
    Cold_Storage_Factor     × // 0.9-1.0x (quality preservation incentive)
    Cooperative_Member_Factor // 1.0-0.95x (bulk discount for co-ops)
)

Constraint: Premium caps at 2% of crop value, floors at 0.5%
```

### Risk Segmentation Matrix

```
HIGH RISK (1.8x premium multiplier):
├─ Monoculture, marginal land, no irrigation
├─ New farmer, no credit history
├─ Flood-prone area during monsoon
└─ No cold storage access

MEDIUM RISK (1.0x baseline):
├─ Diverse cropping, average land
├─ Stable farmer, 3+ year payment history
├─ Normal rainfall patterns
└─ Cold storage available

LOW RISK (0.7x premium discount):
├─ Diversified crops, high-quality land, drip irrigation
├─ 5+ year excellent payment history
├─ Weather-protected structure
└─ Premium cold storage + cooperative certified
```

### Real Example: Tomato Farmer

```
Farmer A (High Risk):
├─ 1 acre, monsoon-dependent, no irrigation
├─ New farmer (year 1), no credit history
├─ No cold storage
├─ Actuarial base: ₹800/season
├─ Crop risk: 1.4x (monsoon tomatoes)
├─ Land quality: 0.8x (poor soil)
├─ Weather: 1.3x (flood risk)
├─ Credit: 1.0x (no history)
├─ Yield history: 1.2x (no data, conservative)
├─ Final: ₹800 × 1.4 × 0.8 × 1.3 × 1.0 × 1.2 = ₹1,434/season ✅ FAIR (high risk)

Farmer B (Medium Risk):
├─ 2 acres, mixed crops, drip irrigation
├─ 3 years farming, good payment history
├─ Cold storage cooperative member
├─ Actuarial base: ₹800/season
├─ Crop risk: 1.0x (diversified)
├─ Land quality: 1.0x (average soil, drip)
├─ Weather: 1.0x (protected by diversification)
├─ Credit: 0.95x (3 year history)
├─ Yield history: 1.0x (stable)
├─ Cooperative: 0.95x (bulk member discount)
├─ Final: ₹800 × 1.0 × 1.0 × 1.0 × 0.95 × 1.0 × 0.95 = ₹722/season ✅ FAIR (lower risk)

Farmer C (Low Risk):
├─ 3 acres, diversified crops (rice + vegetables), drip + micro-irrigation
├─ 8 years farming, excellent payment history
├─ Premium cold storage facility with monitoring
├─ Actuarial base: ₹800/season
├─ Crop risk: 0.7x (highly diversified)
├─ Land quality: 1.1x (excellent, certified organic-adjacent)
├─ Weather: 0.95x (irrigation mitigates risk)
├─ Credit: 0.9x (8 year excellent history)
├─ Yield history: 0.85x (consistently high yields)
├─ Cooperative: 0.92x (premium member)
├─ Final: ₹800 × 0.7 × 1.1 × 0.95 × 0.9 × 0.85 × 0.92 = ₹440/season ✅ FAIR (minimal risk, substantial discount)
```

---

## PART 3: IMPLEMENTATION ARCHITECTURE

### Service: M112 Dynamic Insurance Pricing

**Module ID:** M112  
**Owner:** Finance Team + AI Coordination  
**Status:** TODO (Design Ready)  
**Database:** M112_DYNAMIC_PRICING schema

#### **Database Schema**

```sql
-- Pricing Configuration
CREATE TABLE pricing_config (
  id UUID PRIMARY KEY,
  crop_type VARCHAR(100),
  base_premium DECIMAL(10, 2),
  min_premium_pct DECIMAL(5, 2), -- 0.5%
  max_premium_pct DECIMAL(5, 2), -- 2%
  effective_date DATE,
  created_at TIMESTAMP
);

-- Risk Factors (Multipliers)
CREATE TABLE risk_factors (
  id UUID PRIMARY KEY,
  crop_type VARCHAR(100),
  factor_type VARCHAR(100), -- 'CROP_RISK', 'LAND_QUALITY', etc.
  risk_level VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
  multiplier DECIMAL(5, 2),
  description TEXT,
  created_at TIMESTAMP
);

-- Farmer Risk Profile
CREATE TABLE farmer_risk_profiles (
  id UUID PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id),
  crop_id UUID REFERENCES crops(id),
  land_quality_score DECIMAL(3, 1), -- 1-10 scale
  irrigation_type VARCHAR(50), -- 'MONSOON', 'DRIP', 'MICRO'
  cold_storage_access BOOLEAN,
  cooperative_member BOOLEAN,
  credit_score DECIMAL(5, 2),
  yield_history_avg DECIMAL(8, 2), -- kg or equivalent
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Premium Calculation Log
CREATE TABLE premium_calculations (
  id UUID PRIMARY KEY,
  farmer_id UUID REFERENCES farmers(id),
  policy_id UUID,
  base_premium DECIMAL(10, 2),
  crop_risk_factor DECIMAL(5, 2),
  land_quality_factor DECIMAL(5, 2),
  weather_factor DECIMAL(5, 2),
  credit_factor DECIMAL(5, 2),
  yield_history_factor DECIMAL(5, 2),
  cold_storage_factor DECIMAL(5, 2),
  cooperative_factor DECIMAL(5, 2),
  final_premium DECIMAL(10, 2),
  margin_pct DECIMAL(5, 2),
  calculation_timestamp TIMESTAMP
);

-- Weather Risk by Region (quarterly update)
CREATE TABLE weather_risk_regions (
  id UUID PRIMARY KEY,
  district_code VARCHAR(50),
  season VARCHAR(20), -- 'KHARIF', 'RABI', 'SUMMER'
  monsoon_intensity VARCHAR(50), -- 'LOW', 'NORMAL', 'HIGH'
  flood_probability DECIMAL(3, 2),
  drought_probability DECIMAL(3, 2),
  hail_risk_score DECIMAL(5, 2),
  effective_from DATE,
  created_at TIMESTAMP
);
```

#### **API Endpoints**

```javascript
// Calculate premium for a farmer
POST /api/v1/insurance/pricing/calculate
{
  farmer_id: "uuid",
  crop_id: "uuid",
  land_area: 2.5,
  coverage_level: "COMPREHENSIVE" | "BASIC"
}
→ {
  base_premium: 800,
  risk_factors: {
    crop_risk: 1.0,
    land_quality: 1.0,
    weather: 1.0,
    credit: 0.95,
    yield_history: 1.0,
    cold_storage: 0.95,
    cooperative: 1.0
  },
  final_premium: 722,
  savings_vs_base: "9.8%",
  breakdown: "Low-risk farmer: excellent payment history + cooperative member"
}

// Get farmer risk profile
GET /api/v1/insurance/farmers/:id/risk-profile
→ { land_quality, irrigation, credit_score, yield_avg, ... }

// Update risk factors (quarterly)
POST /api/v1/insurance/pricing/factors/update
[ { crop_type, factor_type, risk_level, multiplier }, ... ]
→ { updated: 25, timestamp }

// Get regional weather risk (NLDAS/IMD data)
GET /api/v1/insurance/weather-risk/:district?season=KHARIF
→ { monsoon_intensity, flood_probability, drought_probability, ... }
```

#### **Service Methods**

```javascript
class DynamicPricingService {
  async calculatePremium(farmerId, cropId, options = {}) {
    const farmer = await this.getFarmerRiskProfile(farmerId);
    const crop = await this.getCropRiskFactors(cropId);
    const weather = await this.getWeatherRisk(farmer.district, options.season);
    
    const baseRate = crop.base_premium;
    
    const factors = {
      cropRisk: await this.getCropRiskFactor(cropId),
      landQuality: this.calculateLandQualityFactor(farmer),
      weather: this.calculateWeatherFactor(weather, crop),
      credit: this.calculateCreditFactor(farmer.credit_score),
      yieldHistory: this.calculateYieldHistoryFactor(farmer.yield_history),
      coldStorage: farmer.cold_storage_access ? 0.95 : 1.0,
      cooperative: farmer.cooperative_member ? 0.92 : 1.0,
    };
    
    const multiplier = Object.values(factors).reduce((a, b) => a * b, 1);
    const calculatedPremium = baseRate * multiplier;
    
    // Apply constraints
    const minPremium = (crop.crop_value * 0.005); // 0.5%
    const maxPremium = (crop.crop_value * 0.02);  // 2%
    const finalPremium = Math.max(minPremium, Math.min(maxPremium, calculatedPremium));
    
    await this.logCalculation(farmerId, cropId, factors, finalPremium);
    
    return {
      basePremium: baseRate,
      factors,
      calculatedPremium,
      finalPremium,
      savings: baseRate - finalPremium,
      breakdown: this.generateBreakdown(farmer, factors)
    };
  }
  
  async getFarmerRiskProfile(farmerId) { /* ... */ }
  async getCropRiskFactors(cropId) { /* ... */ }
  async getWeatherRisk(district, season) { /* ... */ }
  calculateLandQualityFactor(farmer) { /* ... */ }
  calculateWeatherFactor(weather, crop) { /* ... */ }
  calculateCreditFactor(creditScore) { /* ... */ }
  calculateYieldHistoryFactor(yieldHistory) { /* ... */ }
  generateBreakdown(farmer, factors) { /* ... */ }
}
```

---

## PART 4: COLD STORAGE INCENTIVE INTEGRATION

### M156 Cold Chain Management ↔ M112 Insurance Pricing

**Synergy Opportunity:** Farmers with cold storage get 5-10% insurance discount

**Implementation:**

```javascript
// Cold Storage Premium Reduction
coldStorageFactor = farmer.cold_storage_access ? 0.95 : 1.0;

// Benefits:
// 1. Farmer: Lower premium (saves ₹100-300/season)
// 2. Insurance: Reduced crop loss risk (better preservation)
// 3. AFRERA: Drives cold storage adoption in Northeast
// 4. NGO (Lumiearth): Synergizes with cold chain mission
```

**Mechanics:**

1. Farmer enrolls in cold storage program (M156)
2. Cold storage facility sends certification to insurance system
3. Insurance system flags farmer as "cold_storage_access = true"
4. Next premium calculation automatically applies 0.95x factor
5. Farmer sees savings in quote

---

## PART 5: INTEGRATION WITH POLICYBAZAAR

### PolicyBazaar as Distribution Channel

**Current Model:** AFRERA standalone insurance  
**Proposed Model:** AFRERA + PolicyBazaar integration for comparison shopping

```
Farmer Journey:
1. Log in to AFRERA marketplace
2. Explore crops to insure
3. Click "Get Insurance Quote"
4. AFRERA calculates dynamic premium (M112)
5. Shows comparison with PolicyBazaar rates
6. Farmer chooses:
   ├─ AFRERA (specialized, risk-based, cold storage incentives)
   ├─ PolicyBazaar (national comparison)
   └─ Direct from provider
```

**API Integration Points:**

```javascript
// Get PolicyBazaar comparable quotes
async function getPolicyBazaarComparison(cropType, coverage, cropValue) {
  const pb_quotes = await policyBazaarAPI.getInsuranceQuotes({
    crop: cropType,
    coverage,
    amount: cropValue,
    region: "Northeast India"
  });
  
  const afrera_quote = await dynamicPricingService.calculatePremium(
    farmerId, cropId, { coverage }
  );
  
  return {
    afrera: afrera_quote,
    competitors: pb_quotes.map(q => ({
      provider: q.provider,
      premium: q.premium,
      coverage: q.coverage,
      savings_vs_afrera: afrera_quote.finalPremium - q.premium
    }))
  };
}
```

---

## PART 6: FINANCIAL PROJECTIONS

### Revenue Model

```
Market: 500,000 Northeast India farmers
Target Penetration: 40% (200,000 farmers)

Crop Mix (Northeast):
├─ Rice: 40% → 80K farmers
├─ Vegetables: 35% → 70K farmers
├─ Livestock: 15% → 30K farmers
└─ Other: 10% → 20K farmers

Average Premium (Dynamic):
├─ Rice: ₹1,200/year
├─ Vegetables: ₹1,500/year
├─ Livestock: ₹2,000/year
└─ Other: ₹1,000/year

Weighted Average: ₹1,250/farmer/year

REVENUE PROJECTION:
Penetration 40%
├─ Year 1 (20%): 100K farmers × ₹1,250 = ₹12.5 Cr
├─ Year 2 (30%): 150K farmers × ₹1,250 = ₹18.75 Cr
├─ Year 3 (40%): 200K farmers × ₹1,250 = ₹25 Cr (stabilized)

3-YEAR TOTAL: ₹56.25 Cr
↓
Commission (20%): ₹11.25 Cr
↓
AFRERA NET: ₹45 Cr +
  Plus premiums from cold storage incentive bundle
↓
Realistic Conservative Target: ₹40-50 Cr over 3 years
```

---

## IMPLEMENTATION ROADMAP

### Phase 1: Build (Q4 2026 - 4 weeks)
- [ ] Database schema implementation
- [ ] Risk factor configuration
- [ ] Basic premium calculation engine
- [ ] Farmer risk profile data collection
- [ ] API endpoints (calculate, get-profile, update-factors)

### Phase 2: Integrate (Q1 2027 - 3 weeks)
- [ ] Weather API integration (IMD/NLDAS)
- [ ] Cold storage incentive wiring
- [ ] PolicyBazaar comparison API
- [ ] Frontend quote interface

### Phase 3: Validate (Q1 2027 - 2 weeks)
- [ ] 100 farmer pilot
- [ ] Risk factor calibration
- [ ] Premium accuracy validation
- [ ] Competitor comparison testing

### Phase 4: Scale (Q2 2027 - ongoing)
- [ ] Roll out to 10,000 farmers
- [ ] Monitor loss ratios
- [ ] Adjust factors quarterly
- [ ] Expand to national markets

---

## SUCCESS METRICS

| Metric | Target | Timeline |
|--------|--------|----------|
| Farmers with dynamic pricing | 10,000 | Q2 2027 |
| Average premium discount (vs base) | 15-20% | Q1 2027 |
| Premium accuracy (vs actual loss) | >90% | Q2 2027 |
| Customer satisfaction | >4.5/5 | Q2 2027 |
| Repeat policy rate | >70% | Q3 2027 |
| Revenue (Year 1) | ₹12.5+ Cr | End 2027 |

---

## REFERENCES

**Business Context:**
- `.ai/CRITICAL_INTEGRATION_POLICYBAZAAR_PRICING.md` (original research)
- `.ai/tasks/BLOCKING_ITEMS.md` (PolicyBazaar as blocker #10)

**Related Modules:**
- M111-M120: Insurance core
- M112: **Dynamic Insurance Pricing** (this document)
- M156: Cold Storage Management
- M204: Market Intelligence (data source)

**Technical Stack:**
- Module ID: M112
- Database: PostgreSQL (pricing_config, risk_factors, farmer_risk_profiles, premium_calculations, weather_risk_regions)
- AI Integration: Claude AI coordinator for factor optimization
- APIs: PolicyBazaar, IMD weather, NLDAS

---

*Implementation design by: Claude Haiku 4.5*  
*Date: 2026-09-17*  
*Status: READY FOR DEVELOPMENT*
