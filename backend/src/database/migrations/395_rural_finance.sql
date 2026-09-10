CREATE TABLE IF NOT EXISTS rural_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_rural_finance_user ON rural_finance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rural_finance_status ON rural_finance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rural_finance_created ON rural_finance(created_at) WHERE deleted_at IS NULL;