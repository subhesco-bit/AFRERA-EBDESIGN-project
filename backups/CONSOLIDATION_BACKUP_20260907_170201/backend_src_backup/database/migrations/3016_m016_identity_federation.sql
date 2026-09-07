-- Migration for Enhanced M016 Identity Federation
-- Identity & Access Domain
-- Version: 3016
-- Date: 2026-08-11

-- Federated Identities Table
CREATE TABLE IF NOT EXISTS federated_identities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL, -- 'google', 'facebook', 'microsoft', etc.
  provider_user_id VARCHAR(255) NOT NULL,
  attributes JSONB,
  trust_level VARCHAR(20) DEFAULT 'trusted', -- 'trusted', 'verified', 'unknown', 'revoked'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Identity Attribute Mappings Table
CREATE TABLE IF NOT EXISTS identity_attribute_mappings (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  source_attribute VARCHAR(100) NOT NULL,
  target_attribute VARCHAR(100) NOT NULL,
  transformation JSONB,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, source_attribute)
);

-- Federation Trust Table
CREATE TABLE IF NOT EXISTS federation_trust (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL UNIQUE,
  trust_level VARCHAR(20) NOT NULL,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trust Score History Table
CREATE TABLE IF NOT EXISTS trust_score_history (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL REFERENCES federation_trust(provider) ON DELETE CASCADE,
  score_change INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_federated_identities_user_id ON federated_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_federated_identities_provider ON federated_identities(provider);
CREATE INDEX IF NOT EXISTS idx_identity_mappings_provider ON identity_attribute_mappings(provider);
CREATE INDEX IF NOT EXISTS idx_federation_trust_provider ON federation_trust(provider);
CREATE INDEX IF NOT EXISTS idx_trust_history_provider ON trust_score_history(provider);

COMMENT ON TABLE federated_identities IS 'Cross-platform federated identity management';
COMMENT ON TABLE identity_attribute_mappings IS 'Identity attribute mapping for federation';
COMMENT ON TABLE federation_trust IS 'Federation trust relationship management';
COMMENT ON TABLE trust_score_history IS 'Trust score change history for auditing';