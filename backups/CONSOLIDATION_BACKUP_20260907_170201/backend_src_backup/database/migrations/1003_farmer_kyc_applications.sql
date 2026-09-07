CREATE TABLE IF NOT EXISTS farmer_kyc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  id_type VARCHAR(50) NOT NULL,
  id_number VARCHAR(120) NOT NULL,
  village VARCHAR(255),
  land_holding_hectares NUMERIC(12, 3),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  decision_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farmer_kyc_applications_status ON farmer_kyc_applications(status);