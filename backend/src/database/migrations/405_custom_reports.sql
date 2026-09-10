CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON custom_reports(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_custom_reports_status ON custom_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_custom_reports_created ON custom_reports(created_at) WHERE deleted_at IS NULL;