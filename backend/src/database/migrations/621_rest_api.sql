CREATE TABLE IF NOT EXISTS rest_api (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_rest_api_user ON rest_api(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rest_api_status ON rest_api(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rest_api_created ON rest_api(created_at) WHERE deleted_at IS NULL;