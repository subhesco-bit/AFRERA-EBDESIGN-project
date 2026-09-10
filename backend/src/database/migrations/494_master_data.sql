CREATE TABLE IF NOT EXISTS master_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_master_data_user ON master_data(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_master_data_status ON master_data(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_master_data_created ON master_data(created_at) WHERE deleted_at IS NULL;