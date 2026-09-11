-- 9994_village_completeness_operating_layer.sql
-- Village completeness layer: governance, services, infrastructure, resilience,
-- connectivity, livelihoods, social protection, environment and asset lifecycle.
-- This complements 9995-9998 without duplicating agriculture, water, ERP or
-- logistics domain ledgers; it provides the village-level aggregation spine.

BEGIN;

-- 1. Local institutions and governance
CREATE TABLE IF NOT EXISTS village_institutions (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  institution_type VARCHAR(60) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  owner_type VARCHAR(60),
  responsible_person VARCHAR(200),
  phone VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','inactive','closed')),
  latitude NUMERIC(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  capacity JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_institutions_village_type ON village_institutions(village_id, institution_type, status);

CREATE TABLE IF NOT EXISTS village_governance_records (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  governance_type VARCHAR(60) NOT NULL,
  meeting_date DATE,
  agenda TEXT,
  resolution TEXT,
  decision_status VARCHAR(30) NOT NULL DEFAULT 'recorded' CHECK (decision_status IN ('draft','recorded','approved','rejected','implemented')),
  responsible_authority VARCHAR(200),
  source_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_governance_village_date ON village_governance_records(village_id, meeting_date DESC);

CREATE TABLE IF NOT EXISTS village_grievances (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  household_id BIGINT REFERENCES village_households(id) ON DELETE SET NULL,
  category VARCHAR(80) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  description TEXT NOT NULL,
  assigned_to VARCHAR(120),
  status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open','assigned','in_progress','resolved','closed','rejected')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_village_grievances_village_status ON village_grievances(village_id, status, priority);

-- 2. Community/public assets and service coverage
CREATE TABLE IF NOT EXISTS village_assets (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  asset_type VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  asset_code VARCHAR(100),
  ownership_type VARCHAR(60),
  condition_status VARCHAR(30) NOT NULL DEFAULT 'good' CHECK (condition_status IN ('new','good','fair','poor','critical','non_operational','unknown')),
  operational_status VARCHAR(30) NOT NULL DEFAULT 'operational' CHECK (operational_status IN ('operational','partially_operational','non_operational','planned','retired')),
  capacity JSONB NOT NULL DEFAULT '{}',
  installed_at DATE,
  useful_life_years INTEGER CHECK (useful_life_years IS NULL OR useful_life_years > 0),
  last_maintenance_at DATE,
  next_maintenance_at DATE,
  estimated_replacement_cost NUMERIC(20,2) CHECK (estimated_replacement_cost IS NULL OR estimated_replacement_cost >= 0),
  latitude NUMERIC(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude NUMERIC(10,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_assets_village_type ON village_assets(village_id, asset_type, operational_status);

CREATE TABLE IF NOT EXISTS village_service_coverage (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  service_type VARCHAR(80) NOT NULL,
  coverage_percent NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (coverage_percent BETWEEN 0 AND 100),
  served_population INTEGER CHECK (served_population IS NULL OR served_population >= 0),
  target_population INTEGER CHECK (target_population IS NULL OR target_population >= 0),
  quality_score NUMERIC(6,2) CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100),
  access_distance_km NUMERIC(12,3) CHECK (access_distance_km IS NULL OR access_distance_km >= 0),
  measured_on DATE NOT NULL,
  source VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (village_id, service_type, measured_on)
);
CREATE INDEX IF NOT EXISTS idx_village_service_coverage ON village_service_coverage(village_id, service_type, measured_on DESC);

-- 3. Livelihoods, skills and employment gaps
CREATE TABLE IF NOT EXISTS village_livelihoods (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  household_id BIGINT REFERENCES village_households(id) ON DELETE SET NULL,
  livelihood_type VARCHAR(80) NOT NULL,
  primary_flag BOOLEAN NOT NULL DEFAULT FALSE,
  worker_count INTEGER NOT NULL DEFAULT 0 CHECK (worker_count >= 0),
  annual_income_estimate NUMERIC(20,2) CHECK (annual_income_estimate IS NULL OR annual_income_estimate >= 0),
  seasonality JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','inactive')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_livelihoods_village_type ON village_livelihoods(village_id, livelihood_type, status);

CREATE TABLE IF NOT EXISTS village_skill_gaps (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  skill_code VARCHAR(80) NOT NULL,
  skill_name VARCHAR(160) NOT NULL,
  workers_available INTEGER NOT NULL DEFAULT 0 CHECK (workers_available >= 0),
  workers_required INTEGER NOT NULL DEFAULT 0 CHECK (workers_required >= 0),
  training_capacity INTEGER NOT NULL DEFAULT 0 CHECK (training_capacity >= 0),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  metadata JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (village_id, skill_code)
);
CREATE INDEX IF NOT EXISTS idx_village_skill_gaps_priority ON village_skill_gaps(village_id, priority);

-- 4. Financial inclusion / access points (actual financial ledger remains in ERP)
CREATE TABLE IF NOT EXISTS village_financial_access_points (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  access_type VARCHAR(60) NOT NULL,
  provider_name VARCHAR(255),
  service_scope JSONB NOT NULL DEFAULT '{}',
  distance_km NUMERIC(12,3) CHECK (distance_km IS NULL OR distance_km >= 0),
  digital_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  operational_status VARCHAR(30) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_financial_access ON village_financial_access_points(village_id, access_type, operational_status);

-- 5. Climate/disaster resilience and emergency readiness
CREATE TABLE IF NOT EXISTS village_hazard_profiles (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  hazard_type VARCHAR(60) NOT NULL,
  likelihood_score NUMERIC(6,2) CHECK (likelihood_score BETWEEN 0 AND 100),
  impact_score NUMERIC(6,2) CHECK (impact_score BETWEEN 0 AND 100),
  exposure_score NUMERIC(6,2) CHECK (exposure_score BETWEEN 0 AND 100),
  vulnerability_score NUMERIC(6,2) CHECK (vulnerability_score BETWEEN 0 AND 100),
  risk_score NUMERIC(8,2),
  seasonality JSONB NOT NULL DEFAULT '{}',
  mitigation_status VARCHAR(40) NOT NULL DEFAULT 'not_assessed',
  source VARCHAR(100),
  assessed_on DATE,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (village_id, hazard_type)
);
CREATE INDEX IF NOT EXISTS idx_village_hazard_risk ON village_hazard_profiles(village_id, risk_score DESC);

CREATE TABLE IF NOT EXISTS village_emergency_resources (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  resource_type VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  capacity JSONB NOT NULL DEFAULT '{}',
  contact_person VARCHAR(200),
  phone VARCHAR(50),
  location JSONB NOT NULL DEFAULT '{}',
  availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_village_emergency_resources ON village_emergency_resources(village_id, resource_type, availability_status);

-- 6. Digital/telecom connectivity
CREATE TABLE IF NOT EXISTS village_connectivity_profiles (
  village_id INTEGER PRIMARY KEY REFERENCES villages(id) ON DELETE CASCADE,
  mobile_coverage_percent NUMERIC(6,2) CHECK (mobile_coverage_percent IS NULL OR mobile_coverage_percent BETWEEN 0 AND 100),
  broadband_coverage_percent NUMERIC(6,2) CHECK (broadband_coverage_percent IS NULL OR broadband_coverage_percent BETWEEN 0 AND 100),
  internet_quality_score NUMERIC(6,2) CHECK (internet_quality_score IS NULL OR internet_quality_score BETWEEN 0 AND 100),
  mobile_networks JSONB NOT NULL DEFAULT '[]',
  broadband_providers JSONB NOT NULL DEFAULT '[]',
  public_wifi_available BOOLEAN NOT NULL DEFAULT FALSE,
  digital_service_point_available BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  source VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- 7. Environment, biodiversity and common-resource accounting
CREATE TABLE IF NOT EXISTS village_natural_resources (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  resource_type VARCHAR(80) NOT NULL,
  resource_name VARCHAR(255),
  area_or_capacity NUMERIC(20,4),
  unit VARCHAR(40),
  condition_status VARCHAR(40),
  annual_use_estimate NUMERIC(20,4),
  sustainable_use_estimate NUMERIC(20,4),
  protected BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_village_natural_resources ON village_natural_resources(village_id, resource_type);

CREATE TABLE IF NOT EXISTS village_environment_indicators (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  indicator_code VARCHAR(80) NOT NULL,
  indicator_name VARCHAR(160) NOT NULL,
  value NUMERIC(20,6),
  unit VARCHAR(40),
  measured_on DATE NOT NULL,
  source VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE (village_id, indicator_code, measured_on)
);
CREATE INDEX IF NOT EXISTS idx_village_environment_indicators ON village_environment_indicators(village_id, indicator_code, measured_on DESC);

-- 8. Village-level digital twin / readiness snapshot
CREATE TABLE IF NOT EXISTS village_readiness_snapshots (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  governance_score NUMERIC(6,2),
  economic_score NUMERIC(6,2),
  infrastructure_score NUMERIC(6,2),
  service_score NUMERIC(6,2),
  connectivity_score NUMERIC(6,2),
  resilience_score NUMERIC(6,2),
  environmental_score NUMERIC(6,2),
  livelihood_score NUMERIC(6,2),
  overall_score NUMERIC(6,2),
  evidence JSONB NOT NULL DEFAULT '{}',
  generated_by VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (village_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_village_readiness ON village_readiness_snapshots(village_id, snapshot_date DESC);

-- 9. Single view for village gap/opportunity analysis.
CREATE OR REPLACE VIEW village_completeness_gap AS
SELECT
  v.id AS village_id,
  v.name AS village_name,
  COALESCE(h.household_count,0) AS households,
  COALESCE(e.enterprise_count,0) AS enterprises,
  COALESCE(a.asset_count,0) AS assets,
  COALESCE(g.open_grievances,0) AS open_grievances,
  COALESCE(s.service_types,0) AS tracked_service_types,
  COALESCE(sk.skill_gaps,0) AS skill_gap_count,
  COALESCE(hz.hazard_count,0) AS assessed_hazards,
  COALESCE(er.emergency_resource_count,0) AS emergency_resources,
  COALESCE(nr.natural_resource_count,0) AS natural_resources
FROM villages v
LEFT JOIN (SELECT village_id, COUNT(*) household_count FROM village_households GROUP BY village_id) h ON h.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) enterprise_count FROM village_enterprises GROUP BY village_id) e ON e.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) asset_count FROM village_assets GROUP BY village_id) a ON a.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) open_grievances FROM village_grievances WHERE status NOT IN ('resolved','closed','rejected') GROUP BY village_id) g ON g.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(DISTINCT service_type) service_types FROM village_service_coverage GROUP BY village_id) s ON s.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) skill_gaps FROM village_skill_gaps WHERE workers_required > workers_available GROUP BY village_id) sk ON sk.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) hazard_count FROM village_hazard_profiles GROUP BY village_id) hz ON hz.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) emergency_resource_count FROM village_emergency_resources GROUP BY village_id) er ON er.village_id=v.id
LEFT JOIN (SELECT village_id, COUNT(*) natural_resource_count FROM village_natural_resources GROUP BY village_id) nr ON nr.village_id=v.id;

COMMIT;
