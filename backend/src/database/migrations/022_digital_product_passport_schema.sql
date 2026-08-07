-- Digital Product Passport Database Schema
-- CAP-269 to CAP-280: Unique Product ID, Lot/Batch Tracking, Farm Information,
-- Farmer Information, Certification Information, Processing History, Logistics History,
-- Sustainability Data, Carbon Data, Quality Reports, Recall Status, QR Code Generation

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- PRODUCT IDS (CAP-269)
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_ids (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100) UNIQUE NOT NULL,
    product_type VARCHAR(100),
    product_category VARCHAR(100),
    origin_country VARCHAR(100),
    manufacturer_id INTEGER,
    production_date DATE,
    batch_number VARCHAR(100),
    generated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_ids_product_id ON product_ids(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ids_type ON product_ids(product_type);
CREATE INDEX IF NOT EXISTS idx_product_ids_category ON product_ids(product_category);

-- ============================================================================
-- BATCH TRACKING (CAP-270)
-- ============================================================================

CREATE TABLE IF NOT EXISTS batch_tracking (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    quantity_produced DECIMAL(15,2),
    quantity_unit VARCHAR(50),
    production_line VARCHAR(100),
    production_parameters JSONB,
    quality_checks JSONB,
    assigned_by INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_tracking_number ON batch_tracking(batch_number);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_product ON batch_tracking(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_status ON batch_tracking(status);

-- ============================================================================
-- FARM INFORMATION (CAP-271)
-- ============================================================================

CREATE TABLE IF NOT EXISTS farm_information (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    farm_id INTEGER,
    farm_name VARCHAR(255),
    location VARCHAR(255),
    coordinates JSONB,
    soil_type VARCHAR(100),
    climate_zone VARCHAR(100),
    cultivation_practices JSONB,
    irrigation_method VARCHAR(100),
    fertilizers_used JSONB,
    pesticides_used JSONB,
    harvest_date DATE,
    harvesting_method VARCHAR(100),
    post_harvest_handling JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farm_info_product ON farm_information(product_id);
CREATE INDEX IF NOT EXISTS idx_farm_info_batch ON farm_information(batch_id);
CREATE INDEX IF NOT EXISTS idx_farm_info_farm ON farm_information(farm_id);

-- ============================================================================
-- FARMER INFORMATION (CAP-272)
-- ============================================================================

CREATE TABLE IF NOT EXISTS farmer_information (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    farmer_id INTEGER,
    farmer_name VARCHAR(255),
    contact_information JSONB,
    farming_experience INTEGER,
    certifications JSONB,
    training_received JSONB,
    membership_in_cooperatives JSONB,
    payment_details JSONB,
    contract_terms JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farmer_info_product ON farmer_information(product_id);
CREATE INDEX IF NOT EXISTS idx_farmer_info_batch ON farmer_information(batch_id);
CREATE INDEX IF NOT EXISTS idx_farmer_info_farmer ON farmer_information(farmer_id);

-- ============================================================================
-- CERTIFICATION INFORMATION (CAP-273)
-- ============================================================================

CREATE TABLE IF NOT EXISTS certification_information (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    certification_type VARCHAR(100),
    certification_body VARCHAR(255),
    certificate_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    scope TEXT,
    standards_complied JSONB,
    audit_reports JSONB,
    non_conformities JSONB,
    corrective_actions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certification_info_product ON certification_information(product_id);
CREATE INDEX IF NOT EXISTS idx_certification_info_batch ON certification_information(batch_id);
CREATE INDEX IF NOT EXISTS idx_certification_info_type ON certification_information(certification_type);

-- ============================================================================
-- PROCESSING HISTORY (CAP-274)
-- ============================================================================

CREATE TABLE IF NOT EXISTS processing_history (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    processing_facility_id INTEGER,
    processing_date DATE,
    processing_type VARCHAR(100),
    equipment_used JSONB,
    processing_parameters JSONB,
    quality_checks JSONB,
    additives_used JSONB,
    packaging_material VARCHAR(255),
    processing_time INTEGER,
    operators JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_processing_history_product ON processing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_batch ON processing_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_facility ON processing_history(processing_facility_id);

-- ============================================================================
-- LOGISTICS HISTORY (CAP-275)
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics_history (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    shipment_id INTEGER,
    transport_mode VARCHAR(50),
    carrier_id INTEGER,
    pickup_date DATE,
    delivery_date DATE,
    route JSONB,
    temperature_conditions JSONB,
    handling_instructions TEXT,
    transit_time INTEGER,
    delays JSONB,
    incidents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_history_product ON logistics_history(product_id);
CREATE INDEX IF NOT EXISTS idx_logistics_history_batch ON logistics_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_logistics_history_shipment ON logistics_history(shipment_id);

-- ============================================================================
-- SUSTAINABILITY DATA (CAP-276)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sustainability_data (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    water_usage JSONB,
    energy_consumption JSONB,
    waste_generated JSONB,
    waste_recycled JSONB,
    soil_health_metrics JSONB,
    biodiversity_impact JSONB,
    social_impact JSONB,
    economic_impact JSONB,
    sustainability_score DECIMAL(5,2),
    certification_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sustainability_data_product ON sustainability_data(product_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_data_batch ON sustainability_data(batch_id);

-- ============================================================================
-- CARBON DATA (CAP-277)
-- ============================================================================

CREATE TABLE IF NOT EXISTS carbon_data (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    carbon_footprint DECIMAL(10,2),
    carbon_offset DECIMAL(10,2),
    emission_sources JSONB,
    reduction_initiatives JSONB,
    carbon_credits JSONB,
    verification_method VARCHAR(100),
    verification_date DATE,
    carbon_rating VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carbon_data_product ON carbon_data(product_id);
CREATE INDEX IF NOT EXISTS idx_carbon_data_batch ON carbon_data(batch_id);

-- ============================================================================
-- QUALITY REPORTS (CAP-278)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_reports (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    report_type VARCHAR(50),
    test_date DATE,
    test_parameters JSONB,
    test_results JSONB,
    quality_score DECIMAL(5,2),
    pass_fail BOOLEAN,
    tested_by INTEGER,
    laboratory_id INTEGER,
    certification_reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quality_reports_product ON quality_reports(product_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_batch ON quality_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_quality_reports_type ON quality_reports(report_type);

-- ============================================================================
-- RECALL STATUS (CAP-279)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recall_status (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    recall_id VARCHAR(100),
    recall_status VARCHAR(50),
    recall_date DATE,
    recall_reason TEXT,
    affected_markets JSONB,
    consumer_notification TEXT,
    remediation_actions JSONB,
    resolution_status VARCHAR(50),
    resolved_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recall_status_product ON recall_status(product_id);
CREATE INDEX IF NOT EXISTS idx_recall_status_batch ON recall_status(batch_id);
CREATE INDEX IF NOT EXISTS idx_recall_status_recall ON recall_status(recall_id);
CREATE INDEX IF NOT EXISTS idx_recall_status_status ON recall_status(recall_status);

-- ============================================================================
-- QR CODES (CAP-280)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(100),
    batch_id INTEGER,
    qr_data TEXT,
    qr_code_image TEXT,
    generated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_product ON qr_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_batch ON qr_codes(batch_id);

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
DROP TRIGGER IF EXISTS update_batch_tracking_updated_at ON batch_tracking;
CREATE TRIGGER update_batch_tracking_updated_at BEFORE UPDATE ON batch_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farm_information_updated_at ON farm_information;
CREATE TRIGGER update_farm_information_updated_at BEFORE UPDATE ON farm_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farmer_information_updated_at ON farmer_information;
CREATE TRIGGER update_farmer_information_updated_at BEFORE UPDATE ON farmer_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certification_information_updated_at ON certification_information;
CREATE TRIGGER update_certification_information_updated_at BEFORE UPDATE ON certification_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processing_history_updated_at ON processing_history;
CREATE TRIGGER update_processing_history_updated_at BEFORE UPDATE ON processing_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_logistics_history_updated_at ON logistics_history;
CREATE TRIGGER update_logistics_history_updated_at BEFORE UPDATE ON logistics_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sustainability_data_updated_at ON sustainability_data;
CREATE TRIGGER update_sustainability_data_updated_at BEFORE UPDATE ON sustainability_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_carbon_data_updated_at ON carbon_data;
CREATE TRIGGER update_carbon_data_updated_at BEFORE UPDATE ON carbon_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quality_reports_updated_at ON quality_reports;
CREATE TRIGGER update_quality_reports_updated_at BEFORE UPDATE ON quality_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recall_status_updated_at ON recall_status;
CREATE TRIGGER update_recall_status_updated_at BEFORE UPDATE ON recall_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
