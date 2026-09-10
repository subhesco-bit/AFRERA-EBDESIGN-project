CREATE TABLE IF NOT EXISTS siem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_siem_user ON siem(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_siem_status ON siem(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_siem_created ON siem(created_at) WHERE deleted_at IS NULL;