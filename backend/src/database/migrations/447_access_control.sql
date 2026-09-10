CREATE TABLE IF NOT EXISTS access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_access_control_user ON access_control(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_access_control_status ON access_control(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_access_control_created ON access_control(created_at) WHERE deleted_at IS NULL;