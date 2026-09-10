CREATE TABLE IF NOT EXISTS disaster_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_disaster_recovery_user ON disaster_recovery(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_status ON disaster_recovery(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_disaster_recovery_created ON disaster_recovery(created_at) WHERE deleted_at IS NULL;