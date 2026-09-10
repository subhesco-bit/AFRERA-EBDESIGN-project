CREATE TABLE IF NOT EXISTS microfinance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_microfinance_user ON microfinance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_microfinance_status ON microfinance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_microfinance_created ON microfinance(created_at) WHERE deleted_at IS NULL;