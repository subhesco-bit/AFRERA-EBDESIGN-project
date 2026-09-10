CREATE TABLE IF NOT EXISTS eye_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_eye_tracking_user ON eye_tracking(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eye_tracking_status ON eye_tracking(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eye_tracking_created ON eye_tracking(created_at) WHERE deleted_at IS NULL;