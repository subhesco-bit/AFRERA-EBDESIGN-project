CREATE TABLE IF NOT EXISTS behavioral_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_user ON behavioral_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_status ON behavioral_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_behavioral_analytics_created ON behavioral_analytics(created_at) WHERE deleted_at IS NULL;