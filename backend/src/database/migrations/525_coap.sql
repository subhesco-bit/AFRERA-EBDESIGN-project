CREATE TABLE IF NOT EXISTS coap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_coap_user ON coap(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coap_status ON coap(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coap_created ON coap(created_at) WHERE deleted_at IS NULL;