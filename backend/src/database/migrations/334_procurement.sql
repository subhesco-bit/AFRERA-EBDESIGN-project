CREATE TABLE IF NOT EXISTS procurement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_procurement_user ON procurement(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_procurement_status ON procurement(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_procurement_created ON procurement(created_at) WHERE deleted_at IS NULL;