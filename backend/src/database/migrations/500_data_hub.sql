CREATE TABLE IF NOT EXISTS data_hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_hub_user ON data_hub(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_hub_status ON data_hub(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_hub_created ON data_hub(created_at) WHERE deleted_at IS NULL;