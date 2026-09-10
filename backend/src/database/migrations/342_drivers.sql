CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_drivers_user ON drivers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_created ON drivers(created_at) WHERE deleted_at IS NULL;