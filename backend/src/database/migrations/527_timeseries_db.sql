CREATE TABLE IF NOT EXISTS timeseries_db (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_timeseries_db_user ON timeseries_db(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeseries_db_status ON timeseries_db(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_timeseries_db_created ON timeseries_db(created_at) WHERE deleted_at IS NULL;