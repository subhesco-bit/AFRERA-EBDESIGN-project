CREATE TABLE IF NOT EXISTS health_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_health_safety_user ON health_safety(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_safety_status ON health_safety(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_health_safety_created ON health_safety(created_at) WHERE deleted_at IS NULL;