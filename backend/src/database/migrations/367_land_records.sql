CREATE TABLE IF NOT EXISTS land_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_land_records_user ON land_records(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_land_records_status ON land_records(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_land_records_created ON land_records(created_at) WHERE deleted_at IS NULL;