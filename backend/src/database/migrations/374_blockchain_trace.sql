CREATE TABLE IF NOT EXISTS blockchain_trace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_blockchain_trace_user ON blockchain_trace(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_trace_status ON blockchain_trace(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_blockchain_trace_created ON blockchain_trace(created_at) WHERE deleted_at IS NULL;