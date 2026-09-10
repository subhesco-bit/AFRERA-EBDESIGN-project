CREATE TABLE IF NOT EXISTS model_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_model_training_user ON model_training(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_model_training_status ON model_training(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_model_training_created ON model_training(created_at) WHERE deleted_at IS NULL;