CREATE TABLE IF NOT EXISTS pest_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_pest_management_user ON pest_management(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pest_management_status ON pest_management(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pest_management_created ON pest_management(created_at) WHERE deleted_at IS NULL;