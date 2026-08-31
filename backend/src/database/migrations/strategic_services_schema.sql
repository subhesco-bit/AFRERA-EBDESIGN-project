-- Strategic Services Database Schema
-- Pre-Season Purchase, Contract Farming, Household Procurement, Government Subsidy Management
-- Created: 31 August 2026
-- 2026-08-31: moved technical_packages/households/suppliers up from later in
-- this file to before their first reference (pre_season_agreements.input_supplier_id
-- at what was originally line 30 etc.) - SQL executes top-to-bottom within a file,
-- and "relation suppliers does not exist" fired against a real database the first
-- time this file actually ran, since these tables were defined ~400 lines below
-- their own foreign-key references. Content unchanged, position only.

-- ============================================================
-- TECHNICAL PACKAGES (for Contract Farming)
-- ============================================================

CREATE TABLE IF NOT EXISTS technical_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(100) NOT NULL,
  region VARCHAR(100) DEFAULT 'all',
  
  -- Technical specifications
  seed_variety VARCHAR(100),
  fertilizer_schedule JSONB DEFAULT '{}',
  irrigation_schedule JSONB DEFAULT '{}',
  pest_management_protocol JSONB DEFAULT '{}',
  quality_standards JSONB DEFAULT '{}',
  
  -- Expected outcomes
  expected_yield_increase DECIMAL(5,2), -- percentage
  quality_improvement DECIMAL(5,2), -- percentage
  cost_efficiency_rating DECIMAL(3,2), -- 1-5 scale
  
  -- Provider information
  provided_by VARCHAR(255), -- organization name
  technical_advisor_id UUID REFERENCES users(id),
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_technical_packages_crop ON technical_packages(crop_type);
CREATE INDEX idx_technical_packages_region ON technical_packages(region);

-- ============================================================
-- ADDITIONAL TABLES FOR EXISTING SCHEMA EXTENSIONS
-- ============================================================

-- Add households table if not exists
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  head_of_household_id UUID REFERENCES users(id),
  family_size INTEGER NOT NULL,
  address TEXT NOT NULL,
  district VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  
  income_level VARCHAR(50), -- 'low', 'middle', 'high'
  preference_categories JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_households_head ON households(head_of_household_id);
CREATE INDEX idx_households_region ON households(district, state);

-- Add suppliers table if not exists
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50) NOT NULL, -- 'seeds', 'fertilizer', 'pesticide', 'equipment', 'general'
  
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  service_regions JSONB DEFAULT '[]',
  product_categories JSONB DEFAULT '[]',
  
  quality_rating DECIMAL(3,2),
  reliability_score DECIMAL(3,2),
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_status ON suppliers(status);


-- ============================================================
-- PRE-SEASON PURCHASE AGREEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS pre_season_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  crop_id UUID NOT NULL REFERENCES crops(id),
  variety_id INTEGER NOT NULL REFERENCES regional_variety_directory(id),
  
  -- Agreement terms
  agreed_quantity DECIMAL(10,2) NOT NULL, -- in tons
  agreed_price DECIMAL(10,2) NOT NULL, -- per unit price
  delivery_date DATE NOT NULL,
  quality_standards JSONB DEFAULT '{}',
  
  -- Risk sharing models
  risk_sharing_model VARCHAR(50) DEFAULT 'price_floor', -- 'price_floor', 'revenue_share', 'hybrid'
  price_floor DECIMAL(10,2),
  revenue_share_percentage DECIMAL(5,2),
  
  -- Financing options
  input_financing_included BOOLEAN DEFAULT false,
  input_financing_amount DECIMAL(10,2),
  input_supplier_id UUID REFERENCES suppliers(id),
  
  -- Progress tracking
  planting_status VARCHAR(50) DEFAULT 'pending',
  expected_yield DECIMAL(10,2),
  actual_yield DECIMAL(10,2),
  quality_score DECIMAL(5,2),
  
  -- Settlement
  settlement_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'disputed'
  final_price DECIMAL(10,2),
  settlement_date DATE,
  
  -- Smart contract (blockchain integration)
  smart_contract_address VARCHAR(255),
  blockchain_tx_hash VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pre_season_farmer ON pre_season_agreements(farmer_id);
CREATE INDEX idx_pre_season_buyer ON pre_season_agreements(buyer_id);
CREATE INDEX idx_pre_season_status ON pre_season_agreements(settlement_status);
CREATE INDEX idx_pre_season_delivery ON pre_season_agreements(delivery_date);

