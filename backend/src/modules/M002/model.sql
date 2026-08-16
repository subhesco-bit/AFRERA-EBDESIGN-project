-- Platform Configuration Schema (M002)
-- Dynamic configuration management, feature flags, and settings

CREATE TABLE IF NOT EXISTS platform_configurations (
    config_id VARCHAR(50) PRIMARY KEY,
    config_key VARCHAR(200) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    description TEXT,
    encrypted BOOLEAN DEFAULT false,
    validation_rules JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_validation JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuration_history (
    history_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) REFERENCES platform_configurations(config_id),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(50),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_id VARCHAR(50) PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    percentage_rollout INTEGER DEFAULT 0,
    target_segments JSONB,
    dependencies JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuration_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(200) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    configurations JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment_configs (
    env_config_id VARCHAR(50) PRIMARY KEY,
    environment VARCHAR(50) UNIQUE NOT NULL,
    config_overrides JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_configurations_key ON platform_configurations(config_key);
CREATE INDEX idx_platform_configurations_environment ON platform_configurations(environment);
CREATE INDEX idx_platform_configurations_status ON platform_configurations(status);
CREATE INDEX idx_configuration_history_config ON configuration_history(config_id);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_environment_configs_env ON environment_configs(environment);
