CREATE TABLE IF NOT EXISTS carbon_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_carbon_credits_user ON carbon_credits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carbon_credits_status ON carbon_credits(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_carbon_credits_created ON carbon_credits(created_at) WHERE deleted_at IS NULL;