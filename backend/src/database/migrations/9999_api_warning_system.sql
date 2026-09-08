-- API Warning System Schema
-- Production-Grade Warning Management
-- ISO/IEC 27001 Compliant | OWASP Standards
-- Created: 2026-09-08

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main warnings table
CREATE TABLE IF NOT EXISTS api_warnings (
    id BIGSERIAL PRIMARY KEY,
    warning_id VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    category VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id BIGINT,
    request_id VARCHAR(100),
    endpoint VARCHAR(255),
    metadata JSONB,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Indexes for performance
    CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_warnings_warning_id ON api_warnings(warning_id);
CREATE INDEX IF NOT EXISTS idx_api_warnings_severity ON api_warnings(severity);
CREATE INDEX IF NOT EXISTS idx_api_warnings_category ON api_warnings(category);
CREATE INDEX IF NOT EXISTS idx_api_warnings_user_id ON api_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_warnings_created_at ON api_warnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_warnings_expires_at ON api_warnings(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_warnings_code ON api_warnings(code);
CREATE INDEX IF NOT EXISTS idx_api_warnings_endpoint ON api_warnings(endpoint);

-- Composite index for user warnings query
CREATE INDEX IF NOT EXISTS idx_api_warnings_user_expires ON api_warnings(user_id, expires_at);

-- Warning acknowledgments table
CREATE TABLE IF NOT EXISTS warning_acknowledgments (
    id BIGSERIAL PRIMARY KEY,
    warning_id VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to warnings (with ON DELETE CASCADE)
    CONSTRAINT fk_warning_ack_warning 
        FOREIGN KEY (warning_id) 
        REFERENCES api_warnings(warning_id) 
        ON DELETE CASCADE,
    
    -- Ensure one acknowledgment per user per warning
    CONSTRAINT unique_user_warning_ack UNIQUE (warning_id, user_id)
);

-- Create indexes for acknowledgments
CREATE INDEX IF NOT EXISTS idx_warning_acknowledgments_warning_id ON warning_acknowledgments(warning_id);
CREATE INDEX IF NOT EXISTS idx_warning_acknowledgments_user_id ON warning_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_warning_acknowledgments_acknowledged_at ON warning_acknowledgments(acknowledged_at DESC);

-- Warning statistics materialized view (for dashboard performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS warning_statistics AS
SELECT 
    severity,
    category,
    COUNT(*) as total_count,
    COUNT(DISTINCT user_id) as affected_users,
    COUNT(DISTINCT endpoint) as affected_endpoints,
    AVG(count) as avg_occurrences,
    MAX(count) as max_occurrences,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM api_warnings
WHERE expires_at > CURRENT_TIMESTAMP
GROUP BY severity, category
WITH DATA;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_warning_statistics_unique 
    ON warning_statistics(severity, category);

-- Warning aggregation table (for periodic cleanup)
CREATE TABLE IF NOT EXISTS warning_aggregation_daily (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    total_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    affected_endpoints INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_date_severity_category UNIQUE (date, severity, category)
);

-- Create indexes for aggregation
CREATE INDEX IF NOT EXISTS idx_warning_aggregation_date ON warning_aggregation_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_warning_aggregation_severity ON warning_aggregation_daily(severity);

-- Trigger function to update warning count and last_seen
CREATE OR REPLACE FUNCTION update_warning_stats()
RETURNS TRIGGER AS $$
BEGIN
    NEW.count = COALESCE(OLD.count, 0) + 1;
    NEW.last_seen = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for warning updates
DROP TRIGGER IF EXISTS trg_update_warning_stats ON api_warnings;
CREATE TRIGGER trg_update_warning_stats
    BEFORE UPDATE ON api_warnings
    FOR EACH ROW
    EXECUTE FUNCTION update_warning_stats();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_warning_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY warning_statistics;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-refresh statistics after significant changes
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only refresh if this is a new warning or significant count increase
    IF (TG_OP = 'INSERT') OR (NEW.count > OLD.count + 10) THEN
        PERFORM refresh_warning_statistics();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-refresh
DROP TRIGGER IF EXISTS trg_refresh_warning_stats ON api_warnings;
CREATE TRIGGER trg_refresh_warning_stats
    AFTER INSERT OR UPDATE ON api_warnings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_stats();

-- Function to clean expired warnings
CREATE OR REPLACE FUNCTION clean_expired_warnings()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_warnings 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Refresh statistics after cleanup
    PERFORM refresh_warning_statistics();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your database user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON api_warnings TO your_app_user;
-- GRANT SELECT, INSERT, DELETE ON warning_acknowledgments TO your_app_user;
-- GRANT SELECT ON warning_statistics TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON warning_aggregation_daily TO your_app_user;
-- GRANT EXECUTE ON FUNCTION clean_expired_warnings() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION refresh_warning_statistics() TO your_app_user;

-- Comments for documentation
COMMENT ON TABLE api_warnings IS 'Centralized API warning storage with deduplication and expiry management';
COMMENT ON TABLE warning_acknowledgments IS 'User acknowledgment tracking for warnings';
COMMENT ON MATERIALIZED VIEW warning_statistics IS 'Pre-computed warning statistics for dashboard performance';
COMMENT ON TABLE warning_aggregation_daily IS 'Daily aggregated warning statistics for historical analysis';

COMMENT ON COLUMN api_warnings.warning_id IS 'Unique identifier for each warning instance';
COMMENT ON COLUMN api_warnings.code IS 'Standardized warning code for categorization';
COMMENT ON COLUMN api_warnings.severity IS 'Warning severity: info, warning, error, critical';
COMMENT ON COLUMN api_warnings.category IS 'Warning category for grouping (e.g., authentication, database, external_api)';
COMMENT ON COLUMN api_warnings.count IS 'Number of times this warning has occurred (deduplication)';
COMMENT ON COLUMN api_warnings.expires_at IS 'Automatic expiry time for GDPR compliance and data retention';

-- Create indexes for full-text search on warning messages (if needed)
CREATE INDEX IF NOT EXISTS idx_api_warnings_message_fts 
    ON api_warnings USING gin(to_tsvector('english', message));

-- Create index for JSONB metadata queries
CREATE INDEX IF NOT EXISTS idx_api_warnings_metadata 
    ON api_warnings USING gin(metadata);

-- Successful migration completion marker
INSERT INTO migration_log (migration_name, executed_at, status)
VALUES ('api_warning_system', CURRENT_TIMESTAMP, 'success')
ON CONFLICT (migration_name) DO UPDATE SET 
    executed_at = CURRENT_TIMESTAMP, 
    status = 'success';