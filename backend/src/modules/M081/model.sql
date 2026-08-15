-- Data Visualization Dashboard Schema (M081)
-- Business Intelligence & Analytics Module

CREATE TABLE IF NOT EXISTS dashboards (
    dashboard_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL,
    description TEXT,
    layout_config JSONB,
    is_default BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    widget_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_name VARCHAR(200) NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    data_source VARCHAR(100),
    query_config JSONB,
    visualization_config JSONB,
    refresh_interval INTEGER DEFAULT 300,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_data_sources (
    source_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    source_name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    connection_config JSONB,
    query_template TEXT,
    refresh_schedule VARCHAR(50),
    last_refreshed TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_filters (
    filter_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    filter_name VARCHAR(200) NOT NULL,
    filter_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    default_value JSONB,
    filter_config JSONB,
    applies_to_widgets TEXT[],
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
    snapshot_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_data JSONB NOT NULL,
    filters_applied JSONB,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_shares (
    share_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    shared_with VARCHAR(50) NOT NULL,
    shared_by VARCHAR(50) NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'view',
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_usage_logs (
    log_id SERIAL PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES dashboards(dashboard_id) ON DELETE CASCADE,
    user_id VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    metadata JSONB,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboards_user ON dashboards(user_id);
CREATE INDEX idx_dashboards_type ON dashboards(dashboard_type);
CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_data_sources_dashboard ON dashboard_data_sources(dashboard_id);
CREATE INDEX idx_dashboard_filters_dashboard ON dashboard_filters(dashboard_id);
CREATE INDEX idx_dashboard_snapshots_dashboard ON dashboard_snapshots(dashboard_id);
CREATE INDEX idx_dashboard_shares_dashboard ON dashboard_shares(dashboard_id);
CREATE INDEX idx_dashboard_shares_with ON dashboard_shares(shared_with);
CREATE INDEX idx_dashboard_usage_logs_dashboard ON dashboard_usage_logs(dashboard_id);
CREATE INDEX idx_dashboard_usage_logs_user ON dashboard_usage_logs(user_id);
