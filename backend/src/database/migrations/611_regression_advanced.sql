CREATE TABLE IF NOT EXISTS regression_advanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_regression_advanced_user ON regression_advanced(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_regression_advanced_status ON regression_advanced(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_regression_advanced_created ON regression_advanced(created_at) WHERE deleted_at IS NULL;