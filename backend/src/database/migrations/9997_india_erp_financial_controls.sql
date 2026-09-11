-- 9997: India ERP financial-control layer
-- Purpose: close accounting gaps around AP, AR, payments, tax, budgets,
-- bank reconciliation, period close and consolidation without replacing the
-- existing GL/CO/MM/SD/HR/PS/TR/AM/QM/PP modules.

CREATE TABLE IF NOT EXISTS erp_ap_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  supplier_id UUID,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','part_paid','paid','cancelled')),
  source_type TEXT,
  source_id TEXT,
  rural_entity_type TEXT,
  rural_entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS erp_ar_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  customer_id UUID,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','posted','part_paid','paid','cancelled')),
  channel TEXT,
  rural_entity_type TEXT,
  rural_entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS erp_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  payment_reference TEXT NOT NULL UNIQUE,
  payment_date DATE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  amount NUMERIC(20,4) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  method TEXT NOT NULL,
  bank_account_id UUID,
  party_id UUID,
  invoice_id UUID,
  invoice_type TEXT CHECK (invoice_type IN ('AR','AP')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated','authorised','settled','failed','reversed')),
  idempotency_key TEXT UNIQUE,
  reference_type TEXT,
  reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_tax_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  transaction_date DATE NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('GST','IGST','CGST','SGST','UTGST','TDS','TCS','OTHER')),
  direction TEXT NOT NULL CHECK (direction IN ('input','output','withheld','collected')),
  taxable_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
  tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  rate NUMERIC(8,4),
  document_type TEXT,
  document_id UUID,
  counterparty_id UUID,
  state_code TEXT,
  place_of_supply TEXT,
  filing_period TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','review','filed','reconciled','adjusted')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  fiscal_year TEXT NOT NULL,
  period TEXT,
  cost_center_id UUID,
  profit_center_id UUID,
  project_id UUID,
  account_id UUID,
  rural_entity_type TEXT,
  rural_entity_id TEXT,
  budget_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  committed_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','locked','closed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS erp_bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  bank_account_id UUID NOT NULL,
  statement_date DATE NOT NULL,
  opening_balance NUMERIC(20,4) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(20,4) NOT NULL DEFAULT 0,
  ledger_balance NUMERIC(20,4) NOT NULL DEFAULT 0,
  difference_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  reconciled_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  unreconciled_count INTEGER NOT NULL DEFAULT 0 CHECK (unreconciled_count >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','reconciled','exception')),
  exceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  reconciled_by UUID,
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bank_account_id, statement_date)
);

CREATE TABLE IF NOT EXISTS erp_period_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  fiscal_year TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','soft_closed','closed','reopened')),
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  trial_balance_verified BOOLEAN NOT NULL DEFAULT false,
  tax_reconciled BOOLEAN NOT NULL DEFAULT false,
  bank_reconciled BOOLEAN NOT NULL DEFAULT false,
  subledgers_reconciled BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, fiscal_year, period)
);

CREATE TABLE IF NOT EXISTS erp_consolidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID,
  fiscal_year TEXT NOT NULL,
  period TEXT NOT NULL,
  reporting_currency CHAR(3) NOT NULL DEFAULT 'INR',
  entity_count INTEGER NOT NULL DEFAULT 0,
  intercompany_eliminations NUMERIC(20,4) NOT NULL DEFAULT 0,
  consolidated_revenue NUMERIC(20,4) NOT NULL DEFAULT 0,
  consolidated_expense NUMERIC(20,4) NOT NULL DEFAULT 0,
  consolidated_profit NUMERIC(20,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','published')),
  elimination_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, fiscal_year, period)
);

CREATE INDEX IF NOT EXISTS idx_erp_ap_due ON erp_ap_invoices(company_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_erp_ar_due ON erp_ar_invoices(company_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_erp_payments_company_date ON erp_payments(company_id, payment_date, status);
CREATE INDEX IF NOT EXISTS idx_erp_tax_period ON erp_tax_transactions(company_id, filing_period, tax_type, status);
CREATE INDEX IF NOT EXISTS idx_erp_budget_dimension ON erp_budgets(company_id, fiscal_year, cost_center_id, project_id);
CREATE INDEX IF NOT EXISTS idx_erp_bank_recon ON erp_bank_reconciliations(company_id, bank_account_id, statement_date);
