CREATE TABLE IF NOT EXISTS retry_mechanism (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_retry_mechanism_user ON retry_mechanism(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retry_mechanism_status ON retry_mechanism(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_retry_mechanism_created ON retry_mechanism(created_at) WHERE deleted_at IS NULL;