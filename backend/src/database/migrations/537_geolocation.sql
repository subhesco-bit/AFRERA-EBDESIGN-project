CREATE TABLE IF NOT EXISTS geolocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_geolocation_user ON geolocation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_geolocation_status ON geolocation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_geolocation_created ON geolocation(created_at) WHERE deleted_at IS NULL;