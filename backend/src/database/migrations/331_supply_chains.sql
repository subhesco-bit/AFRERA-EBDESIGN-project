CREATE TABLE IF NOT EXISTS supply_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_supply_chains_user ON supply_chains(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supply_chains_status ON supply_chains(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supply_chains_created ON supply_chains(created_at) WHERE deleted_at IS NULL;