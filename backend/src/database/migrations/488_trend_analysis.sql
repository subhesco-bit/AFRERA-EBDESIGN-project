CREATE TABLE IF NOT EXISTS trend_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_trend_analysis_user ON trend_analysis(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trend_analysis_status ON trend_analysis(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trend_analysis_created ON trend_analysis(created_at) WHERE deleted_at IS NULL;