CREATE TABLE IF NOT EXISTS dairy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_dairy_user ON dairy(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dairy_status ON dairy(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dairy_created ON dairy(created_at) WHERE deleted_at IS NULL;