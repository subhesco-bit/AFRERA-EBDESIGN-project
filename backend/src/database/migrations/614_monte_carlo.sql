CREATE TABLE IF NOT EXISTS monte_carlo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_monte_carlo_user ON monte_carlo(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monte_carlo_status ON monte_carlo(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_monte_carlo_created ON monte_carlo(created_at) WHERE deleted_at IS NULL;