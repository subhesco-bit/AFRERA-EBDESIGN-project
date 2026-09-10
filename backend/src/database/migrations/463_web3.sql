CREATE TABLE IF NOT EXISTS web3 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_web3_user ON web3(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_web3_status ON web3(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_web3_created ON web3(created_at) WHERE deleted_at IS NULL;