CREATE TABLE IF NOT EXISTS decentralized_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_decentralized_storage_user ON decentralized_storage(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_decentralized_storage_status ON decentralized_storage(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_decentralized_storage_created ON decentralized_storage(created_at) WHERE deleted_at IS NULL;