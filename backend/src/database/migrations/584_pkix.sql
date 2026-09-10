CREATE TABLE IF NOT EXISTS pkix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_pkix_user ON pkix(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pkix_status ON pkix(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pkix_created ON pkix(created_at) WHERE deleted_at IS NULL;