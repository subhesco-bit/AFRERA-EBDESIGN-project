CREATE TABLE IF NOT EXISTS predictive_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_user ON predictive_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_status ON predictive_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_created ON predictive_analytics(created_at) WHERE deleted_at IS NULL;