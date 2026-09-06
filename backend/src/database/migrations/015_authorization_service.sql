-- Migration: Advanced Authorization Service (M013)
-- Created: August 12, 2026
-- Description: Create tables for AI-powered authorization service with role-based access control

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    hierarchy_level INTEGER NOT NULL DEFAULT 50, -- 10-100 for role hierarchy
    default_permissions JSONB DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy_level ON roles(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_roles_is_system_role ON roles(is_system_role);

-- Authorizations Table
CREATE TABLE IF NOT EXISTS authorizations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    permissions JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for authorizations
CREATE INDEX IF NOT EXISTS idx_authorizations_user_id ON authorizations(user_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_role_id ON authorizations(role_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_status ON authorizations(status);
CREATE INDEX IF NOT EXISTS idx_authorizations_expires_at ON authorizations(expires_at);

-- Authorization Audit Logs Table
CREATE TABLE IF NOT EXISTS authorization_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL, -- 'PERMISSION_CHECK', 'GRANT', 'REVOKE', 'ROLE_ASSIGN', 'ACCESS_DENIED'
    resource VARCHAR(255),
    action VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for authorization_audit_logs
CREATE INDEX IF NOT EXISTS idx_authorization_audit_logs_user_id ON authorization_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_authorization_audit_logs_event ON authorization_audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_authorization_audit_logs_created_at ON authorization_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_authorization_audit_logs_success ON authorization_audit_logs(success);

-- Permission Templates Table
CREATE TABLE IF NOT EXISTS permission_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    applicable_roles JSONB DEFAULT '[]',
    category VARCHAR(50),
    is_system_template BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for permission_templates
CREATE INDEX IF NOT EXISTS idx_permission_templates_category ON permission_templates(category);
CREATE INDEX IF NOT EXISTS idx_permission_templates_is_system_template ON permission_templates(is_system_template);

-- Resource Groups Table
CREATE TABLE IF NOT EXISTS resource_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    resources JSONB NOT NULL DEFAULT '[]',
    parent_group_id INTEGER REFERENCES resource_groups(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for resource_groups
CREATE INDEX IF NOT EXISTS idx_resource_groups_parent_group_id ON resource_groups(parent_group_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_authorization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_authorization_updated_at();

CREATE TRIGGER trigger_authorizations_updated_at
    BEFORE UPDATE ON authorizations
    FOR EACH ROW
    EXECUTE FUNCTION update_authorization_updated_at();

CREATE TRIGGER trigger_permission_templates_updated_at
    BEFORE UPDATE ON permission_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_authorization_updated_at();

CREATE TRIGGER trigger_resource_groups_updated_at
    BEFORE UPDATE ON resource_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_authorization_updated_at();

-- Function to update last_used_at timestamp
CREATE OR REPLACE FUNCTION update_last_used_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_used_at when authorization is used
CREATE TRIGGER trigger_update_last_used_at
    BEFORE UPDATE ON authorizations
    FOR EACH ROW
    WHEN (OLD.last_used_at IS NULL OR AGE(OLD.last_used_at) > INTERVAL '1 hour')
    EXECUTE FUNCTION update_last_used_at();

-- Function to automatically expire authorizations
CREATE OR REPLACE FUNCTION expire_old_authorizations()
RETURNS void AS $$
BEGIN
    UPDATE authorizations 
    SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW() 
    AND status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- Insert default system roles
INSERT INTO roles (name, description, hierarchy_level, default_permissions, is_system_role) VALUES
('SUPER_ADMIN', 'Full system access with all permissions', 100, '[{"resource": "*", "action": "*"}]', true),
('ADMIN', 'Administrative access to most system functions', 90, '[{"resource": "*", "action": ["read", "write", "delete"]}, {"resource": "users", "action": "*"}]', true),
('MANAGER', 'Management access with oversight capabilities', 80, '[{"resource": "*", "action": ["read", "write"]}, {"resource": "reports", "action": "*"}]', true),
('SUPERVISOR', 'Supervisory access for team management', 70, '[{"resource": "*", "action": "read"}, {"resource": "team", "action": "*"}]', true),
('USER', 'Standard user access for daily operations', 50, '[{"resource": "*", "action": "read"}, {"resource": "profile", "action": "*"}]', true),
('GUEST', 'Limited guest access with read-only permissions', 10, '[{"resource": "public", "action": "read"}]', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permission templates
INSERT INTO permission_templates (name, description, permissions, applicable_roles, category, is_system_template) VALUES
('Full Access', 'Complete access to all resources and actions', '[{"resource": "*", "action": "*"}]', '["SUPER_ADMIN"]', 'SYSTEM', true),
('Administrative Access', 'Administrative permissions for system management', '[{"resource": "*", "action": ["read", "write", "delete"]}, {"resource": "users", "action": "*"}]', '["ADMIN"]', 'SYSTEM', true),
('Management Access', 'Management permissions for oversight and reporting', '[{"resource": "*", "action": ["read", "write"]}, {"resource": "reports", "action": "*"}]', '["MANAGER", "SUPERVISOR"]', 'SYSTEM', true),
('User Access', 'Standard user permissions for daily operations', '[{"resource": "*", "action": "read"}, {"resource": "profile", "action": "*"}]', '["USER"]', 'SYSTEM', true),
('Guest Access', 'Limited read-only access for guests', '[{"resource": "public", "action": "read"}]', '["GUEST"]', 'SYSTEM', true)
ON CONFLICT DO NOTHING;

-- Insert default resource groups
INSERT INTO resource_groups (name, description, resources) VALUES
('Platform Foundation', 'Core platform configuration and management', '[{"resource": "platform", "actions": ["read", "write"]}, {"resource": "tenants", "actions": ["read", "write"]}, {"resource": "organizations", "actions": ["read", "write"]}]'),
('Identity Management', 'User and identity management resources', '[{"resource": "users", "actions": ["read", "write", "delete"]}, {"resource": "roles", "actions": ["read", "write"]}, {"resource": "permissions", "actions": ["read", "write"]}]'),
('Farmer Management', 'Farmer-related resources and operations', '[{"resource": "farmers", "actions": ["read", "write"]}, {"resource": "farmer-profiles", "actions": ["read", "write"]}, {"resource": "farmer-health", "actions": ["read", "write"]}]'),
('Land Management', 'Land and property management resources', '[{"resource": "land-parcels", "actions": ["read", "write"]}, {"resource": "land-ownership", "actions": ["read", "write"]}, {"resource": "land-records", "actions": ["read", "write"]}]'),
('Financial Management', 'Financial and accounting resources', '[{"resource": "transactions", "actions": ["read", "write"]}, {"resource": "accounts", "actions": ["read", "write"]}, {"resource": "reports", "actions": ["read"]}]')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON authorizations TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON authorization_audit_logs TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON permission_templates TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON resource_groups TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE roles_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE authorizations_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE authorization_audit_logs_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE permission_templates_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE resource_groups_id_seq TO your_app_user;
-- GRANT EXECUTE ON FUNCTION expire_old_authorizations TO your_app_user;