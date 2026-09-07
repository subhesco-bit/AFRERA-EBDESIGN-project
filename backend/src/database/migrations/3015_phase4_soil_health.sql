-- Phase 4: Soil Health Testing Schema
CREATE TABLE soil_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  ph DECIMAL(3,1),
  nitrogen DECIMAL(5,2),
  phosphorus DECIMAL(5,2),
  potassium DECIMAL(5,2),
  tested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soil_tests_farm ON soil_tests(farm_id);
