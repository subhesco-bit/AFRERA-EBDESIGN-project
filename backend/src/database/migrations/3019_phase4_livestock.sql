-- Phase 4: Livestock Management Schema
CREATE TABLE livestock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  type VARCHAR(50),
  count INT,
  breed VARCHAR(100),
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_livestock_farm ON livestock(farm_id);
