CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_portfolio_created ON portfolio(created_at) WHERE deleted_at IS NULL;