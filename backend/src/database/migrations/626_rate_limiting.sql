CREATE TABLE IF NOT EXISTS rate_limiting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limiting_user ON rate_limiting(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limiting_status ON rate_limiting(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rate_limiting_created ON rate_limiting(created_at) WHERE deleted_at IS NULL;