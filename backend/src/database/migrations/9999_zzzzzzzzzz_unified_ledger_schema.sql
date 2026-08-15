-- Unified Ledger Schema with Economy Segmentation
-- Implements hybrid architecture: One Ledger + 9 Economies working together
--
-- Relocated from backend/migrations/998_unified_ledger_schema.sql (2026-08-15):
-- that directory is not read by the migration runner (backend/src/database/migrate.js
-- only scans backend/src/database/migrations/), so unified_ledger, economy_balances,
-- unified_balances, cross_economy_transfers, and economy_rules - all queried live by
-- backend/src/services/unifiedLedgerService.js - would never have been created on a
-- real database. Also fixed two bugs found while relocating it:
--   1. ON CONFLICT (economy, currency) on economy_balances, whose primary key is
--      just (economy) - Postgres rejects an ON CONFLICT target that doesn't match
--      an existing unique constraint/index.
--   2. fk_account FK to a table named accounts, which doesn't exist anywhere in
--      this schema (unifiedLedgerService.js uses account_id as a free-form label,
--      not a chart-of-accounts foreign key) - dropped the constraint.

-- Unified Ledger Table (Single Source of Truth)
CREATE TABLE IF NOT EXISTS unified_ledger (
  transaction_id VARCHAR(36) PRIMARY KEY,
  economy VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  description TEXT,
  reference VARCHAR(100),
  account_id VARCHAR(50),
  counterparty_id VARCHAR(50),
  category VARCHAR(50),
  entry_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50),
  reconciled_at TIMESTAMP
);

-- Index for economy-based queries
CREATE INDEX idx_unified_ledger_economy ON unified_ledger(economy);
CREATE INDEX idx_unified_ledger_currency ON unified_ledger(currency);
CREATE INDEX idx_unified_ledger_type ON unified_ledger(type);
CREATE INDEX idx_unified_ledger_category ON unified_ledger(category);
CREATE INDEX idx_unified_ledger_created_at ON unified_ledger(created_at);
CREATE INDEX idx_unified_ledger_reference ON unified_ledger(reference);

-- Economy Balances Table (9 Economies)
CREATE TABLE IF NOT EXISTS economy_balances (
  economy VARCHAR(20) PRIMARY KEY,
  currency VARCHAR(3) DEFAULT 'INR',
  total_credits DECIMAL(15,2) DEFAULT 0,
  total_debits DECIMAL(15,2) DEFAULT 0,
  net_balance DECIMAL(15,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_economy CHECK (economy IN ('north', 'south', 'east', 'west', 'central', 'northeast', 'northwest', 'southeast', 'southwest'))
);

-- Unified Balances Table (All Economies Combined)
CREATE TABLE IF NOT EXISTS unified_balances (
  currency VARCHAR(3) PRIMARY KEY,
  total_credits DECIMAL(15,2) DEFAULT 0,
  total_debits DECIMAL(15,2) DEFAULT 0,
  net_balance DECIMAL(15,2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Cross-Economy Transfers Table
CREATE TABLE IF NOT EXISTS cross_economy_transfers (
  transfer_id VARCHAR(36) PRIMARY KEY,
  from_economy VARCHAR(20) NOT NULL,
  to_economy VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  debit_entry_id VARCHAR(36) NOT NULL,
  credit_entry_id VARCHAR(36) NOT NULL,
  reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  reconciled_at TIMESTAMP,
  reconciliation_status VARCHAR(20) DEFAULT 'pending' CHECK (reconciliation_status IN ('pending', 'balanced', 'mismatch')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_debit_entry FOREIGN KEY (debit_entry_id) REFERENCES unified_ledger(transaction_id),
  CONSTRAINT fk_credit_entry FOREIGN KEY (credit_entry_id) REFERENCES unified_ledger(transaction_id),
  CONSTRAINT different_economies CHECK (from_economy != to_economy)
);

CREATE INDEX idx_cross_economy_from ON cross_economy_transfers(from_economy);
CREATE INDEX idx_cross_economy_to ON cross_economy_transfers(to_economy);
CREATE INDEX idx_cross_economy_status ON cross_economy_transfers(status);
CREATE INDEX idx_cross_economy_created_at ON cross_economy_transfers(created_at);

-- Economy Rules Table (Economy-specific policies)
CREATE TABLE IF NOT EXISTS economy_rules (
  id SERIAL PRIMARY KEY,
  economy VARCHAR(20) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  rule_value JSONB NOT NULL,
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_to TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(50),
  CONSTRAINT valid_economy_rule CHECK (economy IN ('north', 'south', 'east', 'west', 'central', 'northeast', 'northwest', 'southeast', 'southwest'))
);

CREATE INDEX idx_economy_rules_economy ON economy_rules(economy);
CREATE INDEX idx_economy_rules_type ON economy_rules(rule_type);
CREATE INDEX idx_economy_rules_effective ON economy_rules(effective_from, effective_to);

-- Initialize economy balances for all 9 economies
INSERT INTO economy_balances (economy, currency) VALUES
  ('north', 'INR'),
  ('south', 'INR'),
  ('east', 'INR'),
  ('west', 'INR'),
  ('central', 'INR'),
  ('northeast', 'INR'),
  ('northwest', 'INR'),
  ('southeast', 'INR'),
  ('southwest', 'INR')
ON CONFLICT (economy) DO NOTHING;

-- Initialize unified balance
INSERT INTO unified_balances (currency) VALUES ('INR')
ON CONFLICT (currency) DO NOTHING;

-- Create view for unified ledger with economy names
CREATE OR REPLACE VIEW v_unified_ledger_enriched AS
SELECT
  ul.*,
  eb.total_credits as economy_total_credits,
  eb.total_debits as economy_total_debits,
  eb.net_balance as economy_net_balance,
  CASE
    WHEN ul.economy = 'north' THEN 'Northern Economy'
    WHEN ul.economy = 'south' THEN 'Southern Economy'
    WHEN ul.economy = 'east' THEN 'Eastern Economy'
    WHEN ul.economy = 'west' THEN 'Western Economy'
    WHEN ul.economy = 'central' THEN 'Central Economy'
    WHEN ul.economy = 'northeast' THEN 'Northeastern Economy'
    WHEN ul.economy = 'northwest' THEN 'Northwestern Economy'
    WHEN ul.economy = 'southeast' THEN 'Southeastern Economy'
    WHEN ul.economy = 'southwest' THEN 'Southwestern Economy'
    ELSE ul.economy
  END as economy_name
FROM unified_ledger ul
LEFT JOIN economy_balances eb ON ul.economy = eb.economy;

-- Create view for cross-economy transfer summary
CREATE OR REPLACE VIEW v_cross_economy_summary AS
SELECT
  cet.from_economy,
  cet.to_economy,
  COUNT(*) as transfer_count,
  SUM(cet.amount) as total_amount,
  AVG(cet.amount) as average_amount,
  MIN(cet.created_at) as first_transfer,
  MAX(cet.created_at) as last_transfer
FROM cross_economy_transfers cet
WHERE cet.status = 'completed'
GROUP BY cet.from_economy, cet.to_economy
ORDER BY total_amount DESC;
