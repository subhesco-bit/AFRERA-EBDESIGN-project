CREATE TABLE IF NOT EXISTS monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_monitoring_user ON monitoring(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monitoring_status ON monitoring(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monitoring_created ON monitoring(created_at) WHERE deleted_at IS NULL;