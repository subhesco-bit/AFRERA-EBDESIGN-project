# Volume 15: AFRERA Renewable Energy Exchange (AREX)

## Executive Summary

This document defines the architecture for the AFRERA Renewable Energy Exchange (AREX)—an open partner ecosystem where qualified renewable energy companies can participate, similar to ONDC but for energy infrastructure. Instead of AFRERA owning the Energy Cloud, it becomes the digital infrastructure connecting farmers and rural communities with 100+ verified solar partners, battery providers, EPC companies, O&M providers, financiers, insurers, and carbon/ESG service providers.

## Platform Vision

### Core Philosophy

**Open Partner Ecosystem**: AFRERA is digital infrastructure, not an energy service provider. Multiple verified partners compete on quality, price, financing, service capability, and lifecycle support.

**AI-Driven Selection**: Farmers don't manually select contractors—AI ranks partners using price, quality, completion time, warranty, ratings, distance, service availability, O&M capability, and financing options.

**Community Energy Focus**: Beyond individual systems, enable village solar plants, community battery systems, solar irrigation networks, solar cold storage, and community EV charging.

### Mission Statement

> **"Connect every farmer and rural community with the most suitable renewable energy solution through an open partner ecosystem where verified energy providers compete on quality, price, financing, service capability, and lifecycle support."**

### Guiding Principle

> **AFRERA is the ONDC of rural energy infrastructure—digital infrastructure connecting stakeholders, not a single vendor.**

---

## Platform Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   REU        │  │   Village    │  │   Partner    │          │
│  │   Portal     │  │   Kiosk      │  │   Portal     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Mobile     │  │   AI Project │  │   Energy     │          │
│  │     App      │  │   Builder    │  │   Dashboard  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AFRERA Renewable Energy Exchange (AREX)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Partner    │  │   AI Partner │  │   Project    │          │
│  │  Management  │  │  Selection   │  │   Builder    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Digital    │  │   Community  │  │   PM-KUSUM   │          │
│  │ Marketplace  │  │   Energy     │  │ Integration  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Partner Ecosystem                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Solar EPC  │  │   Battery    │  │   Energy     │          │
│  │   Partners   │  │   Partners   │  │   as a       │          │
│  │              │  │              │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     O&M      │  │   Finance    │  │   Insurance  │          │
│  │   Partners   │  │   Partners   │  │   Partners   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Carbon     │  │   DISCOM     │  │   Smart      │          │
│  │   & ESG      │  │   Partners   │  │   Meter      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘

```

---

## Partner Ecosystem

### 1. Solar EPC Partner

**Services Offered**:
- Rooftop Solar
- Ground-mounted Solar
- PM-KUSUM (Solar Pumps)
- Solar Cold Storage
- Solar Microgrids
- Community Solar
- Solar Fish Farms
- Solar Dairy Infrastructure
- Solar Food Processing Units

**Capabilities Required**:
- MNRE empanelment (where applicable)
- State empanelment
- Certified engineers
- Installation capacity
- Service regions
- Warranty offerings
- AMC contracts

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "solar_epc",
  "company_name": "string",
  "empanelments": ["mnre", "state_solar_rooftop", "pm_kusum"],
  "certifications": ["iec", "bhel", "tier_1"],
  "service_regions": [{"state": "string", "districts": ["string"]}],
  "team_strength": {"engineers": 10, "technicians": 25},
  "installation_capacity_mw_per_year": 5,
  "completed_projects": 150,
  "customer_ratings": 4.5,
  "warranty_years": 25,
  "amc_offering": true
}

```

### 2. Battery Partner

**Services Offered**:
- Community BESS (Battery Energy Storage System)
- Residential BESS
- Commercial BESS
- Battery Leasing
- Battery Replacement
- Battery O&M
- Battery Recycling

