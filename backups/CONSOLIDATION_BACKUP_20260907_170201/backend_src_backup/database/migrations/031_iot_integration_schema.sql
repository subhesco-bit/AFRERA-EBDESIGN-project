-- FK TYPE FIX 2026-08-04: 4 column(s) declared UUID while referencing
-- iot_devices(id), which is SERIAL. iot_devices is defined in BOTH
-- 015_advanced_features.sql (SERIAL, runs first and therefore wins) and in
-- this file (UUID). Because CREATE TABLE IF NOT EXISTS makes the second
-- definition a no-op, the real column is INTEGER — so these FKs could never
-- be created, and every table carrying them failed with it.

-- IoT Integration Platform Database Schema
-- Manages IoT devices, sensor data, and real-time monitoring

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- IOT DEVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'sensor', 'actuator', 'gateway', 'controller'
    device_category VARCHAR(50), -- 'temperature', 'humidity', 'soil', 'gps', 'camera'
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    firmware_version VARCHAR(50),
    location_id UUID REFERENCES addresses(id),
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'offline'
    last_seen TIMESTAMP,
    battery_level INTEGER, -- 0-100
    signal_strength INTEGER, -- 0-100
    device_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: iot_devices is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS device_category VARCHAR(50);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS device_config JSONB;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS signal_strength INTEGER;

CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_type ON iot_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_assigned ON iot_devices(assigned_to);

-- ============================================================================
-- SENSOR DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id INTEGER REFERENCES iot_devices(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'soil_moisture', 'ph', 'light', 'gps'
    sensor_value DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(20), -- 'C', '%', 'ppm', 'pH', 'lux'
    reading_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location_id UUID REFERENCES addresses(id),
    quality_score DECIMAL(5, 2), -- Data quality indicator
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score DECIMAL(5, 2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_data_device ON sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_data_type ON sensor_data(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(reading_timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_anomaly ON sensor_data(is_anomaly);

-- ============================================================================
-- DEVICE COMMANDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id INTEGER REFERENCES iot_devices(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, -- 'configure', 'calibrate', 'reset', 'update_firmware'
    command_payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'acknowledged', 'completed', 'failed'
    sent_by UUID REFERENCES users(id),
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_commands_device ON device_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_device_commands_status ON device_commands(status);

-- ============================================================================
-- DEVICE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id INTEGER REFERENCES iot_devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'offline', 'low_battery', 'anomaly', 'malfunction', 'threshold_breach'
    alert_severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    alert_message TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}',
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_alerts_device ON device_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alerts_acknowledged ON device_alerts(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_device_alerts_severity ON device_alerts(alert_severity);

-- ============================================================================
-- DEVICE GROUPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) UNIQUE NOT NULL,
    group_description TEXT,
    group_type VARCHAR(50), -- 'farm', 'warehouse', 'greenhouse', 'transport'
    location_id UUID REFERENCES addresses(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES iot_devices(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, device_id)
);

-- ============================================================================
-- IOT ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS iot_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_devices INTEGER DEFAULT 0,
    active_devices INTEGER DEFAULT 0,
    offline_devices INTEGER DEFAULT 0,
    total_sensor_readings INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0,
    alert_count INTEGER DEFAULT 0,
    average_signal_strength DECIMAL(5, 2),
    average_battery_level DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_iot_analytics_date ON iot_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check device health
CREATE OR REPLACE FUNCTION check_device_health(device_id UUID)
RETURNS JSONB AS $$
DECLARE
    last_reading TIMESTAMP;
    is_offline BOOLEAN;
    health_status VARCHAR(20);
    result JSONB;
BEGIN
    SELECT MAX(reading_timestamp) INTO last_reading
    FROM sensor_data
    WHERE device_id = device_id;
    
    -- Consider device offline if no reading in last hour
    is_offline := (last_reading IS NULL) OR (last_reading < CURRENT_TIMESTAMP - INTERVAL '1 hour');
    
    IF is_offline THEN
        health_status := 'offline';
    ELSE
        health_status := 'healthy';
    END IF;
    
    result := jsonb_build_object(
        'device_id', device_id,
        'health_status', health_status,
        'last_reading', last_reading,
        'checked_at', CURRENT_TIMESTAMP
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_iot_devices_updated_at ON iot_devices;
CREATE TRIGGER update_iot_devices_updated_at BEFORE UPDATE ON iot_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
