CREATE TABLE IF NOT EXISTS analytics_engine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_engine_user ON analytics_engine(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_engine_status ON analytics_engine(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_engine_created ON analytics_engine(created_at) WHERE deleted_at IS NULL;