-- Schema for M106 Preventive Maintenance backing
-- backend/src/services/preventiveMaintenanceService.js. Columns match the
-- ResourceManager `fields` already shipped on the "preventive" tab of
-- MachineryManagementPage.jsx - taken directly from that UI, not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS preventive_maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name VARCHAR(200) NOT NULL,
    maintenance_type VARCHAR(100),
    scheduled_date DATE,
    completed_date DATE,
    technician VARCHAR(200),
    cost NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_records_status ON preventive_maintenance_records(status);
