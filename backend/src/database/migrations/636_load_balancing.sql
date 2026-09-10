CREATE TABLE IF NOT EXISTS load_balancing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_load_balancing_user ON load_balancing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_load_balancing_status ON load_balancing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_load_balancing_created ON load_balancing(created_at) WHERE deleted_at IS NULL;