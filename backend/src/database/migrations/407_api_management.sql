CREATE TABLE IF NOT EXISTS api_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_api_management_user ON api_management(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_management_status ON api_management(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_management_created ON api_management(created_at) WHERE deleted_at IS NULL;