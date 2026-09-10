CREATE TABLE IF NOT EXISTS crop_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_crop_insurance_user ON crop_insurance(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crop_insurance_status ON crop_insurance(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crop_insurance_created ON crop_insurance(created_at) WHERE deleted_at IS NULL;