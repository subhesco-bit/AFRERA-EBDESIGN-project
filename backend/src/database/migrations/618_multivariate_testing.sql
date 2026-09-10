CREATE TABLE IF NOT EXISTS multivariate_testing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_multivariate_testing_user ON multivariate_testing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_multivariate_testing_status ON multivariate_testing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_multivariate_testing_created ON multivariate_testing(created_at) WHERE deleted_at IS NULL;