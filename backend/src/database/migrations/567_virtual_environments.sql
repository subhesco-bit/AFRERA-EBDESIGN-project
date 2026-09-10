CREATE TABLE IF NOT EXISTS virtual_environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_virtual_environments_user ON virtual_environments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_virtual_environments_status ON virtual_environments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_virtual_environments_created ON virtual_environments(created_at) WHERE deleted_at IS NULL;