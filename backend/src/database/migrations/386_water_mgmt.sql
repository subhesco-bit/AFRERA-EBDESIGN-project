CREATE TABLE IF NOT EXISTS water_mgmt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_water_mgmt_user ON water_mgmt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_water_mgmt_status ON water_mgmt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_water_mgmt_created ON water_mgmt(created_at) WHERE deleted_at IS NULL;