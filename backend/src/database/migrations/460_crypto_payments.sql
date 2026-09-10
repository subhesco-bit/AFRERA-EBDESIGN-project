CREATE TABLE IF NOT EXISTS crypto_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_crypto_payments_user ON crypto_payments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON crypto_payments(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crypto_payments_created ON crypto_payments(created_at) WHERE deleted_at IS NULL;