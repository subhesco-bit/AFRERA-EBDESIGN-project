CREATE TABLE IF NOT EXISTS compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_user ON compliance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_created ON compliance(created_at) WHERE deleted_at IS NULL;