CREATE TABLE IF NOT EXISTS pre_season_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES pre_season_agreements(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'planting', 'input_application', 'growth_stage', 'harvest'
  target_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delayed'
  notes TEXT,
  verification_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pre_season_milestones_agreement ON pre_season_milestones(agreement_id);
CREATE INDEX idx_pre_season_milestones_status ON pre_season_milestones(status);

CREATE TABLE IF NOT EXISTS pre_season_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  crop_id UUID NOT NULL REFERENCES crops(id),
  variety_id INTEGER NOT NULL REFERENCES regional_variety_directory(id),
  
  quantity_required DECIMAL(10,2) NOT NULL,
  offered_price DECIMAL(10,2) NOT NULL,
  delivery_date DATE NOT NULL,
  quality_requirements JSONB DEFAULT '{}',
  deadline DATE NOT NULL,
  
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'fulfilled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pre_season_opportunities_buyer ON pre_season_opportunities(buyer_id);
CREATE INDEX idx_pre_season_opportunities_status ON pre_season_opportunities(status);

-- ============================================================
-- CONTRACT FARMING AGREEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS contract_farming_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  technical_package_id UUID REFERENCES technical_packages(id),
  
  -- Contract terms
  crop_variety VARCHAR(100) NOT NULL,
  area_hectares DECIMAL(10,2) NOT NULL,
  expected_yield_tons DECIMAL(10,2) NOT NULL,
  contract_period_start DATE NOT NULL,
  contract_period_end DATE NOT NULL,
  
  -- Technical specifications
  seed_variety VARCHAR(100),
  fertilizer_schedule JSONB DEFAULT '{}',
  irrigation_schedule JSONB DEFAULT '{}',
  pest_management_protocol JSONB DEFAULT '{}',
  quality_standards JSONB DEFAULT '{}',
  
  -- Input supply
  input_supplier_id UUID REFERENCES suppliers(id),
  input_credit_amount DECIMAL(10,2),
  input_delivery_schedule JSONB DEFAULT '{}',
  
  -- Technical assistance
  technical_advisor_id UUID REFERENCES users(id),
  assistance_schedule JSONB DEFAULT '{}',
  training_programs JSONB DEFAULT '[]',
  
  -- Pricing and payment
  base_price DECIMAL(10,2) NOT NULL,
  quality_bonus_structure JSONB DEFAULT '{}',
  payment_schedule JSONB DEFAULT '{}',
  
  -- Performance tracking
  compliance_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  yield_vs_target DECIMAL(5,2),
  
  -- Dispute resolution
  dispute_status VARCHAR(50) DEFAULT 'none', -- 'none', 'raised', 'in_progress', 'resolved'
  dispute_resolution_method VARCHAR(50),
  dispute_resolution_date DATE,
  
  -- Smart contract
  smart_contract_address VARCHAR(255),
  blockchain_tx_hash VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_farming_farmer ON contract_farming_agreements(farmer_id);
CREATE INDEX idx_contract_farming_buyer ON contract_farming_agreements(buyer_id);
CREATE INDEX idx_contract_farming_period ON contract_farming_agreements(contract_period_start, contract_period_end);
CREATE INDEX idx_contract_farming_status ON contract_farming_agreements(dispute_status);

CREATE TABLE IF NOT EXISTS contract_quality_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contract_farming_agreements(id) ON DELETE CASCADE,
  test_type VARCHAR(50) NOT NULL, -- 'soil', 'water', 'plant', 'harvest'
  test_date DATE NOT NULL,
  test_results JSONB DEFAULT '{}',
  quality_score DECIMAL(5,2),
  passed_standards BOOLEAN DEFAULT false,
  tester_id UUID REFERENCES users(id),
  laboratory_id UUID REFERENCES laboratories(id),
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'failed'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_quality_tests_contract ON contract_quality_tests(contract_id);
CREATE INDEX idx_contract_quality_tests_type ON contract_quality_tests(test_type);

CREATE TABLE IF NOT EXISTS contract_input_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contract_farming_agreements(id) ON DELETE CASCADE,
  input_type VARCHAR(50) NOT NULL, -- 'seeds', 'fertilizer', 'pesticide', 'water'
  planned_quantity DECIMAL(10,2) NOT NULL,
  actual_quantity DECIMAL(10,2),
  usage_date DATE NOT NULL,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_input_usage_contract ON contract_input_usage(contract_id);
CREATE INDEX idx_contract_input_usage_date ON contract_input_usage(usage_date);

CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contract_farming_agreements(id) ON DELETE CASCADE,
  amendment_type VARCHAR(50) NOT NULL, -- 'quantity', 'price', 'timeline', 'quality_standards'
  original_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  amendment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX idx_contract_amendments_date ON contract_amendments(amendment_date);

CREATE TABLE IF NOT EXISTS contract_farming_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES buyers(id),
  crop_variety VARCHAR(100) NOT NULL,
  
  minimum_hectares DECIMAL(10,2) NOT NULL,
  maximum_hectares DECIMAL(10,2),
  base_price DECIMAL(10,2) NOT NULL,
  quality_bonus_structure JSONB DEFAULT '{}',
  contract_duration_months INTEGER NOT NULL,
  technical_support_included BOOLEAN DEFAULT true,
  required_irrigation BOOLEAN DEFAULT true,
  
  deadline DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contract_opportunities_buyer ON contract_farming_opportunities(buyer_id);
CREATE INDEX idx_contract_opportunities_status ON contract_farming_opportunities(status);

-- ============================================================
-- HOUSEHOLD PROCUREMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS household_procurement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  family_size INTEGER NOT NULL,
  consumption_period_start DATE NOT NULL,
  consumption_period_end DATE NOT NULL,
  
  -- Consumption preferences
  preferred_varieties JSONB DEFAULT '{}',
  dietary_restrictions JSONB DEFAULT '{}',
  quality_requirements JSONB DEFAULT '{}',
  budget_limit DECIMAL(10,2),
  
  -- Procurement schedule
  delivery_frequency VARCHAR(50) DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly'
  delivery_day_of_week INTEGER, -- 0-6, where 0 is Sunday
  delivery_time_slot VARCHAR(50), -- 'morning', 'afternoon', 'evening'
  
  -- Order aggregation
  aggregation_group_id UUID,
  preferred_pickup_location VARCHAR(255),
  
  -- Payment
  payment_method VARCHAR(50) DEFAULT 'card', -- 'card', 'upi', 'cash', 'subscription'
  payment_schedule VARCHAR(50) DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly'
  
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_household_plans_household ON household_procurement_plans(household_id);
CREATE INDEX idx_household_plans_status ON household_procurement_plans(status);
CREATE INDEX idx_household_plans_period ON household_procurement_plans(consumption_period_start, consumption_period_end);

CREATE TABLE IF NOT EXISTS household_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  product_id UUID NOT NULL REFERENCES products(id),
  variety_id INTEGER REFERENCES regional_variety_directory(id),
  quantity DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'cancelled', 'completed'
  auto_renew BOOLEAN DEFAULT true
);

