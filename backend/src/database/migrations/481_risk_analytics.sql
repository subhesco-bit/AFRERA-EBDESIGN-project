CREATE TABLE IF NOT EXISTS risk_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_analytics_user ON risk_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_risk_analytics_status ON risk_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_risk_analytics_created ON risk_analytics(created_at) WHERE deleted_at IS NULL;