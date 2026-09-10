CREATE TABLE IF NOT EXISTS water_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_water_rights_user ON water_rights(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_water_rights_status ON water_rights(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_water_rights_created ON water_rights(created_at) WHERE deleted_at IS NULL;