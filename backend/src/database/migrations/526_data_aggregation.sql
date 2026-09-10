CREATE TABLE IF NOT EXISTS data_aggregation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_aggregation_user ON data_aggregation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_aggregation_status ON data_aggregation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_aggregation_created ON data_aggregation(created_at) WHERE deleted_at IS NULL;