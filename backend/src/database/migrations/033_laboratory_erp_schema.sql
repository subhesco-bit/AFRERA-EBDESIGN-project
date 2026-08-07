-- Laboratory ERP (LIMS) Database Schema
-- Manages laboratory operations, sample testing, and certification

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- LABORATORY REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_code VARCHAR(50) UNIQUE NOT NULL,
    lab_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    nabl_accredited BOOLEAN DEFAULT FALSE,
    nabl_number VARCHAR(100),
    nabl_expiry_date DATE,
    accreditation_type VARCHAR(100),
    location_id UUID REFERENCES addresses(id),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    testing_capabilities JSONB DEFAULT '[]',
    equipment_list JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'inactive'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TEST CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES test_categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate test categories
INSERT INTO test_categories (name, description) VALUES
('Soil Testing', 'Analysis of soil samples for nutrients, contaminants, and physical properties'),
('Water Testing', 'Analysis of water samples for quality, contaminants, and safety'),
('Food Testing', 'Analysis of food samples for nutritional content, contaminants, and safety'),
('Pesticide Residue', 'Detection and quantification of pesticide residues'),
('Microbiological', 'Testing for microorganisms, pathogens, and microbial contamination'),
('Heavy Metals', 'Analysis of heavy metal content in samples'),
('Nutritional Analysis', 'Comprehensive nutritional profiling'),
('Organic Certification', 'Testing required for organic certification');

-- ============================================================================
-- TEST METHODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES test_categories(id),
    description TEXT,
    standard_reference VARCHAR(255), -- e.g., 'ISO 17025', 'AOAC 999.12'
    sample_type VARCHAR(100),
    parameters_analyzed JSONB DEFAULT '[]',
    equipment_required JSONB DEFAULT '[]',
    turnaround_days INTEGER,
    cost_per_sample DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SAMPLE REGISTRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS sample_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_number VARCHAR(50) UNIQUE NOT NULL,
    submitted_by UUID REFERENCES users(id),
    laboratory_id UUID REFERENCES laboratories(id),
    sample_type VARCHAR(100) NOT NULL, -- 'soil', 'water', 'food', 'plant'
    sample_source VARCHAR(255), -- Farm name, location, etc.
    collection_date DATE,
    collection_method VARCHAR(100),
    sample_description TEXT,
    quantity_g DECIMAL(10, 2),
    batch_number VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'normal', -- 'urgent', 'normal', 'low'
    requested_tests JSONB DEFAULT '[]', -- Array of test method IDs
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'received', -- 'received', 'in_progress', 'completed', 'rejected', 'cancelled'
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sample_registrations_number ON sample_registrations(sample_number);
CREATE INDEX IF NOT EXISTS idx_sample_registrations_status ON sample_registrations(status);
CREATE INDEX IF NOT EXISTS idx_sample_registrations_lab ON sample_registrations(laboratory_id);

-- ============================================================================
-- SAMPLE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS sample_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES sample_registrations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- 'received', 'assigned', 'testing', 'review', 'completed'
    location VARCHAR(255),
    handled_by VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_sample_tracking_sample ON sample_tracking(sample_id);

-- ============================================================================
-- TEST ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES sample_registrations(id) ON DELETE CASCADE,
    test_method_id INTEGER REFERENCES test_methods(id),
    assigned_to VARCHAR(255),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'failed'
    results JSONB,
    quality_control_data JSONB,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_test_assignments_sample ON test_assignments(sample_id);

-- ============================================================================
-- TEST RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_assignment_id UUID REFERENCES test_assignments(id) ON DELETE CASCADE,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(15, 6),
    unit VARCHAR(50),
    method_used VARCHAR(255),
    detection_limit DECIMAL(15, 6),
    uncertainty DECIMAL(10, 4),
    result_status VARCHAR(20), -- 'detected', 'not_detected', 'below_limit', 'above_limit'
    compliance_status VARCHAR(20), -- 'compliant', 'non_compliant', 'borderline'
    reference_value DECIMAL(15, 6),
    reference_range TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CERTIFICATION REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS certification_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES sample_registrations(id),
    report_number VARCHAR(50) UNIQUE NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'test_report', 'certificate', 'compliance'
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(255),
    report_data JSONB NOT NULL,
    pdf_url TEXT,
    valid_until DATE,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'issued', 'revoked'
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUALITY CONTROL
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_control_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES sample_registrations(id),
    qc_type VARCHAR(50) NOT NULL, -- 'blank', 'duplicate', 'spike', 'reference'
    expected_value DECIMAL(15, 6),
    tolerance_percentage DECIMAL(5, 2),
    measured_value DECIMAL(15, 6),
    passed BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EQUIPMENT CALIBRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_calibration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laboratory_id UUID REFERENCES laboratories(id),
    equipment_name VARCHAR(255) NOT NULL,
    equipment_id VARCHAR(100),
    calibration_date DATE,
    next_calibration_date DATE,
    calibration_agency VARCHAR(255),
    calibration_certificate_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'calibrated', -- 'calibrated', 'due', 'overdue'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ANALYST PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS laboratory_analysts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laboratory_id UUID REFERENCES laboratories(id),
    user_id UUID REFERENCES users(id),
    analyst_id VARCHAR(100) UNIQUE NOT NULL,
    qualifications JSONB DEFAULT '[]',
    specializations TEXT[],
    certification_level VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INVOICE & BILLING
-- ============================================================================

CREATE TABLE IF NOT EXISTS laboratory_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID REFERENCES sample_registrations(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    billed_to UUID REFERENCES users(id),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    total_amount DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    paid_at TIMESTAMP,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate sample number
CREATE OR REPLACE FUNCTION generate_sample_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    sample_num VARCHAR(50);
BEGIN
    sample_num := 'SMP-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(nextval('sample_seq')::TEXT, 6, '0');
    RETURN sample_num;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for sample numbers
CREATE SEQUENCE IF NOT EXISTS sample_seq START 1;

-- Function to calculate expected completion date
CREATE OR REPLACE FUNCTION calculate_completion_date(sample_id UUID)
RETURNS DATE AS $$
DECLARE
    turnaround_days INTEGER;
    expected_date DATE;
BEGIN
    SELECT COALESCE(SUM(tm.turnaround_days), 7) INTO turnaround_days
    FROM sample_registrations sr
    CROSS JOIN LATERAL jsonb_array_elements_text(sr.requested_tests) AS test_id
    LEFT JOIN test_methods tm ON tm.id::TEXT = test_id
    WHERE sr.id = sample_id;
    
    expected_date := CURRENT_DATE + COALESCE(turnaround_days, 7);
    RETURN expected_date;
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

DROP TRIGGER IF EXISTS update_laboratories_updated_at ON laboratories;
CREATE TRIGGER update_laboratories_updated_at BEFORE UPDATE ON laboratories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sample_registrations_updated_at ON sample_registrations;
CREATE TRIGGER update_sample_registrations_updated_at BEFORE UPDATE ON sample_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_laboratory_analysts_updated_at ON laboratory_analysts;
CREATE TRIGGER update_laboratory_analysts_updated_at BEFORE UPDATE ON laboratory_analysts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