**Capabilities Required**:
- Battery manufacturer partnerships
- Installation certification
- Safety certifications
- Service regions
- Warranty offerings
- Recycling partnerships

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "battery",
  "company_name": "string",
  "battery_manufacturers": ["lithium_exide", "tata", "amara_raja"],
  "battery_types": ["lithium_ion", "lead_acid", "flow_battery"],
  "capacities": [{"kwh": 10, "kw": 5}, {"kwh": 50, "kw": 25}],
  "warranty_years": 10,
  "recycling_partner": true,
  "leasing_available": true
}

```

### 3. Energy-as-a-Service Provider

**Services Offered**:
- Electricity supply
- Backup power
- Irrigation power
- Cooling power
- Processing power
- Pay-as-you-go models

**Business Model**:
- Not selling equipment
- Selling electricity/service
- Monthly/annual subscription
- Performance-based pricing
- Maintenance included

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "eaas",
  "company_name": "string",
  "service_types": ["electricity", "backup", "irrigation", "cooling"],
  "pricing_model": "per_kwh",
  "base_rate_per_kwh": 5.5,
  "minimum_subscription_months": 12,
  "maintenance_included": true,
  "performance_guarantee": 95
}

```

### 4. O&M Partner

**Services Offered**:
- Preventive maintenance
- Breakdown service
- Remote monitoring
- Warranty management
- Spare parts supply
- Performance optimization

**Capabilities Required**:
- Certified technicians
- Remote monitoring systems
- Spare parts inventory
- Service level agreements
- Response time guarantees

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "om",
  "company_name": "string",
  "service_types": ["solar", "battery", "inverter"],
  "technicians": 15,
  "service_regions": [{"state": "string", "districts": ["string"]}],
  "response_time_hours": 24,
  "remote_monitoring": true,
  "spare_parts_inventory": true,
  "amc_contracts": 200
}

```

### 5. Finance Partner

**Services Offered**:
- Solar loans
- Battery finance
- Energy subscription finance
- Pay-as-you-save models
- Leasing
- Working capital
- Subsidy-linked financing

**Capabilities Required**:
- RBI/NBFC registration
- Solar financing experience
- Subsidy processing
- EMI flexibility
- Interest rate competitiveness

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "finance",
  "company_name": "string",
  "institution_type": "bank|nbfc|cooperative",
  "loan_products": ["solar_loan", "battery_finance", "subscription_finance"],
  "interest_rate_range": {"min": 8.5, "max": 12},
  "tenure_range_years": {"min": 3, "max": 10},
  "subsidy_processing": true,
  "pay_as_you_save": true,
  "collateral_requirements": "flexible"
}

```

### 6. Insurance Partner

**Products Offered**:
- Plant insurance
- Equipment breakdown
- Fire insurance
- Natural disasters
- Business interruption
- Liability insurance

**Capabilities Required**:
- IRDAI registration
- Renewable energy insurance experience
- Claim processing capability
- Competitive premiums

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "insurance",
  "company_name": "string",
  "insurance_products": ["plant", "equipment_breakdown", "fire", "natural_disaster", "business_interruption"],
  "premium_range": {"min": 0.5, "max": 2},
  "claim_settlement_days": 7,
  "renewal_discount": true
}

```

### 7. Carbon & ESG Partner

**Services Offered**:
- Carbon accounting
- Carbon credit aggregation (where applicable)
- ESG reporting
- Sustainability reporting
- Carbon footprint analysis

**Capabilities Required**:
- Carbon accounting certification
- ESG reporting experience
- Verification partnerships
- Carbon market access

**Profile Data**:

```json

{
  "partner_id": "uuid",
  "partner_type": "carbon_esg",
  "company_name": "string",
  "services": ["carbon_accounting", "esg_reporting", "sustainability_reporting"],
  "certifications": ["iso_14064", "ghg_protocol"],
  "carbon_market_access": true,
  "verification_partners": ["string"]
}

```

---

## AI Partner Selection Engine

### Selection Criteria

**Primary Criteria**:
- Price (total project cost)
- Quality (certifications, empanelments)
- Completion time
- Warranty period
- Previous ratings
- Distance from site
- Service availability
- O&M capability
- Financing options
- AMC offering

### AI Ranking Algorithm

```javascript

