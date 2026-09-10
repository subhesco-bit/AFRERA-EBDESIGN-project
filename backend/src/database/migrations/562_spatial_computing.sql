CREATE TABLE IF NOT EXISTS spatial_computing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_spatial_computing_user ON spatial_computing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_spatial_computing_status ON spatial_computing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_spatial_computing_created ON spatial_computing(created_at) WHERE deleted_at IS NULL;