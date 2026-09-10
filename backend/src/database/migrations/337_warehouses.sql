CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_warehouses_user ON warehouses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_created ON warehouses(created_at) WHERE deleted_at IS NULL;