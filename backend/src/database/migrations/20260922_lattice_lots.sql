-- Living-lot persistence for the lattice kernel (backend/src/value-chain-control/lotKernel.js).
-- lotKernel.js itself is pure calculation (mass in grams, money in paise) with no storage --
-- this is the missing storage layer: a farmer cell mints a lot, offtake is settled against it,
-- remaining mass always stays on the lot (never invented).

CREATE TABLE IF NOT EXISTS lattice_cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  village TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lattice_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES lattice_cells(id),
  variety TEXT NOT NULL,
  minted_grams NUMERIC(14,2) NOT NULL CHECK (minted_grams > 0),
  remaining_grams NUMERIC(14,2) NOT NULL CHECK (remaining_grams >= 0),
  cost_paise BIGINT NOT NULL CHECK (cost_paise >= 0),
  status TEXT NOT NULL DEFAULT 'living'
    CHECK (status IN ('living', 'settled', 'spoiled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lattice_lots_cell ON lattice_lots(cell_id);
CREATE INDEX IF NOT EXISTS idx_lattice_lots_status ON lattice_lots(status);

-- Every offtake and spoilage event against a lot, in kernel-declared FIFO order.
-- The clerk always names kilograms, paymentRef and loss -- AI proposes, never writes rupees.
CREATE TABLE IF NOT EXISTS lattice_lot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES lattice_lots(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('intake', 'offtake', 'spoilage', 'settlement')),
  qty_grams NUMERIC(14,2) NOT NULL CHECK (qty_grams > 0),
  gross_paise BIGINT,
  freight_paise BIGINT,
  farmgate_paise BIGINT,
  payment_ref TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lattice_lot_events_lot ON lattice_lot_events(lot_id);