function rankPartners(requirements, availablePartners) {
  const scored = availablePartners.map(partner => {
    const score = {
      partner: partner,
      price_score: calculatePriceScore(partner, requirements),
      quality_score: calculateQualityScore(partner),
      time_score: calculateTimeScore(partner, requirements),
      warranty_score: calculateWarrantyScore(partner),
      rating_score: calculateRatingScore(partner),
      distance_score: calculateDistanceScore(partner, requirements.location),
      service_score: calculateServiceScore(partner),
      om_score: calculateOMScore(partner),
      finance_score: calculateFinanceScore(partner, requirements),
      amc_score: calculateAMCScore(partner)
    };
    
    score.total_score = 
      score.price_score * 0.25 +
      score.quality_score * 0.15 +
      score.time_score * 0.10 +
      score.warranty_score * 0.10 +
      score.rating_score * 0.15 +
      score.distance_score * 0.05 +
      score.service_score * 0.05 +
      score.om_score * 0.05 +
      score.finance_score * 0.05 +
      score.amc_score * 0.05;
    
    return score;
  });
  
  return scored.sort((a, b) => b.total_score - a.total_score);
}

```

### Scoring Functions

**Price Score**:

```javascript

function calculatePriceScore(partner, requirements) {
  const quotation = partner.quotation;
  const budget = requirements.budget;
  const marketAverage = requirements.market_average;
  
  if (quotation <= budget) {
    return 100;
  } else if (quotation <= marketAverage) {
    return 80;
  } else if (quotation <= marketAverage * 1.1) {
    return 60;
  } else {
    return 40;
  }
}

```

**Quality Score**:

```javascript

function calculateQualityScore(partner) {
  let score = 0;
  
  // Empanelments
  if (partner.empanelments.includes('mnre')) score += 30;
  if (partner.empanelments.includes('state_solar_rooftop')) score += 20;
  if (partner.empanelments.includes('pm_kusum')) score += 20;
  
  // Certifications
  if (partner.certifications.includes('iec')) score += 15;
  if (partner.certifications.includes('bhel')) score += 10;
  if (partner.certifications.includes('tier_1')) score += 5;
  
  return score;
}

```

**Distance Score**:

```javascript

function calculateDistanceScore(partner, location) {
  const distance = calculateDistance(partner.service_region, location);
  
  if (distance <= 50) return 100;
  if (distance <= 100) return 80;
  if (distance <= 200) return 60;
  if (distance <= 300) return 40;
  return 20;
}

```

---

## Digital Marketplace

### Partner Profile Management

**Company Profile**:
- Company name and registration
- Contact information
- Business registration documents
- GST registration
- PAN verification

**Certifications & Empanelments**:
- MNRE empanelment
- State empanelments
- PM-KUSUM empanelment
- IEC certification
- BHEL certification
- Tier-1 classification

**Service Regions**:
- States served
- Districts served
- Service radius
- Regional offices

**Team Strength**:
- Engineers count
- Technicians count
- Project managers count
- Service team count

**Live Pricing**:
- Product catalogue
- Service rates
- Installation charges
- AMC rates

**Completed Projects**:
- Project count
- Total capacity installed
- Project types
- Customer testimonials

**Customer Ratings**:
- Overall rating
- Quality rating
- Timeliness rating
- Service rating
- Price rating

**AMC Offerings**:
- AMC plans
- Response time
- Warranty coverage
- Spare parts included

---

## PM-KUSUM Integration

### Empanelled Installer Integration

**State Empanelment Systems**:
- Tripura PM-KUSUM
- Other state PM-KUSUM systems
- State Solar Rooftop programs

**Integration Approach**:
- Onboard empanelled installers
- Verify empanelment status
- Sync project data with state systems
- Facilitate subsidy applications
- Track approval status

**Workflow**:

```
Farmer Request
      ↓
