-- Migration for Enhanced M018 Privacy Controls
-- Identity & Access Domain
-- Version: 3018
-- Date: 2026-08-11

-- Data Access Policies Table
CREATE TABLE IF NOT EXISTS data_access_policies (
  id SERIAL PRIMARY KEY,
  resource_name VARCHAR(255) NOT NULL,
  access_level VARCHAR(20) NOT NULL, -- 'read', 'write', 'admin'
  allowed_roles JSONB NOT NULL,
  data_fields JSONB,
  retention_period VARCHAR(50),
  masking_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource_name)
);

-- Masking Rules Table
CREATE TABLE IF NOT EXISTS masking_rules (
  id SERIAL PRIMARY KEY,
  field VARCHAR(100) NOT NULL,
  mask_type VARCHAR(50) NOT NULL, -- 'full', 'partial', 'email', 'phone', 'hash'
  mask_char VARCHAR(1) DEFAULT '*',
  visible_chars INTEGER DEFAULT 0,
  applies_to_resources JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Privacy Policies Table
CREATE TABLE IF NOT EXISTS privacy_policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  policy_text TEXT NOT NULL,
  effective_date DATE NOT NULL,
  categories JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Privacy Policy Acceptances Table
CREATE TABLE IF NOT EXISTS privacy_policy_acceptances (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  policy_id INTEGER NOT NULL REFERENCES privacy_policies(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, policy_id)
);

-- Profile Views Table
CREATE TABLE IF NOT EXISTS profile_views (
  id SERIAL PRIMARY KEY,
  profile_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewer_user_id INTEGER,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile Activity Table
CREATE TABLE IF NOT EXISTS profile_activity (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_data_access_policies_resource ON data_access_policies(resource_name);
CREATE INDEX IF NOT EXISTS idx_masking_rules_field ON masking_rules(field);
CREATE INDEX IF NOT EXISTS idx_privacy_policies_effective_date ON privacy_policies(effective_date);
CREATE INDEX IF NOT EXISTS idx_privacy_acceptances_user_id ON privacy_policy_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_user ON profile_views(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_activity_user_id ON profile_activity(user_id);

COMMENT ON TABLE data_access_policies IS 'Data access control policies';
COMMENT ON TABLE masking_rules IS 'Data masking rules for privacy';
COMMENT ON TABLE privacy_policies IS 'Privacy policy management';
COMMENT ON TABLE privacy_policy_acceptances IS 'Privacy policy acceptances';
COMMENT ON TABLE profile_views IS 'Profile view tracking';
COMMENT ON TABLE profile_activity IS 'Profile activity logging';