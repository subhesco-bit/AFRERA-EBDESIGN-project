CREATE TABLE IF NOT EXISTS sustainability_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sustainability_goals_user ON sustainability_goals(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sustainability_goals_status ON sustainability_goals(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sustainability_goals_created ON sustainability_goals(created_at) WHERE deleted_at IS NULL;