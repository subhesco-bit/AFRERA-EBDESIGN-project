CREATE TABLE IF NOT EXISTS competitive_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_competitive_intel_user ON competitive_intel(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_competitive_intel_status ON competitive_intel(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_competitive_intel_created ON competitive_intel(created_at) WHERE deleted_at IS NULL;