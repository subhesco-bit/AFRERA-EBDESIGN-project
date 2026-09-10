CREATE TABLE IF NOT EXISTS email (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_email_user ON email(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_status ON email(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_email_created ON email(created_at) WHERE deleted_at IS NULL;