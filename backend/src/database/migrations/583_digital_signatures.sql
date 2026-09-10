CREATE TABLE IF NOT EXISTS digital_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_digital_signatures_user ON digital_signatures(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_digital_signatures_status ON digital_signatures(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_digital_signatures_created ON digital_signatures(created_at) WHERE deleted_at IS NULL;