CREATE TABLE IF NOT EXISTS experimental_design (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_experimental_design_user ON experimental_design(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_experimental_design_status ON experimental_design(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_experimental_design_created ON experimental_design(created_at) WHERE deleted_at IS NULL;