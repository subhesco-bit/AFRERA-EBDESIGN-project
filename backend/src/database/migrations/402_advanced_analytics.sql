CREATE TABLE IF NOT EXISTS advanced_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_advanced_analytics_user ON advanced_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_status ON advanced_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_advanced_analytics_created ON advanced_analytics(created_at) WHERE deleted_at IS NULL;