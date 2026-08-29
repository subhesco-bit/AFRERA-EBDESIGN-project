-- GDPR Compliance Database Schema Migration
-- GDPR compliance tables for data protection and privacy

-- User consent table
CREATE TABLE IF NOT EXISTS user_consent (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    consent_given BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, consent_type)
);

-- Data subject requests table (GDPR rights requests)
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User data residency table (for data localization compliance)
CREATE TABLE IF NOT EXISTS user_data_residency (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_region VARCHAR(10) NOT NULL DEFAULT 'IN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Privacy impact assessments table
CREATE TABLE IF NOT EXISTS privacy_impact_assessments (
    id SERIAL PRIMARY KEY,
    component VARCHAR(255) NOT NULL,
    data_types TEXT[],
    processing_purpose TEXT,
    risks JSONB,
    mitigations JSONB,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assessor_id INTEGER REFERENCES users(id)
);

-- Data processing activities table (GDPR Article 30)
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id SERIAL PRIMARY KEY,
    controller_name VARCHAR(255) NOT NULL,
    processor_name VARCHAR(255),
    data_categories TEXT[],
    purposes TEXT[],
    recipients TEXT[],
    international_transfers BOOLEAN DEFAULT false,
    security_measures TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data breach notification table (GDPR Article 33)
CREATE TABLE IF NOT EXISTS data_breach_notifications (
    id SERIAL PRIMARY KEY,
    breach_id VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    affected_users INTEGER,
    data_categories TEXT[],
    consequences TEXT,
    mitigation_measures TEXT,
    notified_authority BOOLEAN DEFAULT false,
    authority_notification_date TIMESTAMP,
    notified_data_subjects BOOLEAN DEFAULT false,
    data_subject_notification_date TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Add deleted_at column to users table for soft delete (right to be forgotten)
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX idx_user_consent_user_id ON user_consent(user_id);
CREATE INDEX idx_user_consent_consent_type ON user_consent(consent_type);
CREATE INDEX idx_data_subject_requests_user_id ON data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_user_data_residency_user_id ON user_data_residency(user_id);
CREATE INDEX idx_user_data_residency_data_region ON user_data_residency(data_region);
CREATE INDEX idx_privacy_impact_assessments_component ON privacy_impact_assessments(component);
CREATE INDEX idx_data_processing_activities_controller ON data_processing_activities(controller_name);
CREATE INDEX idx_data_breach_notifications_discovered_at ON data_breach_notifications(discovered_at);

-- Comment on tables
COMMENT ON TABLE user_consent IS 'User consent records for GDPR compliance';
COMMENT ON TABLE data_subject_requests IS 'GDPR rights requests (access, erasure, portability, etc.)';
COMMENT ON TABLE user_data_residency IS 'Data residency information for localization compliance';
COMMENT ON TABLE privacy_impact_assessments IS 'Privacy impact assessments for new systems/features';
COMMENT ON TABLE data_processing_activities IS 'Data processing activities registry (GDPR Article 30)';
COMMENT ON TABLE data_breach_notifications IS 'Data breach notification records (GDPR Article 33)';
