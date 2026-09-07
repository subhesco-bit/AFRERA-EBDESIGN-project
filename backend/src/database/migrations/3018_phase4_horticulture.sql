-- Phase 4: Horticulture Management Schema
CREATE TABLE fruit_orchards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  fruit_type VARCHAR(100),
  area DECIMAL(10,2),
  planting_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fruit_orchards_farm ON fruit_orchards(farm_id);
