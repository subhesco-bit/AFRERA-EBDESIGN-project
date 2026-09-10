CREATE TABLE IF NOT EXISTS openid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_openid_user ON openid(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_openid_status ON openid(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_openid_created ON openid(created_at) WHERE deleted_at IS NULL;