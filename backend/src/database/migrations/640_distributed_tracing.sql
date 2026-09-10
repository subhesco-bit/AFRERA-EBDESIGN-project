CREATE TABLE IF NOT EXISTS distributed_tracing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_distributed_tracing_user ON distributed_tracing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_distributed_tracing_status ON distributed_tracing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_distributed_tracing_created ON distributed_tracing(created_at) WHERE deleted_at IS NULL;