CREATE TABLE IF NOT EXISTS correlation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_correlation_analysis_user ON correlation_analysis(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_correlation_analysis_status ON correlation_analysis(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_correlation_analysis_created ON correlation_analysis(created_at) WHERE deleted_at IS NULL;