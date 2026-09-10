CREATE TABLE IF NOT EXISTS irrigation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_irrigation_user ON irrigation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_irrigation_status ON irrigation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_irrigation_created ON irrigation(created_at) WHERE deleted_at IS NULL;