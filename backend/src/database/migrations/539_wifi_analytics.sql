CREATE TABLE IF NOT EXISTS wifi_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_wifi_analytics_user ON wifi_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wifi_analytics_status ON wifi_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wifi_analytics_created ON wifi_analytics(created_at) WHERE deleted_at IS NULL;