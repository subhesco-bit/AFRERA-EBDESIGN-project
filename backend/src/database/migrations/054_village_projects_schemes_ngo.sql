-- ============================================================================
-- 054_village_projects_schemes_ngo.sql
-- Village projects, government schemes, other schemes and NGO works.
-- village_profiles remains the single authoritative village master.
-- Existing government_schemes is reused as the verified government registry.
-- ============================================================================

CREATE TABLE IF NOT EXISTS village_initiatives (
  initiative_id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES village_profiles(village_id) ON DELETE RESTRICT,
  initiative_code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(240) NOT NULL,
  description TEXT,
  initiative_type VARCHAR(40) NOT NULL DEFAULT 'project'
    CHECK (initiative_type IN ('project','government_scheme','other_scheme','ngo_work','mixed')),
  source_type VARCHAR(40) NOT NULL DEFAULT 'village'
    CHECK (source_type IN ('government','ngo','other_scheme','village','private','mixed')),
  government_scheme_id BIGINT REFERENCES government_schemes(id) ON DELETE SET NULL,
  implementing_partner VARCHAR(240),
  funding_source VARCHAR(240),
  department_or_sponsor VARCHAR(240),
  sector VARCHAR(100),
  status VARCHAR(40) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','planned','submitted','approved','active','on_hold','completed','cancelled','rejected')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  estimated_cost NUMERIC(16,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  approved_amount NUMERIC(16,2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
  spent_amount NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  beneficiaries_target INTEGER CHECK (beneficiaries_target IS NULL OR beneficiaries_target >= 0),
  beneficiaries_reached INTEGER NOT NULL DEFAULT 0 CHECK (beneficiaries_reached >= 0),
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT village_initiative_dates_valid CHECK (
    start_date IS NULL OR expected_end_date IS NULL OR expected_end_date >= start_date
  ),
  CONSTRAINT village_initiative_actual_end_valid CHECK (
    actual_end_date IS NULL OR start_date IS NULL OR actual_end_date >= start_date
  ),
  CONSTRAINT village_initiative_spend_not_above_approved CHECK (
    approved_amount IS NULL OR spent_amount <= approved_amount
  )
);

CREATE INDEX IF NOT EXISTS idx_village_initiatives_village ON village_initiatives(village_id, status);
CREATE INDEX IF NOT EXISTS idx_village_initiatives_type ON village_initiatives(initiative_type, source_type);
CREATE INDEX IF NOT EXISTS idx_village_initiatives_scheme ON village_initiatives(government_scheme_id);
CREATE INDEX IF NOT EXISTS idx_village_initiatives_status_dates ON village_initiatives(status, expected_end_date);

CREATE TABLE IF NOT EXISTS village_initiative_updates (
  update_id BIGSERIAL PRIMARY KEY,
  initiative_id BIGINT NOT NULL REFERENCES village_initiatives(initiative_id) ON DELETE CASCADE,
  status VARCHAR(40),
  progress_percent NUMERIC(5,2) CHECK (progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100)),
  note TEXT NOT NULL,
  actor_id UUID,
  actor_role VARCHAR(120),
  attachment_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_village_initiative_updates_initiative ON village_initiative_updates(initiative_id, created_at DESC);

CREATE TABLE IF NOT EXISTS village_initiative_beneficiaries (
  beneficiary_id BIGSERIAL PRIMARY KEY,
  initiative_id BIGINT NOT NULL REFERENCES village_initiatives(initiative_id) ON DELETE CASCADE,
  beneficiary_type VARCHAR(40) NOT NULL DEFAULT 'household'
    CHECK (beneficiary_type IN ('person','household','farmer','fisher','producer_group','fpo','enterprise','school','institution','community','other')),
  beneficiary_ref VARCHAR(120),
  beneficiary_name VARCHAR(240),
  target_flag BOOLEAN NOT NULL DEFAULT true,
  status VARCHAR(30) NOT NULL DEFAULT 'identified'
    CHECK (status IN ('identified','eligible','enrolled','benefited','withdrawn','ineligible')),
  benefit_type VARCHAR(160),
  benefit_value NUMERIC(16,2) CHECK (benefit_value IS NULL OR benefit_value >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (initiative_id, beneficiary_type, beneficiary_ref)
);

CREATE INDEX IF NOT EXISTS idx_village_initiative_beneficiaries_initiative ON village_initiative_beneficiaries(initiative_id, status);
CREATE INDEX IF NOT EXISTS idx_village_initiative_beneficiaries_ref ON village_initiative_beneficiaries(beneficiary_ref);

CREATE TABLE IF NOT EXISTS village_initiative_milestones (
  milestone_id BIGSERIAL PRIMARY KEY,
  initiative_id BIGINT NOT NULL REFERENCES village_initiatives(initiative_id) ON DELETE CASCADE,
  milestone_code VARCHAR(80) NOT NULL,
  name VARCHAR(240) NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','delayed','cancelled')),
  planned_amount NUMERIC(16,2) CHECK (planned_amount IS NULL OR planned_amount >= 0),
  actual_amount NUMERIC(16,2) CHECK (actual_amount IS NULL OR actual_amount >= 0),
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (initiative_id, milestone_code)
);

CREATE INDEX IF NOT EXISTS idx_village_initiative_milestones_due ON village_initiative_milestones(initiative_id, due_date, status);

CREATE OR REPLACE VIEW v_village_initiative_summary AS
SELECT
  vi.village_id,
  vi.initiative_id,
  vi.initiative_code,
  vi.name,
  vi.initiative_type,
  vi.source_type,
  vi.status,
  vi.priority,
  vi.government_scheme_id,
  vi.implementing_partner,
  vi.start_date,
  vi.expected_end_date,
  vi.actual_end_date,
  vi.estimated_cost,
  vi.approved_amount,
  vi.spent_amount,
  vi.beneficiaries_target,
  vi.beneficiaries_reached,
  COUNT(DISTINCT vim.milestone_id)::INTEGER AS milestone_count,
  COUNT(DISTINCT vim.milestone_id) FILTER (WHERE vim.status = 'completed')::INTEGER AS completed_milestones,
  COUNT(DISTINCT vib.beneficiary_id)::INTEGER AS beneficiary_records,
  COUNT(DISTINCT vib.beneficiary_id) FILTER (WHERE vib.status = 'benefited')::INTEGER AS benefited_records
FROM village_initiatives vi
LEFT JOIN village_initiative_milestones vim ON vim.initiative_id = vi.initiative_id
LEFT JOIN village_initiative_beneficiaries vib ON vib.initiative_id = vi.initiative_id
GROUP BY vi.village_id, vi.initiative_id;

COMMENT ON TABLE village_initiatives IS
  'Unified village project/programme/work record. Covers government schemes, other schemes, NGO works and village projects without duplicating village master data.';
COMMENT ON COLUMN village_initiatives.government_scheme_id IS
  'Optional link to the existing verified government_schemes registry; other schemes and NGO works do not require this FK.';
COMMENT ON VIEW v_village_initiative_summary IS
  'Operational summary for village project, scheme and NGO-work monitoring.';
