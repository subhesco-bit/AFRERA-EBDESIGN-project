-- NAME FIX 2026-08-04: referenced "subsidy_applications", which exists nowhere.
-- The real table is "subsidy_claims". This single bad FK failed the
-- rural_enterprises CREATE TABLE and cascaded into 56 errors from this file.

-- NAME FIX 2026-08-04: this file referenced "insurance_policies", a table that
-- exists nowhere in the schema. The real table is "policies" (000_base_schema).
-- Every ALTER, index and foreign key here silently failed as a result.
-- Renamed 2 reference(s); FKs to it corrected to UUID to match policies.id.

-- AFRERA Rural Economic Operating System (Rural Life OS) Database Schema
-- This file contains database extensions for the Rural Economic Unit (REU) concept and 9-layer architecture

-- ============================================================================
-- RURAL ECONOMIC UNITS (REU)
-- ============================================================================

-- ===========================================================================
-- MISSING TABLE FIX 2026-08-04
--
-- This file references crops(id) in 4 foreign keys, but no migration anywhere
-- in the chain ever created a "crops" table. Every table carrying a crop_id
-- therefore failed to create, cascading into 77 errors from this file alone.
--
-- Defined here as the crop master. Deliberately minimal — it is a reference
-- list of what can be grown, not agronomic detail, which already lives in
-- native_crops_database, organic_crops and crop_plans. Linked to the v42
-- crop_concepts semantic index (992) so a crop resolves across languages.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_code VARCHAR(40) UNIQUE NOT NULL,
  common_name VARCHAR(120) NOT NULL,
  scientific_name VARCHAR(120),
  -- Optional link to the multilingual concept index from migration 992, so a
  -- crop recorded here is findable by its vernacular names.
  concept_key VARCHAR(40),
  category VARCHAR(60),               -- 'cereal' | 'spice' | 'horticulture' ...
  season VARCHAR(30)                  -- 'kharif' | 'rabi' | 'zaid' | 'perennial'
    CHECK (season IS NULL OR season IN ('kharif','rabi','zaid','perennial')),
  duration_days INTEGER CHECK (duration_days IS NULL OR duration_days > 0),
  is_perishable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crops_category ON crops (category);
CREATE INDEX IF NOT EXISTS idx_crops_concept ON crops (concept_key);

CREATE TABLE IF NOT EXISTS rural_economic_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- REU Classification
  reu_type VARCHAR(50) NOT NULL, -- individual, family, fpo, cooperative, shg, pacs, enterprise
  reu_subtype VARCHAR(50), -- farmer, dairy, fishery, processing, retail, service
  legal_structure VARCHAR(50), -- proprietorship, partnership, cooperative, company, trust
  registration_number VARCHAR(100),
  registration_date DATE,
  
  -- Location
  location JSONB NOT NULL, -- {village, district, state, pincode, latitude, longitude}
  
  -- Household Profile
  household_profile JSONB, -- {household_size, dependents, children_school_going, elderly_members, health_insurance_coverage, life_insurance_coverage, annual_consumption_budget, annual_cultivation_budget, annual_investment_budget}
  
  -- Economic Profile
  economic_profile JSONB, -- {annual_income, income_sources, assets, liabilities, net_worth}
  
  -- Membership
  membership JSONB, -- {members: [{member_id, role, relationship, age, gender, education, occupation}], total_members, working_members, dependent_members}
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rural_economic_units
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_user ON rural_economic_units(user_id);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_type ON rural_economic_units(reu_type);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_subtype ON rural_economic_units(reu_subtype);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_status ON rural_economic_units(status);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_location ON rural_economic_units USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_tags ON rural_economic_units USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_rural_economic_units_created_at ON rural_economic_units(created_at DESC);

-- ============================================================================
-- LAYER 1: DAILY HOUSEHOLD ECONOMY
-- ============================================================================

CREATE TABLE IF NOT EXISTS household_economy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Budget
  monthly_budget DECIMAL,
  annual_budget DECIMAL,
  
  -- Consumption Categories
  grocery_budget DECIMAL,
  dairy_budget DECIMAL,
  appliances_budget DECIMAL,
  school_supplies_budget DECIMAL,
  clothing_budget DECIMAL,
  medicines_budget DECIMAL,
  electronics_budget DECIMAL,
  building_materials_budget DECIMAL,
  lpg_budget DECIMAL,
  healthcare_budget DECIMAL,
  education_budget DECIMAL,
  
  -- Subscription
  subscription_id UUID,
  subscription_type VARCHAR(50), -- monthly, quarterly, annual
  subscription_status VARCHAR(50), -- active, inactive, cancelled
  subscription_start_date DATE,
  subscription_end_date DATE,
  
  -- Delivery
  delivery_schedule JSONB, -- {frequency, preferred_day, preferred_time}
  delivery_address JSONB,
  
  -- Savings
  consumption_savings DECIMAL,
  wholesale_savings DECIMAL,
  total_savings DECIMAL,
  
  -- Orders
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_household_economy_reu ON household_economy(reu_id);
CREATE INDEX IF NOT EXISTS idx_household_economy_subscription ON household_economy(subscription_id);
CREATE INDEX IF NOT EXISTS idx_household_economy_status ON household_economy(subscription_status);

