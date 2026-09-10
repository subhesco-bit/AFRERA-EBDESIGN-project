CREATE TABLE IF NOT EXISTS ar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ar_user ON ar(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_status ON ar(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_created ON ar(created_at) WHERE deleted_at IS NULL;