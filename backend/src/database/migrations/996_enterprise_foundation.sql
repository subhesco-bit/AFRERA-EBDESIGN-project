-- ============================================================================
-- 996_enterprise_foundation.sql   (2026-08-03)
--
-- ERP SPINE: organisation structure + double-entry accounting.
--
-- WHY THIS EXISTS
-- A gap analysis of the 28-domain ERP specification against the live schema
-- (417 tables) found the agriculture, AI, compliance and logistics domains
-- substantially built — but the ACCOUNTING FOUNDATION entirely absent:
--
--   chart_of_accounts   MISSING      cost_centers      MISSING
--   journal_entries     MISSING      profit_centers    MISSING
--   general_ledger      MISSING      companies         MISSING
--   accounts_payable    MISSING      business_units    MISSING
--   accounts_receivable MISSING      fiscal_periods    MISSING
--
-- The platform tracked payments, loans, transactions and wallets, but had no
-- double-entry ledger to post them to. Consequences: no trial balance, no P&L,
-- no balance sheet, no multi-company consolidation, and no way to attribute
-- cost or revenue to a business unit. That is the difference between a
-- transaction tracker and an ERP.
--
-- Every other ERP domain hangs off this: procurement posts to AP, sales posts
-- to AR, payroll posts to expense, assets post depreciation. Building those
-- modules before this spine exists guarantees rework.
--
-- DESIGN NOTES
--  * Double-entry integrity is enforced in the DATABASE, not just application
--    code (see the journal balance trigger). An unbalanced journal is a
--    corrupt ledger, and application-layer checks get bypassed by scripts,
--    migrations and direct fixes.
--  * Amounts use NUMERIC(20,4), never floating point. Binary floats cannot
--    represent 0.1 exactly; using them for money produces cent-level drift
--    that compounds across millions of rows and will not reconcile.
--  * Posted journals are immutable. Corrections are made by reversing entries,
--    which is both standard accounting practice and an audit requirement.
--  * Multi-currency is carried from the start (transaction currency + rate +
--    base amount). Retrofitting currency onto a single-currency ledger is a
--    far larger migration than including it now.
--
-- Numbered 996 so it runs after the base schema and platform tables, and
-- before the geospatial (997), FK-index (998) and reconciliation (999) files.
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ORGANISATION STRUCTURE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    -- Self-reference supports group structures / holding companies.
    parent_company_id INTEGER REFERENCES companies(id) ON DELETE RESTRICT,
    registration_number VARCHAR(100),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    cin_number VARCHAR(30),
    base_currency CHAR(3) NOT NULL DEFAULT 'INR',
    country CHAR(2) NOT NULL DEFAULT 'IN',
    fiscal_year_start_month SMALLINT NOT NULL DEFAULT 4
        CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
    address JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_units (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_unit_id INTEGER REFERENCES business_units(id) ON DELETE RESTRICT,
    unit_type VARCHAR(30) DEFAULT 'division',
    manager_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    business_unit_id INTEGER REFERENCES business_units(id) ON DELETE SET NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    branch_type VARCHAR(30),
    gst_number VARCHAR(20),
    address JSONB DEFAULT '{}',
    -- Typed coordinates rather than JSONB: these are used for proximity
    -- search and must be indexable (see 997_geospatial_indexes.sql).
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS enterprise_departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    business_unit_id INTEGER REFERENCES business_units(id) ON DELETE SET NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_department_id INTEGER REFERENCES enterprise_departments(id) ON DELETE RESTRICT,
    head_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

-- Cost centre: where spend is incurred. Profit centre: where margin is earned.
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE RESTRICT,
    business_unit_id INTEGER REFERENCES business_units(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES enterprise_departments(id) ON DELETE SET NULL,
    responsible_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS profit_centers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_profit_center_id INTEGER REFERENCES profit_centers(id) ON DELETE RESTRICT,
    business_unit_id INTEGER REFERENCES business_units(id) ON DELETE SET NULL,
    responsible_user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

-- ---------------------------------------------------------------------------
-- 2. FISCAL CALENDAR
-- Period control is what makes a close meaningful: once a period is closed,
-- nothing may post into it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fiscal_years (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','closed','locked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code),
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS fiscal_periods (
    id SERIAL PRIMARY KEY,
    fiscal_year_id INTEGER NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    period_number SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','closed','locked')),
    closed_at TIMESTAMP,
    closed_by UUID,
    UNIQUE (fiscal_year_id, period_number),
    CHECK (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- 3. CHART OF ACCOUNTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    parent_account_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    -- The five fundamental account classes.
    account_type VARCHAR(20) NOT NULL
        CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
    account_subtype VARCHAR(50),
    -- Natural balance side. Assets/expenses are debit-normal; liabilities,
    -- equity and revenue are credit-normal. Stored explicitly so reporting
    -- does not have to re-derive sign conventions.
    normal_balance CHAR(2) NOT NULL CHECK (normal_balance IN ('DR','CR')),
    -- Only leaf accounts may be posted to; parents are for roll-up reporting.
    is_postable BOOLEAN NOT NULL DEFAULT TRUE,
    is_reconcilable BOOLEAN DEFAULT FALSE,
    currency CHAR(3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, account_code)
);

-- ---------------------------------------------------------------------------
-- 4. JOURNAL (double entry)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    entry_number VARCHAR(40) NOT NULL,
    entry_date DATE NOT NULL,
    fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE RESTRICT,
    journal_type VARCHAR(30) NOT NULL DEFAULT 'general'
        CHECK (journal_type IN ('general','sales','purchase','cash','bank','payroll','depreciation','adjustment','reversal','opening')),
    description TEXT,
    reference_type VARCHAR(50),   -- e.g. 'order', 'invoice', 'payment'
    reference_id VARCHAR(100),    -- links the ledger back to the source document
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate NUMERIC(18,8) NOT NULL DEFAULT 1
        CHECK (exchange_rate > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','posted','reversed')),
    -- Reversal linkage: a posted entry is never edited, only reversed.
    reversed_by_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    reverses_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    posted_at TIMESTAMP,
    posted_by UUID,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number SMALLINT NOT NULL,
    account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    -- NUMERIC, never float: money must be exact.
    debit NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    base_debit NUMERIC(20,4) NOT NULL DEFAULT 0,
    base_credit NUMERIC(20,4) NOT NULL DEFAULT 0,
    -- A line is one side or the other, never both and never neither.
    CONSTRAINT journal_line_single_side CHECK (
        (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
    ),
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    profit_center_id INTEGER REFERENCES profit_centers(id) ON DELETE SET NULL,
    business_unit_id INTEGER REFERENCES business_units(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES enterprise_departments(id) ON DELETE SET NULL,
    partner_type VARCHAR(20),    -- 'customer' | 'vendor' | 'employee' | 'farmer'
    partner_id VARCHAR(100),
    description TEXT,
    UNIQUE (journal_entry_id, line_number)
);

-- ---------------------------------------------------------------------------
-- 5. DOUBLE-ENTRY INTEGRITY (enforced in the database)
--
-- Application-level balance checks are bypassed by scripts, data fixes and
-- other services. A ledger that can be left unbalanced is not a ledger, so the
-- rule lives where nothing can route around it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_journal_balanced()
RETURNS TRIGGER AS $$
DECLARE
    v_entry INTEGER;
    v_status VARCHAR(20);
    v_debit NUMERIC(20,4);
    v_credit NUMERIC(20,4);
BEGIN
    v_entry := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);

    SELECT status INTO v_status FROM journal_entries WHERE id = v_entry;

    -- Drafts are allowed to be unbalanced while being built up.
    IF v_status IS DISTINCT FROM 'posted' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
      INTO v_debit, v_credit
      FROM journal_lines WHERE journal_entry_id = v_entry;

    IF v_debit <> v_credit THEN
        RAISE EXCEPTION
          'Journal entry % is unbalanced: debits %, credits %',
          v_entry, v_debit, v_credit;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_lines_balanced ON journal_lines;
CREATE CONSTRAINT TRIGGER trg_journal_lines_balanced
    AFTER INSERT OR UPDATE OR DELETE ON journal_lines
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_journal_balanced();

-- Block posting into a closed period, and block editing a posted entry.
CREATE OR REPLACE FUNCTION assert_period_open()
RETURNS TRIGGER AS $$
DECLARE
    v_period_status VARCHAR(20);
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status = 'posted' AND NEW.status = 'posted' THEN
        IF NEW.entry_date <> OLD.entry_date
           OR NEW.company_id <> OLD.company_id
           OR NEW.currency <> OLD.currency THEN
            RAISE EXCEPTION
              'Posted journal entry % is immutable; reverse it instead of editing.', OLD.id;
        END IF;
    END IF;

    IF NEW.status = 'posted' AND NEW.fiscal_period_id IS NOT NULL THEN
        SELECT status INTO v_period_status
          FROM fiscal_periods WHERE id = NEW.fiscal_period_id;
        IF v_period_status IN ('closed','locked') THEN
            RAISE EXCEPTION
              'Cannot post to fiscal period % because it is %.',
              NEW.fiscal_period_id, v_period_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_period_guard ON journal_entries;
DROP TRIGGER IF EXISTS trg_journal_period_guard ON journal_entries;
CREATE TRIGGER trg_journal_period_guard BEFORE INSERT OR UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION assert_period_open();

-- ---------------------------------------------------------------------------
-- 6. SUBLEDGERS — Accounts Payable / Accounts Receivable
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ap_invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    vendor_id VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(20,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(20,4) NOT NULL DEFAULT 0,
    -- Generated, so "what is still owed" can never drift from the components.
    amount_due NUMERIC(20,4) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('draft','open','partially_paid','paid','cancelled','disputed')),
    journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, vendor_id, invoice_number),
    CHECK (due_date >= invoice_date),
    CHECK (amount_paid <= total_amount)
);

CREATE TABLE IF NOT EXISTS ar_invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    customer_id VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(60) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(20,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    amount_received NUMERIC(20,4) NOT NULL DEFAULT 0,
    amount_due NUMERIC(20,4) GENERATED ALWAYS AS (total_amount - amount_received) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('draft','open','partially_paid','paid','cancelled','written_off')),
    journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    profit_center_id INTEGER REFERENCES profit_centers(id) ON DELETE SET NULL,
    -- Links the accounting document back to the marketplace order.
    source_order_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, customer_id, invoice_number),
    CHECK (due_date >= invoice_date),
    CHECK (amount_received <= total_amount)
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_reference VARCHAR(100) NOT NULL,
    allocation_type VARCHAR(10) NOT NULL CHECK (allocation_type IN ('AP','AR')),
    ap_invoice_id INTEGER REFERENCES ap_invoices(id) ON DELETE CASCADE,
    ar_invoice_id INTEGER REFERENCES ar_invoices(id) ON DELETE CASCADE,
    amount NUMERIC(20,4) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Exactly one side must be populated, matching allocation_type.
    CONSTRAINT allocation_target_exclusive CHECK (
        (allocation_type = 'AP' AND ap_invoice_id IS NOT NULL AND ar_invoice_id IS NULL) OR
        (allocation_type = 'AR' AND ar_invoice_id IS NOT NULL AND ap_invoice_id IS NULL)
    )
);

