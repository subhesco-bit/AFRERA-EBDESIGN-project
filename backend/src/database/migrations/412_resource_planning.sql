CREATE TABLE IF NOT EXISTS resource_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_resource_planning_user ON resource_planning(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resource_planning_status ON resource_planning(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resource_planning_created ON resource_planning(created_at) WHERE deleted_at IS NULL;