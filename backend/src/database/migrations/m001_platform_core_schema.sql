-- M001 Platform Core Database Schema
-- Platform configuration and core functionality tables

-- Platform configuration table
CREATE TABLE IF NOT EXISTS platform_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    data_type VARCHAR(20) DEFAULT 'string',
    active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform version table
CREATE TABLE IF NOT EXISTS platform_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    changelog TEXT,
    is_current BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id)
);

-- Platform events table (for audit logging)
CREATE TABLE IF NOT EXISTS platform_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    description TEXT,
    metadata JSONB,
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform maintenance schedule table
CREATE TABLE IF NOT EXISTS platform_maintenance (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    impact_level VARCHAR(20) DEFAULT 'low',
    affected_services TEXT[],
    notification_sent BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default platform configuration
INSERT INTO platform_config (key, value, description, category) VALUES
('platform.name', 'AFRERA Platform', 'Platform name', 'general'),
('platform.version', '1.0.0', 'Current platform version', 'general'),
('platform.environment', 'development', 'Environment (development/staging/production)', 'general'),
('auth.session_timeout', '3600', 'Session timeout in seconds', 'authentication'),
('auth.max_login_attempts', '5', 'Maximum login attempts before lockout', 'authentication'),
('auth.lockout_duration', '900', 'Account lockout duration in seconds', 'authentication'),
('api.rate_limit', '100', 'API rate limit per minute', 'api'),
('api.rate_limit_window', '60', 'Rate limit window in seconds', 'api'),
('storage.max_file_size', '10485760', 'Maximum file size in bytes (10MB)', 'storage'),
('storage.allowed_file_types', '["jpg","jpeg","png","pdf","doc","docx"]', 'Allowed file types', 'storage')
ON CONFLICT (key) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_platform_config_category ON platform_config(category);
CREATE INDEX idx_platform_config_active ON platform_config(active);
CREATE INDEX idx_platform_events_event_type ON platform_events(event_type);
CREATE INDEX idx_platform_events_created_at ON platform_events(created_at);
CREATE INDEX idx_platform_events_user_id ON platform_events(user_id);
CREATE INDEX idx_platform_maintenance_status ON platform_maintenance(status);
CREATE INDEX idx_platform_maintenance_scheduled_start ON platform_maintenance(scheduled_start);

-- Comment on tables
COMMENT ON TABLE platform_config IS 'Platform-wide configuration settings';
COMMENT ON TABLE platform_versions IS 'Platform version history and releases';
COMMENT ON TABLE platform_events IS 'Platform event log for audit and monitoring';
COMMENT ON TABLE platform_maintenance IS 'Scheduled maintenance windows and status';
