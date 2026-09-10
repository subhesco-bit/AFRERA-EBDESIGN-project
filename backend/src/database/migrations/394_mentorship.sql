CREATE TABLE IF NOT EXISTS mentorship (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_mentorship_user ON mentorship(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mentorship_status ON mentorship(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_mentorship_created ON mentorship(created_at) WHERE deleted_at IS NULL;