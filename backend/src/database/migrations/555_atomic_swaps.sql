CREATE TABLE IF NOT EXISTS atomic_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_user ON atomic_swaps(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_status ON atomic_swaps(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_created ON atomic_swaps(created_at) WHERE deleted_at IS NULL;