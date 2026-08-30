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

CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organizations_status ON organizations(status);

-- Environments Table
CREATE TABLE IF NOT EXISTS environments (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'production' CHECK (type IN ('development', 'staging', 'production')),
  status VARCHAR(50) DEFAULT 'active',
  config JSONB DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_roles_system ON roles(is_system_role);
CREATE INDEX idx_roles_level ON roles(level);

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

CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Single Sign-On Configurations Table
CREATE TABLE IF NOT EXISTS sso_configurations (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  provider_config JSONB NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  is_enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Audit Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
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

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

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