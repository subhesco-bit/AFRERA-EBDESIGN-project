-- M041 Village Project / DPR / Estimate / Subsidy Intelligence Layer
-- Extends the canonical Village ERP without creating a second project ledger.

CREATE TABLE IF NOT EXISTS village_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  engineering_project_id UUID REFERENCES engineering_projects(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
  fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
  project_code VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  project_level VARCHAR(30) NOT NULL DEFAULT 'village' CHECK (project_level IN ('farmer','household','village','fpo','cluster','block','district','state')),
  project_type VARCHAR(100) NOT NULL,
  sector VARCHAR(80),
  objective TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','design','dpr','funding','approval','sanctioned','procurement','implementation','completed','cancelled')),
  estimated_cost NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  approved_cost NUMERIC(16,2) CHECK (approved_cost IS NULL OR approved_cost >= 0),
  actual_cost NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (actual_cost >= 0),
  funding_gap NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (funding_gap >= 0),
  design_data JSONB NOT NULL DEFAULT '{}',
  implementation_plan JSONB NOT NULL DEFAULT '{}',
  outcomes JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((farmer_id IS NOT NULL) OR (project_level <> 'farmer'))
);

CREATE INDEX IF NOT EXISTS idx_village_projects_village ON village_projects(village_id);
CREATE INDEX IF NOT EXISTS idx_village_projects_farmer ON village_projects(farmer_id);
CREATE INDEX IF NOT EXISTS idx_village_projects_fpo ON village_projects(fpo_id);
CREATE INDEX IF NOT EXISTS idx_village_projects_status ON village_projects(status);
CREATE INDEX IF NOT EXISTS idx_village_projects_type ON village_projects(project_type);

CREATE TABLE IF NOT EXISTS village_project_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES village_projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  estimate_type VARCHAR(40) NOT NULL DEFAULT 'detailed' CHECK (estimate_type IN ('preliminary','detailed','revised','final')),
  boq JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  contingency NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (contingency >= 0),
  taxes NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (taxes >= 0),
  total_cost NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  assumptions JSONB NOT NULL DEFAULT '{}',
  prepared_by UUID REFERENCES users(id) ON DELETE SET NULL,
  prepared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_village_project_estimates_project ON village_project_estimates(project_id);

