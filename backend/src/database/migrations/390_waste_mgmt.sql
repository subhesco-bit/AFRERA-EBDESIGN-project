CREATE TABLE IF NOT EXISTS waste_mgmt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_waste_mgmt_user ON waste_mgmt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waste_mgmt_status ON waste_mgmt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_waste_mgmt_created ON waste_mgmt(created_at) WHERE deleted_at IS NULL;