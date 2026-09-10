CREATE TABLE IF NOT EXISTS equipment_rental (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_equipment_rental_user ON equipment_rental(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_rental_status ON equipment_rental(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_rental_created ON equipment_rental(created_at) WHERE deleted_at IS NULL;