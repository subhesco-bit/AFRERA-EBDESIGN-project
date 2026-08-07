-- Food Safety ERP Database Schema
-- CAP-247 to CAP-254: HACCP Management, FSSAI Compliance, ISO 22000 Compliance,
-- Recall Management, CAPA Management, Food Safety Audit, Risk Assessment, Corrective Actions

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HACCP PLANS (CAP-247)
-- ============================================================================

CREATE TABLE IF NOT EXISTS haccp_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(255) NOT NULL,
    facility_id INTEGER NOT NULL,
    product_category VARCHAR(100),
    hazard_analysis JSONB,
    critical_control_points JSONB,
    monitoring_procedures JSONB,
    critical_limits JSONB,
    corrective_actions JSONB,
    verification_procedures JSONB,
    record_keeping JSONB,
    review_frequency VARCHAR(50),
    approved_by INTEGER,
    effective_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_haccp_plans_facility ON haccp_plans(facility_id);
CREATE INDEX idx_haccp_plans_category ON haccp_plans(product_category);
CREATE INDEX idx_haccp_plans_status ON haccp_plans(status);

-- ============================================================================
-- HACCP MONITORING RECORDS (CAP-247)
-- ============================================================================

CREATE TABLE IF NOT EXISTS haccp_monitoring_records (
    id SERIAL PRIMARY KEY,
    haccp_plan_id INTEGER NOT NULL,
    ccp_id INTEGER NOT NULL,
    monitoring_value DECIMAL(10,2),
    critical_limit DECIMAL(10,2),
    within_limits BOOLEAN,
    monitoring_by INTEGER,
    comments TEXT,
    corrective_action_taken TEXT,
    monitoring_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_haccp_monitoring_plan ON haccp_monitoring_records(haccp_plan_id);
CREATE INDEX idx_haccp_monitoring_ccp ON haccp_monitoring_records(ccp_id);
CREATE INDEX idx_haccp_monitoring_time ON haccp_monitoring_records(monitoring_time DESC);

-- ============================================================================
-- FSSAI COMPLIANCE (CAP-248)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fssai_compliance (
    id SERIAL PRIMARY KEY,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    facility_id INTEGER NOT NULL,
    license_type VARCHAR(50),
    license_category VARCHAR(50),
    valid_from DATE,
    valid_to DATE,
    annual_turnover DECIMAL(15,2),
    manufacturing_activities JSONB,
    products_covered JSONB,
    compliance_status VARCHAR(50),
    inspection_date DATE,
    next_inspection_date DATE,
    violations JSONB,
    corrective_actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fssai_license ON fssai_compliance(license_number);
CREATE INDEX idx_fssai_facility ON fssai_compliance(facility_id);
CREATE INDEX idx_fssai_status ON fssai_compliance(compliance_status);

-- ============================================================================
-- ISO 22000 COMPLIANCE (CAP-249)
-- ============================================================================

CREATE TABLE IF NOT EXISTS iso22000_compliance (
    id SERIAL PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    facility_id INTEGER NOT NULL,
    scope TEXT,
    certification_body VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    surveillance_audits JSONB,
    management_review DATE,
    internal_audits JSONB,
    prerequisite_programs JSONB,
    food_safety_policy TEXT,
    objectives JSONB,
    performance_indicators JSONB,
    nonconformities JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_iso22000_certificate ON iso22000_compliance(certificate_number);
CREATE INDEX idx_iso22000_facility ON iso22000_compliance(facility_id);
CREATE INDEX idx_iso22000_status ON iso22000_compliance(status);

-- ============================================================================
-- FOOD SAFETY RECALLS (CAP-250)
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_safety_recalls (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    batch_number VARCHAR(100),
    recall_type VARCHAR(50),
    recall_reason TEXT,
    risk_level VARCHAR(50),
    affected_quantity INTEGER,
    distribution_scope JSONB,
    notification_method JSONB,
    recall_initiator INTEGER,
    recall_date DATE,
    response_deadline DATE,
    corrective_action_plan JSONB,
    communication_plan JSONB,
    status VARCHAR(50) DEFAULT 'initiated',
    recovery_rate DECIMAL(5,2),
    closure_notes TEXT,
    closed_by INTEGER,
    closed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_safety_recalls_product ON food_safety_recalls(product_id);
CREATE INDEX idx_food_safety_recalls_batch ON food_safety_recalls(batch_number);
CREATE INDEX idx_food_safety_recalls_status ON food_safety_recalls(status);
CREATE INDEX idx_food_safety_recalls_risk ON food_safety_recalls(risk_level);

-- ============================================================================
-- CAPA RECORDS (CAP-251)
-- ============================================================================

CREATE TABLE IF NOT EXISTS capa_records (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50),
    source_id INTEGER,
    issue_description TEXT,
    root_cause TEXT,
    impact_assessment JSONB,
    preventive_action JSONB,
    corrective_action JSONB,
    responsibility INTEGER,
    target_date DATE,
    effectiveness_check TEXT,
    verification_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'open',
    completion_notes TEXT,
    completed_by INTEGER,
    completed_date DATE,
    effectiveness_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capa_source ON capa_records(source_type, source_id);
CREATE INDEX idx_capa_status ON capa_records(status);
CREATE INDEX idx_capa_responsibility ON capa_records(responsibility);

-- ============================================================================
-- FOOD SAFETY AUDITS (CAP-252)
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_safety_audits (
    id SERIAL PRIMARY KEY,
    audit_type VARCHAR(50),
    facility_id INTEGER NOT NULL,
    audit_scope JSONB,
    audit_criteria JSONB,
    audit_team JSONB,
    scheduled_date DATE,
    actual_date DATE,
    findings JSONB,
    nonconformities JSONB,
    observations JSONB,
    score DECIMAL(5,2),
    grade VARCHAR(10),
    recommendations JSONB,
    follow_up_required BOOLEAN,
    next_audit_date DATE,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_safety_audits_facility ON food_safety_audits(facility_id);
CREATE INDEX idx_food_safety_audits_type ON food_safety_audits(audit_type);
CREATE INDEX idx_food_safety_audits_date ON food_safety_audits(actual_date DESC);

-- ============================================================================
-- FOOD SAFETY RISK ASSESSMENTS (CAP-253)
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_safety_risk_assessments (
    id SERIAL PRIMARY KEY,
    assessment_type VARCHAR(50),
    facility_id INTEGER NOT NULL,
    product_id INTEGER,
    hazard_identification JSONB,
    risk_characterization JSONB,
    exposure_assessment JSONB,
    risk_level VARCHAR(50),
    likelihood VARCHAR(50),
    severity VARCHAR(50),
    mitigation_measures JSONB,
    residual_risk VARCHAR(50),
    assessment_date DATE,
    assessed_by INTEGER,
    review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_safety_risk_facility ON food_safety_risk_assessments(facility_id);
CREATE INDEX idx_food_safety_risk_product ON food_safety_risk_assessments(product_id);
CREATE INDEX idx_food_safety_risk_level ON food_safety_risk_assessments(risk_level);

-- ============================================================================
-- CORRECTIVE ACTIONS (CAP-254)
-- ============================================================================

CREATE TABLE IF NOT EXISTS corrective_actions (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50),
    source_id INTEGER,
    issue_description TEXT,
    immediate_action TEXT,
    root_cause TEXT,
    long_term_correction TEXT,
    responsibility INTEGER,
    due_date DATE,
    effectiveness_verification TEXT,
    completion_date DATE,
    completed_by INTEGER,
    completion_notes TEXT,
    effectiveness_result JSONB,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_corrective_actions_source ON corrective_actions(source_type, source_id);
CREATE INDEX idx_corrective_actions_status ON corrective_actions(status);
CREATE INDEX idx_corrective_actions_responsibility ON corrective_actions(responsibility);

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
CREATE TRIGGER update_haccp_plans_updated_at BEFORE UPDATE ON haccp_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fssai_compliance_updated_at BEFORE UPDATE ON fssai_compliance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iso22000_compliance_updated_at BEFORE UPDATE ON iso22000_compliance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_safety_recalls_updated_at BEFORE UPDATE ON food_safety_recalls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capa_records_updated_at BEFORE UPDATE ON capa_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_safety_audits_updated_at BEFORE UPDATE ON food_safety_audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_safety_risk_assessments_updated_at BEFORE UPDATE ON food_safety_risk_assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corrective_actions_updated_at BEFORE UPDATE ON corrective_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
