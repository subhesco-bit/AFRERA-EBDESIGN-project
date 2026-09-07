-- Institutional Procurement ERP Database Schema
-- CAP-262 to CAP-268: Tender Management, Demand Forecasting, Institution Menu Planning,
-- Nutrition Compliance, Supply Contracts, Quality Inspection, Settlement Management

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROCUREMENT TENDERS (CAP-262)
-- ============================================================================

CREATE TABLE IF NOT EXISTS procurement_tenders (
    id SERIAL PRIMARY KEY,
    tender_number VARCHAR(100) UNIQUE NOT NULL,
    institution_id INTEGER NOT NULL,
    tender_type VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    procurement_category VARCHAR(100),
    estimated_value DECIMAL(15,2),
    bid_security_amount DECIMAL(15,2),
    pre_bid_meeting_date DATE,
    bid_submission_deadline TIMESTAMP,
    bid_opening_date TIMESTAMP,
    technical_evaluation_date DATE,
    financial_evaluation_date DATE,
    award_date DATE,
    contract_duration INTEGER,
    delivery_schedule JSONB,
    payment_terms JSONB,
    eligibility_criteria JSONB,
    evaluation_criteria JSONB,
    documents_required JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procurement_tenders_number ON procurement_tenders(tender_number);
CREATE INDEX idx_procurement_tenders_institution ON procurement_tenders(institution_id);
CREATE INDEX idx_procurement_tenders_type ON procurement_tenders(tender_type);
CREATE INDEX idx_procurement_tenders_status ON procurement_tenders(status);

-- ============================================================================
-- TENDER BIDS (CAP-262)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tender_bids (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    bid_amount DECIMAL(15,2),
    technical_proposal JSONB,
    financial_proposal JSONB,
    documents_submitted JSONB,
    bid_security_provided BOOLEAN,
    proposed_delivery_schedule JSONB,
    proposed_payment_terms JSONB,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tender_bids_tender ON tender_bids(tender_id);
CREATE INDEX idx_tender_bids_supplier ON tender_bids(supplier_id);
CREATE INDEX idx_tender_bids_status ON tender_bids(status);

-- ============================================================================
-- DEMAND FORECASTS (CAP-263)
-- ============================================================================

CREATE TABLE IF NOT EXISTS demand_forecasts (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    forecast_period VARCHAR(50),
    forecast_type VARCHAR(50),
    product_category VARCHAR(100),
    historical_data JSONB,
    seasonal_factors JSONB,
    special_events JSONB,
    enrollment_data JSONB,
    menu_requirements JSONB,
    budget_constraints JSONB,
    forecast_method VARCHAR(100),
    confidence_level DECIMAL(5,2),
    generated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demand_forecasts_institution ON demand_forecasts(institution_id);
CREATE INDEX idx_demand_forecasts_type ON demand_forecasts(forecast_type);
CREATE INDEX idx_demand_forecasts_category ON demand_forecasts(product_category);

-- ============================================================================
-- MENU PLANS (CAP-264)
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_plans (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    meal_types JSONB,
    target_demographics JSONB,
    nutritional_requirements JSONB,
    budget_per_meal DECIMAL(10,2),
    special_dietary_requirements JSONB,
    seasonal_preferences JSONB,
    local_sourcing_requirements JSONB,
    menu_items JSONB,
    ingredients_list JSONB,
    portion_sizes JSONB,
    preparation_instructions JSONB,
    allergen_information JSONB,
    approved_by INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_plans_institution ON menu_plans(institution_id);
CREATE INDEX idx_menu_plans_type ON menu_plans(plan_type);
CREATE INDEX idx_menu_plans_dates ON menu_plans(start_date, end_date);
CREATE INDEX idx_menu_plans_status ON menu_plans(status);

-- ============================================================================
-- NUTRITION COMPLIANCE (CAP-265)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_compliance (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    compliance_type VARCHAR(50),
    compliance_period VARCHAR(50),
    nutritional_standards JSONB,
    actual_achievement JSONB,
    deficiencies JSONB,
    corrective_actions JSONB,
    compliance_score DECIMAL(5,2),
    assessed_by INTEGER,
    assessment_date DATE,
    next_assessment_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nutrition_compliance_institution ON nutrition_compliance(institution_id);
CREATE INDEX idx_nutrition_compliance_type ON nutrition_compliance(compliance_type);
CREATE INDEX idx_nutrition_compliance_date ON nutrition_compliance(assessment_date);

-- ============================================================================
-- SUPPLY CONTRACTS (CAP-266)
-- ============================================================================

CREATE TABLE IF NOT EXISTS supply_contracts (
    id SERIAL PRIMARY KEY,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    institution_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    contract_type VARCHAR(50),
    tender_id INTEGER,
    start_date DATE,
    end_date DATE,
    contract_value DECIMAL(15,2),
    products_supplied JSONB,
    delivery_schedule JSONB,
    quality_standards JSONB,
    payment_terms JSONB,
    penalty_clauses JSONB,
    force_majeure TEXT,
    renewal_terms JSONB,
    termination_conditions JSONB,
    special_conditions JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    signed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supply_contracts_number ON supply_contracts(contract_number);
CREATE INDEX idx_supply_contracts_institution ON supply_contracts(institution_id);
CREATE INDEX idx_supply_contracts_supplier ON supply_contracts(supplier_id);
CREATE INDEX idx_supply_contracts_status ON supply_contracts(status);

-- ============================================================================
-- QUALITY INSPECTIONS (CAP-267)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_inspections (
    id SERIAL PRIMARY KEY,
    inspection_number VARCHAR(100) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL,
    shipment_id INTEGER,
    inspection_type VARCHAR(50),
    inspection_date DATE,
    inspector_id INTEGER NOT NULL,
    inspection_location VARCHAR(255),
    sample_size INTEGER,
    inspection_criteria JSONB,
    test_results JSONB,
    quality_score DECIMAL(5,2),
    pass_fail BOOLEAN,
    defects_found JSONB,
    non_conformities JSONB,
    corrective_actions_required JSONB,
    approval_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quality_inspections_number ON quality_inspections(inspection_number);
CREATE INDEX idx_quality_inspections_contract ON quality_inspections(contract_id);
CREATE INDEX idx_quality_inspections_shipment ON quality_inspections(shipment_id);
CREATE INDEX idx_quality_inspections_status ON quality_inspections(approval_status);

-- ============================================================================
-- SETTLEMENT RECORDS (CAP-268)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlement_records (
    id SERIAL PRIMARY KEY,
    settlement_number VARCHAR(100) UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL,
    invoice_id INTEGER,
    settlement_type VARCHAR(50),
    settlement_date DATE,
    amount_due DECIMAL(15,2),
    amount_paid DECIMAL(15,2),
    deductions JSONB,
    penalties JSONB,
    bonuses JSONB,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    settled_by INTEGER,
    approved_by INTEGER,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlement_records_number ON settlement_records(settlement_number);
CREATE INDEX idx_settlement_records_contract ON settlement_records(contract_id);
CREATE INDEX idx_settlement_records_invoice ON settlement_records(invoice_id);
CREATE INDEX idx_settlement_records_date ON settlement_records(settlement_date);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_procurement_tenders_updated_at BEFORE UPDATE ON procurement_tenders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_bids_updated_at BEFORE UPDATE ON tender_bids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demand_forecasts_updated_at BEFORE UPDATE ON demand_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_plans_updated_at BEFORE UPDATE ON menu_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_compliance_updated_at BEFORE UPDATE ON nutrition_compliance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supply_contracts_updated_at BEFORE UPDATE ON supply_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_inspections_updated_at BEFORE UPDATE ON quality_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_records_updated_at BEFORE UPDATE ON settlement_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
