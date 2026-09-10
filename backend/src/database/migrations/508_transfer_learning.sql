CREATE TABLE IF NOT EXISTS transfer_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_transfer_learning_user ON transfer_learning(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transfer_learning_status ON transfer_learning(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transfer_learning_created ON transfer_learning(created_at) WHERE deleted_at IS NULL;