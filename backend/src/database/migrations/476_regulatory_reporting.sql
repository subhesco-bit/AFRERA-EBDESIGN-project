CREATE TABLE IF NOT EXISTS regulatory_reporting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_user ON regulatory_reporting(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_status ON regulatory_reporting(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_created ON regulatory_reporting(created_at) WHERE deleted_at IS NULL;