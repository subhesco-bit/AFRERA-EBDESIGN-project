CREATE TABLE IF NOT EXISTS agri_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_agri_finance_user ON agri_finance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agri_finance_status ON agri_finance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agri_finance_created ON agri_finance(created_at) WHERE deleted_at IS NULL;