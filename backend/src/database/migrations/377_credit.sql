CREATE TABLE IF NOT EXISTS credit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_credit_user ON credit(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_status ON credit(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_created ON credit(created_at) WHERE deleted_at IS NULL;