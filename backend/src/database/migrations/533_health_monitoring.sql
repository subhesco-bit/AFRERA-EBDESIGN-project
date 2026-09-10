CREATE TABLE IF NOT EXISTS health_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_health_monitoring_user ON health_monitoring(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_monitoring_status ON health_monitoring(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_monitoring_created ON health_monitoring(created_at) WHERE deleted_at IS NULL;