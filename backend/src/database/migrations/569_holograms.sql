CREATE TABLE IF NOT EXISTS holograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_holograms_user ON holograms(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holograms_status ON holograms(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holograms_created ON holograms(created_at) WHERE deleted_at IS NULL;