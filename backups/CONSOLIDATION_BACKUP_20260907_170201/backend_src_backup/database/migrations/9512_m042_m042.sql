-- Folded from backend/src/modules/M042/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Equipment Inventory Schema (M042) / -- Farm equipment inventory management with AI-powered maintenance prediction
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS equipment_usage_log (
    usage_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    usage_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_used DECIMAL(5,2),
    task_performed VARCHAR(200),
    location VARCHAR(200),
    fuel_consumed DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_log_equipment ON equipment_usage_log(equipment_id);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_log_date ON equipment_usage_log(usage_date);