AI Project Builder
      ↓
PM-KUSUM Eligibility Check
      ↓
Empanelled Partner Selection
      ↓
Quotation Generation
      ↓
Subsidy Application
      ↓
State System Integration
      ↓
Approval Tracking
      ↓
Installation
      ↓
Commissioning
      ↓
Subsidy Disbursement

```

### Subsidy Management

**Subsidy Types**:
- PM-KUSUM Component A (Central)
- PM-KUSUM Component B (State)
- State Solar Rooftop Subsidy
- DISCOM Incentives

**Subsidy Processing**:
- Eligibility verification
- Document collection
- Application submission
- Approval tracking
- Disbursement coordination

---

## Community Energy Projects

### Project Types

**Village Solar Plants**:
- Community solar farms
- Shared ownership models
- FPO-owned plants
- Village panchayat plants

**Community Battery Systems**:
- Village BESS
- Shared battery storage
- Peak shaving
- Backup power

**Solar Irrigation Networks**:
- Solar pump networks
- Shared irrigation infrastructure
- Water storage integration
- Timed irrigation systems

**Solar Cold Storage**:
- Village cold storage
- Solar-powered cold rooms
- Shared cold chain
- FPO cold storage

**Solar Fish Farms**:
- Solar-powered aeration
- Solar-powered pumps
- Solar-powered processing
- Integrated systems

**Solar Dairy Infrastructure**:
- Solar-powered chilling
- Solar-powered processing
- Solar-powered packaging
- Integrated systems

**Solar Food Processing Units**:
- Solar-powered processing
- Solar-powered drying
- Solar-powered packaging
- Integrated systems

**Community EV Charging**:
- Solar-powered charging stations
- Battery swapping
- Community charging hubs
- Grid integration

### Community Project Workflow

```
Village Interest
      ↓
Feasibility Study
      ↓
Community Consent
      ↓
FPO/Panchayat Registration
      ↓
AI Project Design
      ↓
Partner Selection
      ↓
Financing Arrangement
      ↓
Subsidy Application
      ↓
Installation
      ↓
Commissioning
      ↓
Revenue Sharing Setup
      ↓
O&M Contract
      ↓
Monitoring

```

---

## AI Project Builder

### Input Parameters

**Farmer/Village Inputs**:
- Village location
- Connected load (kW)
- Farm size (acres)
- Irrigation needs (hours/day)
- Outage duration (hours/day)
- Budget range
- Energy consumption pattern
- Future expansion plans

### AI Recommendations

**System Design**:

```javascript

function designEnergySystem(inputs) {
  const design = {
    solar_capacity: calculateSolarCapacity(inputs),
    battery_capacity: calculateBatteryCapacity(inputs),
    inverter_capacity: calculateInverterCapacity(inputs),
    system_type: determineSystemType(inputs),
    individual_vs_community: compareIndividualVsCommunity(inputs),
    estimated_cost: calculateEstimatedCost(design),
    estimated_savings: calculateEstimatedSavings(design, inputs),
    payback_period: calculatePaybackPeriod(design, inputs),
    financing_options: getFinancingOptions(design, inputs),
    eligible_partners: getEligiblePartners(design, inputs),
    applicable_schemes: getApplicableSchemes(design, inputs),
    om_plan: generateOMPlan(design)
  };
  
  return design;
}

```

**Solar Capacity Calculation**:

```javascript

function calculateSolarCapacity(inputs) {
  const dailyConsumption = inputs.connected_load * 24;
  const solarGeneration = 4; // average 4 hours peak sun
  const solarCapacity = dailyConsumption / solarGeneration;
  
  return {
    recommended_capacity_kw: Math.ceil(solarCapacity),
    roof_area_required_sqft: solarCapacity * 100,
    ground_area_required_sqft: solarCapacity * 120
  };
}

```

**Battery Capacity Calculation**:

```javascript

