-- 10010_accounting_intelligence_compliance.sql
-- Effective-dated, evidence-backed accounting/tax intelligence controls.
-- Does not replace the existing GL/AP/AR/GST/TDS/TCS tables.

CREATE TABLE IF NOT EXISTS accounting_tax_rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT NOT NULL DEFAULT 'IN',
  tax_type TEXT NOT NULL CHECK (tax_type IN ('GST','TDS','TCS','CESS','OTHER')),
  rule_code TEXT NOT NULL,
  description TEXT,
  effective_from DATE NOT NULL,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','verified','retired')),
  parameters JSONB NOT NULL,
  source_url TEXT,
  source_document TEXT,
  source_hash CHAR(64),
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CHECK (status <> 'verified' OR (source_url IS NOT NULL AND verified_at IS NOT NULL)),
  UNIQUE(jurisdiction,tax_type,rule_code,effective_from)
);

CREATE INDEX IF NOT EXISTS idx_accounting_tax_rule_lookup
  ON accounting_tax_rule_versions(jurisdiction,tax_type,rule_code,effective_from,effective_to,status);

CREATE TABLE IF NOT EXISTS accounting_reconciliation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  reconciliation_type TEXT NOT NULL CHECK (reconciliation_type IN
    ('bank','gst_2b_itc','vendor','customer','intercompany','payment','tax','inventory_gl','other')),
  period TEXT,
  source_ref TEXT,
  target_ref TEXT,
  source_amount NUMERIC(20,4),
  target_amount NUMERIC(20,4),
  difference_amount NUMERIC(20,4),
  match_score NUMERIC(5,4) CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 1),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  proposed_action JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN
    ('open','matched','exception','review','approved','resolved','rejected')),
  approval_required BOOLEAN NOT NULL DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status NOT IN ('approved','resolved') OR approved_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_accounting_reconciliation_company
  ON accounting_reconciliation_cases(company_id,reconciliation_type,status,period);

CREATE TABLE IF NOT EXISTS accounting_close_control_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  fiscal_year TEXT NOT NULL,
  period TEXT NOT NULL,
  control_code TEXT NOT NULL,
  control_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass','fail','warning','not_run')),
  blocking BOOLEAN NOT NULL DEFAULT false,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_by TEXT NOT NULL DEFAULT 'system',
  UNIQUE(company_id,fiscal_year,period,control_code)
);

CREATE INDEX IF NOT EXISTS idx_accounting_close_controls
  ON accounting_close_control_results(company_id,fiscal_year,period,status,blocking);

CREATE TABLE IF NOT EXISTS accounting_ai_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  capability TEXT NOT NULL,
  source_type TEXT,
  source_ref TEXT,
  proposal JSONB NOT NULL,
  confidence NUMERIC(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_provider TEXT,
  model_id TEXT,
  prompt_hash CHAR(64),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','review','approved','rejected','applied','superseded')),
  authority TEXT NOT NULL DEFAULT 'proposal_only',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (authority='proposal_only'),
  CHECK (status NOT IN ('approved','applied') OR reviewed_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_accounting_ai_proposals
  ON accounting_ai_proposals(company_id,capability,status,created_at DESC);

COMMENT ON TABLE accounting_tax_rule_versions IS
  'Effective-dated, source-provenanced statutory/accounting rules. Code must fail closed when no verified applicable rule exists.';
COMMENT ON TABLE accounting_ai_proposals IS
  'AI-assisted accounting output is proposal-only; the authoritative ledger/tax workflow performs any approved mutation.';
