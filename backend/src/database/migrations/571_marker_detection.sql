CREATE TABLE IF NOT EXISTS marker_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_marker_detection_user ON marker_detection(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marker_detection_status ON marker_detection(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marker_detection_created ON marker_detection(created_at) WHERE deleted_at IS NULL;