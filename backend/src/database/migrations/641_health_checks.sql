CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_health_checks_user ON health_checks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_checks_created ON health_checks(created_at) WHERE deleted_at IS NULL;