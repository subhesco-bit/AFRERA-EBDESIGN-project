CREATE TABLE IF NOT EXISTS computer_vision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_computer_vision_user ON computer_vision(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_computer_vision_status ON computer_vision(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_computer_vision_created ON computer_vision(created_at) WHERE deleted_at IS NULL;