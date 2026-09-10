CREATE TABLE IF NOT EXISTS video_conference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_video_conference_user ON video_conference(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_video_conference_status ON video_conference(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_video_conference_created ON video_conference(created_at) WHERE deleted_at IS NULL;