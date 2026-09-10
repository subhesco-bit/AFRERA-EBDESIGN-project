CREATE TABLE IF NOT EXISTS social_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_social_media_user ON social_media(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_media_status ON social_media(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_media_created ON social_media(created_at) WHERE deleted_at IS NULL;