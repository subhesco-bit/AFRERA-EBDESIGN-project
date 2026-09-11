-- Phase 6: commercial reconciliation/readiness ledger.
-- This records allocation of order value for later ERP/accounting settlement;
-- it does not execute payments or connect to a payment provider.
CREATE TABLE IF NOT EXISTS commercial_reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  beneficiary_id UUID NOT NULL,
  beneficiary_type VARCHAR(20) NOT NULL CHECK (beneficiary_type IN ('farmer','fpo','seller','platform','carrier','tax_authority','other')),
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('credit','debit','fee','tax','reserve','release','adjustment')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','eligible','approved','reconciled','held','reversed')),
  reconciliation_reference VARCHAR(80) NOT NULL UNIQUE,
  source VARCHAR(40) NOT NULL DEFAULT 'marketplace',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS commercial_reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_number VARCHAR(50) NOT NULL UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','calculated','approved','reconciled','failed')),
  total_entries INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(16,2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_order ON commercial_reconciliation_records(order_id);
CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_beneficiary ON commercial_reconciliation_records(beneficiary_id,beneficiary_type);
CREATE INDEX IF NOT EXISTS idx_commercial_reconciliation_status ON commercial_reconciliation_records(status);
