CREATE TABLE IF NOT EXISTS causal_inference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_causal_inference_user ON causal_inference(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_causal_inference_status ON causal_inference(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_causal_inference_created ON causal_inference(created_at) WHERE deleted_at IS NULL;