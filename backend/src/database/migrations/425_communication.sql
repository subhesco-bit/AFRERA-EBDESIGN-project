CREATE TABLE IF NOT EXISTS communication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_communication_user ON communication(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_status ON communication(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_communication_created ON communication(created_at) WHERE deleted_at IS NULL;