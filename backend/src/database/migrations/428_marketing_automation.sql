CREATE TABLE IF NOT EXISTS marketing_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_marketing_automation_user ON marketing_automation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_automation_status ON marketing_automation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_automation_created ON marketing_automation(created_at) WHERE deleted_at IS NULL;