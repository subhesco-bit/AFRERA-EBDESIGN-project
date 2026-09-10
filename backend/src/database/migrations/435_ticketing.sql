CREATE TABLE IF NOT EXISTS ticketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ticketing_user ON ticketing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticketing_status ON ticketing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticketing_created ON ticketing(created_at) WHERE deleted_at IS NULL;