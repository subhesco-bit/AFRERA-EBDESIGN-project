CREATE TABLE IF NOT EXISTS time_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_time_series_user ON time_series(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_series_status ON time_series(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_series_created ON time_series(created_at) WHERE deleted_at IS NULL;