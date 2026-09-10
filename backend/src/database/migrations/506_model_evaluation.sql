CREATE TABLE IF NOT EXISTS model_evaluation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_model_evaluation_user ON model_evaluation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_model_evaluation_status ON model_evaluation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_model_evaluation_created ON model_evaluation(created_at) WHERE deleted_at IS NULL;