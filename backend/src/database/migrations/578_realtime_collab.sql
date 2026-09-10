CREATE TABLE IF NOT EXISTS realtime_collab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_realtime_collab_user ON realtime_collab(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_realtime_collab_status ON realtime_collab(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_realtime_collab_created ON realtime_collab(created_at) WHERE deleted_at IS NULL;