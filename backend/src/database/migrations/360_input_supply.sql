CREATE TABLE IF NOT EXISTS input_supply (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_input_supply_user ON input_supply(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_input_supply_status ON input_supply(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_input_supply_created ON input_supply(created_at) WHERE deleted_at IS NULL;