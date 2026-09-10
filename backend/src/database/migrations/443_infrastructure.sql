CREATE TABLE IF NOT EXISTS infrastructure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_infrastructure_user ON infrastructure(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_infrastructure_status ON infrastructure(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_infrastructure_created ON infrastructure(created_at) WHERE deleted_at IS NULL;