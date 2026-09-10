CREATE TABLE IF NOT EXISTS exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_exceptions_user ON exceptions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_exceptions_created ON exceptions(created_at) WHERE deleted_at IS NULL;