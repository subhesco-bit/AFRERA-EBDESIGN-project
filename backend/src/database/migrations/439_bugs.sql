CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_bugs_user ON bugs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bugs_created ON bugs(created_at) WHERE deleted_at IS NULL;