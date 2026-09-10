CREATE TABLE IF NOT EXISTS last_mile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_last_mile_user ON last_mile(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_last_mile_status ON last_mile(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_last_mile_created ON last_mile(created_at) WHERE deleted_at IS NULL;