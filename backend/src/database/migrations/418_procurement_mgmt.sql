CREATE TABLE IF NOT EXISTS procurement_mgmt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_procurement_mgmt_user ON procurement_mgmt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_procurement_mgmt_status ON procurement_mgmt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_procurement_mgmt_created ON procurement_mgmt(created_at) WHERE deleted_at IS NULL;