CREATE TABLE IF NOT EXISTS blockchain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_blockchain_user ON blockchain(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_status ON blockchain(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_created ON blockchain(created_at) WHERE deleted_at IS NULL;