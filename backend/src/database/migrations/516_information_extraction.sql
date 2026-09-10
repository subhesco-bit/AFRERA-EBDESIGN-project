CREATE TABLE IF NOT EXISTS information_extraction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_information_extraction_user ON information_extraction(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_information_extraction_status ON information_extraction(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_information_extraction_created ON information_extraction(created_at) WHERE deleted_at IS NULL;