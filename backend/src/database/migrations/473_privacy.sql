CREATE TABLE IF NOT EXISTS privacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_privacy_user ON privacy(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_privacy_status ON privacy(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_privacy_created ON privacy(created_at) WHERE deleted_at IS NULL;