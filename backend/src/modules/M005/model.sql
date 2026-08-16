-- Environment Management Schema (M005)
-- Environment configuration, staging, and deployment management

CREATE TABLE IF NOT EXISTS environments (
    env_id VARCHAR(50) PRIMARY KEY,
    env_name VARCHAR(200) NOT NULL,
    env_type VARCHAR(50) NOT NULL,
    deployment_strategy VARCHAR(50),
    infrastructure_config JSONB,
    database_config JSONB,
    security_config JSONB,
    monitoring_config JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_setup JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment_variables (
    var_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50) REFERENCES environments(env_id),
    var_name VARCHAR(200) NOT NULL,
    var_value TEXT NOT NULL,
    var_type VARCHAR(50) NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50) REFERENCES environments(env_id),
    deployment_type VARCHAR(50) NOT NULL,
    version VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50) REFERENCES environments(env_id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_environments_type ON environments(env_type);
CREATE INDEX idx_environments_status ON environments(status);
CREATE INDEX idx_environment_variables_env ON environment_variables(env_id);
CREATE INDEX idx_deployment_logs_env ON deployment_logs(env_id);
CREATE INDEX idx_environment_metrics_env ON environment_metrics(env_id);
