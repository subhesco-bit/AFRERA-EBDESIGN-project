CREATE TABLE IF NOT EXISTS digital_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_digital_identity_user ON digital_identity(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_digital_identity_status ON digital_identity(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_digital_identity_created ON digital_identity(created_at) WHERE deleted_at IS NULL;