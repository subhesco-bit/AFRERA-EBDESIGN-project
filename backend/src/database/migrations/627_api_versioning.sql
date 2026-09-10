CREATE TABLE IF NOT EXISTS api_versioning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_api_versioning_user ON api_versioning(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_versioning_status ON api_versioning(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_versioning_created ON api_versioning(created_at) WHERE deleted_at IS NULL;