-- Household Orders
CREATE TABLE IF NOT EXISTS household_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  household_economy_id UUID REFERENCES household_economy(id) ON DELETE SET NULL,
  
  -- Order Details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_type VARCHAR(50), -- grocery, dairy, appliances, etc.
  
  -- Items
  items JSONB, -- [{product_id, name, quantity, unit, price, total}]
  
  -- Pricing
  subtotal DECIMAL,
  discount DECIMAL,
  delivery_charge DECIMAL,
  total_amount DECIMAL,
  
  -- Delivery
  delivery_address JSONB,
  delivery_date DATE,
  delivery_time VARCHAR(50),
  delivery_status VARCHAR(50), -- pending, scheduled, in_transit, delivered
  tracking_id VARCHAR(100),
  
  -- Payment
  payment_status VARCHAR(50), -- pending, paid, failed, refunded
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, delivered, cancelled
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_household_orders_reu ON household_orders(reu_id);
CREATE INDEX IF NOT EXISTS idx_household_orders_number ON household_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_household_orders_status ON household_orders(status);
CREATE INDEX IF NOT EXISTS idx_household_orders_delivery ON household_orders(delivery_date, delivery_status);

-- ============================================================================
-- LAYER 2: FARM CONSUMABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS farm_consumables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  
  -- Input Details
  input_type VARCHAR(50) NOT NULL, -- seed, fertilizer, protection, micronutrient, mulch, irrigation, feed
  input_category VARCHAR(50), -- chemical, organic, biofertilizer, biopesticide
  input_name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  specifications JSONB,
  
  -- Quantity
  quantity DECIMAL NOT NULL,
  unit VARCHAR(20) NOT NULL, -- kg, liter, packet, bag, etc.
  
  -- Cost
  unit_price DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  
  -- Subsidy
  subsidy_eligible BOOLEAN DEFAULT false,
  subsidy_scheme VARCHAR(100),
  subsidy_percentage DECIMAL,
  subsidy_amount DECIMAL,
  net_cost DECIMAL,
  
  -- Financing
  financing_required BOOLEAN DEFAULT false,
  financing_type VARCHAR(50), -- kcc, input_credit, working_capital
  financing_amount DECIMAL,
  financing_status VARCHAR(50), -- pending, approved, disbursed, repaid
  
  -- Season
  season VARCHAR(50), -- kharif, rabi, summer
  year INTEGER,
  
  -- Source
  source_type VARCHAR(50), -- marketplace, direct, government
  supplier_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farm_consumables_reu ON farm_consumables(reu_id);
CREATE INDEX IF NOT EXISTS idx_farm_consumables_crop ON farm_consumables(crop_id);
CREATE INDEX IF NOT EXISTS idx_farm_consumables_type ON farm_consumables(input_type);
CREATE INDEX IF NOT EXISTS idx_farm_consumables_season ON farm_consumables(season, year);
CREATE INDEX IF NOT EXISTS idx_farm_consumables_subsidy ON farm_consumables(subsidy_eligible);

-- ============================================================================
-- LAYER 3: MACHINERY ACCESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS machinery_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  machinery_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  -- Access Model
  access_model VARCHAR(50) NOT NULL, -- rental, lease, subscription, cooperative, fpo_owned, village_owned, certified_second_life
  rental_type VARCHAR(50), -- hourly, daily, weekly, seasonal, crop_cycle
  
  -- Booking Details
  booking_id UUID,
  booking_number VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_hours DECIMAL,
  duration_days INTEGER,
  
  -- Cost
  unit_rate DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  security_deposit DECIMAL,
  
  -- Location
  pickup_location JSONB,
  delivery_location JSONB,
  delivery_required BOOLEAN DEFAULT false,
  delivery_cost DECIMAL,
  
  -- Purpose
  purpose VARCHAR(100),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  area DECIMAL, -- in acres
  area_unit VARCHAR(20), -- acre, hectare, sqft
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  actual_start_date DATE,
  actual_end_date DATE,
  actual_duration_hours DECIMAL,
  
  -- Operator
  operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operator_name VARCHAR(255),
  
  -- Feedback
  rating INTEGER, -- 1-5
  feedback TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_machinery_access_reu ON machinery_access(reu_id);
