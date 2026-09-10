CREATE TABLE IF NOT EXISTS sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_sentiment_user ON sentiment(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sentiment_status ON sentiment(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sentiment_created ON sentiment(created_at) WHERE deleted_at IS NULL;