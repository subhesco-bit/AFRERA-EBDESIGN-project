CREATE TABLE IF NOT EXISTS blockchain_node (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_blockchain_node_user ON blockchain_node(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_node_status ON blockchain_node(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_node_created ON blockchain_node(created_at) WHERE deleted_at IS NULL;