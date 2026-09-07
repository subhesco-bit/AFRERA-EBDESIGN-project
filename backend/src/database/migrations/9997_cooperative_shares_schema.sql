-- 9997_cooperative_shares_schema.sql
--
-- Cooperative share capital register. Nothing in the schema before this
-- migration records who owns how much of a cooperative/FPO, so
-- cooperativeShareRoutes.js had no table to back it, and the M052 dividend
-- distribution and M058 statutory reserve modules had nothing to compute
-- against. This is the real ledger those three consume.
--
-- Runs after 996_enterprise_foundation.sql (has `companies`) and after
-- 4000_comprehensive_erp_schema.sql, both of which sort earlier by filename.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- One row per cooperative/FPO/society issuing shares. Deliberately not FKed
-- to `companies` (996) — a cooperative society in this domain is frequently
-- an unincorporated village-level body that never gets a companies row.
CREATE TABLE IF NOT EXISTS cooperative_societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  face_value_per_share NUMERIC(12,2) NOT NULL DEFAULT 100.00 CHECK (face_value_per_share > 0),
  -- Statutory reserve fund percentage of net surplus, per Cooperative
  -- Societies Act model bye-laws (typically 25%). Kept configurable per
  -- society rather than hard-coded because state acts vary (20-25%).
  statutory_reserve_pct NUMERIC(5,2) NOT NULL DEFAULT 25.00 CHECK (statutory_reserve_pct BETWEEN 0 AND 100),
  cooperative_education_fund_pct NUMERIC(5,2) NOT NULL DEFAULT 1.00 CHECK (cooperative_education_fund_pct BETWEEN 0 AND 100),
  -- Most cooperative acts cap the annual dividend rate payable to members
  -- (e.g. 15%) regardless of surplus, to keep capital in the reserve.
  max_dividend_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (max_dividend_rate_pct >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cooperative_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES cooperative_societies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_number VARCHAR(50) NOT NULL,
  member_name VARCHAR(255) NOT NULL,
  joined_on DATE DEFAULT CURRENT_DATE,
  -- Patronage volume (business done with the society, e.g. produce sold
  -- through it) drives patronage-based dividend, separate from share-based
  -- dividend. Tracked cumulatively per fiscal year.
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (society_id, member_number)
);

CREATE INDEX IF NOT EXISTS idx_cooperative_members_society ON cooperative_members(society_id);

-- Append-only share transaction ledger (issue / transfer / redeem). Current
-- holding is derived by summing this ledger, the same "derive, don't store"
-- principle recoveredFinanceService.js uses for its trial balance.
CREATE TABLE IF NOT EXISTS cooperative_share_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES cooperative_societies(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES cooperative_members(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issue', 'transfer_in', 'transfer_out', 'redeem')),
  -- Positive for issue/transfer_in, negative for transfer_out/redeem — signed
  -- so SUM() over this column is the holding directly.
  share_count INTEGER NOT NULL CHECK (share_count <> 0),
  price_per_share NUMERIC(12,2) NOT NULL CHECK (price_per_share > 0),
  amount NUMERIC(14,2) GENERATED ALWAYS AS (share_count * price_per_share) STORED,
  counterparty_member_id UUID REFERENCES cooperative_members(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference VARCHAR(100),
  recorded_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coop_share_txn_society ON cooperative_share_transactions(society_id);
CREATE INDEX IF NOT EXISTS idx_coop_share_txn_member ON cooperative_share_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_coop_share_txn_date ON cooperative_share_transactions(transaction_date);

-- One row per fiscal-year dividend declaration for a society. `data` carries
-- the computed per-member breakdown so the M052 module and this route can
-- both read a completed declaration without recomputing it.
CREATE TABLE IF NOT EXISTS cooperative_dividend_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES cooperative_societies(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(9) NOT NULL, -- e.g. '2025-2026'
  net_surplus NUMERIC(14,2) NOT NULL CHECK (net_surplus >= 0),
  statutory_reserve_amount NUMERIC(14,2) NOT NULL,
  cooperative_education_fund_amount NUMERIC(14,2) NOT NULL,
  distributable_surplus NUMERIC(14,2) NOT NULL,
  declared_dividend_rate_pct NUMERIC(5,2) NOT NULL,
  total_dividend_paid NUMERIC(14,2) NOT NULL,
  member_breakdown JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'declared' CHECK (status IN ('declared', 'paid', 'reversed')),
  declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (society_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_coop_dividend_society ON cooperative_dividend_declarations(society_id);

-- Statutory reserve balance carried forward year over year — needed by M058
-- to flag a society whose accumulated reserve has fallen below the minimum
-- the act requires relative to paid-up share capital.
CREATE TABLE IF NOT EXISTS cooperative_statutory_reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES cooperative_societies(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(9) NOT NULL,
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  contribution NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (society_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_coop_reserve_society ON cooperative_statutory_reserves(society_id);
