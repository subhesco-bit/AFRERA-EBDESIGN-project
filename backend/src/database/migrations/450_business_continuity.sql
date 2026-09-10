CREATE TABLE IF NOT EXISTS business_continuity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_business_continuity_user ON business_continuity(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_continuity_status ON business_continuity(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_business_continuity_created ON business_continuity(created_at) WHERE deleted_at IS NULL;