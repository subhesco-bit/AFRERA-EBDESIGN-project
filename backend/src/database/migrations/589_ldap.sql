CREATE TABLE IF NOT EXISTS ldap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_ldap_user ON ldap(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ldap_status ON ldap(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ldap_created ON ldap(created_at) WHERE deleted_at IS NULL;