CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_releases_user ON releases(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_releases_created ON releases(created_at) WHERE deleted_at IS NULL;