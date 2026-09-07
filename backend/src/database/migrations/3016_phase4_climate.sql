-- Phase 4: Climate Advisory Schema
CREATE TABLE climate_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(255),
  temperature_avg DECIMAL(5,2),
  rainfall INT,
  season VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_climate_data_region ON climate_data(region);
