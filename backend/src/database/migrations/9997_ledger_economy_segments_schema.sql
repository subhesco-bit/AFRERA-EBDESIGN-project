-- 9997_ledger_economy_segments_schema.sql
--
-- unifiedLedgerRoutes.js is documented in index.js as "Unified Ledger with
-- Economy Segmentation - One Ledger + 9 Economies", matching the 9-layer
-- Rural Life OS architecture in 041_rural_life_os_schema.sql (household,
-- farm consumables, machinery, shared infrastructure, enterprise, energy,
-- finance, advisory, market). gl_ledger_chain (053_v42_recovered_finance.sql)
-- is already the one real ledger — this migration does not create a second
-- one. It adds only the mapping this route needs to segment that existing
-- ledger by economy: which REOS layer an account name belongs to.
--
-- Runs after 053_v42_recovered_finance.sql (has gl_ledger_chain), sorts
-- before 996/4000/9997_erp_* alphabetically doesn't matter since this table
-- is independent of those.

CREATE TABLE IF NOT EXISTS ledger_economy_segments (
  account_name VARCHAR(40) PRIMARY KEY,
  economy VARCHAR(30) NOT NULL CHECK (economy IN (
    'household', 'farm_consumables', 'machinery', 'shared_infrastructure',
    'enterprise', 'renewable_energy', 'finance', 'advisory', 'market_access'
  )),
  notes TEXT
);

-- Seed the account names already produced elsewhere in this codebase
-- (recoveredFinanceService.appendLedgerEntry callers, financialService.js
-- EMI/advance flows) so a segmented trial balance is meaningful immediately
-- rather than showing everything as "unmapped".
INSERT INTO ledger_economy_segments (account_name, economy, notes) VALUES
  ('cash',                 'finance',              'Cash and bank clearing account'),
  ('ar',                   'market_access',        'Accounts receivable from produce sales'),
  ('ap',                   'farm_consumables',     'Accounts payable for farm inputs'),
  ('revenue',              'market_access',        'Sales revenue recognition'),
  ('cogs',                 'farm_consumables',     'Cost of goods / inputs consumed'),
  ('loan_payable',         'finance',              'Outstanding loan principal'),
  ('interest_expense',     'finance',              'Interest accrued on loans/advances'),
  ('subsidy_receivable',   'finance',              'Government subsidy pending disbursement'),
  ('machinery_rent_income','machinery',            'Income from machinery rental/access'),
  ('infrastructure_fee',   'shared_infrastructure','Storage/processing-as-a-service fees'),
  ('energy_savings',       'renewable_energy',     'Recognised savings from solar/renewable systems'),
  ('household_spend',      'household',            'Household consumption/procurement spend'),
  ('advisory_fee',         'advisory',             'Paid AI/agronomy advisory services'),
  ('enterprise_capital',   'enterprise',           'Capital deployed into rural enterprise ventures')
ON CONFLICT (account_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ledger_economy_segments_economy ON ledger_economy_segments(economy);
