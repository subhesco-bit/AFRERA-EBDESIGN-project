CREATE TABLE IF NOT EXISTS metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_metadata_user ON metadata(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_metadata_status ON metadata(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_metadata_created ON metadata(created_at) WHERE deleted_at IS NULL;