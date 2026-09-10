CREATE TABLE IF NOT EXISTS config_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_config_management_user ON config_management(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_config_management_status ON config_management(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_config_management_created ON config_management(created_at) WHERE deleted_at IS NULL;