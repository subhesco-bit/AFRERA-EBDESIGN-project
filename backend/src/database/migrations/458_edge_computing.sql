CREATE TABLE IF NOT EXISTS edge_computing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_edge_computing_user ON edge_computing(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_edge_computing_status ON edge_computing(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_edge_computing_created ON edge_computing(created_at) WHERE deleted_at IS NULL;