function calculateBatteryCapacity(inputs) {
  const outageHours = inputs.outage_duration;
  const connectedLoad = inputs.connected_load;
  const batteryCapacity = outageHours * connectedLoad;
  
  return {
    recommended_capacity_kwh: Math.ceil(batteryCapacity),
    backup_hours: outageHours,
    autonomy_days: 1
  };
}

```

**Individual vs Community Comparison**:

```javascript

function compareIndividualVsCommunity(inputs) {
  const individual = {
    cost_per_kw: 45000,
    maintenance_per_kw: 500,
    total_cost: 45000 * inputs.solar_capacity
  };
  
  const community = {
    cost_per_kw: 38000,
    maintenance_per_kw: 400,
    total_cost: 38000 * inputs.solar_capacity,
    participants: 50,
    cost_per_participant: individual.total_cost / 50
  };
  
  return {
    individual: individual,
    community: community,
    recommendation: community.cost_per_participant < individual.total_cost ? 'community' : 'individual',
    savings: individual.total_cost - community.cost_per_participant
  };
}

```

### Output Display

**Farmer/Village Receives**:
- Recommended system capacity
- Estimated project cost
- Estimated annual savings
- Payback period
- Financing options
- Top 3 ranked partners
- Applicable government schemes
- O&M plan
- AMC options

---

## Revenue Model

### Digital Infrastructure Revenue

**Qualified Lead Generation**:
- Per qualified lead fee
- Per project conversion fee
- Per kW installed fee

**Project Management Fees**:
- Project coordination fee
- Documentation fee
- Subsidy processing fee
- Commissioning fee

**Marketplace Commissions**:
- Percentage of project value
- Tiered commission structure
- Volume discounts for partners

**Subscription Services**:
- Monitoring subscription
- Analytics subscription
- Reporting subscription
- Premium partner subscription

**Monitoring and Analytics**:
- Per device monitoring fee
- Data analytics fee
- Performance reporting fee
- Alert service fee

**O&M Coordination**:
- O&M coordination fee
- AMC facilitation fee
- Spare parts coordination fee
- Service scheduling fee

**Financing Facilitation**:
- Loan origination fee
- Documentation fee
- Processing coordination fee
- Success fee

**Energy Management Software**:
- Software licensing
- Per user fee
- Per device fee
- Premium features

---

## Extended Rural Energy Ecosystem

### Additional Partners

**DG Providers**:
- Backup diesel generators
- Hybrid systems
- Fuel management
- Maintenance

**Biogas Companies**:
- Biogas plant installation
- Feedstock management
- Gas purification
- Maintenance

**Biomass Companies**:
- Biomass gasifiers
- Fuel supply
- Maintenance
- Ash management

**Microgrid Developers**:
- Village microgrids
- Grid integration
- Load balancing
- Maintenance

**Smart Meter Companies**:
- Smart meter installation
- AMI systems
- Data collection
- Analytics

**IoT Providers**:
- Sensor deployment
- Data collection
- Remote monitoring
- Analytics

**Energy Management Software Vendors**:
- EMS software
- Analytics platforms
- Reporting tools
- Integration services

**DISCOM Partners**:
- Net metering
- Grid synchronization
- Billing integration
- Regulatory compliance

---

## Technology Architecture

### Backend Services

**Partner Management Service**:
- Partner registration
- Profile management
- Certification verification
- Empanelment verification
- Rating management

**AI Partner Selection Service**:
- Partner ranking
- Quotation comparison
- Multi-criteria scoring
- Recommendation engine

**Digital Marketplace Service**:
- Partner catalog
- Product catalog
- Pricing management
- Availability management

**Project Builder Service**:
- AI system design
- Cost estimation
- Savings calculation
- Payback analysis

**PM-KUSUM Integration Service**:
- State system integration
- Empanelment verification
- Subsidy application
- Approval tracking

**Community Energy Service**:
- Community project design
- Consent management
- Revenue sharing
- Governance

**Project Management Service**:
- Project tracking
- Milestone management
- Documentation
- Commissioning

**Monitoring Service**:
- Device monitoring
- Performance tracking
- Alert generation
- Analytics

**O&M Coordination Service**:
- AMC management
- Service scheduling
- Spare parts coordination
- Warranty management

### AI/ML Services

**Partner Selection AI**:
- Multi-criteria ranking
- Quotation analysis
- Performance prediction
- Risk assessment

**System Design AI**:
- Capacity optimization
- Cost optimization
- Technology selection
- ROI maximization

**Demand Prediction AI**:
- Energy demand forecasting
- Load profiling
- Peak demand prediction
- Storage optimization

**Performance AI**:
- Performance monitoring
- Anomaly detection
- Predictive maintenance
- Optimization recommendations

### Frontend Applications

**REU Portal**:
- Project request
- Partner comparison
- Quotation review
- Project tracking

**Partner Portal**:
- Profile management
- Quotation submission
- Project management
- Performance reporting

**Village Kiosk**:
- Community project request
- Partner information
- Subsidy information
- Application support

**Mobile App**:
- Project request
- Partner selection
- Monitoring
- Alerts

---

## Database Schema

### Partners Table

```sql