CREATE INDEX idx_household_subscriptions_household ON household_subscriptions(household_id);
CREATE INDEX idx_household_subscriptions_product ON household_subscriptions(product_id);
CREATE INDEX idx_household_subscriptions_status ON household_subscriptions(status);

CREATE TABLE IF NOT EXISTS household_aggregation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(100) NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time_slot VARCHAR(50) NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  
  total_households INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_quantity DECIMAL(10,2) DEFAULT 0,
  
  status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'confirmed', 'in_transit', 'delivered'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_household_aggregation_region ON household_aggregation_groups(region);
CREATE INDEX idx_household_aggregation_date ON household_aggregation_groups(delivery_date);
CREATE INDEX idx_household_aggregation_status ON household_aggregation_groups(status);

-- ============================================================
-- GOVERNMENT SUBSIDY MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS government_subsidy_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name VARCHAR(255) NOT NULL,
  ministry VARCHAR(255) NOT NULL,
  budget_allocation DECIMAL(15,2) NOT NULL,
  fiscal_year VARCHAR(10) NOT NULL, -- '2024-25'
  
  -- Eligibility criteria
  land_ownership_requirement BOOLEAN DEFAULT true,
  minimum_land_hectares DECIMAL(10,2),
  maximum_income_threshold DECIMAL(15,2),
  eligible_crops JSONB DEFAULT '[]',
  eligible_regions JSONB DEFAULT '[]',
  
  -- Subsidy structure
  subsidy_type VARCHAR(50) NOT NULL, -- 'input', 'output', 'insurance', 'equipment'
  subsidy_amount DECIMAL(10,2),
  subsidy_percentage DECIMAL(5,2),
  maximum_subsidy_per_farmer DECIMAL(10,2),
  
  -- Implementation
  application_period_start DATE NOT NULL,
  application_period_end DATE NOT NULL,
  disbursement_schedule JSONB DEFAULT '{}',
  
  -- Monitoring
  utilization_target DECIMAL(5,2) DEFAULT 80.0,
  leak_detection_threshold DECIMAL(5,2) DEFAULT 10.0,
  
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gov_subsidy_programs_ministry ON government_subsidy_programs(ministry);
CREATE INDEX idx_gov_subsidy_programs_fiscal_year ON government_subsidy_programs(fiscal_year);
CREATE INDEX idx_gov_subsidy_programs_status ON government_subsidy_programs(status);

