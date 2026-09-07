-- Farmer Subsidies Schema (M025)
-- Government subsidy management and distribution

CREATE TABLE IF NOT EXISTS subsidy_schemes (
    scheme_id VARCHAR(50) PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    scheme_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    eligibility_criteria JSONB,
    subsidy_percentage DECIMAL(5,2),
    max_amount DECIMAL(15,2),
    min_land_size DECIMAL(10,2),
    max_land_size DECIMAL(10,2),
    target_crops JSONB,
    application_period_start DATE,
    application_period_end DATE,
    required_documents JSONB,
    ai_eligibility_prediction JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subsidy_applications (
    application_id VARCHAR(50) PRIMARY KEY,
    scheme_id VARCHAR(50) NOT NULL REFERENCES subsidy_schemes(scheme_id),
    farmer_id VARCHAR(50) NOT NULL,
    application_date DATE NOT NULL,
    application_status VARCHAR(20) DEFAULT 'pending',
    land_area DECIMAL(10,2),
    crops_grown JSONB,
    estimated_subsidy DECIMAL(15,2),
    documents_submitted JSONB,
    verification_status VARCHAR(20),
    verification_notes TEXT,
    approved_amount DECIMAL(15,2),
    disbursement_status VARCHAR(20),
    disbursement_date DATE,
    ai_eligibility_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subsidy_schemes_category ON subsidy_schemes(category);
CREATE INDEX idx_subsidy_schemes_status ON subsidy_schemes(status);
CREATE INDEX idx_subsidy_applications_scheme ON subsidy_applications(scheme_id);
CREATE INDEX idx_subsidy_applications_farmer ON subsidy_applications(farmer_id);
CREATE INDEX idx_subsidy_applications_status ON subsidy_applications(application_status);
