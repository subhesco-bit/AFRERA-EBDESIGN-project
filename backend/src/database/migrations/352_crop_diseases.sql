CREATE TABLE IF NOT EXISTS crop_diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_diseases_user ON crop_diseases(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crop_diseases_status ON crop_diseases(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crop_diseases_created ON crop_diseases(created_at) WHERE deleted_at IS NULL;