CREATE TABLE IF NOT EXISTS insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_insurance_user ON insurance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_status ON insurance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_created ON insurance(created_at) WHERE deleted_at IS NULL;