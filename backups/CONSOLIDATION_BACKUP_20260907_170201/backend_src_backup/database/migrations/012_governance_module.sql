-- FK TYPE FIX 2026-08-04: 4 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Governance Module Migration
-- Village Management, Panchayat Integration, CSR Tracking, and Compliance

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Villages Table
CREATE TABLE IF NOT EXISTS villages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  population INTEGER,
  households INTEGER,
  coordinates JSONB,
  demographics JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_villages_district ON villages(district);
CREATE INDEX IF NOT EXISTS idx_villages_state ON villages(state);

-- Panchayats Table
CREATE TABLE IF NOT EXISTS panchayats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  block VARCHAR(255),
  villages JSONB DEFAULT '[]',
  contact_info JSONB,
  chairman VARCHAR(255),
  established_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_panchayats_district ON panchayats(district);
CREATE INDEX IF NOT EXISTS idx_panchayats_state ON panchayats(state);

-- Panchayat Schemes Table
CREATE TABLE IF NOT EXISTS panchayat_schemes (
  id SERIAL PRIMARY KEY,
  panchayat_id INTEGER NOT NULL REFERENCES panchayats(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  target_beneficiaries JSONB,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_panchayat_schemes_panchayat_id ON panchayat_schemes(panchayat_id);
CREATE INDEX IF NOT EXISTS idx_panchayat_schemes_status ON panchayat_schemes(status);

-- CSR Projects Table
CREATE TABLE IF NOT EXISTS csr_projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization VARCHAR(255) NOT NULL,
  budget DECIMAL(15, 2),
  start_date DATE,
  end_date DATE,
  location JSONB,
  impact_areas JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csr_projects_organization ON csr_projects(organization);
CREATE INDEX IF NOT EXISTS idx_csr_projects_status ON csr_projects(status);

-- CSR Contributions Table
CREATE TABLE IF NOT EXISTS csr_contributions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES csr_projects(id),
  contributor_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('monetary', 'in_kind', 'volunteer')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csr_contributions_project_id ON csr_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_csr_contributions_contributor_id ON csr_contributions(contributor_id);

-- Compliance Reports Table
CREATE TABLE IF NOT EXISTS compliance_reports (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  period VARCHAR(50) NOT NULL,
  findings JSONB NOT NULL,
  recommendations JSONB,
  submitted_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'action_required')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  action_items JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON compliance_reports(type);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_entity ON compliance_reports(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);

-- Cooperatives Table
CREATE TABLE IF NOT EXISTS cooperatives (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  district VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100),
  members JSONB DEFAULT '[]',
  bylaws JSONB,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved')),
  established_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cooperatives_type ON cooperatives(type);
CREATE INDEX IF NOT EXISTS idx_cooperatives_district ON cooperatives(district);

-- Cooperative Members Table
CREATE TABLE IF NOT EXISTS cooperative_members (
  id SERIAL PRIMARY KEY,
  cooperative_id INTEGER NOT NULL REFERENCES cooperatives(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(50),
  share_holding DECIMAL(10, 2),
  joining_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cooperative_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cooperative_members_cooperative_id ON cooperative_members(cooperative_id);
CREATE INDEX IF NOT EXISTS idx_cooperative_members_user_id ON cooperative_members(user_id);

-- Audit triggers
DROP TRIGGER IF EXISTS update_villages_updated_at ON villages;
CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_panchayats_updated_at ON panchayats;
CREATE TRIGGER update_panchayats_updated_at BEFORE UPDATE ON panchayats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_panchayat_schemes_updated_at ON panchayat_schemes;
CREATE TRIGGER update_panchayat_schemes_updated_at BEFORE UPDATE ON panchayat_schemes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_csr_projects_updated_at ON csr_projects;
CREATE TRIGGER update_csr_projects_updated_at BEFORE UPDATE ON csr_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compliance_reports_updated_at ON compliance_reports;
CREATE TRIGGER update_compliance_reports_updated_at BEFORE UPDATE ON compliance_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cooperatives_updated_at ON cooperatives;
CREATE TRIGGER update_cooperatives_updated_at BEFORE UPDATE ON cooperatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE villages IS 'Stores village information and demographics';
COMMENT ON TABLE panchayats IS 'Stores panchayat (local government) information';
COMMENT ON TABLE panchayat_schemes IS 'Stores schemes and programs run by panchayats';
COMMENT ON TABLE csr_projects IS 'Stores Corporate Social Responsibility projects';
COMMENT ON TABLE csr_contributions IS 'Stores contributions to CSR projects';
COMMENT ON TABLE compliance_reports IS 'Stores compliance and audit reports';
COMMENT ON TABLE cooperatives IS 'Stores farmer cooperative information';
COMMENT ON TABLE cooperative_members IS 'Stores cooperative membership details';
