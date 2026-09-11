BEGIN;

CREATE TABLE IF NOT EXISTS commercial_inventory_ledger (
  id BIGSERIAL PRIMARY KEY,
  supply_lot_id BIGINT,
  order_id BIGINT,
  shipment_id BIGINT,
  event_type TEXT NOT NULL CHECK (event_type IN ('reserve','allocate','dispatch','receive','adjust','release')),
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity <> 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  reference_no TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_commercial_inventory_lot ON commercial_inventory_ledger(supply_lot_id);
CREATE INDEX IF NOT EXISTS idx_commercial_inventory_order ON commercial_inventory_ledger(order_id);

CREATE TABLE IF NOT EXISTS commercial_accounting_ledger (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT,
  settlement_id BIGINT,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('receivable','payable','revenue','cost','tax','settlement','adjustment')),
  debit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  reference_no TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (debit + credit > 0)
);
CREATE INDEX IF NOT EXISTS idx_commercial_accounting_order ON commercial_accounting_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_commercial_accounting_settlement ON commercial_accounting_ledger(settlement_id);

CREATE TABLE IF NOT EXISTS commercial_reconciliation_runs (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  inventory_total NUMERIC(18,3) NOT NULL DEFAULT 0,
  accounting_debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  accounting_credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  variance_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','balanced','exception','resolved')),
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reconciliation_order ON commercial_reconciliation_runs(order_id);

CREATE TABLE IF NOT EXISTS e2e_flow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_name TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','passed','failed','rolled_back')),
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_e2e_flow_correlation ON e2e_flow_runs(correlation_id);

COMMIT;
