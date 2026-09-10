CREATE TABLE IF NOT EXISTS data_validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_validation_user ON data_validation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_validation_status ON data_validation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_validation_created ON data_validation(created_at) WHERE deleted_at IS NULL;