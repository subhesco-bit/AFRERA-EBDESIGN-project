-- Value-Chain Control Plane kernel schema
-- Orchestration state only — references canonical domain IDs, does not duplicate masters.

CREATE TABLE IF NOT EXISTS vc_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  commodity_family TEXT NOT NULL,
  node_types JSONB NOT NULL DEFAULT '[]',
  default_gates JSONB NOT NULL DEFAULT '[]',
  unit_primary TEXT NOT NULL DEFAULT 'kg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_code TEXT UNIQUE NOT NULL,
  template_id TEXT REFERENCES vc_templates(id),
  title TEXT NOT NULL,
  commodity TEXT NOT NULL,
  variety TEXT,
  state TEXT,
  district TEXT,
  season TEXT,
  fpo_id UUID,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','gated','closed','cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_case_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','complete','blocked','skipped')),
  specialist_module TEXT,
  specialist_route TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  evidence JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  gate_code TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','blocked','passed','waived')),
  requirements JSONB NOT NULL DEFAULT '[]',
  evaluated_at TIMESTAMPTZ,
  UNIQUE (case_id, gate_code)
);

CREATE TABLE IF NOT EXISTS vc_assertions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  value JSONB NOT NULL,
  unit TEXT,
  evidence_class TEXT NOT NULL
    CHECK (evidence_class IN (
      'AUTHORITATIVE','VERIFIED','TRANSACTIONAL','SENSOR_OBSERVED',
      'USER_DECLARED','CALCULATED','ESTIMATED','STALE','CONFLICTED','MISSING'
    )),
  source_system TEXT,
  source_record TEXT,
  calculation_id TEXT,
  calculation_version TEXT,
  assumption_id TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_calculation_definitions (
  calculation_id TEXT NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  formula_text TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '[]',
  unit TEXT,
  effective_from DATE,
  effective_to DATE,
  PRIMARY KEY (calculation_id, version)
);

CREATE TABLE IF NOT EXISTS vc_mass_balance_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  qty_in NUMERIC(18,4) NOT NULL DEFAULT 0,
  qty_out NUMERIC(18,4) NOT NULL DEFAULT 0,
  byproduct NUMERIC(18,4) NOT NULL DEFAULT 0,
  waste NUMERIC(18,4) NOT NULL DEFAULT 0,
  loss NUMERIC(18,4) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  evidence_class TEXT NOT NULL DEFAULT 'USER_DECLARED',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  gate_code TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vc_case_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES vc_cases(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_system TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_cases_status ON vc_cases(status);
CREATE INDEX IF NOT EXISTS idx_vc_assertions_case ON vc_assertions(case_id);
CREATE INDEX IF NOT EXISTS idx_vc_gates_case ON vc_gates(case_id);

-- Seed minimal templates
INSERT INTO vc_templates (id, name, commodity_family, node_types, default_gates, unit_primary)
VALUES
(
  'VC-TPL-SPICE-PROCESSING',
  'Spice / processing (e.g. turmeric, ginger)',
  'spice',
  '["PRODUCTION","HARVEST","COLLECTION","QUALITY","AGGREGATION","PROCESSING","PACKAGING","STORAGE","TRANSPORT","BUYER_ACCEPTANCE","SETTLEMENT"]'::jsonb,
  '[{"code":"G0","label":"Opportunity"},{"code":"G5","label":"Compliance readiness"},{"code":"G9","label":"Dispatch readiness"},{"code":"G11","label":"Settlement"}]'::jsonb,
  'kg'
),
(
  'VC-TPL-FRESH-HORTICULTURE',
  'Fresh horticulture',
  'horticulture',
  '["PRODUCTION","HARVEST","QUALITY","PRE_COOL","COLD_STORAGE","PACKAGING","TRANSPORT","BUYER_ACCEPTANCE","SETTLEMENT"]'::jsonb,
  '[{"code":"G0","label":"Opportunity"},{"code":"G4","label":"Infrastructure readiness"},{"code":"G9","label":"Dispatch readiness"},{"code":"G11","label":"Settlement"}]'::jsonb,
  'kg'
)
ON CONFLICT (id) DO NOTHING;
