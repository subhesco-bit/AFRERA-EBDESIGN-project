CREATE TABLE IF NOT EXISTS gender_empowerment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_gender_empowerment_user ON gender_empowerment(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gender_empowerment_status ON gender_empowerment(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gender_empowerment_created ON gender_empowerment(created_at) WHERE deleted_at IS NULL;