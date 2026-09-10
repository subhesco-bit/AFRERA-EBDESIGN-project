CREATE TABLE IF NOT EXISTS encryption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_encryption_user ON encryption(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_encryption_status ON encryption(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_encryption_created ON encryption(created_at) WHERE deleted_at IS NULL;