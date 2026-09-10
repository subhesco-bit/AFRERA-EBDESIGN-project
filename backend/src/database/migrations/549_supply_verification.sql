CREATE TABLE IF NOT EXISTS supply_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_supply_verification_user ON supply_verification(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supply_verification_status ON supply_verification(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supply_verification_created ON supply_verification(created_at) WHERE deleted_at IS NULL;