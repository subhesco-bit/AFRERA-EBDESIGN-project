CREATE TABLE IF NOT EXISTS motion_capture (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_motion_capture_user ON motion_capture(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_motion_capture_status ON motion_capture(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_motion_capture_created ON motion_capture(created_at) WHERE deleted_at IS NULL;