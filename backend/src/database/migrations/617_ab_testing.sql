CREATE TABLE IF NOT EXISTS ab_testing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ab_testing_user ON ab_testing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ab_testing_status ON ab_testing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ab_testing_created ON ab_testing(created_at) WHERE deleted_at IS NULL;