-- FPO Registration Schema (M051)
-- Farmer Producer Organization registration and management

CREATE TABLE IF NOT EXISTS fpos (
    fpo_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    village_id VARCHAR(50),
    district_id VARCHAR(50),
    state_id VARCHAR(50),
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    fpo_type VARCHAR(50) NOT NULL,
    formation_date DATE,
    membership_count INTEGER DEFAULT 0,
    share_capital DECIMAL(15,2) DEFAULT 0,
    business_activities JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_memberships (
    membership_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50) REFERENCES fpos(fpo_id) ON DELETE CASCADE,
    farmer_id VARCHAR(50) NOT NULL,
    membership_date DATE NOT NULL,
    shareholding DECIMAL(15,2) DEFAULT 0,
    role VARCHAR(50) DEFAULT 'MEMBER',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_financial_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50) REFERENCES fpos(fpo_id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    reference_id VARCHAR(50),
    metadata JSONB,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_performance_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50) REFERENCES fpos(fpo_id) ON DELETE CASCADE,
    report_type VARCHAR(50) DEFAULT 'performance',
    fpo_summary JSONB,
    financial_summary JSONB,
    membership_summary JSONB,
    performance_metrics JSONB,
    recommendations JSONB,
    benchmark_comparison JSONB,
    growth_opportunities JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fpos_district ON fpos(district_id);
CREATE INDEX idx_fpos_state ON fpos(state_id);
CREATE INDEX idx_fpos_status ON fpos(status);
CREATE INDEX idx_fpos_type ON fpos(fpo_type);
CREATE INDEX idx_fpo_memberships_fpo ON fpo_memberships(fpo_id);
CREATE INDEX idx_fpo_memberships_farmer ON fpo_memberships(farmer_id);
CREATE INDEX idx_fpo_financial_transactions_fpo ON fpo_financial_transactions(fpo_id);
CREATE INDEX idx_fpo_financial_transactions_date ON fpo_financial_transactions(transaction_date);
CREATE INDEX idx_fpo_performance_reports_fpo ON fpo_performance_reports(fpo_id);
