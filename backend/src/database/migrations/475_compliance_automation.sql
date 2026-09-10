CREATE TABLE IF NOT EXISTS compliance_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_compliance_automation_user ON compliance_automation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_automation_status ON compliance_automation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_automation_created ON compliance_automation(created_at) WHERE deleted_at IS NULL;