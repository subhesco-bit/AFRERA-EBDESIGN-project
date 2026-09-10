CREATE TABLE IF NOT EXISTS dimensionality_reduction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_user ON dimensionality_reduction(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_status ON dimensionality_reduction(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_created ON dimensionality_reduction(created_at) WHERE deleted_at IS NULL;