-- Multi-party trade escrow (client/farmer/bank patterns)
-- Separate from FPO member payouts and warehouse receipts.

CREATE TABLE IF NOT EXISTS trade_escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_code TEXT UNIQUE NOT NULL,
  escrow_type TEXT NOT NULL
    CHECK (escrow_type IN (
      'buyer_seller',
      'farmer_farmer',
      'client_client',
      'fpo_mediated',
      'bank_recovery',
      'bank_bank'
    )),
  -- Parties (nullable depending on type)
  payer_id UUID,
  payee_id UUID,
  fpo_id UUID,
  lender_id UUID,
  bank_from_id UUID,
  bank_to_id UUID,
  order_id UUID,
  contract_id UUID,
  warehouse_receipt_id UUID,
  -- Money
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  funded_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (funded_amount >= 0),
  payment_reference TEXT,
  -- Waterfall caps (optional)
  lender_claim_cap NUMERIC(14,2),
  platform_fee_amount NUMERIC(14,2),
  platform_fee_pct NUMERIC(5,2),
  -- State
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'awaiting_funds', 'funded', 'frozen', 'released', 'partially_released',
      'refunded', 'cancelled'
    )),
  release_conditions JSONB NOT NULL DEFAULT '[]',
  condition_state JSONB NOT NULL DEFAULT '{}',
  waterfall_result JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trade_escrows_type ON trade_escrows(escrow_type);
CREATE INDEX IF NOT EXISTS idx_trade_escrows_status ON trade_escrows(status);
CREATE INDEX IF NOT EXISTS idx_trade_escrows_payer ON trade_escrows(payer_id);
CREATE INDEX IF NOT EXISTS idx_trade_escrows_payee ON trade_escrows(payee_id);
CREATE INDEX IF NOT EXISTS idx_trade_escrows_order ON trade_escrows(order_id);

CREATE TABLE IF NOT EXISTS trade_escrow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES trade_escrows(id),
  event_type TEXT NOT NULL,
  actor_user_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_escrow_events_escrow ON trade_escrow_events(escrow_id);

CREATE TABLE IF NOT EXISTS trade_escrow_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES trade_escrows(id),
  beneficiary_role TEXT NOT NULL
    CHECK (beneficiary_role IN ('lender', 'platform', 'fpo', 'payee', 'payer_refund', 'counterparty_bank')),
  beneficiary_id UUID,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'instructed', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
