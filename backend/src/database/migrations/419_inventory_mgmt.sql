CREATE TABLE IF NOT EXISTS inventory_mgmt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_user ON inventory_mgmt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_status ON inventory_mgmt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_created ON inventory_mgmt(created_at) WHERE deleted_at IS NULL;