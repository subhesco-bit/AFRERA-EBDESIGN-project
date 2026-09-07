-- Folded from backend/src/modules/M051/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- FPO Registration Schema (M051) / -- Farmer Producer Organization registration and management
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS fpo_memberships (
    membership_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50),
    farmer_id VARCHAR(50) NOT NULL,
    membership_date DATE NOT NULL,
    shareholding DECIMAL(15,2) DEFAULT 0,
    role VARCHAR(50) DEFAULT 'MEMBER',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_financial_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50),
    transaction_type VARCHAR(20) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    reference_id VARCHAR(50),
    metadata JSONB,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_performance_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    fpo_id VARCHAR(50),
    report_type VARCHAR(50) DEFAULT 'performance',
    fpo_summary JSONB,
    financial_summary JSONB,
    membership_summary JSONB,
    performance_metrics JSONB,
    recommendations JSONB,
    benchmark_comparison JSONB,
    growth_opportunities JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fpo_memberships_fpo ON fpo_memberships(fpo_id);

CREATE INDEX IF NOT EXISTS idx_fpo_memberships_farmer ON fpo_memberships(farmer_id);

CREATE INDEX IF NOT EXISTS idx_fpo_financial_transactions_fpo ON fpo_financial_transactions(fpo_id);

CREATE INDEX IF NOT EXISTS idx_fpo_financial_transactions_date ON fpo_financial_transactions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_fpo_performance_reports_fpo ON fpo_performance_reports(fpo_id);
