CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at) WHERE deleted_at IS NULL;