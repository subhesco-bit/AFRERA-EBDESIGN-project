-- Second-Use Equipment Exchange — marketplace for retired farm machinery.
-- Confirmed genuinely absent (2026-08-15 concept-document gap analysis).

CREATE TABLE IF NOT EXISTS equipment_exchange_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listed_by UUID NOT NULL REFERENCES users(id),
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100),
  condition_grade VARCHAR(20) NOT NULL CHECK (condition_grade IN ('excellent', 'good', 'fair', 'needs_repair')),
  description TEXT,
  images JSONB DEFAULT '[]',
  pricing_type VARCHAR(10) NOT NULL DEFAULT 'priced' CHECK (pricing_type IN ('free', 'priced')),
  price_inr NUMERIC(12,2) CHECK (price_inr IS NULL OR price_inr >= 0),
  location_address TEXT,
  state_id INTEGER REFERENCES states(id),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'exchanged', 'withdrawn')),
  reserved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_free_has_no_price CHECK (pricing_type != 'free' OR price_inr IS NULL),
  CONSTRAINT chk_priced_has_price CHECK (pricing_type != 'priced' OR price_inr IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_equipment_exchange_status ON equipment_exchange_listings(status);
CREATE INDEX IF NOT EXISTS idx_equipment_exchange_state ON equipment_exchange_listings(state_id);
