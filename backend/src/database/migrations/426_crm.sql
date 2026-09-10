CREATE TABLE IF NOT EXISTS crm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_user ON crm(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_status ON crm(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_created ON crm(created_at) WHERE deleted_at IS NULL;