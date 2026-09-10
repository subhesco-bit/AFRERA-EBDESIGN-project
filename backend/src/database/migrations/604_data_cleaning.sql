CREATE TABLE IF NOT EXISTS data_cleaning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_data_cleaning_user ON data_cleaning(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_cleaning_status ON data_cleaning(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_data_cleaning_created ON data_cleaning(created_at) WHERE deleted_at IS NULL;