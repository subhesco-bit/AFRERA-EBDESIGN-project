-- Full-Truck Window — LTL (less-than-truckload) shipments pool into one
-- truck; per-kg freight falls as fill % rises. Confirmed genuinely absent
-- (2026-08-15 concept-document gap analysis) despite freight being one of
-- the largest costs eating into farmer margin.

CREATE TABLE IF NOT EXISTS freight_pool_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  vehicle_capacity_kg NUMERIC(10,2) NOT NULL CHECK (vehicle_capacity_kg > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'dispatched', 'cancelled')),
  closes_at TIMESTAMP,
  dispatched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freight_pool_shipments (
  id SERIAL PRIMARY KEY,
  window_id UUID NOT NULL REFERENCES freight_pool_windows(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  weight_kg NUMERIC(10,2) NOT NULL CHECK (weight_kg > 0),
  rate_per_kg_inr NUMERIC(10,2),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(window_id, shipment_id)
);

CREATE INDEX IF NOT EXISTS idx_freight_pool_status ON freight_pool_windows(status);
CREATE INDEX IF NOT EXISTS idx_freight_pool_shipments_window ON freight_pool_shipments(window_id);
