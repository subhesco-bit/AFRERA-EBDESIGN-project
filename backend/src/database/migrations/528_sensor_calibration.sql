CREATE TABLE IF NOT EXISTS sensor_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sensor_calibration_user ON sensor_calibration(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_calibration_status ON sensor_calibration(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sensor_calibration_created ON sensor_calibration(created_at) WHERE deleted_at IS NULL;