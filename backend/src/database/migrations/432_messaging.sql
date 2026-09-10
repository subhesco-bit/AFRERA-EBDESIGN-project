CREATE TABLE IF NOT EXISTS messaging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_messaging_user ON messaging(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messaging_status ON messaging(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messaging_created ON messaging(created_at) WHERE deleted_at IS NULL;