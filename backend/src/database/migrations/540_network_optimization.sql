CREATE TABLE IF NOT EXISTS network_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_network_optimization_user ON network_optimization(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_network_optimization_status ON network_optimization(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_network_optimization_created ON network_optimization(created_at) WHERE deleted_at IS NULL;