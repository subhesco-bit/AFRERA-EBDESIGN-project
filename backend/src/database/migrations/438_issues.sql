CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_issues_user ON issues(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_created ON issues(created_at) WHERE deleted_at IS NULL;