CREATE TABLE IF NOT EXISTS haptic_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_haptic_feedback_user ON haptic_feedback(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_haptic_feedback_status ON haptic_feedback(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_haptic_feedback_created ON haptic_feedback(created_at) WHERE deleted_at IS NULL;