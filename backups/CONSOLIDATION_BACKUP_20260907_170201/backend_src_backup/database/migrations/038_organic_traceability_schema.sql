-- Northeast Organic Traceability OS Database Schema
-- End-to-end organic traceability from seed to consumer with chain-of-custody

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- ORGANIC CERTIFICATION STANDARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_standards (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'NPOP', 'USDA-NOP', 'EU-ORGANIC'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    issuing_authority VARCHAR(255),
    country VARCHAR(100),
    conversion_period_months INTEGER DEFAULT 36,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC FARM REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id VARCHAR(100) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id),
    farm_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    registration_date DATE,
    certification_standard_id INTEGER REFERENCES organic_standards(id),
    certification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_conversion', 'certified', 'suspended', 'revoked'
    certification_date DATE,
    expiry_date DATE,
    conversion_start_date DATE,
    conversion_end_date DATE,
    total_area_hectares DECIMAL(10, 2),
    organic_area_hectares DECIMAL(10, 2),
    in_conversion_area_hectares DECIMAL(10, 2),
    location_id UUID REFERENCES addresses(id),
    gps_coordinates JSONB,
    soil_test_date DATE,
    soil_test_results JSONB,
    water_test_date DATE,
    water_test_results JSONB,
    inspection_date DATE,
    next_inspection_date DATE,
    inspector_name VARCHAR(255),
    inspector_id VARCHAR(100),
    certification_body VARCHAR(255),
    certificate_number VARCHAR(100),
    certificate_document_url TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organic_farms_farmer ON organic_farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_organic_farms_status ON organic_farms(certification_status);

-- ============================================================================
-- ORGANIC LAND PLOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organic_farm_id UUID REFERENCES organic_farms(id) ON DELETE CASCADE,
    plot_number VARCHAR(50) NOT NULL,
    plot_name VARCHAR(255),
    area_hectares DECIMAL(10, 2) NOT NULL,
    certification_status VARCHAR(20) DEFAULT 'certified', -- 'certified', 'in_conversion', 'non_organic'
    conversion_start_date DATE,
    conversion_end_date DATE,
    soil_type VARCHAR(100),
    irrigation_type VARCHAR(100),
    gps_boundary JSONB, -- GeoJSON polygon
    crops_grown TEXT[],
    last_inspection_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organic_plots_farm ON organic_plots(organic_farm_id);

