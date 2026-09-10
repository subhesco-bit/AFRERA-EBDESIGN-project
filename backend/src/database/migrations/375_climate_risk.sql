CREATE TABLE IF NOT EXISTS climate_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_climate_risk_user ON climate_risk(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_climate_risk_status ON climate_risk(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_climate_risk_created ON climate_risk(created_at) WHERE deleted_at IS NULL;