CREATE TABLE IF NOT EXISTS subsidy_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES government_subsidy_programs(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  
  -- Disbursement details
  subsidy_amount DECIMAL(10,2) NOT NULL,
  disbursement_date DATE,
  payment_method VARCHAR(50) NOT NULL, -- 'dbt', 'direct', 'bank_transfer'
  transaction_id VARCHAR(255),
  
  -- Verification
  aadhaar_verified BOOLEAN DEFAULT false,
  bank_account_verified BOOLEAN DEFAULT false,
  land_verified BOOLEAN DEFAULT false,
  
  -- Impact tracking
  pre_subsidy_income DECIMAL(10,2),
  post_subsidy_income DECIMAL(10,2),
  productivity_change DECIMAL(5,2),
  
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'disbursed', 'rejected', 'failed'
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subsidy_disbursements_program ON subsidy_disbursements(program_id);
CREATE INDEX idx_subsidy_disbursements_farmer ON subsidy_disbursements(farmer_id);
CREATE INDEX idx_subsidy_disbursements_status ON subsidy_disbursements(status);
CREATE INDEX idx_subsidy_disbursements_date ON subsidy_disbursements(disbursement_date);

CREATE TABLE IF NOT EXISTS government_subsidy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES government_subsidy_programs(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  
  -- Application details
  application_date DATE NOT NULL,
  land_hectares DECIMAL(10,2) NOT NULL,
  crop_variety VARCHAR(100),
  estimated_production DECIMAL(10,2),
  income_declaration DECIMAL(15,2),
  
  -- Supporting documents
  land_document_url VARCHAR(255),
  aadhaar_number VARCHAR(12),
  bank_account_number VARCHAR(20),
  bank_ifsc_code VARCHAR(11),
  
  -- Verification status
  land_verification_status VARCHAR(50) DEFAULT 'pending',
  aadhaar_verification_status VARCHAR(50) DEFAULT 'pending',
  bank_verification_status VARCHAR(50) DEFAULT 'pending',
  
  -- Application status
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'rejected', 'disbursed'
  review_officer_id UUID REFERENCES users(id),
  approval_date DATE,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subsidy_applications_program ON government_subsidy_applications(program_id);
CREATE INDEX idx_subsidy_applications_farmer ON government_subsidy_applications(farmer_id);
CREATE INDEX idx_subsidy_applications_status ON government_subsidy_applications(status);
CREATE INDEX idx_subsidy_applications_date ON government_subsidy_applications(application_date);


-- Add buyers table if not exists
CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  buyer_type VARCHAR(50) NOT NULL, -- 'corporate', 'government', 'individual', 'cooperative'
  
  organization_type VARCHAR(50), -- 'private', 'public', 'psu', 'international'
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  
  business_regions JSONB DEFAULT '[]',
  preferred_crops JSONB DEFAULT '[]',
  
  credit_rating VARCHAR(10),
  annual_procurement_volume DECIMAL(15,2),
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buyers_type ON buyers(buyer_type);
CREATE INDEX idx_buyers_status ON buyers(status);

-- Add laboratories table if not exists
CREATE TABLE IF NOT EXISTS laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  laboratory_type VARCHAR(50) NOT NULL, -- 'soil', 'water', 'plant', 'comprehensive'
  
  accreditation_number VARCHAR(100),
  accreditation_body VARCHAR(100),
  
  address TEXT,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  
  testing_capabilities JSONB DEFAULT '[]',
  quality_rating DECIMAL(3,2),
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_laboratories_type ON laboratories(laboratory_type);
CREATE INDEX idx_laboratories_status ON laboratories(status);

-- Add crop_recommendations table if not exists
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  
  recommended_seed_variety VARCHAR(100),
  standard_fertilizer_schedule JSONB DEFAULT '{}',
  standard_irrigation_schedule JSONB DEFAULT '{}',
  standard_pest_management JSONB DEFAULT '{}',
  
  expected_yield DECIMAL(10,2),
  growing_season VARCHAR(50),
  
  data_source VARCHAR(100), -- 'agricultural_university', 'research_institute', 'expert_panel'
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crop_recommendations_crop_region ON crop_recommendations(crop_name, region);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_pre_season_agreements_updated_at BEFORE UPDATE ON pre_season_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pre_season_milestones_updated_at BEFORE UPDATE ON pre_season_milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_farming_agreements_updated_at BEFORE UPDATE ON contract_farming_agreements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_quality_tests_updated_at BEFORE UPDATE ON contract_quality_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_household_procurement_plans_updated_at BEFORE UPDATE ON household_procurement_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_household_aggregation_groups_updated_at BEFORE UPDATE ON household_aggregation_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_government_subsidy_programs_updated_at BEFORE UPDATE ON government_subsidy_programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subsidy_disbursements_updated_at BEFORE UPDATE ON subsidy_disbursements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subsidy_applications_updated_at BEFORE UPDATE ON government_subsidy_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_packages_updated_at BEFORE UPDATE ON technical_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON buyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_laboratories_updated_at BEFORE UPDATE ON laboratories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();