CREATE TABLE IF NOT EXISTS secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_secrets_user ON secrets(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_secrets_status ON secrets(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_secrets_created ON secrets(created_at) WHERE deleted_at IS NULL;