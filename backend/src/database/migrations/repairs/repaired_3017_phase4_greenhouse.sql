-- Phase 4: Greenhouse Management Schema
CREATE TABLE IF NOT EXISTS greenhouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  area DECIMAL(10,2),
  crops TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_greenhouses_farmer ON greenhouses(farmer_id);
