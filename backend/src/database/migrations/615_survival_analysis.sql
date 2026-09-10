CREATE TABLE IF NOT EXISTS survival_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_survival_analysis_user ON survival_analysis(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_survival_analysis_status ON survival_analysis(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_survival_analysis_created ON survival_analysis(created_at) WHERE deleted_at IS NULL;