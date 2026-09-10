CREATE TABLE IF NOT EXISTS customer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_analytics_user ON customer_analytics(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customer_analytics_status ON customer_analytics(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customer_analytics_created ON customer_analytics(created_at) WHERE deleted_at IS NULL;