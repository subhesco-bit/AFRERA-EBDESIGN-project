CREATE TABLE IF NOT EXISTS certificate_authority (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_certificate_authority_user ON certificate_authority(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_certificate_authority_status ON certificate_authority(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_certificate_authority_created ON certificate_authority(created_at) WHERE deleted_at IS NULL;