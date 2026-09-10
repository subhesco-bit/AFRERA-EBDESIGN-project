CREATE TABLE IF NOT EXISTS sso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sso_user ON sso(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sso_status ON sso(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sso_created ON sso(created_at) WHERE deleted_at IS NULL;