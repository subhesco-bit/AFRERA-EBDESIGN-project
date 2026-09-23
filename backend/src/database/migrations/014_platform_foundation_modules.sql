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

-- Platform Foundation Modules Migration
-- Phase 1: Platform Foundation Enhancement (M001-M020)
-- Core platform tables with AI enhancement support

-- Platform Configurations Table
CREATE TABLE IF NOT EXISTS platform_configurations (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'string',
  is_sensitive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS config_key VARCHAR(255);
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS config_value TEXT;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS config_type VARCHAR(50) DEFAULT 'string';
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT false;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS updated_by UUID;


CREATE INDEX idx_platform_configurations_category ON platform_configurations(category);
CREATE INDEX idx_platform_configurations_active ON platform_configurations(is_active);

-- Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  subdomain VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  plan VARCHAR(50) DEFAULT 'basic',
  max_users INTEGER DEFAULT 100,
  max_storage INTEGER DEFAULT 10737418240, -- 10GB in bytes
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 100;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_storage INTEGER DEFAULT 10737418240;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_plan ON tenants(plan);

-- Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'business',
  industry VARCHAR(100),
  size VARCHAR(50),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  address JSONB,
  contact_info JSONB,
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'business';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_info JSONB;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organizations_status ON organizations(status);

-- Environments Table
CREATE TABLE IF NOT EXISTS environments (
  id SERIAL PRIMARY KEY,
  -- TYPE ALIGNED (2026-09-23): declared INTEGER, but organizations.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'production' CHECK (type IN ('development', 'staging', 'production')),
  status VARCHAR(50) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE environments ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE environments ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'production' CHECK (type IN ('development', 'staging', 'production'));
ALTER TABLE environments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE environments ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
ALTER TABLE environments ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';
ALTER TABLE environments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_environments_organization ON environments(organization_id);
CREATE INDEX idx_environments_type ON environments(type);

-- System Administrators Table
CREATE TABLE IF NOT EXISTS system_administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  permissions JSONB DEFAULT '[]',
  access_level VARCHAR(50) DEFAULT 'full',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'full';
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE system_administrators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_system_administrators_user ON system_administrators(user_id);

-- Localization Settings Table
CREATE TABLE IF NOT EXISTS localization_settings (
  id SERIAL PRIMARY KEY,
  language_code VARCHAR(10) NOT NULL,
  language_name VARCHAR(100) NOT NULL,
  region_code VARCHAR(10),
  region_name VARCHAR(100),
  date_format VARCHAR(50),
  time_format VARCHAR(50),
  number_format VARCHAR(50),
  currency_code VARCHAR(10),
  currency_symbol VARCHAR(10),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS language_code VARCHAR(10);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS language_name VARCHAR(100);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS region_code VARCHAR(10);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS region_name VARCHAR(100);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(50);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS time_format VARCHAR(50);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS number_format VARCHAR(50);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(10);
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE localization_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_localization_language ON localization_settings(language_code);
CREATE INDEX idx_localization_active ON localization_settings(is_active);

-- Time Zone Settings Table
CREATE TABLE IF NOT EXISTS time_zone_settings (
  id SERIAL PRIMARY KEY,
  zone_name VARCHAR(100) NOT NULL UNIQUE,
  utc_offset VARCHAR(10) NOT NULL,
  display_name VARCHAR(255),
  country_code VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS zone_name VARCHAR(100);
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS utc_offset VARCHAR(10);
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE time_zone_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_time_zone_active ON time_zone_settings(is_active);

-- Master Configuration Table
CREATE TABLE IF NOT EXISTS master_configurations (
  id SERIAL PRIMARY KEY,
  config_group VARCHAR(100) NOT NULL,
  config_key VARCHAR(255) NOT NULL,
  config_value TEXT,
  config_type VARCHAR(50) DEFAULT 'string',
  validation_rules JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS config_group VARCHAR(100);
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS config_key VARCHAR(255);
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS config_value TEXT;
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS config_type VARCHAR(50) DEFAULT 'string';
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}';
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_master_config_group ON master_configurations(config_group);
CREATE INDEX idx_master_config_key ON master_configurations(config_key);

-- Roles Table (Enhanced)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT false,
  level INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE roles ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT false;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- 2026-08-30: removed unconditional CREATE INDEX on is_system_role/level -
-- this file's own CREATE TABLE roles above is a no-op (000_base_schema.sql's
-- narrower roles table already exists and runs first), so these columns
-- don't exist on the real table and the index creation fails outright
-- ("column is_system_role does not exist"). The equivalent indexes are
-- already created safely, with IF NOT EXISTS, after the columns actually
-- exist, by 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_repair.sql.

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  resource VARCHAR(100),
  action VARCHAR(50),
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS action VARCHAR(50);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
-- 2026-08-30: removed idx_user_roles_active - this file's own CREATE TABLE
-- user_roles above is a no-op (000_base_schema.sql's user_roles already
-- exists and runs first, with no is_active column), so this unconditional
-- index creation fails with "column is_active does not exist" against a
-- real database. See schema-decisions.json ("user_roles", kind: deferred).

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS role_id INTEGER;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS permission_id INTEGER;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Single Sign-On Configurations Table
CREATE TABLE IF NOT EXISTS sso_configurations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  provider_config JSONB NOT NULL,
  -- TYPE ALIGNED (2026-09-23): declared INTEGER, but organizations.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
  organization_id UUID REFERENCES organizations(id),
  is_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS provider VARCHAR(50);
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS provider_config JSONB;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS organization_id INTEGER;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT false;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sso_configurations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_sso_provider ON sso_configurations(provider);
CREATE INDEX idx_sso_organization ON sso_configurations(organization_id);

-- Consent Management Table
CREATE TABLE IF NOT EXISTS consents (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(100) NOT NULL,
  consent_version VARCHAR(50) NOT NULL,
  consent_text TEXT,
  is_granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE consents ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS consent_type VARCHAR(100);
ALTER TABLE consents ADD COLUMN IF NOT EXISTS consent_version VARCHAR(50);
ALTER TABLE consents ADD COLUMN IF NOT EXISTS consent_text TEXT;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS is_granted BOOLEAN DEFAULT false;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE consents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE consents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_consents_user ON consents(user_id);
CREATE INDEX idx_consents_type ON consents(consent_type);
CREATE INDEX idx_consents_granted ON consents(is_granted);

-- Session Management Table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  session_token VARCHAR(255) NOT NULL UNIQUE,
  refresh_token VARCHAR(255) UNIQUE,
  device_info JSONB,
  ip_address INET,
  location JSONB,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS device_info JSONB;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'success';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
-- 2026-08-30: removed idx_audit_created ON audit_logs(created_at) - this
-- file's own CREATE TABLE audit_logs above is a no-op (000_base_schema.sql's
-- audit_logs already exists and runs first; its equivalent column is named
-- `timestamp`, not `created_at`), so this unconditional index creation fails
-- with "column created_at does not exist" against a real database.

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_platform_configurations_updated_at
  BEFORE UPDATE ON platform_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_environments_updated_at
  BEFORE UPDATE ON environments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_administrators_updated_at
  BEFORE UPDATE ON system_administrators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_localization_settings_updated_at
  BEFORE UPDATE ON localization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_zone_settings_updated_at
  BEFORE UPDATE ON time_zone_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_configurations_updated_at
  BEFORE UPDATE ON master_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON sso_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE platform_configurations IS 'Platform-wide configuration settings';
COMMENT ON TABLE tenants IS 'Multi-tenant tenant information';
COMMENT ON TABLE organizations IS 'Organization/Company information';
COMMENT ON TABLE environments IS 'Deployment environments (dev, staging, prod)';
COMMENT ON TABLE system_administrators IS 'System administrator accounts and permissions';
COMMENT ON TABLE localization_settings IS 'Language and regional settings';
COMMENT ON TABLE time_zone_settings IS 'Time zone configurations';
COMMENT ON TABLE master_configurations IS 'Master configuration templates';
COMMENT ON TABLE roles IS 'User roles with permissions';
COMMENT ON TABLE permissions IS 'Granular permissions for access control';
COMMENT ON TABLE user_roles IS 'User-role assignments';
COMMENT ON TABLE role_permissions IS 'Role-permission mappings';
COMMENT ON TABLE sso_configurations IS 'Single sign-on provider configurations';
COMMENT ON TABLE consents IS 'User consent tracking for GDPR compliance';
COMMENT ON TABLE user_sessions IS 'User session management';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';