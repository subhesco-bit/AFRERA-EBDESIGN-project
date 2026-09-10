CREATE TABLE IF NOT EXISTS renewable_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_renewable_energy_user ON renewable_energy(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_renewable_energy_status ON renewable_energy(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_renewable_energy_created ON renewable_energy(created_at) WHERE deleted_at IS NULL;