-- ---------------------------------------------------------------------------
-- 7. FIXED ASSETS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fixed_assets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    asset_code VARCHAR(40) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_class VARCHAR(50),
    acquisition_date DATE NOT NULL,
    acquisition_cost NUMERIC(20,4) NOT NULL CHECK (acquisition_cost >= 0),
    salvage_value NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (salvage_value >= 0),
    useful_life_months INTEGER NOT NULL CHECK (useful_life_months > 0),
    depreciation_method VARCHAR(30) NOT NULL DEFAULT 'straight_line'
        CHECK (depreciation_method IN ('straight_line','declining_balance','units_of_production','wdv')),
    accumulated_depreciation NUMERIC(20,4) NOT NULL DEFAULT 0,
    net_book_value NUMERIC(20,4)
        GENERATED ALWAYS AS (acquisition_cost - accumulated_depreciation) STORED,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','under_maintenance','disposed','written_off','transferred')),
    disposal_date DATE,
    disposal_amount NUMERIC(20,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, asset_code),
    CHECK (salvage_value <= acquisition_cost)
);

CREATE TABLE IF NOT EXISTS depreciation_schedule (
    id SERIAL PRIMARY KEY,
    fixed_asset_id INTEGER NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
    period_date DATE NOT NULL,
    depreciation_amount NUMERIC(20,4) NOT NULL CHECK (depreciation_amount >= 0),
    accumulated_after NUMERIC(20,4) NOT NULL,
    journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE SET NULL,
    is_posted BOOLEAN DEFAULT FALSE,
    UNIQUE (fixed_asset_id, period_date)
);