CREATE TABLE IF NOT EXISTS village_project_dpr_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES village_projects(id) ON DELETE CASCADE,
  dpr_document_id UUID REFERENCES dpr_documents(id) ON DELETE SET NULL,
  engineering_project_id UUID REFERENCES engineering_projects(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  readiness_score NUMERIC(5,2) CHECK (readiness_score IS NULL OR (readiness_score >= 0 AND readiness_score <= 100)),
  gaps JSONB NOT NULL DEFAULT '[]',
  ai_review JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','ready','approved','rejected')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_village_project_dpr_project ON village_project_dpr_links(project_id);
CREATE INDEX IF NOT EXISTS idx_village_project_dpr_document ON village_project_dpr_links(dpr_document_id);

CREATE TABLE IF NOT EXISTS village_scheme_catalogue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_code VARCHAR(100) UNIQUE NOT NULL,
  scheme_name VARCHAR(255) NOT NULL,
  government_level VARCHAR(20) NOT NULL CHECK (government_level IN ('central','state')),
  state VARCHAR(100),
  ministry_department VARCHAR(255),
  sector VARCHAR(100),
  beneficiary_types TEXT[] NOT NULL DEFAULT '{}',
  geography JSONB NOT NULL DEFAULT '{}',
  eligibility_rules JSONB NOT NULL DEFAULT '{}',
  assistance_rules JSONB NOT NULL DEFAULT '{}',
  eligible_cost_heads TEXT[] NOT NULL DEFAULT '{}',
  required_documents TEXT[] NOT NULL DEFAULT '{}',
  official_source_url TEXT,
  notification_reference TEXT,
  effective_from DATE,
  effective_to DATE,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified','expired','superseded')),
  last_verified_at TIMESTAMP,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (government_level <> 'state' OR state IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_village_scheme_catalogue_level ON village_scheme_catalogue(government_level);
CREATE INDEX IF NOT EXISTS idx_village_scheme_catalogue_state ON village_scheme_catalogue(state);
CREATE INDEX IF NOT EXISTS idx_village_scheme_catalogue_sector ON village_scheme_catalogue(sector);
CREATE INDEX IF NOT EXISTS idx_village_scheme_catalogue_active ON village_scheme_catalogue(active);

CREATE TABLE IF NOT EXISTS village_project_subsidy_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES village_projects(id) ON DELETE CASCADE,
  scheme_id UUID NOT NULL REFERENCES village_scheme_catalogue(id) ON DELETE CASCADE,
  match_score NUMERIC(5,2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  eligibility_status VARCHAR(30) NOT NULL DEFAULT 'potential' CHECK (eligibility_status IN ('potential','eligible_pending_verification','eligible','ineligible','expired')),
  potential_assistance NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (potential_assistance >= 0),
  eligible_cost_base NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (eligible_cost_base >= 0),
  applicant_contribution NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (applicant_contribution >= 0),
  reasons JSONB NOT NULL DEFAULT '[]',
  missing_documents JSONB NOT NULL DEFAULT '[]',
  conflicts JSONB NOT NULL DEFAULT '[]',
  ai_explanation TEXT,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_village_subsidy_matches_project ON village_project_subsidy_matches(project_id);
CREATE INDEX IF NOT EXISTS idx_village_subsidy_matches_score ON village_project_subsidy_matches(match_score DESC);

CREATE TABLE IF NOT EXISTS village_project_funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES village_projects(id) ON DELETE CASCADE,
  source_type VARCHAR(40) NOT NULL CHECK (source_type IN ('central_subsidy','state_subsidy','grant','loan','equity','beneficiary','fpo','csr','other')),
  scheme_id UUID REFERENCES village_scheme_catalogue(id) ON DELETE SET NULL,
  committed_amount NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
  approved_amount NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (approved_amount >= 0),
  received_amount NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (received_amount >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','applied','approved','sanctioned','received','rejected','closed')),
  application_reference VARCHAR(150),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_project_funding_project ON village_project_funding_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_village_project_funding_scheme ON village_project_funding_sources(scheme_id);

CREATE TABLE IF NOT EXISTS village_project_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES village_projects(id) ON DELETE CASCADE,
  review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('project_design','estimate','dpr','subsidy_matching','funding_plan','risk')),
  provider VARCHAR(80),
  model VARCHAR(120),
  source_snapshot JSONB NOT NULL DEFAULT '{}',
  findings JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC(5,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  human_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (human_status IN ('pending','accepted','rejected','superseded')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_project_ai_reviews_project ON village_project_ai_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_village_project_ai_reviews_type ON village_project_ai_reviews(review_type);

CREATE OR REPLACE FUNCTION village_project_recalculate_financials()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE village_projects p
  SET estimated_cost = COALESCE((SELECT total_cost FROM village_project_estimates e WHERE e.project_id = p.id ORDER BY version DESC LIMIT 1), 0),
      funding_gap = GREATEST(
        COALESCE((SELECT COALESCE(approved_cost, estimated_cost, 0) FROM village_projects p2 WHERE p2.id = p.id), 0)
        - COALESCE((SELECT SUM(COALESCE(committed_amount,0)) FROM village_project_funding_sources f WHERE f.project_id = p.id), 0), 0),
      updated_at = NOW()
  WHERE p.id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_village_project_estimate_financials ON village_project_estimates;
CREATE TRIGGER trg_village_project_estimate_financials
AFTER INSERT OR UPDATE ON village_project_estimates
FOR EACH ROW EXECUTE FUNCTION village_project_recalculate_financials();

DROP TRIGGER IF EXISTS trg_village_project_funding_financials ON village_project_funding_sources;
CREATE TRIGGER trg_village_project_funding_financials
AFTER INSERT OR UPDATE OR DELETE ON village_project_funding_sources
FOR EACH ROW EXECUTE FUNCTION village_project_recalculate_financials();
