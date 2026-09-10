CREATE TABLE IF NOT EXISTS environmental_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_environmental_monitoring_user ON environmental_monitoring(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_environmental_monitoring_status ON environmental_monitoring(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_environmental_monitoring_created ON environmental_monitoring(created_at) WHERE deleted_at IS NULL;