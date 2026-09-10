CREATE TABLE IF NOT EXISTS zero_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_zero_trust_user ON zero_trust(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zero_trust_status ON zero_trust(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zero_trust_created ON zero_trust(created_at) WHERE deleted_at IS NULL;