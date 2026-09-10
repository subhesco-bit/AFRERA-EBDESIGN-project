CREATE TABLE IF NOT EXISTS agri_tourism (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_agri_tourism_user ON agri_tourism(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agri_tourism_status ON agri_tourism(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agri_tourism_created ON agri_tourism(created_at) WHERE deleted_at IS NULL;