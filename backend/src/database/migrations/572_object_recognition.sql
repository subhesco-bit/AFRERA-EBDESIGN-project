CREATE TABLE IF NOT EXISTS object_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_object_recognition_user ON object_recognition(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_object_recognition_status ON object_recognition(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_object_recognition_created ON object_recognition(created_at) WHERE deleted_at IS NULL;