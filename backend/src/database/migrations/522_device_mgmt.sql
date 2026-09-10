CREATE TABLE IF NOT EXISTS device_mgmt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_device_mgmt_user ON device_mgmt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_device_mgmt_status ON device_mgmt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_device_mgmt_created ON device_mgmt(created_at) WHERE deleted_at IS NULL;