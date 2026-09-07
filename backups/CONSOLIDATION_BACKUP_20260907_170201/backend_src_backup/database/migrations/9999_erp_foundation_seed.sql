-- ============================================================================
-- 9999_erp_foundation_seed.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- Migration 996_enterprise_foundation.sql created companies, fiscal_years and
-- chart_of_accounts (all with real FK constraints — company_id on every ERP
-- table REFERENCES companies(id), fiscal_year_id REFERENCES fiscal_years(id),
-- account_id REFERENCES chart_of_accounts(id)). Nothing ever inserted a row
-- into any of the three, so AF-AA, AF-CO and AF-PS (assetAccountingService.js,
-- costControlService.js, projectSystemsService.js) had real FK-enforced
-- lookup tables with zero rows to look up — the frontend pages could only
-- ask a user to type a numeric ID that pointed at nothing.
--
-- SINGLE-ORG BY DESIGN
-- AFRERA_CLAUDE_BUILD_DIRECTIVE.md Part 3C states the platform's canonical
-- philosophy explicitly: "one identity, one ledger, one ERP ... ". There is
-- one hash-chained double-entry ledger for the whole platform, not a
-- ledger-per-tenant, and nothing elsewhere in this schema (companyRoutes.js,
-- authStore.js, or any other migration) carries a multi-tenant/org-switching
-- concept. `companies` supports a parent_company_id for group structures
-- because that is how a real chart of accounts is modelled, not because this
-- platform runs multiple unrelated organisations. So this seeds exactly ONE
-- company row — the platform's own operating entity — not a fabricated set
-- of tenants.
--
-- HONESTY ON WHAT IS NOT SEEDED
-- No registration_number, gst_number, pan_number or cin_number is set: this
-- codebase has no verified legal-registration data for that entity, and
-- inventing one would be exactly the fabrication this seed exists to avoid.
-- Those columns stay NULL until a real value is entered through the company
-- record. fiscal_periods (month-level rows under each fiscal year) are also
-- deliberately NOT seeded here: every FK that touches a period
-- (journal_entries.fiscal_period_id, budget_lines.fiscal_period_id,
-- depreciation_schedule.fiscal_period_id) is nullable, so period rows are not
-- required to unblock the AF-AA/AF-CO/AF-PS lookups this migration exists
-- for, and seeding 12 placeholder months per year for a close/lock workflow
-- nobody has wired up yet would be inventing process, not data.
--
-- FISCAL YEARS: INDIA, APRIL-MARCH
-- companies.fiscal_year_start_month defaults to 4 (April) — India's statutory
-- fiscal year. FY2025-26, FY2026-27 (current as of this migration's date) and
-- FY2027-28 (upcoming) are seeded so a budget or asset created today has a
-- real fiscal year to attach to, plus room to plan ahead.
--
-- CHART OF ACCOUNTS: STANDARD FIVE-CLASS SKELETON, NOT FABRICATED BALANCES
-- The accounts below are the standard account classes every double-entry
-- ledger needs (cash, receivables, payables, equity, revenue, cost of goods,
-- operating expense, depreciation) — structural chart-of-accounts entries,
-- not invented transactions or balances. No opening balances are posted
-- here; that is a journal_entries concern, out of scope for a lookup seed.
--
-- Numbered 9999 so it runs after 996 (which creates these tables) and after
-- the other 999x-numbered files. Idempotent: every INSERT is ON CONFLICT DO
-- NOTHING against the same unique constraints 996 already defined, so
-- re-running this file is safe and never duplicates or overwrites a row a
-- real user has since edited.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. THE ONE COMPANY
-- ---------------------------------------------------------------------------

INSERT INTO companies (code, name, legal_name, base_currency, country, fiscal_year_start_month, is_active)
VALUES ('AFRERA', 'AFRERA', 'AFRERA Platform', 'INR', 'IN', 4, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. FISCAL YEARS (India: April - March)
-- ---------------------------------------------------------------------------

INSERT INTO fiscal_years (company_id, code, start_date, end_date, status)
SELECT c.id, v.code, v.start_date::date, v.end_date::date, v.status
FROM companies c
CROSS JOIN (VALUES
    ('FY2025-26', '2025-04-01', '2026-03-31', 'open'),
    ('FY2026-27', '2026-04-01', '2027-03-31', 'open'),
    ('FY2027-28', '2027-04-01', '2028-03-31', 'open')
) AS v(code, start_date, end_date, status)
WHERE c.code = 'AFRERA'
ON CONFLICT (company_id, code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. CHART OF ACCOUNTS — standard five-class skeleton
--    Parents (is_postable = FALSE) first, then postable leaf accounts.
-- ---------------------------------------------------------------------------

INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, normal_balance, is_postable)
SELECT c.id, v.account_code, v.account_name, v.account_type, v.normal_balance, FALSE
FROM companies c
CROSS JOIN (VALUES
    ('1000', 'Assets',      'asset',     'DR'),
    ('2000', 'Liabilities', 'liability', 'CR'),
    ('3000', 'Equity',      'equity',    'CR'),
    ('4000', 'Revenue',     'revenue',   'CR'),
    ('5000', 'Expenses',    'expense',   'DR')
) AS v(account_code, account_name, account_type, normal_balance)
WHERE c.code = 'AFRERA'
ON CONFLICT (company_id, account_code) DO NOTHING;

-- Parent resolved per-row via a correlated subquery on parent_code, since a
-- single JOIN cannot vary its condition per VALUES row.
INSERT INTO chart_of_accounts
    (company_id, account_code, account_name, parent_account_id, account_type, normal_balance, is_postable)
SELECT c.id, v.account_code, v.account_name,
       (SELECT id FROM chart_of_accounts WHERE company_id = c.id AND account_code = v.parent_code),
       v.account_type, v.normal_balance, TRUE
FROM companies c
CROSS JOIN (VALUES
    ('1110', 'Cash',                     '1000', 'asset',     'DR'),
    ('1120', 'Bank Accounts',            '1000', 'asset',     'DR'),
    ('1200', 'Accounts Receivable',      '1000', 'asset',     'DR'),
    ('1300', 'Fixed Assets',             '1000', 'asset',     'DR'),
    ('1310', 'Accumulated Depreciation', '1000', 'asset',     'CR'),
    ('2100', 'Accounts Payable',         '2000', 'liability', 'CR'),
    ('2200', 'GST Payable',              '2000', 'liability', 'CR'),
    ('3100', 'Owner''s Capital',         '3000', 'equity',    'CR'),
    ('3200', 'Retained Earnings',        '3000', 'equity',    'CR'),
    ('4100', 'Sales Revenue',            '4000', 'revenue',   'CR'),
    ('4200', 'Service Revenue',          '4000', 'revenue',   'CR'),
    ('5100', 'Cost of Goods Sold',       '5000', 'expense',   'DR'),
    ('5200', 'Operating Expenses',       '5000', 'expense',   'DR'),
    ('5300', 'Depreciation Expense',     '5000', 'expense',   'DR'),
    ('5400', 'Payroll Expense',          '5000', 'expense',   'DR')
) AS v(account_code, account_name, parent_code, account_type, normal_balance)
WHERE c.code = 'AFRERA'
ON CONFLICT (company_id, account_code) DO NOTHING;
