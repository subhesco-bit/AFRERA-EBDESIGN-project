CREATE TABLE IF NOT EXISTS api_testing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_api_testing_user ON api_testing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_testing_status ON api_testing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_testing_created ON api_testing(created_at) WHERE deleted_at IS NULL;