CREATE TABLE IF NOT EXISTS feature_scaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_scaling_user ON feature_scaling(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_scaling_status ON feature_scaling(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_scaling_created ON feature_scaling(created_at) WHERE deleted_at IS NULL;