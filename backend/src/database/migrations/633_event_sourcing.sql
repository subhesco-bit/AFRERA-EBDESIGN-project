CREATE TABLE IF NOT EXISTS event_sourcing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_event_sourcing_user ON event_sourcing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_sourcing_status ON event_sourcing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_sourcing_created ON event_sourcing(created_at) WHERE deleted_at IS NULL;