CREATE TABLE IF NOT EXISTS smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_contracts_user ON smart_contracts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON smart_contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contracts_created ON smart_contracts(created_at) WHERE deleted_at IS NULL;