CREATE INDEX IF NOT EXISTS idx_machinery_access_machinery ON machinery_access(machinery_id);
CREATE INDEX IF NOT EXISTS idx_machinery_access_booking ON machinery_access(booking_id);
CREATE INDEX IF NOT EXISTS idx_machinery_access_dates ON machinery_access(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_machinery_access_status ON machinery_access(status);

-- ============================================================================
-- LAYER 4: SHARED RURAL INFRASTRUCTURE
-- ============================================================================

CREATE TABLE IF NOT EXISTS shared_infrastructure_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  infrastructure_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  -- Access Model
  access_model VARCHAR(50) NOT NULL, -- storage_as_a_service, processing_as_a_service, infrastructure_as_a_service, cooperative, fpo_owned, village_owned
  service_type VARCHAR(50), -- storage, processing, ripening, testing, etc.
  
  -- Booking Details
  booking_id UUID,
  booking_number VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER,
  
  -- Capacity
  capacity_required DECIMAL NOT NULL,
  capacity_unit VARCHAR(20), -- kg, ton, sqft, cubic_meter
  actual_capacity_used DECIMAL,
  
  -- Cost
  unit_rate DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  
  -- Specifications
  specifications JSONB, -- {temperature, humidity, quality_requirements, etc.}
  
  -- Location
  infrastructure_location JSONB,
  delivery_required BOOLEAN DEFAULT false,
  pickup_required BOOLEAN DEFAULT false,
  
  -- Purpose
  purpose VARCHAR(100),
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  produce_type VARCHAR(100),
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Quality
  quality_grade VARCHAR(20),
  quality_report_url TEXT,
  
  -- Feedback
  rating INTEGER,
  feedback TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_reu ON shared_infrastructure_access(reu_id);
CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_infrastructure ON shared_infrastructure_access(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_booking ON shared_infrastructure_access(booking_id);
CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_dates ON shared_infrastructure_access(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_shared_infrastructure_access_status ON shared_infrastructure_access(status);

-- ============================================================================
-- LAYER 5: RURAL ENTERPRISE BUILDER
-- ============================================================================

CREATE TABLE IF NOT EXISTS rural_enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Enterprise Details
  enterprise_type VARCHAR(50) NOT NULL, -- fish_farming, dairy, poultry, goat_farming, mushroom, hydroponics, greenhouse, processing, retail, tourism
  enterprise_subtype VARCHAR(50), -- biofloc, ras, hatchery, broiler, layer, etc.
  enterprise_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'planning', -- planning, feasibility, setup, operational, suspended, closed
  setup_date DATE,
  operational_date DATE,
  
  -- Investment
  total_investment DECIMAL,
  equity_investment DECIMAL,
  debt_investment DECIMAL,
  subsidy_amount DECIMAL,
  
  -- Performance
  annual_revenue DECIMAL,
  annual_profit DECIMAL,
  annual_expenses DECIMAL,
  roi DECIMAL,
  payback_period_months INTEGER,
  
  -- Capacity
  capacity DECIMAL,
  capacity_unit VARCHAR(20), -- tons, liters, birds, animals, sqft
  
  -- Infrastructure
  infrastructure_required JSONB, -- [{type, capacity, cost}]
  infrastructure_allocated JSONB, -- [{infrastructure_id, access_model, cost}]
  
  -- Financing
  subsidy_id UUID REFERENCES subsidy_claims(id) ON DELETE SET NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  insurance_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  
  -- Engineering
  project_id UUID REFERENCES engineering_projects(id) ON DELETE SET NULL,
  dpr_id UUID REFERENCES dpr_documents(id) ON DELETE SET NULL,
  
  -- Training
  training_completed BOOLEAN DEFAULT false,
  training_certification_url TEXT,
  
  -- Market
  market_channels JSONB, -- [{channel, status, price}]
  
  -- Metadata
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rural_enterprises_reu ON rural_enterprises(reu_id);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_type ON rural_enterprises(enterprise_type);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_status ON rural_enterprises(status);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_project ON rural_enterprises(project_id);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_subsidy ON rural_enterprises(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_rural_enterprises_loan ON rural_enterprises(loan_id);

-- Enterprise Feasibility Analysis
CREATE TABLE IF NOT EXISTS enterprise_feasibility_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES rural_enterprises(id) ON DELETE SET NULL,
  
  -- Analysis Type
  enterprise_type VARCHAR(50) NOT NULL,
  location JSONB NOT NULL,
  
  -- Market Analysis
  market_demand VARCHAR(50), -- high, medium, low
  market_competition VARCHAR(50), -- high, medium, low
  market_price_trend VARCHAR(20), -- increasing, stable, decreasing
  
  -- Technical Feasibility
  technical_feasibility BOOLEAN,
  technical_challenges TEXT[],
  infrastructure_availability BOOLEAN,
  
  -- Financial Feasibility
  financial_feasibility BOOLEAN,
  total_investment DECIMAL,
  expected_annual_revenue DECIMAL,
  expected_annual_profit DECIMAL,
  roi DECIMAL,
  payback_period_years DECIMAL,
  break_even_point_years DECIMAL,
  
  -- Risk Assessment
  risk_level VARCHAR(50), -- low, medium, high
  risks JSONB, -- [{type, severity, mitigation}]
  
  -- Recommendations
  recommendation VARCHAR(50), -- recommended, conditional, not_recommended
  recommendation_reason TEXT,
  next_steps TEXT[],
  
  -- Analysis Metadata
  analysis_date DATE DEFAULT CURRENT_DATE,
  analyst_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_confidence DECIMAL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_reu ON enterprise_feasibility_analysis(reu_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_enterprise ON enterprise_feasibility_analysis(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_type ON enterprise_feasibility_analysis(enterprise_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_feasibility_recommendation ON enterprise_feasibility_analysis(recommendation);

-- ============================================================================
-- LAYER 6: RENEWABLE ENERGY
-- ============================================================================

CREATE TABLE IF NOT EXISTS renewable_energy_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES rural_enterprises(id) ON DELETE SET NULL,
  
  -- System Details
  system_type VARCHAR(50) NOT NULL, -- solar_pump, rooftop_solar, ground_mount, microgrid, solar_cold_room, solar_dryer, biogas, wind
  system_subtype VARCHAR(50), -- pm_kusum, grid_connected, off_grid, hybrid
  
  -- Capacity
  capacity_kw DECIMAL NOT NULL,
  capacity_unit VARCHAR(20) DEFAULT 'kW',
  
  -- Installation
  installation_date DATE,
  installer_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  location JSONB,
  
  -- Cost
  total_cost DECIMAL NOT NULL,
  subsidy_amount DECIMAL,
  net_cost DECIMAL,
  
  -- Financing
  financing_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  financing_type VARCHAR(50), -- pm_kusum, bank_loan, vendor_financing
  
  -- Performance
  annual_generation DECIMAL, -- in kWh
  annual_savings DECIMAL,
  annual_export DECIMAL, -- to grid
  self_consumption_percentage DECIMAL,
  
  -- Subsidy
  subsidy_scheme VARCHAR(100), -- PM_KUSUM, state_solar, etc.
  subsidy_application_id UUID,
  subsidy_disbursement_date DATE,
  
  -- Net Metering
  net_metering BOOLEAN DEFAULT false,
  net_metering_id VARCHAR(100),
  grid_connection_date DATE,
  
  -- Battery Storage
  battery_capacity DECIMAL, -- in kWh
  battery_type VARCHAR(50),
  
  -- Monitoring
  monitoring_enabled BOOLEAN DEFAULT false,
  monitoring_device_id VARCHAR(100),
  
  -- Maintenance
  maintenance_contract BOOLEAN DEFAULT false,
  maintenance_provider_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  last_maintenance_date DATE,
  
  -- Carbon
  annual_carbon_savings DECIMAL, -- in kg CO2e
  lifetime_carbon_savings DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'planning', -- planning, installation, operational, maintenance, decommissioned
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_reu ON renewable_energy_systems(reu_id);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_enterprise ON renewable_energy_systems(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_type ON renewable_energy_systems(system_type);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_status ON renewable_energy_systems(status);
CREATE INDEX IF NOT EXISTS idx_renewable_energy_systems_subsidy ON renewable_energy_systems(subsidy_scheme);

-- Energy Generation Data
CREATE TABLE IF NOT EXISTS energy_generation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id UUID NOT NULL REFERENCES renewable_energy_systems(id) ON DELETE CASCADE,
  
  -- Generation Data
  generation_date DATE NOT NULL,
  generation_kwh DECIMAL NOT NULL,
  export_kwh DECIMAL DEFAULT 0,
  self_consumption_kwh DECIMAL DEFAULT 0,
  
  -- Performance
  performance_ratio DECIMAL,
  capacity_factor DECIMAL,
  
  -- Weather
  solar_irradiance DECIMAL,
  temperature DECIMAL,
  
  -- Cost
  grid_import_kwh DECIMAL DEFAULT 0,
  grid_export_kwh DECIMAL DEFAULT 0,
  net_cost DECIMAL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_energy_generation_data_system ON energy_generation_data(system_id);
CREATE INDEX IF NOT EXISTS idx_energy_generation_data_date ON energy_generation_data(generation_date DESC);

-- ============================================================================
-- LAYER 7: FINANCE
-- ============================================================================

-- ===========================================================================
-- MISSING TABLE FIX 2026-08-04
-- rural_finance references lenders(id), but no migration ever created it —
-- failing that CREATE TABLE and cascading into 22 errors. Defined here as the
-- register of who lends: banks, NBFCs, cooperatives, SHGs and informal
-- lenders. The last category matters: rural credit often comes from moneylenders
-- at punitive rates, and a finance module that cannot record that cannot show
-- a farmer what refinancing would save them.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  lender_type VARCHAR(40) NOT NULL
    CHECK (lender_type IN ('public_bank','private_bank','rrb','cooperative','nbfc','mfi','shg','fpo','government_scheme','informal')),
  is_formal BOOLEAN
    GENERATED ALWAYS AS (lender_type <> 'informal') STORED,
  interest_rate_min NUMERIC(6,3) CHECK (interest_rate_min IS NULL OR interest_rate_min >= 0),
  interest_rate_max NUMERIC(6,3) CHECK (interest_rate_max IS NULL OR interest_rate_max >= 0),
  max_loan_amount NUMERIC(20,4),
  requires_collateral BOOLEAN DEFAULT TRUE,
  operates_in_states TEXT[],
  contact_details JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT lender_rate_range_sane CHECK (
    interest_rate_min IS NULL OR interest_rate_max IS NULL OR interest_rate_min <= interest_rate_max
  )
);

CREATE INDEX IF NOT EXISTS idx_lenders_type ON lenders (lender_type);
CREATE INDEX IF NOT EXISTS idx_lenders_active ON lenders (is_active);

CREATE TABLE IF NOT EXISTS rural_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES rural_enterprises(id) ON DELETE SET NULL,
  energy_system_id UUID REFERENCES renewable_energy_systems(id) ON DELETE SET NULL,
  
  -- Financial Product
  financial_product_type VARCHAR(50) NOT NULL, -- working_capital, equipment_finance, cash_flow_loan, crop_loan, warehouse_receipt, solar_finance, greenhouse_finance, fisheries_finance, dairy_finance, enterprise_finance
  product_subtype VARCHAR(50),
  
  -- Loan Details
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  loan_amount DECIMAL NOT NULL,
  interest_rate DECIMAL NOT NULL,
  tenure_months INTEGER NOT NULL,
  
  -- EMI
  emi DECIMAL NOT NULL,
  emi_start_date DATE,
  emi_end_date DATE,
  
  -- Purpose
  purpose TEXT,
  purpose_category VARCHAR(50), -- cultivation, enterprise, energy, household, infrastructure
  
  -- Collateral
  collateral_type VARCHAR(50), -- land, gold, equipment, infrastructure, none
  collateral_value DECIMAL,
  collateral_details JSONB,
  
  -- Subsidy Linkage
  subsidy_linked BOOLEAN DEFAULT false,
  subsidy_scheme VARCHAR(100),
  subsidy_amount DECIMAL,
  subsidy_disbursement_date DATE,
  
  -- Insurance
  insurance_required BOOLEAN DEFAULT false,
  insurance_policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'applied', -- applied, under_review, approved, rejected, disbursed, active, closed, defaulted
  application_date DATE DEFAULT CURRENT_DATE,
  approval_date DATE,
  disbursement_date DATE,
  
  -- Repayment
  principal_repaid DECIMAL DEFAULT 0,
  interest_paid DECIMAL DEFAULT 0,
  outstanding_principal DECIMAL,
  next_emi_date DATE,
  
  -- Lender
  lender_id UUID REFERENCES lenders(id) ON DELETE SET NULL,
  lender_type VARCHAR(50), -- bank, nbfc, cooperative, government
  
  -- Government Scheme
  government_scheme VARCHAR(100),
  scheme_reference_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rural_finance_reu ON rural_finance(reu_id);
CREATE INDEX IF NOT EXISTS idx_rural_finance_enterprise ON rural_finance(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_rural_finance_energy ON rural_finance(energy_system_id);
CREATE INDEX IF NOT EXISTS idx_rural_finance_number ON rural_finance(loan_number);
CREATE INDEX IF NOT EXISTS idx_rural_finance_type ON rural_finance(financial_product_type);
CREATE INDEX IF NOT EXISTS idx_rural_finance_status ON rural_finance(status);
CREATE INDEX IF NOT EXISTS idx_rural_finance_lender ON rural_finance(lender_id);

-- Financial Needs Assessment
CREATE TABLE IF NOT EXISTS financial_needs_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Assessment Date
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- Needs Breakdown
  household_needs DECIMAL,
  cultivation_needs DECIMAL,
  enterprise_needs DECIMAL,
  infrastructure_needs DECIMAL,
  energy_needs DECIMAL,
  total_financial_requirement DECIMAL,
  
  -- Collateral
  available_collateral DECIMAL,
  collateral_details JSONB,
  
  -- Credit Profile
  credit_score INTEGER,
  credit_score_source VARCHAR(50),
  fdi_score INTEGER,
  
  -- Recommended Products
  recommended_products JSONB, -- [{product_type, amount, interest_rate, tenure, purpose}]
  
  -- Subsidy Opportunities
  subsidy_opportunities JSONB, -- [{scheme, amount, eligibility, documents_required}]
  
  -- Government Schemes
  government_schemes JSONB, -- [{scheme, eligibility, benefits, documents_required}]
  
  -- Assessment Metadata
  assessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_confidence DECIMAL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_financial_needs_assessment_reu ON financial_needs_assessment(reu_id);
CREATE INDEX IF NOT EXISTS idx_financial_needs_assessment_date ON financial_needs_assessment(assessment_date DESC);

-- ============================================================================
-- LAYER 8: KNOWLEDGE & AI
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
  enterprise_id UUID REFERENCES rural_enterprises(id) ON DELETE SET NULL,
  
  -- Advisory Details
  advisory_type VARCHAR(50) NOT NULL, -- crop_planning, pest_diagnosis, soil_health, weather, market_price, project_feasibility, financial_planning, subsidy_eligibility, legal_compliance, equipment_recommendation, enterprise_guidance
  advisory_subtype VARCHAR(50),
  
  -- Query
  query TEXT NOT NULL,
  query_type VARCHAR(50), -- text, image, voice, video
  query_context JSONB, -- {location, season, crop, etc.}
  
  -- AI Analysis
  ai_analysis JSONB, -- {model_used, parameters, intermediate_results}
  
  -- Response
  response TEXT NOT NULL,
  response_format VARCHAR(50), -- text, structured, action_items
  confidence_score DECIMAL,
  
  -- Action Items
  action_items JSONB, -- [{action, priority, deadline, status}]
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_status VARCHAR(50), -- pending, completed, skipped
  
  -- Impact
  impact_measured BOOLEAN DEFAULT false,
  impact_data JSONB, -- {metric, before, after, improvement}
  
  -- Feedback
  user_rating INTEGER,
  user_feedback TEXT,
  helpful BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_advisories_reu ON ai_advisories(reu_id);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_type ON ai_advisories(advisory_type);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_crop ON ai_advisories(crop_id);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_enterprise ON ai_advisories(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_date ON ai_advisories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_followup ON ai_advisories(follow_up_required, follow_up_date);

-- Advisory Attachments (Images, etc.)
CREATE TABLE IF NOT EXISTS advisory_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES ai_advisories(id) ON DELETE CASCADE,
  
  -- File Details
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- image, video, audio, document
  file_size BIGINT,
  file_format VARCHAR(20),
  
  -- Analysis
  ai_analysis JSONB, -- {detection, confidence, bounding_boxes, etc.}
  analysis_result TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advisory_attachments_advisory ON advisory_attachments(advisory_id);

-- ============================================================================
-- LAYER 9: MARKET ACCESS
-- ============================================================================

-- ===========================================================================
-- MISSING TABLE FIX 2026-08-04
-- market_access references buyers(id), but no migration ever created it.
-- Defined here as the register of who buys from rural producers — the demand
-- side of market access. Deliberately records the buyer TYPE, because the
-- difference between selling to a village aggregator and selling direct to an
-- institution is most of what market access actually means.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  buyer_type VARCHAR(40) NOT NULL
    CHECK (buyer_type IN ('aggregator','trader','processor','retailer','institution','exporter','direct_consumer','government','fpo')),
  -- How many hands the produce passes through before the end user. Longer
  -- chains mean a smaller share of the final price reaches the farmer.
  chain_position SMALLINT CHECK (chain_position IS NULL OR chain_position BETWEEN 1 AND 6),
  gst_number VARCHAR(20),
  operates_in_states TEXT[],
  preferred_crops TEXT[],
  typical_volume_kg NUMERIC(14,2),
  payment_terms_days INTEGER CHECK (payment_terms_days IS NULL OR payment_terms_days >= 0),
  pays_on_time BOOLEAN,
  contact_details JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buyers_type ON buyers (buyer_type);
CREATE INDEX IF NOT EXISTS idx_buyers_active ON buyers (is_active);

-- ===========================================================================
-- MISSING TABLE FIX 2026-08-04
-- market_access references logistics_providers(id); no migration created it.
-- The register of who physically moves produce. Links to freight_lanes and
-- transport_modes (migration 992) so a provider is tied to the corridors and
-- modes it actually serves rather than being a free-text name.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS logistics_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(40) NOT NULL
    CHECK (provider_type IN ('individual','fleet_owner','3pl','courier','rail','air','cooperative','aggregator')),
  -- Which of the modes in transport_modes (992) this provider can actually run.
  supported_modes TEXT[],
  -- Whether they can hold a cold chain. This is the single most consequential
  -- capability for perishable produce and must not be assumed.
  has_reefer BOOLEAN DEFAULT FALSE,
  min_temperature_c NUMERIC(5,2),
  serves_lanes TEXT[],
  operates_in_states TEXT[],
  capacity_kg NUMERIC(14,2),
  contact_details JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- A declared minimum temperature without reefer capability is a claim the
  -- provider cannot honour.
  CONSTRAINT provider_temp_needs_reefer CHECK (min_temperature_c IS NULL OR has_reefer = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_logistics_providers_type ON logistics_providers (provider_type);
CREATE INDEX IF NOT EXISTS idx_logistics_providers_reefer ON logistics_providers (has_reefer);

CREATE TABLE IF NOT EXISTS market_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID NOT NULL REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES rural_enterprises(id) ON DELETE SET NULL,
  
  -- Produce Details
  produce_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  quality_grade VARCHAR(20), -- grade_a, grade_b, grade_c
  quantity DECIMAL NOT NULL,
  quantity_unit VARCHAR(20), -- kg, ton, liter, pieces
  
  -- Market Channel
  market_channel VARCHAR(50) NOT NULL, -- consumer, retailer, horeca, processor, exporter, institution, government, fpo, enam, ecommerce
  channel_subtype VARCHAR(50),
  
  -- Pricing
  price_per_unit DECIMAL NOT NULL,
  total_value DECIMAL NOT NULL,
  
  -- Market Details
  market_name VARCHAR(255),
  market_location JSONB,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  buyer_name VARCHAR(255),
  
  -- Sale Details
  sale_date DATE NOT NULL,
  sale_number VARCHAR(50),
  
  -- Logistics
  logistics_required BOOLEAN DEFAULT false,
  logistics_cost DECIMAL,
  logistics_provider_id UUID REFERENCES logistics_providers(id) ON DELETE SET NULL,
  
  -- Quality
  quality_certificate_url TEXT,
  quality_inspection_date DATE,
  
  -- Contract
  contract_farming BOOLEAN DEFAULT false,
  contract_id UUID,
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue
  payment_terms VARCHAR(50),
  payment_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_transit, delivered, paid, cancelled
  
  -- eNAM Integration
  enam_listing BOOLEAN DEFAULT false,
  enam_trade_id VARCHAR(100),
  enam_bid_id VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_access_reu ON market_access(reu_id);
CREATE INDEX IF NOT EXISTS idx_market_access_enterprise ON market_access(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_market_access_produce ON market_access(produce_type);
CREATE INDEX IF NOT EXISTS idx_market_access_channel ON market_access(market_channel);
CREATE INDEX IF NOT EXISTS idx_market_access_date ON market_access(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_access_status ON market_access(status);
CREATE INDEX IF NOT EXISTS idx_market_access_buyer ON market_access(buyer_id);

-- Market Intelligence
CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Market Details
  produce_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  location JSONB,
  
  -- Price Data
  min_price DECIMAL,
  max_price DECIMAL,
  average_price DECIMAL,
  modal_price DECIMAL,
  
  -- Price Trend
  price_trend VARCHAR(20), -- increasing, stable, decreasing
  price_change_percentage DECIMAL,
  price_change_period VARCHAR(20), -- daily, weekly, monthly
  
  -- Volume Data
  trading_volume DECIMAL,
  volume_unit VARCHAR(20),
  
  -- Demand
  demand_level VARCHAR(50), -- high, medium, low
  demand_trend VARCHAR(20),
  
  -- Supply
  supply_level VARCHAR(50), -- high, medium, low
  supply_trend VARCHAR(20),
  
  -- Quality Premium
  quality_a_premium DECIMAL,
  quality_b_premium DECIMAL,
  
  -- Seasonality
  seasonal_pattern JSONB, -- {month: {price, volume, demand}}
  
  -- Forecast
  forecast_price DECIMAL,
  forecast_confidence DECIMAL,
  forecast_period VARCHAR(20), -- next_week, next_month, next_quarter
  
  -- Data Source
  data_source VARCHAR(50), -- enam, mandi, wholesale, retail
  data_date DATE NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_produce ON market_intelligence(produce_type);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_location ON market_intelligence USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_date ON market_intelligence(data_date DESC);

-- ============================================================================
-- CROSS-LAYER INTEGRATION TABLES
-- ============================================================================

-- REU Dashboard Summary (Materialized View for performance)
CREATE MATERIALIZED VIEW reu_dashboard_summary AS
SELECT 
  reu.id,
  reu.reu_number,
  reu.reu_type,
  reu.location,
  
  -- Layer 1: Household Economy
  COALESCE(household_economy.total_savings, 0) as household_savings,
  COALESCE(household_economy.total_orders, 0) as household_orders,
  
  -- Layer 2: Farm Consumables
  COALESCE(SUM(farm_consumables.total_cost), 0) as farm_consumables_cost,
  COALESCE(COUNT(DISTINCT farm_consumables.id), 0) as farm_consumables_count,
  
  -- Layer 3: Machinery Access
  COALESCE(SUM(machinery_access.total_cost), 0) as machinery_cost,
  COALESCE(COUNT(DISTINCT machinery_access.id), 0) as machinery_bookings,
  
  -- Layer 4: Shared Infrastructure
  COALESCE(SUM(shared_infrastructure_access.total_cost), 0) as infrastructure_cost,
  COALESCE(COUNT(DISTINCT shared_infrastructure_access.id), 0) as infrastructure_bookings,
  
  -- Layer 5: Enterprises
  COALESCE(COUNT(DISTINCT rural_enterprises.id), 0) as active_enterprises,
  COALESCE(SUM(rural_enterprises.annual_revenue), 0) as enterprise_revenue,
  
  -- Layer 6: Renewable Energy
  COALESCE(SUM(renewable_energy_systems.capacity_kw), 0) as total_energy_capacity,
  COALESCE(SUM(renewable_energy_systems.annual_savings), 0) as annual_energy_savings,
  
  -- Layer 7: Finance
  COALESCE(SUM(rural_finance.loan_amount), 0) as total_loans,
  COALESCE(SUM(rural_finance.outstanding_principal), 0) as outstanding_loans,
  
  -- Layer 8: Advisory
  COALESCE(COUNT(DISTINCT ai_advisories.id), 0) as total_advisories,
  COALESCE(COUNT(DISTINCT CASE WHEN ai_advisories.follow_up_required THEN ai_advisories.id END), 0) as pending_followups,
  
  -- Layer 9: Market Access
  COALESCE(SUM(market_access.total_value), 0) as total_sales,
  COALESCE(COUNT(DISTINCT market_access.id), 0) as total_sales_count
  
FROM rural_economic_units reu
LEFT JOIN household_economy ON household_economy.reu_id = reu.id
LEFT JOIN farm_consumables ON farm_consumables.reu_id = reu.id
LEFT JOIN machinery_access ON machinery_access.reu_id = reu.id
LEFT JOIN shared_infrastructure_access ON shared_infrastructure_access.reu_id = reu.id
LEFT JOIN rural_enterprises ON rural_enterprises.reu_id = reu.id AND rural_enterprises.status = 'operational'
LEFT JOIN renewable_energy_systems ON renewable_energy_systems.reu_id = reu.id AND renewable_energy_systems.status = 'operational'
LEFT JOIN rural_finance ON rural_finance.reu_id = reu.id AND rural_finance.status = 'active'
LEFT JOIN ai_advisories ON ai_advisories.reu_id = reu.id
LEFT JOIN market_access ON market_access.reu_id = reu.id AND market_access.status = 'delivered'
WHERE reu.status = 'active'
GROUP BY reu.id, reu.reu_number, reu.reu_type, reu.location, household_economy.total_savings, household_economy.total_orders;

-- FIXED 2026-08-04: the materialized view exposes this column as "id"
-- (SELECT reu.id), not "reu_id", so this index could never be built.
-- UNIQUE because REFRESH MATERIALIZED VIEW CONCURRENTLY requires a unique
-- index — without one, every refresh takes an exclusive lock on the view.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reu_dashboard_summary ON reu_dashboard_summary(id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_household_economy_updated_at ON household_economy;
CREATE TRIGGER update_household_economy_updated_at BEFORE UPDATE ON household_economy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farm_consumables_updated_at ON farm_consumables;
CREATE TRIGGER update_farm_consumables_updated_at BEFORE UPDATE ON farm_consumables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_machinery_access_updated_at ON machinery_access;
CREATE TRIGGER update_machinery_access_updated_at BEFORE UPDATE ON machinery_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_infrastructure_access_updated_at ON shared_infrastructure_access;
CREATE TRIGGER update_shared_infrastructure_access_updated_at BEFORE UPDATE ON shared_infrastructure_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rural_enterprises_updated_at ON rural_enterprises;
CREATE TRIGGER update_rural_enterprises_updated_at BEFORE UPDATE ON rural_enterprises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_renewable_energy_systems_updated_at ON renewable_energy_systems;
CREATE TRIGGER update_renewable_energy_systems_updated_at BEFORE UPDATE ON renewable_energy_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rural_finance_updated_at ON rural_finance;
CREATE TRIGGER update_rural_finance_updated_at BEFORE UPDATE ON rural_finance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_advisories_updated_at ON ai_advisories;
CREATE TRIGGER update_ai_advisories_updated_at BEFORE UPDATE ON ai_advisories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_access_updated_at ON market_access;
CREATE TRIGGER update_market_access_updated_at BEFORE UPDATE ON market_access
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_intelligence_updated_at ON market_intelligence;
CREATE TRIGGER update_market_intelligence_updated_at BEFORE UPDATE ON market_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate REU number
CREATE OR REPLACE FUNCTION generate_reu_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part INTEGER;
    reu_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(reu_number FROM 9 FOR 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM rural_economic_units
    WHERE reu_number LIKE 'REU-' || year_part || '-%';
    
    reu_number := 'REU-' || year_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    NEW.reu_number := reu_number;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger for REU number generation
DROP TRIGGER IF EXISTS generate_reu_number_trigger ON rural_economic_units;
CREATE TRIGGER generate_reu_number_trigger BEFORE INSERT ON rural_economic_units
    FOR EACH ROW
    WHEN (NEW.reu_number IS NULL)
    EXECUTE FUNCTION generate_reu_number();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_reu_dashboard_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW reu_dashboard_summary;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- REU Household Economy Summary
CREATE OR REPLACE VIEW reu_household_economy_summary AS
SELECT 
    reu.id,
    reu.reu_number,
    reu.reu_type,
    he.monthly_budget,
    he.annual_budget,
    he.subscription_status,
    he.consumption_savings,
    he.total_orders,
    he.total_spent,
    he.created_at as subscription_start_date
FROM rural_economic_units reu
LEFT JOIN household_economy he ON he.reu_id = reu.id
WHERE reu.status = 'active';

-- REU Cultivation Summary
CREATE OR REPLACE VIEW reu_cultivation_summary AS
SELECT 
    reu.id,
    reu.reu_number,
    reu.reu_type,
    COUNT(fc.id) as input_purchases,
    SUM(fc.total_cost) as total_input_cost,
    SUM(fc.subsidy_amount) as total_subsidy_received,
    -- FIXED 2026-08-04: farm_consumables has no financing_id column. It carries
    -- financing_required / financing_type / financing_amount, so "financed
    -- inputs" is a count of rows flagged as requiring finance.
    COUNT(*) FILTER (WHERE fc.financing_required) as financed_inputs,
    fc.season,
    fc.year
FROM rural_economic_units reu
LEFT JOIN farm_consumables fc ON fc.reu_id = reu.id
WHERE reu.status = 'active'
GROUP BY reu.id, reu.reu_number, reu.reu_type, fc.season, fc.year;

-- REU Enterprise Summary
CREATE OR REPLACE VIEW reu_enterprise_summary AS
SELECT 
    reu.id,
    reu.reu_number,
    reu.reu_type,
    COUNT(DISTINCT ent.id) as total_enterprises,
    COUNT(DISTINCT CASE WHEN ent.status = 'operational' THEN ent.id END) as operational_enterprises,
    SUM(ent.total_investment) as total_enterprise_investment,
    SUM(ent.annual_revenue) as total_enterprise_revenue,
    SUM(ent.annual_profit) as total_enterprise_profit
FROM rural_economic_units reu
LEFT JOIN rural_enterprises ent ON ent.reu_id = reu.id
WHERE reu.status = 'active'
GROUP BY reu.id, reu.reu_number, reu.reu_type;

-- REU Financial Summary
CREATE OR REPLACE VIEW reu_financial_summary AS
SELECT 
    reu.id,
    reu.reu_number,
    reu.reu_type,
    COUNT(DISTINCT rf.id) as total_loans,
    SUM(rf.loan_amount) as total_loan_amount,
    SUM(rf.outstanding_principal) as total_outstanding_principal,
    AVG(rf.interest_rate) as average_interest_rate,
    COUNT(DISTINCT CASE WHEN rf.status = 'active' THEN rf.id END) as active_loans,
    COUNT(DISTINCT CASE WHEN rf.subsidy_linked THEN rf.id END) as subsidy_linked_loans
FROM rural_economic_units reu
LEFT JOIN rural_finance rf ON rf.reu_id = reu.id
WHERE reu.status = 'active'
GROUP BY reu.id, reu.reu_number, reu.reu_type;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- This schema provides a comprehensive database structure for the AFRERA Rural Economic Operating System (Rural Life OS)
-- It supports the Rural Economic Unit (REU) concept and all 9 layers of the architecture:
-- Layer 1: Daily Household Economy
-- Layer 2: Farm Consumables
-- Layer 3: Machinery Access
-- Layer 4: Shared Rural Infrastructure
-- Layer 5: Rural Enterprise Builder
-- Layer 6: Renewable Energy
-- Layer 7: Finance
-- Layer 8: Knowledge & AI
-- Layer 9: Market Access

-- The schema is designed with:
-- Proper indexing for performance
-- Foreign key relationships for data integrity
-- JSONB columns for flexible data storage
-- Triggers for automated updates
-- Materialized views for dashboard summaries
-- Views for common queries
