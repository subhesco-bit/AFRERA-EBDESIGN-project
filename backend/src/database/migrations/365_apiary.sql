CREATE TABLE IF NOT EXISTS apiary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_apiary_user ON apiary(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_apiary_status ON apiary(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_apiary_created ON apiary(created_at) WHERE deleted_at IS NULL;