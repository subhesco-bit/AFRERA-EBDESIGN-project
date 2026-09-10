CREATE TABLE IF NOT EXISTS api_gateway (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_api_gateway_user ON api_gateway(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_gateway_status ON api_gateway(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_gateway_created ON api_gateway(created_at) WHERE deleted_at IS NULL;