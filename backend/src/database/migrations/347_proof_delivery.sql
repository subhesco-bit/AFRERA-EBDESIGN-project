CREATE TABLE IF NOT EXISTS proof_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_proof_delivery_user ON proof_delivery(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proof_delivery_status ON proof_delivery(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proof_delivery_created ON proof_delivery(created_at) WHERE deleted_at IS NULL;