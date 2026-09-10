CREATE TABLE IF NOT EXISTS biodiversity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_biodiversity_user ON biodiversity(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_biodiversity_status ON biodiversity(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_biodiversity_created ON biodiversity(created_at) WHERE deleted_at IS NULL;