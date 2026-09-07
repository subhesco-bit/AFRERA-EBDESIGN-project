-- Organization Management Schema (M004)
-- Organization structure, hierarchy, and management

CREATE TABLE IF NOT EXISTS organizations (
    org_id VARCHAR(50) PRIMARY KEY,
    org_name VARCHAR(200) NOT NULL,
    org_code VARCHAR(50) UNIQUE NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    industry VARCHAR(50),
    size VARCHAR(50),
    headquarters VARCHAR(200),
    parent_org_id VARCHAR(50),
    configuration JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_setup JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_departments (
    dept_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) REFERENCES organizations(org_id),
    dept_name VARCHAR(200) NOT NULL,
    dept_code VARCHAR(50),
    parent_dept_id VARCHAR(50),
    manager_id VARCHAR(50),
    budget DECIMAL(15,2),
    headcount INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    dept_id VARCHAR(50) REFERENCES org_departments(dept_id),
    team_name VARCHAR(200) NOT NULL,
    team_lead_id VARCHAR(50),
    team_size INTEGER,
    skills JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_users (
    user_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) REFERENCES organizations(org_id),
    dept_id VARCHAR(50) REFERENCES org_departments(dept_id),
    team_id VARCHAR(50) REFERENCES org_teams(team_id),
    user_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    manager_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS org_hierarchy (
    hierarchy_id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) REFERENCES organizations(org_id),
    parent_id VARCHAR(50),
    child_id VARCHAR(50),
    relationship_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_code ON organizations(org_code);
CREATE INDEX idx_organizations_type ON organizations(org_type);
CREATE INDEX idx_org_departments_org ON org_departments(org_id);
CREATE INDEX idx_org_teams_dept ON org_teams(dept_id);
CREATE INDEX idx_org_users_org ON org_users(org_id);
CREATE INDEX idx_org_users_dept ON org_users(dept_id);
CREATE INDEX idx_org_hierarchy_org ON org_hierarchy(org_id);
