CREATE TABLE IF NOT EXISTS image_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_image_tracking_user ON image_tracking(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_image_tracking_status ON image_tracking(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_image_tracking_created ON image_tracking(created_at) WHERE deleted_at IS NULL;