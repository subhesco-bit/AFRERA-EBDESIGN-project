CREATE TABLE IF NOT EXISTS smart_contract_platform (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_contract_platform_user ON smart_contract_platform(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contract_platform_status ON smart_contract_platform(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contract_platform_created ON smart_contract_platform(created_at) WHERE deleted_at IS NULL;