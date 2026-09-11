CREATE TABLE IF NOT EXISTS module_production_assurance (
  id UUID PRIMARY KEY,
  module_id VARCHAR(10) NOT NULL,
  module_name VARCHAR(150) NOT NULL,
  domain VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_module_production_assurance_module ON module_production_assurance(module_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_production_assurance_status ON module_production_assurance(status, created_at DESC);
