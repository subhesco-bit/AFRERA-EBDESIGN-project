BEGIN;

CREATE TABLE IF NOT EXISTS commercial_settlements (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL,
  beneficiary_type TEXT NOT NULL CHECK (beneficiary_type IN ('farmer','fpo','supplier','carrier','buyer','enterprise')),
  beneficiary_id TEXT NOT NULL,
  gross_amount NUMERIC(18,2) NOT NULL CHECK (gross_amount >= 0),
  deductions NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_amount NUMERIC(18,2) GENERATED ALWAYS AS (gross_amount - deductions) STORED,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','queued','processing','paid','failed','reversed','cancelled')),
  idempotency_key TEXT NOT NULL UNIQUE,
  created_by TEXT,
  approved_by TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (deductions <= gross_amount)
);
CREATE INDEX IF NOT EXISTS idx_commercial_settlements_order ON commercial_settlements(order_id);
CREATE INDEX IF NOT EXISTS idx_commercial_settlements_beneficiary ON commercial_settlements(beneficiary_type, beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_commercial_settlements_status ON commercial_settlements(status);

CREATE TABLE IF NOT EXISTS commercial_payment_attempts (
  id BIGSERIAL PRIMARY KEY,
  settlement_id BIGINT NOT NULL REFERENCES commercial_settlements(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_reference TEXT,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('created','submitted','succeeded','failed','reversed')),
  response_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_settlement ON commercial_payment_attempts(settlement_id);

CREATE TABLE IF NOT EXISTS commercial_settlement_events (
  id BIGSERIAL PRIMARY KEY,
  settlement_id BIGINT NOT NULL REFERENCES commercial_settlements(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settlement_events_settlement ON commercial_settlement_events(settlement_id, created_at);

COMMIT;