CREATE TABLE energy_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Details
  company_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL, -- solar_epc, battery, eaas, om, finance, insurance, carbon_esg
  partner_subtype VARCHAR(50),
  
  -- Registration
  registration_number VARCHAR(100),
  gst_number VARCHAR(15),
  pan_number VARCHAR(10),
  incorporation_date DATE,
  
  -- Contact
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address JSONB,
  
  -- Certifications
  certifications JSONB, -- [{type, number, expiry_date}]
  empanelments JSONB, -- [{scheme, state, number, expiry_date}]
  
  -- Service Regions
  service_regions JSONB, -- [{state, districts, service_radius}]
  
  -- Team
  team_strength JSONB, -- {engineers, technicians, project_managers, service_team}
  
  -- Capacity
  installation_capacity_mw_per_year DECIMAL,
  completed_projects INTEGER DEFAULT 0,
  
  -- Performance
  overall_rating DECIMAL,
  quality_rating DECIMAL,
  timeliness_rating DECIMAL,
  service_rating DECIMAL,
  price_rating DECIMAL,
  
  -- Offerings
  warranty_years INTEGER,
  amc_offering BOOLEAN DEFAULT false,
  financing_available BOOLEAN DEFAULT false,
  
  -- Status
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### Energy Projects Table

```sql

CREATE TABLE energy_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Project Details
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_type VARCHAR(50) NOT NULL, -- rooftop_solar, ground_mounted, solar_pump, community_solar, battery, microgrid
  
  -- System Design
  solar_capacity_kw DECIMAL,
  battery_capacity_kwh DECIMAL,
  inverter_capacity_kw DECIMAL,
  system_type VARCHAR(50),
  
  -- Location
  location JSONB NOT NULL,
  
  -- Partner Selection
  solar_epc_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  battery_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  om_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  
  -- Pricing
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  
  -- Financing
  finance_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  loan_amount DECIMAL,
  loan_interest_rate DECIMAL,
  loan_tenure_years INTEGER,
  
  -- Subsidy
  subsidy_scheme VARCHAR(100),
  subsidy_amount DECIMAL,
  subsidy_status VARCHAR(50), -- applied, approved, rejected, disbursed
  
  -- Timeline
  proposed_start_date DATE,
  proposed_completion_date DATE,
  actual_start_date DATE,
  actual_completion_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'planning', -- planning, approved, in_progress, completed, commissioned
  
  -- Performance
  annual_generation_kwh DECIMAL,
  annual_savings DECIMAL,
  payback_period_years DECIMAL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### Partner Quotations Table

```sql

