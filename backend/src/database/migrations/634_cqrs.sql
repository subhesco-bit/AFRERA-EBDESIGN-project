CREATE TABLE IF NOT EXISTS cqrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_cqrs_user ON cqrs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cqrs_status ON cqrs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cqrs_created ON cqrs(created_at) WHERE deleted_at IS NULL;