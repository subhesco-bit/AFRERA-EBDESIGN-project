CREATE TABLE IF NOT EXISTS visibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_visibility_user ON visibility(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visibility_status ON visibility(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_visibility_created ON visibility(created_at) WHERE deleted_at IS NULL;