-- ============================================================================
-- ORGANIC INPUTS (SEEDS, FERTILIZERS, PESTICIDES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_input_types (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) UNIQUE NOT NULL, -- 'seed', 'fertilizer', 'pesticide', 'growth_regulator'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_organic_compatible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS organic_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_type_id INTEGER REFERENCES organic_input_types(id),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    manufacturer VARCHAR(255),
    organic_certification_number VARCHAR(100),
    certification_body VARCHAR(255),
    is_organic_approved BOOLEAN DEFAULT TRUE,
    approval_date DATE,
    expiry_date DATE,
    composition JSONB,
    usage_instructions TEXT,
    safety_data_sheet_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_input_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organic_plot_id UUID REFERENCES organic_plots(id),
    organic_input_id UUID REFERENCES organic_inputs(id),
    application_date DATE,
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    application_method VARCHAR(100),
    applied_by VARCHAR(255),
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC CROP PRODUCTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organic_plot_id UUID REFERENCES organic_plots(id),
    crop_name VARCHAR(255) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_hectares DECIMAL(10, 2),
    expected_yield_kg_per_hectare DECIMAL(10, 2),
    actual_yield_kg DECIMAL(10, 2),
    seed_source VARCHAR(255),
    seed_lot_number VARCHAR(100),
    seed_certification_number VARCHAR(100),
    cultivation_practices JSONB, -- Details of organic cultivation practices
    pest_management_practices JSONB,
    soil_management_practices JSONB,
    water_management_practices JSONB,
    status VARCHAR(20) DEFAULT 'growing', -- 'growing', 'harvested', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC HARVEST
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_harvests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organic_crop_id UUID REFERENCES organic_crops(id),
    harvest_number VARCHAR(50) UNIQUE NOT NULL,
    harvest_date DATE NOT NULL,
    total_quantity_kg DECIMAL(12, 2) NOT NULL,
    grade VARCHAR(50),
    moisture_content DECIMAL(5, 2),
    quality_parameters JSONB,
    harvested_by VARCHAR(255),
    storage_location VARCHAR(255),
    batch_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC PROCESSING
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_processing_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(255) NOT NULL,
    facility_code VARCHAR(100) UNIQUE NOT NULL,
    certification_number VARCHAR(100),
    certification_body VARCHAR(255),
    certification_status VARCHAR(20) DEFAULT 'certified',
    certification_date DATE,
    expiry_date DATE,
    location_id UUID REFERENCES addresses(id),
    processing_types TEXT[], -- 'cleaning', 'grading', 'packaging', 'milling', etc.
    capacity_per_day_kg DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_processing_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    harvest_id UUID REFERENCES organic_harvests(id),
    processing_facility_id UUID REFERENCES organic_processing_facilities(id),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    processing_date DATE NOT NULL,
    processing_type VARCHAR(100) NOT NULL,
    input_quantity_kg DECIMAL(12, 2),
    output_quantity_kg DECIMAL(12, 2),
    processing_parameters JSONB,
    quality_check_results JSONB,
    processed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC STORAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_storage_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(255) NOT NULL,
    facility_code VARCHAR(100) UNIQUE NOT NULL,
    location_id UUID REFERENCES addresses(id),
    storage_type VARCHAR(50), -- 'warehouse', 'cold_storage', 'silo'
    capacity_kg DECIMAL(12, 2),
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_range VARCHAR(50),
    humidity_controlled BOOLEAN DEFAULT FALSE,
    humidity_range VARCHAR(50),
    pest_control_system VARCHAR(100),
    certification_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_storage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processing_batch_id UUID REFERENCES organic_processing_batches(id),
    storage_facility_id UUID REFERENCES organic_storage_facilities(id),
    storage_date DATE NOT NULL,
    quantity_kg DECIMAL(12, 2) NOT NULL,
    storage_location VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    withdrawal_date DATE,
    withdrawal_quantity_kg DECIMAL(12, 2),
    withdrawal_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC TRANSPORTATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_transport_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_record_id UUID REFERENCES organic_storage_records(id),
    transport_number VARCHAR(50) UNIQUE NOT NULL,
    transport_date DATE NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    quantity_kg DECIMAL(12, 2) NOT NULL,
    vehicle_number VARCHAR(50),
    vehicle_type VARCHAR(100),
    driver_name VARCHAR(255),
    temperature_controlled BOOLEAN DEFAULT FALSE,
    temperature_log JSONB,
    contamination_prevention_measures TEXT[],
    arrival_date DATE,
    received_by VARCHAR(255),
    received_quantity_kg DECIMAL(12, 2),
    condition_on_arrival VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORGANIC PACKAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_packaging_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_name VARCHAR(255) NOT NULL,
    material_type VARCHAR(100), -- 'jute', 'paper', 'biodegradable_plastic', 'glass'
    is_organic_compliant BOOLEAN DEFAULT TRUE,
    certification_number VARCHAR(100),
    supplier VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_packaging_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transport_record_id UUID REFERENCES organic_transport_records(id),
    packaging_material_id UUID REFERENCES organic_packaging_materials(id),
    packaging_date DATE NOT NULL,
    quantity_kg DECIMAL(12, 2) NOT NULL,
    package_type VARCHAR(100),
    package_size VARCHAR(50),
    batch_number VARCHAR(100),
    lot_number VARCHAR(100),
    expiry_date DATE,
    qr_code_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CHAIN OF CUSTODY
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_chain_of_custody (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    current_holder_type VARCHAR(50) NOT NULL, -- 'farmer', 'processor', 'storage', 'transport', 'retailer', 'consumer'
    current_holder_id UUID,
    custody_transfer_date DATE NOT NULL,
    transfer_from_type VARCHAR(50),
    transfer_from_id UUID,
    quantity_kg DECIMAL(12, 2) NOT NULL,
    document_reference VARCHAR(100),
    verified_by VARCHAR(255),
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organic_chain_of_custody_product ON organic_chain_of_custody(product_id);
CREATE INDEX IF NOT EXISTS idx_chain_of_custody_lot ON organic_chain_of_custody(lot_number);

-- ============================================================================
-- ORGANIC CERTIFICATION AUDITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organic_farm_id UUID REFERENCES organic_farms(id),
    audit_type VARCHAR(50) NOT NULL, -- 'initial', 'annual', 'surprise', 'complaint'
    audit_date DATE NOT NULL,
    auditor_name VARCHAR(255),
    auditor_organization VARCHAR(255),
    audit_findings JSONB,
    non_conformities JSONB,
    corrective_actions JSONB,
    follow_up_date DATE,
    audit_result VARCHAR(50), -- 'pass', 'pass_with_conditions', 'fail'
    report_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONSUMER TRANSPARENCY (QR CODE DATA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_consumer_transparency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    lot_number VARCHAR(100),
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    farmer_name VARCHAR(255),
    farm_location TEXT,
    farm_certification_number VARCHAR(100),
    harvest_date DATE,
    processing_facility VARCHAR(255),
    processing_date DATE,
    packaging_date DATE,
    ingredients JSONB,
    nutritional_info JSONB,
    organic_certification_details JSONB,
    chain_of_custody_summary JSONB,
    quality_test_results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consumer_transparency_qr ON organic_consumer_transparency(qr_code);

-- ============================================================================
-- ORGANIC FRAUD DETECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS organic_fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'fake_certificate', 'non_organic_input', 'chain_break', 'mislabeling'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    entity_type VARCHAR(50) NOT NULL, -- 'farm', 'processor', 'product', 'certificate'
    entity_id UUID,
    description TEXT NOT NULL,
    evidence JSONB,
    reported_by VARCHAR(255),
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    investigation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'false_alarm'
    investigation_findings JSONB,
    resolution_date TIMESTAMP,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate QR code data for a product
CREATE OR REPLACE FUNCTION generate_organic_qr_data(product_id UUID, lot_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    qr_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'product_id', p.id,
        'product_name', p.name,
        'lot_number', ot.lot_number,
        'farmer_name', up.first_name || ' ' || up.last_name,
        'farm_location', a.city || ', ' || a.state,
        'certification_number', ofarm.certificate_number,
        'certification_body', ofarm.certification_body,
        'harvest_date', oh.harvest_date,
        'processing_date', opb.processing_date,
        'organic_status', ofarm.certification_status
    ) INTO qr_data
    FROM products p
    LEFT JOIN organic_consumer_transparency ot ON p.id = ot.product_id
    LEFT JOIN organic_harvests oh ON ot.lot_number = oh.batch_number
    LEFT JOIN organic_processing_batches opb ON oh.id = opb.harvest_id
    LEFT JOIN organic_farms ofarm ON oh.organic_crop_id IN (
        SELECT id FROM organic_crops WHERE organic_plot_id IN (
            SELECT id FROM organic_plots WHERE organic_farm_id = ofarm.id
        )
    )
    LEFT JOIN user_profiles up ON ofarm.farmer_id = up.user_id
    LEFT JOIN addresses a ON ofarm.location_id = a.id
    WHERE p.id = product_id;
    
    RETURN qr_data;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organic_farms_updated_at ON organic_farms;
CREATE TRIGGER update_organic_farms_updated_at BEFORE UPDATE ON organic_farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organic_plots_updated_at ON organic_plots;
CREATE TRIGGER update_organic_plots_updated_at BEFORE UPDATE ON organic_plots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organic_crops_updated_at ON organic_crops;
CREATE TRIGGER update_organic_crops_updated_at BEFORE UPDATE ON organic_crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organic_processing_facilities_updated_at ON organic_processing_facilities;
CREATE TRIGGER update_organic_processing_facilities_updated_at BEFORE UPDATE ON organic_processing_facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organic_storage_facilities_updated_at ON organic_storage_facilities;
CREATE TRIGGER update_organic_storage_facilities_updated_at BEFORE UPDATE ON organic_storage_facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
