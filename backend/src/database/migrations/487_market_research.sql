CREATE TABLE IF NOT EXISTS market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_market_research_user ON market_research(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_status ON market_research(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_market_research_created ON market_research(created_at) WHERE deleted_at IS NULL;