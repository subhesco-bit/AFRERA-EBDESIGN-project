CREATE TABLE IF NOT EXISTS financial_modeling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_modeling_user ON financial_modeling(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_modeling_status ON financial_modeling(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_modeling_created ON financial_modeling(created_at) WHERE deleted_at IS NULL;