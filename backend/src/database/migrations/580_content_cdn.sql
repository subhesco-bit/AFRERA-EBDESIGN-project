CREATE TABLE IF NOT EXISTS content_cdn (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_content_cdn_user ON content_cdn(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_cdn_status ON content_cdn(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_content_cdn_created ON content_cdn(created_at) WHERE deleted_at IS NULL;