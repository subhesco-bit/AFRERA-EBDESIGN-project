CREATE TABLE IF NOT EXISTS websocket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_websocket_user ON websocket(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_websocket_status ON websocket(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_websocket_created ON websocket(created_at) WHERE deleted_at IS NULL;