CREATE TABLE IF NOT EXISTS mr_rendering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_mr_rendering_user ON mr_rendering(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mr_rendering_status ON mr_rendering(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mr_rendering_created ON mr_rendering(created_at) WHERE deleted_at IS NULL;