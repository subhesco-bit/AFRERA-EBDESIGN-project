CREATE TABLE IF NOT EXISTS cross_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_cross_chain_user ON cross_chain(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cross_chain_status ON cross_chain(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cross_chain_created ON cross_chain(created_at) WHERE deleted_at IS NULL;