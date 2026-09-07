CREATE TABLE IF NOT EXISTS farmer_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_name VARCHAR(255) NOT NULL,
  verification_type VARCHAR(100) NOT NULL,
  claim_details TEXT,
  verifier_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  decision_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farmer_verification_requests_status ON farmer_verification_requests(status);