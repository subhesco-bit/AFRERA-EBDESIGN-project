CREATE TABLE IF NOT EXISTS predictive_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_user ON predictive_maintenance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_status ON predictive_maintenance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_created ON predictive_maintenance(created_at) WHERE deleted_at IS NULL;