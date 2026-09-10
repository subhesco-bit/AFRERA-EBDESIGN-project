CREATE TABLE IF NOT EXISTS circuit_breaker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_circuit_breaker_user ON circuit_breaker(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_status ON circuit_breaker(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_created ON circuit_breaker(created_at) WHERE deleted_at IS NULL;