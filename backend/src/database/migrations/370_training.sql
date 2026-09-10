CREATE TABLE IF NOT EXISTS training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_training_user ON training(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_training_status ON training(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_training_created ON training(created_at) WHERE deleted_at IS NULL;