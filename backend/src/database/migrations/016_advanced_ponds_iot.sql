-- Migration: Advanced Pond Management with IoT Integration (M132)
-- Created: August 12, 2026
-- Description: Create tables for IoT-integrated pond management with sensor networks

-- Ponds Table (Enhanced)
CREATE TABLE IF NOT EXISTS ponds (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10, 2), -- in square meters
    pond_type VARCHAR(50) NOT NULL, -- 'EARTHEN', 'CONCRETE', 'LINER', 'BIOFLOC'
    depth DECIMAL(10, 2), -- in meters
    water_source VARCHAR(50), -- 'WELL', 'CANAL', 'RAINWATER', 'TUBEWELL'
    capacity DECIMAL(10, 2), -- in cubic meters
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DRY'
    sensor_config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ponds
CREATE INDEX IF NOT EXISTS idx_ponds_farmer_id ON ponds(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ponds_pond_type ON ponds(pond_type);
CREATE INDEX IF NOT EXISTS idx_ponds_status ON ponds(status);

-- Pond Sensors Table
CREATE TABLE IF NOT EXISTS pond_sensors (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL, -- 'PH', 'TEMPERATURE', 'DISSOLVED_OXYGEN', 'TURBIDITY', 'AMMONIA', 'LEVEL'
    device_id VARCHAR(100) NOT NULL,
    sensor_id VARCHAR(100) NOT NULL UNIQUE,
    calibration JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'CALIBRATING', 'FAULTY'
    last_seen TIMESTAMP,
    battery_level INTEGER,
    signal_strength INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pond_sensors
CREATE INDEX IF NOT EXISTS idx_pond_sensors_pond_id ON pond_sensors(pond_id);
CREATE INDEX IF NOT EXISTS idx_pond_sensors_sensor_type ON pond_sensors(sensor_type);
CREATE INDEX IF NOT EXISTS idx_pond_sensors_device_id ON pond_sensors(device_id);
CREATE INDEX IF NOT EXISTS idx_pond_sensors_status ON pond_sensors(status);

-- Pond Sensor Readings Table
CREATE TABLE IF NOT EXISTS pond_sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL REFERENCES pond_sensors(id) ON DELETE CASCADE,
    reading_time TIMESTAMP NOT NULL,
    ph DECIMAL(4, 2),
    temperature DECIMAL(4, 2),
    dissolved_oxygen DECIMAL(4, 2),
    turbidity DECIMAL(10, 2),
    ammonia DECIMAL(4, 2),
    water_level DECIMAL(10, 2),
    conductivity DECIMAL(10, 2),
    salinity DECIMAL(4, 2),
    raw_data JSONB DEFAULT '{}',
    quality_score DECIMAL(3, 2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pond_sensor_readings
CREATE INDEX IF NOT EXISTS idx_pond_sensor_readings_sensor_id ON pond_sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_pond_sensor_readings_reading_time ON pond_sensor_readings(reading_time);
CREATE INDEX IF NOT EXISTS idx_pond_sensor_readings_quality_score ON pond_sensor_readings(quality_score);

-- Pond Health Index Table
CREATE TABLE IF NOT EXISTS pond_health_index (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    health_score INTEGER, -- 0-100
    health_status VARCHAR(20), -- 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
    ph_score INTEGER,
    temperature_score INTEGER,
    oxygen_score INTEGER,
    turbidity_score INTEGER,
    overall_rating DECIMAL(3, 2),
    recommendations JSONB DEFAULT '[]',
    alerts JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pond_health_index
CREATE INDEX IF NOT EXISTS idx_pond_health_index_pond_id ON pond_health_index(pond_id);
CREATE INDEX IF NOT EXISTS idx_pond_health_index_measurement_date ON pond_health_index(measurement_date);
CREATE INDEX IF NOT EXISTS idx_pond_health_index_health_status ON pond_health_index(health_status);

-- Pond AI Insights Table
CREATE TABLE IF NOT EXISTS pond_ai_insights (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    insight_date TIMESTAMP NOT NULL,
    insight_type VARCHAR(50) NOT NULL, -- 'GROWTH_POTENTIAL', 'FEED_OPTIMIZATION', 'DISEASE_RISK', 'HARVEST_PREDICTION'
    confidence DECIMAL(3, 2),
    predictions JSONB NOT NULL,
    actual_outcomes JSONB DEFAULT '{}',
    accuracy_tracking JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pond_ai_insights
CREATE INDEX IF NOT EXISTS idx_pond_ai_insights_pond_id ON pond_ai_insights(pond_id);
CREATE INDEX IF NOT EXISTS idx_pond_ai_insights_insight_type ON pond_ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_pond_ai_insights_insight_date ON pond_ai_insights(insight_date);

-- Pond Alerts Table
CREATE TABLE IF NOT EXISTS pond_alerts (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'PH', 'TEMPERATURE', 'OXYGEN', 'TURBIDITY', 'SENSOR_FAULT', 'CONNECTIVITY'
    severity VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'
    message TEXT NOT NULL,
    value DECIMAL(10, 2),
    threshold DECIMAL(10, 2),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for pond_alerts
CREATE INDEX IF NOT EXISTS idx_pond_alerts_pond_id ON pond_alerts(pond_id);
CREATE INDEX IF NOT EXISTS idx_pond_alerts_alert_type ON pond_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_pond_alerts_severity ON pond_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_pond_alerts_resolved ON pond_alerts(resolved);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pond_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_ponds_updated_at
    BEFORE UPDATE ON ponds
    FOR EACH ROW
    EXECUTE FUNCTION update_pond_updated_at();

CREATE TRIGGER trigger_pond_sensors_updated_at
    BEFORE UPDATE ON pond_sensors
    FOR EACH ROW
    EXECUTE FUNCTION update_pond_updated_at();

-- Function to generate health index automatically
CREATE OR REPLACE FUNCTION generate_pond_health_index()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called periodically to calculate health index
    -- For now, it's a placeholder
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create alerts from sensor readings
CREATE OR REPLACE FUNCTION create_sensor_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Create alerts based on sensor readings
    IF NEW.ph < 6.5 OR NEW.ph > 8.5 THEN
        INSERT INTO pond_alerts (pond_id, alert_type, severity, message, value, threshold)
        SELECT ps.pond_id, 'PH', 'WARNING', 'pH level outside optimal range', NEW.ph, 7.0
        FROM pond_sensors ps WHERE ps.id = NEW.sensor_id;
    END IF;
    
    IF NEW.temperature > 32 THEN
        INSERT INTO pond_alerts (pond_id, alert_type, severity, message, value, threshold)
        SELECT ps.pond_id, 'TEMPERATURE', 'CRITICAL', 'High temperature detected', NEW.temperature, 30.0
        FROM pond_sensors ps WHERE ps.id = NEW.sensor_id;
    END IF;
    
    IF NEW.dissolved_oxygen < 5 THEN
        INSERT INTO pond_alerts (pond_id, alert_type, severity, message, value, threshold)
        SELECT ps.pond_id, 'OXYGEN', 'WARNING', 'Low dissolved oxygen', NEW.dissolved_oxygen, 5.0
        FROM pond_sensors ps WHERE ps.id = NEW.sensor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create alerts on sensor readings
CREATE TRIGGER trigger_create_sensor_alerts
    AFTER INSERT ON pond_sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION create_sensor_alerts();

-- 2026-08-30: removed a fabricated sample-sensor INSERT that used a bare
-- pond_id of 1 - fails its own FK constraint (pond_sensors_pond_id_fkey) on
-- any real database, since no pond with id=1 is ever created by this
-- migration or seeded elsewhere. Caught by the same real npm run migrate CI
-- gate as the horticulture/roles fixes in prior commits.

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ponds TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pond_sensors TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pond_sensor_readings TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pond_health_index TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pond_ai_insights TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON pond_alerts TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE ponds_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE pond_sensors_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE pond_sensor_readings_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE pond_health_index_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE pond_ai_insights_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE pond_alerts_id_seq TO your_app_user;