CREATE TABLE partner_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES energy_projects(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES energy_partners(id) ON DELETE CASCADE,
  
  -- Quotation Details
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  quotation_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  -- Pricing
  base_cost DECIMAL NOT NULL,
  installation_cost DECIMAL,
  total_cost DECIMAL NOT NULL,
  
  -- Specifications
  solar_capacity_kw DECIMAL,
  panel_brand VARCHAR(100),
  inverter_brand VARCHAR(100),
  battery_brand VARCHAR(100),
  
  -- Warranty
  warranty_years INTEGER,
  warranty_details TEXT,
  
  -- Timeline
  completion_days INTEGER,
  proposed_completion_date DATE,
  
  -- AMC
  amc_available BOOLEAN DEFAULT false,
  amc_cost_annual DECIMAL,
  amc_details TEXT,
  
  -- Financing
  financing_available BOOLEAN DEFAULT false,
  financing_details JSONB,
  
  -- AI Score
  ai_score DECIMAL,
  ai_ranking INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, reviewed, accepted, rejected
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### Community Energy Projects Table

```sql

CREATE TABLE community_energy_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Community Details
  community_type VARCHAR(50) NOT NULL, -- fpo, panchayat, cooperative, village
  community_id UUID,
  community_name VARCHAR(255),
  location JSONB NOT NULL,
  
  -- Project Details
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_type VARCHAR(50) NOT NULL, -- village_solar, community_battery, solar_irrigation, solar_cold_storage
  
  -- System Design
  solar_capacity_kw DECIMAL,
  battery_capacity_kwh DECIMAL,
  inverter_capacity_kw DECIMAL,
  
  -- Governance
  participants INTEGER,
  governance_model VARCHAR(50), -- fpo_owned, panchayat_owned, cooperative, shared_ownership
  revenue_sharing_model JSONB,
  
  -- Partners
  solar_epc_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  om_partner_id UUID REFERENCES energy_partners(id) ON DELETE SET NULL,
  
  -- Financing
  total_investment DECIMAL,
  participant_contribution DECIMAL,
  subsidy_amount DECIMAL,
  loan_amount DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'planning', -- planning, consent, approved, in_progress, completed, commissioned
  
  -- Performance
  annual_generation_kwh DECIMAL,
  annual_revenue DECIMAL,
  participant_annual_savings DECIMAL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

---

## Success Metrics

### Primary KPI

**Partner Metrics**:
- Active partners by type
- Partner satisfaction
- Partner retention rate
- Partner revenue

**Project Metrics**:
- Projects commissioned
- Total capacity installed
- Average project cost per kW
- Average completion time

**Farmer Metrics**:
- Farmer satisfaction
- Average savings per farmer
- Payback period achievement
- Adoption rate

**Community Metrics**:
- Community projects commissioned
- Participants per project
- Community satisfaction
- Revenue sharing accuracy

### Secondary KPIs

**Marketplace Metrics**:
- Quotation response time
- Quotation acceptance rate
- Partner ranking accuracy
- Price competitiveness

**Subsidy Metrics**:
- Subsidy application success rate
- Subsidy disbursement time
- Subsidy amount per project

**Performance Metrics**:
- System performance ratio
- Downtime percentage
- AMC uptake rate
- Warranty claims rate

---

## Conclusion

The AFRERA Renewable Energy Exchange (AREX) transforms the energy cloud from a single-vendor model to an open partner ecosystem. By becoming digital infrastructure that connects farmers and rural communities with 100+ verified energy partners, AFRERA will:

1. **Increase Competition**: Multiple partners compete on quality, price, and service
2. **Improve Selection**: AI-driven partner selection based on multiple criteria
3. **Enable Community Energy**: Support village-level energy projects
4. **Integrate Government Schemes**: Seamless PM-KUSUM and state program integration
5. **Provide Choice**: Farmers get comparable quotations from multiple partners
6. **Reduce Risk**: Verified partners, ratings, and performance tracking

This architecture positions AFRERA as **the ONDC of rural energy infrastructure**, where the platform's AI helps farmers and villages select the most suitable solution rather than locking them into a single vendor, while generating revenue through digital infrastructure services rather than equipment sales.
