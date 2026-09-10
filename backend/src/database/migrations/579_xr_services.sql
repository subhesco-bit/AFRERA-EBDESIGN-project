CREATE TABLE IF NOT EXISTS xr_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_xr_services_user ON xr_services(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xr_services_status ON xr_services(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xr_services_created ON xr_services(created_at) WHERE deleted_at IS NULL;