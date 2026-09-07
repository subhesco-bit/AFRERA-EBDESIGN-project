-- Return-Load Board — open marketplace for a vehicle's spare/empty
-- return-leg capacity. Distinct from the rideshare feature (people, not
-- freight) and from freight_pool_windows (that pools multiple NEW
-- outbound shipments; this posts SPARE capacity on a vehicle already
-- committed to a route). Confirmed genuinely absent (2026-08-15).

CREATE TABLE IF NOT EXISTS return_load_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id),
  posted_by UUID REFERENCES users(id),
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  available_capacity_kg NUMERIC(10,2) NOT NULL CHECK (available_capacity_kg > 0),
  available_from TIMESTAMP NOT NULL,
  available_until TIMESTAMP NOT NULL,
  asking_rate_per_kg_inr NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'expired', 'cancelled')),
  booked_shipment_id UUID REFERENCES shipments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_return_load_window CHECK (available_until > available_from)
);

CREATE INDEX IF NOT EXISTS idx_return_load_status ON return_load_postings(status);
CREATE INDEX IF NOT EXISTS idx_return_load_window ON return_load_postings(available_from, available_until);
