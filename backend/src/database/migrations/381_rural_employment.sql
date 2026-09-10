CREATE TABLE IF NOT EXISTS rural_employment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_rural_employment_user ON rural_employment(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rural_employment_status ON rural_employment(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rural_employment_created ON rural_employment(created_at) WHERE deleted_at IS NULL;