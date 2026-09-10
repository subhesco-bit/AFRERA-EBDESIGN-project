CREATE TABLE IF NOT EXISTS threat_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_threat_detection_user ON threat_detection(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_threat_detection_status ON threat_detection(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_threat_detection_created ON threat_detection(created_at) WHERE deleted_at IS NULL;