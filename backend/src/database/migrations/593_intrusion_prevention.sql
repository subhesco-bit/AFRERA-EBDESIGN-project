CREATE TABLE IF NOT EXISTS intrusion_prevention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_user ON intrusion_prevention(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_status ON intrusion_prevention(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_created ON intrusion_prevention(created_at) WHERE deleted_at IS NULL;