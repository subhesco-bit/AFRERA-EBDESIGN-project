CREATE TABLE IF NOT EXISTS soil_conservation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_soil_conservation_user ON soil_conservation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_soil_conservation_status ON soil_conservation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_soil_conservation_created ON soil_conservation(created_at) WHERE deleted_at IS NULL;