CREATE TABLE IF NOT EXISTS logging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_logging_user ON logging(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_logging_status ON logging(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_logging_created ON logging(created_at) WHERE deleted_at IS NULL;