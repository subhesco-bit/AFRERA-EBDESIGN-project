-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS society_code VARCHAR(40);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS face_value_per_share NUMERIC(12,2) DEFAULT 100.00 CHECK (face_value_per_share > 0);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS statutory_reserve_pct NUMERIC(5,2) DEFAULT 25.00 CHECK (statutory_reserve_pct BETWEEN 0 AND 100);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS cooperative_education_fund_pct NUMERIC(5,2) DEFAULT 1.00 CHECK (cooperative_education_fund_pct BETWEEN 0 AND 100);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS max_dividend_rate_pct NUMERIC(5,2) DEFAULT 15.00 CHECK (max_dividend_rate_pct >= 0);
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE cooperative_societies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS society_id UUID;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS member_number VARCHAR(50);
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS member_name VARCHAR(255);
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS joined_on DATE DEFAULT CURRENT_DATE;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expelled'));
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_cooperative_members_society ON cooperative_members(society_id);

-- Append-only share transaction ledger (issue / transfer / redeem). Current
-- holding is derived by summing this ledger, the same "derive, don't store"
-- principle recoveredFinanceService.js uses for its trial balance.
CREATE TABLE IF NOT EXISTS cooperative_share_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES cooperative_societies(id) ON DELETE CASCADE,
  -- TYPE ALIGNED (2026-09-23): declared UUID, but cooperative_members.id is INTEGER, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
  member_id INTEGER NOT NULL REFERENCES cooperative_members(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('issue', 'transfer_in', 'transfer_out', 'redeem')),
  -- Positive for issue/transfer_in, negative for transfer_out/redeem — signed
  -- so SUM() over this column is the holding directly.
  share_count INTEGER NOT NULL CHECK (share_count <> 0),
  price_per_share NUMERIC(12,2) NOT NULL CHECK (price_per_share > 0),
  amount NUMERIC(14,2) GENERATED ALWAYS AS (share_count * price_per_share) STORED,
  -- TYPE ALIGNED (2026-09-23): declared UUID, but cooperative_members.id is INTEGER, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
  counterparty_member_id INTEGER REFERENCES cooperative_members(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference VARCHAR(100),
  recorded_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS society_id UUID;
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS member_id UUID;
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) CHECK (transaction_type IN ('issue', 'transfer_in', 'transfer_out', 'redeem'));
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS share_count INTEGER CHECK (share_count <> 0);
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS price_per_share NUMERIC(12,2) CHECK (price_per_share > 0);
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2);
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS counterparty_member_id UUID;
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS reference VARCHAR(100);
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS recorded_by UUID;
ALTER TABLE cooperative_share_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS society_id UUID;
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS fiscal_year VARCHAR(9);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS net_surplus NUMERIC(14,2) CHECK (net_surplus >= 0);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS statutory_reserve_amount NUMERIC(14,2);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS cooperative_education_fund_amount NUMERIC(14,2);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS distributable_surplus NUMERIC(14,2);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS declared_dividend_rate_pct NUMERIC(5,2);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS total_dividend_paid NUMERIC(14,2);
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS member_breakdown JSONB DEFAULT '[]';
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'declared' CHECK (status IN ('declared', 'paid', 'reversed'));
ALTER TABLE cooperative_dividend_declarations ADD COLUMN IF NOT EXISTS declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS society_id UUID;
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS fiscal_year VARCHAR(9);
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,2) DEFAULT 0;
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS contribution NUMERIC(14,2) DEFAULT 0;
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS closing_balance NUMERIC(14,2);
ALTER TABLE cooperative_statutory_reserves ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_coop_reserve_society ON cooperative_statutory_reserves(society_id);
