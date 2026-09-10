CREATE TABLE IF NOT EXISTS anonymization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_anonymization_user ON anonymization(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anonymization_status ON anonymization(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anonymization_created ON anonymization(created_at) WHERE deleted_at IS NULL;