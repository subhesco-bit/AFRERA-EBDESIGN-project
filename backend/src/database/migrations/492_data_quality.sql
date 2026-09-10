CREATE TABLE IF NOT EXISTS data_quality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_quality_user ON data_quality(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_quality_status ON data_quality(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_quality_created ON data_quality(created_at) WHERE deleted_at IS NULL;