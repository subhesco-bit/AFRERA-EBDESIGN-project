CREATE TABLE IF NOT EXISTS ddos_protection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ddos_protection_user ON ddos_protection(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ddos_protection_status ON ddos_protection(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ddos_protection_created ON ddos_protection(created_at) WHERE deleted_at IS NULL;