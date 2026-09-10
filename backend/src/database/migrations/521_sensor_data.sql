CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_user ON sensor_data(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_data_status ON sensor_data(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_data_created ON sensor_data(created_at) WHERE deleted_at IS NULL;