CREATE TABLE IF NOT EXISTS tax_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_tax_optimization_user ON tax_optimization(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tax_optimization_status ON tax_optimization(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tax_optimization_created ON tax_optimization(created_at) WHERE deleted_at IS NULL;