-- Folded from backend/src/modules/M003/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Tenant Management Schema (M003) / -- Multi-tenant architecture, tenant isolation, and resource management
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS tenant_users (
    user_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    user_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_usage_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_billing (
    billing_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    billing_period VARCHAR(20) NOT NULL,
    usage_summary JSONB NOT NULL,
    charges DECIMAL(15,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    invoice_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_settings (
    setting_id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50),
    setting_key VARCHAR(200) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_logs_tenant ON tenant_usage_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_logs_metric ON tenant_usage_logs(metric_type);

CREATE INDEX IF NOT EXISTS idx_tenant_billing_tenant ON tenant_billing(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
