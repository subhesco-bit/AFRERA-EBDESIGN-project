CREATE TABLE IF NOT EXISTS quantum_encryption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_quantum_encryption_user ON quantum_encryption(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quantum_encryption_status ON quantum_encryption(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quantum_encryption_created ON quantum_encryption(created_at) WHERE deleted_at IS NULL;