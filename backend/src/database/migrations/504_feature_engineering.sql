CREATE TABLE IF NOT EXISTS feature_engineering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_engineering_user ON feature_engineering(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_engineering_status ON feature_engineering(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_engineering_created ON feature_engineering(created_at) WHERE deleted_at IS NULL;