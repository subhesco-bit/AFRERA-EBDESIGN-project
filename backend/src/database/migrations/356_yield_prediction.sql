CREATE TABLE IF NOT EXISTS yield_prediction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_yield_prediction_user ON yield_prediction(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_yield_prediction_status ON yield_prediction(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_yield_prediction_created ON yield_prediction(created_at) WHERE deleted_at IS NULL;