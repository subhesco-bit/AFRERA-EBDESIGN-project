CREATE TABLE IF NOT EXISTS sidechains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sidechains_user ON sidechains(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sidechains_status ON sidechains(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sidechains_created ON sidechains(created_at) WHERE deleted_at IS NULL;