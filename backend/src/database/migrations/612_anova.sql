CREATE TABLE IF NOT EXISTS anova (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_anova_user ON anova(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anova_status ON anova(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_anova_created ON anova(created_at) WHERE deleted_at IS NULL;