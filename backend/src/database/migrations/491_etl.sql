CREATE TABLE IF NOT EXISTS etl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_etl_user ON etl(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_etl_status ON etl(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_etl_created ON etl(created_at) WHERE deleted_at IS NULL;