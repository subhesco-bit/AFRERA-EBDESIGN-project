CREATE TABLE IF NOT EXISTS 3d_rendering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_3d_rendering_user ON 3d_rendering(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_3d_rendering_status ON 3d_rendering(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_3d_rendering_created ON 3d_rendering(created_at) WHERE deleted_at IS NULL;