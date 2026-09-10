CREATE TABLE IF NOT EXISTS abac (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_abac_user ON abac(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_abac_status ON abac(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_abac_created ON abac(created_at) WHERE deleted_at IS NULL;