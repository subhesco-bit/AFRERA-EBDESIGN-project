CREATE TABLE IF NOT EXISTS telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_user ON telemetry(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_telemetry_status ON telemetry(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON telemetry(created_at) WHERE deleted_at IS NULL;