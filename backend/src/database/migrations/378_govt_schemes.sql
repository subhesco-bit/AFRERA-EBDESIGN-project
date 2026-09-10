CREATE TABLE IF NOT EXISTS govt_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_govt_schemes_user ON govt_schemes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_govt_schemes_status ON govt_schemes(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_govt_schemes_created ON govt_schemes(created_at) WHERE deleted_at IS NULL;