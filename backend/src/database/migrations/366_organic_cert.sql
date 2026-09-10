CREATE TABLE IF NOT EXISTS organic_cert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_organic_cert_user ON organic_cert(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organic_cert_status ON organic_cert(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_organic_cert_created ON organic_cert(created_at) WHERE deleted_at IS NULL;