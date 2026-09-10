CREATE TABLE IF NOT EXISTS merkle_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_merkle_trees_user ON merkle_trees(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_merkle_trees_status ON merkle_trees(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_merkle_trees_created ON merkle_trees(created_at) WHERE deleted_at IS NULL;