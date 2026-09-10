CREATE TABLE IF NOT EXISTS data_deduplication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_deduplication_user ON data_deduplication(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_deduplication_status ON data_deduplication(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_deduplication_created ON data_deduplication(created_at) WHERE deleted_at IS NULL;