CREATE TABLE IF NOT EXISTS iot_gateway (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_iot_gateway_user ON iot_gateway(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_iot_gateway_status ON iot_gateway(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_iot_gateway_created ON iot_gateway(created_at) WHERE deleted_at IS NULL;