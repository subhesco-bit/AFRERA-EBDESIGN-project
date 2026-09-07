-- Phase 4: Farm Costing Schema
CREATE TABLE farm_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farm_costs_farm ON farm_costs(farm_id);
