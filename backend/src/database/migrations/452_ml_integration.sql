CREATE TABLE IF NOT EXISTS ml_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ml_integration_user ON ml_integration(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ml_integration_status ON ml_integration(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ml_integration_created ON ml_integration(created_at) WHERE deleted_at IS NULL;