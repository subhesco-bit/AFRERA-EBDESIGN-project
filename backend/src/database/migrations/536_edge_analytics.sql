CREATE TABLE IF NOT EXISTS edge_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_edge_analytics_user ON edge_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_edge_analytics_status ON edge_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_edge_analytics_created ON edge_analytics(created_at) WHERE deleted_at IS NULL;