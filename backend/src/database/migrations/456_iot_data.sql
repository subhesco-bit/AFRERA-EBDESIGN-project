CREATE TABLE IF NOT EXISTS iot_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_iot_data_user ON iot_data(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_iot_data_status ON iot_data(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_iot_data_created ON iot_data(created_at) WHERE deleted_at IS NULL;