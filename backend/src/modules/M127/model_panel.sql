-- M127 extension: Specialist Panel case storage & withdrawal reference
-- Apply alongside existing animal_health_records schema

CREATE TABLE IF NOT EXISTS vet_case_conferences (
    case_id VARCHAR(64) PRIMARY KEY,
    species VARCHAR(32) NOT NULL,
    animal_id VARCHAR(50),
    farmer_id VARCHAR(50),
    urgency VARCHAR(20) NOT NULL,
    isolation_recommended BOOLEAN DEFAULT FALSE,
    notifiable_suspect BOOLEAN DEFAULT FALSE,
    confidence_overall DECIMAL(5,4),
    report JSONB NOT NULL,
    knowledge_version VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vet_case_species ON vet_case_conferences(species);
CREATE INDEX IF NOT EXISTS idx_vet_case_urgency ON vet_case_conferences(urgency);
CREATE INDEX IF NOT EXISTS idx_vet_case_notifiable ON vet_case_conferences(notifiable_suspect);

CREATE TABLE IF NOT EXISTS vet_withdrawal_periods (
    id SERIAL PRIMARY KEY,
    drug_id VARCHAR(100) NOT NULL,
    drug_name VARCHAR(200),
    species VARCHAR(32) NOT NULL,
    product_matrix VARCHAR(32) NOT NULL, -- milk|meat|eggs|honey
    withdrawal_days INTEGER,
    source TEXT NOT NULL,
    source_ref TEXT,
    country_scope VARCHAR(64) DEFAULT 'IN',
    version VARCHAR(32) NOT NULL,
    requires_label_verify BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (drug_id, species, product_matrix, version)
);

CREATE TABLE IF NOT EXISTS vet_ethnovet_catalogue (
    remedy_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    uses JSONB,
    species JSONB,
    evidence_level VARCHAR(32) NOT NULL,
    requires_vet_consultation BOOLEAN DEFAULT TRUE,
    cautions JSONB,
    region VARCHAR(64) DEFAULT 'India',
    version VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
