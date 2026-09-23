-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE villages ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS population INTEGER;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS households INTEGER;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS coordinates JSONB;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS demographics JSONB;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE villages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS block VARCHAR(255);
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS villages JSONB DEFAULT '[]';
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS chairman VARCHAR(255);
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS established_date DATE;
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE panchayats ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS panchayat_id INTEGER;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS target_beneficiaries JSONB;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended'));
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE panchayat_schemes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS organization VARCHAR(255);
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS impact_areas JSONB DEFAULT '[]';
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'cancelled'));
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE csr_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS project_id INTEGER;
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS contributor_id UUID;
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS type VARCHAR(50) CHECK (type IN ('monetary', 'in_kind', 'volunteer'));
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE csr_contributions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS entity VARCHAR(100);
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS entity_id INTEGER;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS period VARCHAR(50);
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS findings JSONB;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS recommendations JSONB;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'action_required'));
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS review_comments TEXT;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS action_items JSONB;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE compliance_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]';
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS bylaws JSONB;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dissolved'));
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS established_date DATE;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cooperatives ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS cooperative_id INTEGER;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS share_holding DECIMAL(10, 2);
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'withdrawn'));
ALTER TABLE cooperative_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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
