-- Folded from backend/src/modules/M105/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Fleet Management Schema (M105) / -- Comprehensive fleet operations, dispatch optimization, and resource allocation
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS fleet_dispatches (
    dispatch_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50),
    driver_id VARCHAR(50),
    route_id VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    cargo_details JSONB,
    destination VARCHAR(200),
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'scheduled',
    ai_optimization JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fleet_routes (
    route_id VARCHAR(50) PRIMARY KEY,
    route_name VARCHAR(200),
    start_location VARCHAR(200),
    end_location VARCHAR(200),
    distance_km DECIMAL(10,2),
    estimated_time_minutes INTEGER,
    waypoints JSONB,
    traffic_patterns JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fleet_maintenance_records (
    record_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    odometer_reading INTEGER,
    cost DECIMAL(10,2),
    service_center VARCHAR(200),
    next_service_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fleet_fuel_logs (
    fuel_log_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50),
    fuel_date DATE NOT NULL,
    fuel_quantity DECIMAL(10,2),
    fuel_cost DECIMAL(10,2),
    fueling_station VARCHAR(200),
    odometer_reading INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fleet_dispatches_vehicle ON fleet_dispatches(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_fleet_dispatches_driver ON fleet_dispatches(driver_id);

CREATE INDEX IF NOT EXISTS idx_fleet_dispatches_dates ON fleet_dispatches(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_fleet_dispatches_status ON fleet_dispatches(status);

CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_vehicle ON fleet_maintenance_records(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_date ON fleet_maintenance_records(service_date);

CREATE INDEX IF NOT EXISTS idx_fleet_fuel_vehicle ON fleet_fuel_logs(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_fleet_fuel_date ON fleet_fuel_logs(fuel_date);
