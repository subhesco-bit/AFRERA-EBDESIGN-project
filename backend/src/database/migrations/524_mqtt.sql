CREATE TABLE IF NOT EXISTS mqtt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_mqtt_user ON mqtt(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mqtt_status ON mqtt(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mqtt_created ON mqtt(created_at) WHERE deleted_at IS NULL;