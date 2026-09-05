-- Phase 4: Yield Management Schema
CREATE TABLE yields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  crop_id UUID,
  quantity DECIMAL(10,2),
  unit VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_yields_farm ON yields(farm_id);
