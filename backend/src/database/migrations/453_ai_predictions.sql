CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_user ON ai_predictions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_predictions_status ON ai_predictions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created ON ai_predictions(created_at) WHERE deleted_at IS NULL;