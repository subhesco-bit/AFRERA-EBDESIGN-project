CREATE TABLE IF NOT EXISTS deep_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_deep_learning_user ON deep_learning(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deep_learning_status ON deep_learning(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deep_learning_created ON deep_learning(created_at) WHERE deleted_at IS NULL;