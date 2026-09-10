CREATE TABLE IF NOT EXISTS zero_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_zero_knowledge_user ON zero_knowledge(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zero_knowledge_status ON zero_knowledge(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_zero_knowledge_created ON zero_knowledge(created_at) WHERE deleted_at IS NULL;