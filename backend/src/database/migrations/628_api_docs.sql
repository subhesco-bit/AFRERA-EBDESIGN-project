CREATE TABLE IF NOT EXISTS api_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_api_docs_user ON api_docs(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_docs_status ON api_docs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_docs_created ON api_docs(created_at) WHERE deleted_at IS NULL;