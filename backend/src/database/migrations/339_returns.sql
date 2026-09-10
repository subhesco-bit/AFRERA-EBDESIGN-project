CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_returns_created ON returns(created_at) WHERE deleted_at IS NULL;