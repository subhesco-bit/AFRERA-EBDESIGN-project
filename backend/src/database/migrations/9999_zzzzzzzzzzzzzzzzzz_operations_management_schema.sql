-- Schema for the 8 Operations-domain CRUD resources backing
-- backend/src/services/operationsManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/OperationsManagementPage.jsx - taken directly from
-- that UI, not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS farm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_name VARCHAR(200) NOT NULL,
    plot VARCHAR(200),
    activity_type VARCHAR(30) NOT NULL DEFAULT 'Ploughing',
    scheduled_date DATE,
    completed_date DATE,
    assigned_to VARCHAR(200),
    status VARCHAR(20) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farm_activities_status ON farm_activities(status);

CREATE TABLE IF NOT EXISTS farm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'Medium',
    assigned_to VARCHAR(200),
    status VARCHAR(20) DEFAULT 'To Do',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farm_tasks_status ON farm_tasks(status);

CREATE TABLE IF NOT EXISTS contractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_name VARCHAR(200) NOT NULL,
    service_type VARCHAR(120) NOT NULL,
    contact_number VARCHAR(32),
    contract_start DATE,
    contract_end DATE,
    rate NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);

CREATE TABLE IF NOT EXISTS machinery_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_name VARCHAR(200) NOT NULL,
    operation_type VARCHAR(120) NOT NULL,
    operator_name VARCHAR(200),
    field_plot VARCHAR(200),
    operation_date DATE,
    hours_used NUMERIC(8,2),
    fuel_consumed_l NUMERIC(8,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name VARCHAR(200) NOT NULL,
    scheduled_by VARCHAR(200),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_schedules_status ON equipment_schedules(status);

CREATE TABLE IF NOT EXISTS input_consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    input_name VARCHAR(200) NOT NULL,
    input_type VARCHAR(30) NOT NULL DEFAULT 'Seed',
    quantity_used NUMERIC(12,2),
    unit VARCHAR(20),
    field_plot VARCHAR(200),
    consumption_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farm_productivity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(200) NOT NULL,
    plot VARCHAR(200),
    value NUMERIC(14,2),
    unit VARCHAR(30),
    period VARCHAR(50),
    benchmark NUMERIC(14,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farm_operations_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name VARCHAR(200) NOT NULL,
    value NUMERIC(14,2),
    target NUMERIC(14,2),
    period VARCHAR(50),
    trend VARCHAR(10) DEFAULT 'Stable',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
