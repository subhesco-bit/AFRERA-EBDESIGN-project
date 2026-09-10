CREATE TABLE IF NOT EXISTS youth_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_youth_engagement_user ON youth_engagement(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_youth_engagement_status ON youth_engagement(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_youth_engagement_created ON youth_engagement(created_at) WHERE deleted_at IS NULL;