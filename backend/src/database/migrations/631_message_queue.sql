CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_message_queue_user ON message_queue(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_queue_created ON message_queue(created_at) WHERE deleted_at IS NULL;