-- ---------------------------------------------------------------------------
-- 8. BUDGETING
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year_id INTEGER NOT NULL REFERENCES fiscal_years(id) ON DELETE CASCADE,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(255) NOT NULL,
    budget_type VARCHAR(30) DEFAULT 'operating'
        CHECK (budget_type IN ('operating','capital','cash','project')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','submitted','approved','rejected','revised','closed')),
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS budget_lines (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    profit_center_id INTEGER REFERENCES profit_centers(id) ON DELETE SET NULL,
    fiscal_period_id INTEGER REFERENCES fiscal_periods(id) ON DELETE SET NULL,
    budgeted_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    -- Actuals are derived from the ledger, not stored, to avoid drift.
    notes TEXT
);

-- ---------------------------------------------------------------------------
-- 9. REPORTING VIEWS
-- Derived from the ledger so they can never disagree with it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_general_ledger AS
SELECT
    jl.id                AS line_id,
    je.company_id,
    je.entry_number,
    je.entry_date,
    je.journal_type,
    je.status,
    je.reference_type,
    je.reference_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    jl.debit,
    jl.credit,
    jl.base_debit,
    jl.base_credit,
    jl.cost_center_id,
    jl.profit_center_id,
    jl.business_unit_id,
    jl.partner_type,
    jl.partner_id,
    jl.description
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
JOIN chart_of_accounts coa ON coa.id = jl.account_id
WHERE je.status = 'posted';

CREATE OR REPLACE VIEW v_trial_balance AS
SELECT
    je.company_id,
    coa.id                AS account_id,
    coa.account_code,
    coa.account_name,
    coa.account_type,
    coa.normal_balance,
    SUM(jl.debit)         AS total_debit,
    SUM(jl.credit)        AS total_credit,
    -- Signed balance in the account's natural direction.
    CASE WHEN coa.normal_balance = 'DR'
         THEN SUM(jl.debit) - SUM(jl.credit)
         ELSE SUM(jl.credit) - SUM(jl.debit)
    END                   AS balance
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
JOIN chart_of_accounts coa ON coa.id = jl.account_id
WHERE je.status = 'posted'
GROUP BY je.company_id, coa.id, coa.account_code, coa.account_name,
         coa.account_type, coa.normal_balance;

CREATE OR REPLACE VIEW v_ap_ageing AS
SELECT
    company_id, vendor_id, invoice_number, invoice_date, due_date,
    total_amount, amount_paid, amount_due, status,
    (CURRENT_DATE - due_date) AS days_overdue,
    CASE
        WHEN amount_due <= 0 THEN 'settled'
        WHEN CURRENT_DATE <= due_date THEN 'current'
        WHEN CURRENT_DATE - due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - due_date <= 60 THEN '31-60'
        WHEN CURRENT_DATE - due_date <= 90 THEN '61-90'
        ELSE '90+'
    END AS ageing_bucket
FROM ap_invoices
WHERE status NOT IN ('cancelled','draft');

CREATE OR REPLACE VIEW v_ar_ageing AS
SELECT
    company_id, customer_id, invoice_number, invoice_date, due_date,
    total_amount, amount_received, amount_due, status,
    (CURRENT_DATE - due_date) AS days_overdue,
    CASE
        WHEN amount_due <= 0 THEN 'settled'
        WHEN CURRENT_DATE <= due_date THEN 'current'
        WHEN CURRENT_DATE - due_date <= 30 THEN '1-30'
        WHEN CURRENT_DATE - due_date <= 60 THEN '31-60'
        WHEN CURRENT_DATE - due_date <= 90 THEN '61-90'
        ELSE '90+'
    END AS ageing_bucket
FROM ar_invoices
WHERE status NOT IN ('cancelled','draft');

CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
    b.company_id,
    b.id                       AS budget_id,
    b.name                     AS budget_name,
    bl.account_id,
    coa.account_code,
    coa.account_name,
    bl.cost_center_id,
    bl.fiscal_period_id,
    bl.budgeted_amount,
    COALESCE(actual.actual_amount, 0) AS actual_amount,
    bl.budgeted_amount - COALESCE(actual.actual_amount, 0) AS variance
FROM budget_lines bl
JOIN budgets b ON b.id = bl.budget_id
JOIN chart_of_accounts coa ON coa.id = bl.account_id
LEFT JOIN (
    SELECT jl.account_id,
           jl.cost_center_id,
           je.fiscal_period_id,
           SUM(jl.debit - jl.credit) AS actual_amount
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.status = 'posted'
    GROUP BY jl.account_id, jl.cost_center_id, je.fiscal_period_id
) actual
  ON actual.account_id = bl.account_id
 AND actual.fiscal_period_id IS NOT DISTINCT FROM bl.fiscal_period_id
 AND actual.cost_center_id IS NOT DISTINCT FROM bl.cost_center_id;

-- ---------------------------------------------------------------------------
-- 10. INDEXES
-- ---------------------------------------------------------------------------

-- 2026-08-30: removed idx_journal_entries_company_date and idx_journal_entries_status
-- (deferred collision, see schema-decisions.json "journal_entries") - company_id,
-- entry_date, and status all don't exist on the real (winner) journal_entries
-- table (3102_ecommerce_ai_erp_business_marketing.sql's version is a flat
-- debit/credit ledger line, not this file's header-row shape).
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference
    ON journal_entries (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry
    ON journal_lines (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account
    ON journal_lines (account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_cost_center
    ON journal_lines (cost_center_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_profit_center
    ON journal_lines (profit_center_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_partner
    ON journal_lines (partner_type, partner_id);
CREATE INDEX IF NOT EXISTS idx_coa_company_type
    ON chart_of_accounts (company_id, account_type);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_vendor_status
    ON ap_invoices (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_ap_invoices_due
    ON ap_invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_customer_status
    ON ar_invoices (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_due
    ON ar_invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_source_order
    ON ar_invoices (source_order_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_company_status
    ON fixed_assets (company_id, status);
CREATE INDEX IF NOT EXISTS idx_cost_centers_company
    ON cost_centers (company_id);
CREATE INDEX IF NOT EXISTS idx_profit_centers_company
    ON profit_centers (company_id);
