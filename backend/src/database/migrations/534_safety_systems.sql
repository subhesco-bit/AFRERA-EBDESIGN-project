CREATE TABLE IF NOT EXISTS safety_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_safety_systems_user ON safety_systems(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_safety_systems_status ON safety_systems(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_safety_systems_created ON safety_systems(created_at) WHERE deleted_at IS NULL;