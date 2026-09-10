CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_user ON feature_flags(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON feature_flags(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_flags_created ON feature_flags(created_at) WHERE deleted_at IS NULL;