-- NAME FIX 2026-08-04: this file referenced "insurance_policies", a table that
-- exists nowhere in the schema. The real table is "policies" (000_base_schema).
-- Every ALTER, index and foreign key here silently failed as a result.
-- Renamed 4 reference(s); FKs to it corrected to UUID to match policies.id.

-- FK TYPE FIX 2026-08-04: 4 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Insurance Enhancements Migration
-- Premium Calculation, Policy Issuance, and Fraud Detection

-- Insurance Quotes Table
CREATE TABLE IF NOT EXISTS insurance_quotes (
  id SERIAL PRIMARY KEY,
  policyholder_id UUID NOT NULL REFERENCES users(id),
  insurance_type VARCHAR(50) NOT NULL,
  premium_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'issued', 'expired')),
  valid_until TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_quotes_policyholder_id ON insurance_quotes(policyholder_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_status ON insurance_quotes(status);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_insurance_type ON insurance_quotes(insurance_type);

-- Enhanced Insurance Policies Table
ALTER TABLE policies 
ADD COLUMN IF NOT EXISTS quote_id INTEGER REFERENCES insurance_quotes(id),
ADD COLUMN IF NOT EXISTS policy_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_schedule JSONB,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS policy_data JSONB,
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS renewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS renewal_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(12, 2);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_policy_number ON policies(policy_number);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_quote_id ON policies(quote_id);

-- Policy Documents Table
CREATE TABLE IF NOT EXISTS policy_documents (
  id SERIAL PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES policies(id),
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_policy_documents_policy_id ON policy_documents(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_documents_document_type ON policy_documents(document_type);

-- Enhanced Claims Table
ALTER TABLE claims
ADD COLUMN IF NOT EXISTS policyholder_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS incident_date DATE,
ADD COLUMN IF NOT EXISTS incident_location TEXT,
ADD COLUMN IF NOT EXISTS police_report_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS witness_details JSONB,
ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS investigation_notes TEXT,
ADD COLUMN IF NOT EXISTS investigation_officer UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS fraud_analysis_id INTEGER,
ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_claims_policyholder_id ON claims(policyholder_id);
CREATE INDEX IF NOT EXISTS idx_claims_incident_date ON claims(incident_date);
CREATE INDEX IF NOT EXISTS idx_claims_risk_level ON claims(risk_level);

-- Claim Documents Table
CREATE TABLE IF NOT EXISTS claim_documents (
  id SERIAL PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES claims(id),
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES users(id),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  verification_notes TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_document_type ON claim_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_claim_documents_verified ON claim_documents(verified);

-- Fraud Analysis Table
CREATE TABLE IF NOT EXISTS fraud_analysis (
  id SERIAL PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES claims(id),
  indicators JSONB NOT NULL,
  fraud_score JSONB NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(claim_id)
);

CREATE INDEX IF NOT EXISTS idx_fraud_analysis_claim_id ON fraud_analysis(claim_id);
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_risk_level ON fraud_analysis(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_analysis_analyzed_at ON fraud_analysis(analyzed_at);

-- Risk Factors Table (for location and crop risk data)
CREATE TABLE IF NOT EXISTS risk_factors (
  id SERIAL PRIMARY KEY,
  location_type VARCHAR(50) NOT NULL,
  location_value VARCHAR(100) NOT NULL,
  factor_type VARCHAR(50) NOT NULL,
  factor_value DECIMAL(5, 2) NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(location_type, location_value, factor_type, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_risk_factors_location ON risk_factors(location_type, location_value);
CREATE INDEX IF NOT EXISTS idx_risk_factors_factor_type ON risk_factors(factor_type);

-- Audit triggers for fraud detection
DROP TRIGGER IF EXISTS update_insurance_quotes_updated_at ON insurance_quotes;
CREATE TRIGGER update_insurance_quotes_updated_at BEFORE UPDATE ON insurance_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_factors_updated_at ON risk_factors;
CREATE TRIGGER update_risk_factors_updated_at BEFORE UPDATE ON risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically trigger fraud analysis on claim submission
CREATE OR REPLACE FUNCTION trigger_fraud_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- This would call the fraud detection service
  -- For now, we'll just mark the claim for analysis
  NEW.status = 'under_investigation';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for high-value claims
DROP TRIGGER IF EXISTS high_value_claim_fraud_check ON claims;
CREATE TRIGGER high_value_claim_fraud_check BEFORE INSERT ON claims
  FOR EACH ROW
  -- FIXED 2026-08-04: was NEW.amount. The column on claims is claim_amount
  -- (000_base_schema), so this trigger could never be created and no
  -- high-value claim was ever routed for fraud analysis.
  WHEN (NEW.claim_amount > 100000)
  EXECUTE FUNCTION trigger_fraud_analysis();

-- Insert default risk factors for Northeast India
INSERT INTO risk_factors (location_type, location_value, factor_type, factor_value) VALUES
('state', 'Assam', 'flood_risk', 0.8),
('state', 'Assam', 'drought_risk', 0.3),
('state', 'Assam', 'pest_risk', 0.6),
('state', 'Meghalaya', 'flood_risk', 0.6),
('state', 'Meghalaya', 'drought_risk', 0.2),
('state', 'Meghalaya', 'pest_risk', 0.5),
('state', 'Manipur', 'flood_risk', 0.5),
('state', 'Manipur', 'drought_risk', 0.4),
('state', 'Manipur', 'pest_risk', 0.4),
('state', 'Nagaland', 'flood_risk', 0.4),
('state', 'Nagaland', 'drought_risk', 0.3),
('state', 'Nagaland', 'pest_risk', 0.3),
('state', 'Tripura', 'flood_risk', 0.7),
('state', 'Tripura', 'drought_risk', 0.2),
('state', 'Tripura', 'pest_risk', 0.5),
('state', 'Mizoram', 'flood_risk', 0.4),
('state', 'Mizoram', 'drought_risk', 0.3),
('state', 'Mizoram', 'pest_risk', 0.3),
('state', 'Arunachal Pradesh', 'flood_risk', 0.5),
('state', 'Arunachal Pradesh', 'drought_risk', 0.3),
('state', 'Arunachal Pradesh', 'pest_risk', 0.4)
ON CONFLICT (location_type, location_value, factor_type, effective_from) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE insurance_quotes IS 'Stores insurance premium quotes before policy issuance';
COMMENT ON TABLE policy_documents IS 'Stores documents related to insurance policies';
COMMENT ON TABLE claim_documents IS 'Stores documents submitted for insurance claims';
COMMENT ON TABLE fraud_analysis IS 'Stores fraud detection analysis results for claims';
COMMENT ON TABLE risk_factors IS 'Stores risk factors for different locations and crop types';
