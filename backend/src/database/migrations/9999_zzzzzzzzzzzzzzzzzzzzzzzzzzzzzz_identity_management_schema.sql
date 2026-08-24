-- Schema for 5 of the 6 remaining Identity-domain resources backing
-- backend/src/services/identityManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/IdentityManagementPage.jsx - taken directly from that
-- UI, not invented. M014 Role Management already has its own real schema
-- (roleManagementService.js) and is untouched. M020 Session Management has
-- no table here at all - it reads/terminates the real `sessions` table
-- created by the M012 recovery migration - see
-- identityManagementService.js.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS identity_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_name VARCHAR(200) NOT NULL,
    resource VARCHAR(150) NOT NULL,
    action VARCHAR(15) DEFAULT 'Read',
    role_assigned VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sso_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name VARCHAR(200) NOT NULL,
    protocol VARCHAR(10) DEFAULT 'OAuth2',
    client_id VARCHAR(200),
    status VARCHAR(10) DEFAULT 'Enabled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mfa_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_identifier VARCHAR(255) NOT NULL,
    device_type VARCHAR(20) DEFAULT 'Authenticator App',
    enrolled_date DATE,
    status VARCHAR(10) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mfa_devices_user ON mfa_devices(user_identifier);

CREATE TABLE IF NOT EXISTS digital_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identity_ref VARCHAR(150) NOT NULL,
    identity_type VARCHAR(15) DEFAULT 'Aadhaar',
    verification_status VARCHAR(10) DEFAULT 'Pending',
    issued_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name VARCHAR(200) NOT NULL,
    consent_type VARCHAR(20) DEFAULT 'Data Sharing',
    granted_date DATE,
    expiry_date DATE,
    status VARCHAR(10) DEFAULT 'Granted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
