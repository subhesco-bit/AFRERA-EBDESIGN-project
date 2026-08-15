-- Migration: Farmer Health & Welfare Module (M029)
-- Created: August 12, 2026
-- Description: Create tables for farmer health records and welfare programs

-- Farmer Health Records Table
CREATE TABLE IF NOT EXISTS farmer_health_records (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    health_type VARCHAR(50) NOT NULL, -- 'GENERAL', 'OCCUPATIONAL', 'CHRONIC', 'EMERGENCY'
    description TEXT,
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
    date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for farmer_health_records
CREATE INDEX IF NOT EXISTS idx_farmer_health_records_farmer_id ON farmer_health_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_health_records_health_type ON farmer_health_records(health_type);
CREATE INDEX IF NOT EXISTS idx_farmer_health_records_severity ON farmer_health_records(severity);
CREATE INDEX IF NOT EXISTS idx_farmer_health_records_date ON farmer_health_records(date);

-- Welfare Programs Table
CREATE TABLE IF NOT EXISTS welfare_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility VARCHAR(50) NOT NULL, -- 'ALL', 'BPL', 'SMALL_FARMER', 'WOMEN_FARMER'
    benefits TEXT,
    application_process TEXT,
    required_documents TEXT[],
    start_date DATE,
    end_date DATE,
    max_enrollments INTEGER,
    current_enrollments INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'CLOSED'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for welfare_programs
CREATE INDEX IF NOT EXISTS idx_welfare_programs_eligibility ON welfare_programs(eligibility);
CREATE INDEX IF NOT EXISTS idx_welfare_programs_status ON welfare_programs(status);
CREATE INDEX IF NOT EXISTS idx_welfare_programs_dates ON welfare_programs(start_date, end_date);

-- Welfare Enrollments Table
CREATE TABLE IF NOT EXISTS welfare_enrollments (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES welfare_programs(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    approval_date DATE,
 rejection_reason TEXT,
    benefits_received TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(farmer_id, program_id)
);

-- Indexes for welfare_enrollments
CREATE INDEX IF NOT EXISTS idx_welfare_enrollments_farmer_id ON welfare_enrollments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_welfare_enrollments_program_id ON welfare_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_welfare_enrollments_status ON welfare_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_welfare_enrollments_enrollment_date ON welfare_enrollments(enrollment_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farmer_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_farmer_health_records_updated_at
    BEFORE UPDATE ON farmer_health_records
    FOR EACH ROW
    EXECUTE FUNCTION update_farmer_health_updated_at();

CREATE TRIGGER trigger_welfare_programs_updated_at
    BEFORE UPDATE ON welfare_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_farmer_health_updated_at();

CREATE TRIGGER trigger_welfare_enrollments_updated_at
    BEFORE UPDATE ON welfare_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_farmer_health_updated_at();

-- Function to increment current_enrollments when a new enrollment is created
CREATE OR REPLACE FUNCTION increment_welfare_enrollments()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' THEN
        UPDATE welfare_programs 
        SET current_enrollments = current_enrollments + 1 
        WHERE id = NEW.program_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_welfare_enrollments
    AFTER INSERT ON welfare_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION increment_welfare_enrollments();

-- Insert sample welfare programs
INSERT INTO welfare_programs (name, description, eligibility, benefits, application_process, required_documents, start_date, end_date, max_enrollments) VALUES
('Health Insurance Scheme', 'Comprehensive health insurance for farmers and their families', 'ALL', 'Medical coverage up to ₹5 lakhs per year', 'Online application with health card verification', ARRAY['Aadhar Card', 'Land Records', 'Income Certificate'], CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 10000),
('Occupational Health Support', 'Support for work-related health issues in agriculture', 'SMALL_FARMER', 'Free health checkups and treatment for occupational hazards', 'Visit local health center with farm registration', ARRAY['Farm Registration', 'Health Report'], CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 5000),
('Women Farmer Health Program', 'Specialized health services for women farmers', 'WOMEN_FARMER', 'Maternal health, gynecological services, and general health support', 'Women health center enrollment', ARRAY['Women Identity Card', 'Farm Registration'], CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 3000),
('Emergency Medical Fund', 'Emergency medical assistance for critical health situations', 'BPL', 'Immediate financial support for medical emergencies', 'Emergency hotline with quick verification', ARRAY['BPL Card', 'Income Certificate', 'Medical Report'], CURRENT_DATE, CURRENT_DATE + INTERVAL '2 years', 2000)
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON farmer_health_records TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON welfare_programs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON welfare_enrollments TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE farmer_health_records_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE welfare_programs_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE welfare_enrollments_id_seq TO your_app_user;