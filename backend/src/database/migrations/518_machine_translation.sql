CREATE TABLE IF NOT EXISTS machine_translation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_machine_translation_user ON machine_translation(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_machine_translation_status ON machine_translation(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_machine_translation_created ON machine_translation(created_at) WHERE deleted_at IS NULL;