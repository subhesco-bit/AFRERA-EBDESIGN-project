CREATE TABLE IF NOT EXISTS key_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_key_management_user ON key_management(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_key_management_status ON key_management(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_key_management_created ON key_management(created_at) WHERE deleted_at IS NULL;