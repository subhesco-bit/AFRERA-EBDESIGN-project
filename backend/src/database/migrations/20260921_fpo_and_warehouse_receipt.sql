-- FPO Operations + Warehouse Receipt System
-- Branch: consolidated/final
-- Idempotent-friendly: IF NOT EXISTS

-- ---------------------------------------------------------------------------
-- FPO / Cooperative
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fpo_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  registration_number TEXT,
  state TEXT,
  district TEXT,
  village TEXT,
  bank_account_masked TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fpo_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID NOT NULL REFERENCES fpo_organizations(id),
  farmer_id UUID,
  user_id UUID,
  member_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  share_units NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (share_units >= 0),
  share_capital_paid NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (share_capital_paid >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'exited')),
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fpo_id, member_code)
);

CREATE INDEX IF NOT EXISTS idx_fpo_members_fpo ON fpo_members(fpo_id);
CREATE INDEX IF NOT EXISTS idx_fpo_members_farmer ON fpo_members(farmer_id);

-- Aggregation lot (pooled produce)
CREATE TABLE IF NOT EXISTS fpo_pool_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID NOT NULL REFERENCES fpo_organizations(id),
  lot_code TEXT NOT NULL,
  commodity TEXT NOT NULL,
  grade TEXT,
  unit TEXT NOT NULL DEFAULT 'kg',
  target_qty NUMERIC(14,3),
  pooled_qty NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (pooled_qty >= 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'sold', 'cancelled')),
  pricing_rule TEXT NOT NULL DEFAULT 'equal_share'
    CHECK (pricing_rule IN ('equal_share', 'qty_weighted', 'grade_weighted')),
  sale_price_per_unit NUMERIC(14,4),
  sale_reference TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (fpo_id, lot_code)
);

CREATE TABLE IF NOT EXISTS fpo_pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES fpo_pool_lots(id),
  member_id UUID NOT NULL REFERENCES fpo_members(id),
  qty NUMERIC(14,3) NOT NULL CHECK (qty > 0),
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fpo_contrib_lot ON fpo_pool_contributions(lot_id);

-- Member payout ledger (no invented UPI; records intent + status)
CREATE TABLE IF NOT EXISTS fpo_payout_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpo_id UUID NOT NULL REFERENCES fpo_organizations(id),
  member_id UUID NOT NULL REFERENCES fpo_members(id),
  lot_id UUID REFERENCES fpo_pool_lots(id),
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paid', 'failed', 'cancelled')),
  payment_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Warehouse Receipt (storage title) — links to cold_storage_facilities when present
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  facility_id UUID,
  fpo_id UUID REFERENCES fpo_organizations(id),
  depositor_farmer_id UUID,
  depositor_member_id UUID REFERENCES fpo_members(id),
  commodity TEXT NOT NULL,
  grade TEXT,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  moisture_pct NUMERIC(5,2),
  inward_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_release_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pledged', 'partially_released', 'released', 'cancelled')),
  lien_holder TEXT,
  lien_amount NUMERIC(14,2),
  lien_ref TEXT,
  quality_certificate_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wr_facility ON warehouse_receipts(facility_id);
CREATE INDEX IF NOT EXISTS idx_wr_fpo ON warehouse_receipts(fpo_id);
CREATE INDEX IF NOT EXISTS idx_wr_status ON warehouse_receipts(status);

CREATE TABLE IF NOT EXISTS warehouse_receipt_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES warehouse_receipts(id),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('inward', 'pledge', 'lien_release', 'partial_release', 'full_release', 'cancel', 'note')),
  quantity_delta NUMERIC(14,3),
  actor_user_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wr_events_receipt ON warehouse_receipt_events(receipt_id);
