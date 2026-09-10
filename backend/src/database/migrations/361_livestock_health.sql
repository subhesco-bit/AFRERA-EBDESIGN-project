CREATE TABLE IF NOT EXISTS livestock_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_livestock_health_user ON livestock_health(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_livestock_health_status ON livestock_health(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_livestock_health_created ON livestock_health(created_at) WHERE deleted_at IS NULL;