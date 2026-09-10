CREATE TABLE IF NOT EXISTS bayesian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_bayesian_user ON bayesian(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bayesian_status ON bayesian(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bayesian_created ON bayesian(created_at) WHERE deleted_at IS NULL;