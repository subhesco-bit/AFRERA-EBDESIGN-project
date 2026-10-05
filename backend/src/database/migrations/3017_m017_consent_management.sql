-- Migration for Enhanced M017 Consent Management
-- Identity & Access Domain
-- Version: 3017
-- Date: 2026-08-11

-- Consents Table
CREATE TABLE IF NOT EXISTS consents (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL, -- 'data_processing', 'marketing', 'analytics', etc.
  consent_category VARCHAR(100) NOT NULL,
  consent_text TEXT,
  data_categories JSONB,
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NOT NULL,
  version INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'revoked', 'expired'
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Categories Table
CREATE TABLE IF NOT EXISTS consent_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  required BOOLEAN DEFAULT false,
  data_types JSONB,
  retention_period VARCHAR(50), -- '90 days', '1 year', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Templates Table
CREATE TABLE IF NOT EXISTS consent_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  consent_category VARCHAR(100) NOT NULL,
  consent_text TEXT NOT NULL,
  data_categories JSONB,
  validity_period VARCHAR(50) DEFAULT '365 days',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent Acceptances Table
CREATE TABLE IF NOT EXISTS consent_acceptances (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_id INTEGER NOT NULL REFERENCES consent_templates(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, policy_id)
);

-- Consent History Table
CREATE TABLE IF NOT EXISTS consent_history (
  id SERIAL PRIMARY KEY,
  consent_id INTEGER NOT NULL REFERENCES consents(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'revoked', 'expired'
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents(user_id);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "consents") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_consents_status ON consents(status);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "consents") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_consents_valid_until ON consents(valid_until);
CREATE INDEX IF NOT EXISTS idx_consent_acceptances_user_id ON consent_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_history_consent_id ON consent_history(consent_id);

COMMENT ON TABLE consents IS 'GDPR-compliant consent tracking';
COMMENT ON TABLE consent_categories IS 'Consent category definitions';
COMMENT ON TABLE consent_templates IS 'Reusable consent templates';
COMMENT ON TABLE consent_acceptances IS 'User consent acceptances';
COMMENT ON TABLE consent_history IS 'Consent change history for audit';