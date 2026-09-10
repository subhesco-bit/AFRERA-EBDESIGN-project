CREATE TABLE IF NOT EXISTS social_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_social_impact_user ON social_impact(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_impact_status ON social_impact(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_impact_created ON social_impact(created_at) WHERE deleted_at IS NULL;