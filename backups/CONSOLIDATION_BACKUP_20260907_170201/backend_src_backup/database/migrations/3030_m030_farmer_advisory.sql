-- Migration for Enhanced M030 Farmer Advisory
-- Farmer Domain
-- Version: 3030
-- Date: 2026-08-11

-- Farmer Advisories Table
CREATE TABLE IF NOT EXISTS farmer_advisories (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  advisory_type VARCHAR(50) NOT NULL, -- 'crop_recommendation', 'weather_advisory', 'market_advisory', 'pest_alert', 'government_scheme'
  content JSONB NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IoT Devices Table
CREATE TABLE IF NOT EXISTS iot_devices (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL, -- 'soil_sensor', 'weather_station', 'irrigation_controller', etc.
  location JSONB,
  capabilities JSONB,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(farmer_id, device_id)
);

-- Farmer Alerts Table
CREATE TABLE IF NOT EXISTS farmer_alerts (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'weather', 'pest', 'disease', 'market', 'system'
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  action_required TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_farmer_advisories_farmer_id ON farmer_advisories(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_advisories_type ON farmer_advisories(advisory_type);
CREATE INDEX IF NOT EXISTS idx_farmer_advisories_created_at ON farmer_advisories(created_at);
CREATE INDEX IF NOT EXISTS idx_iot_devices_farmer_id ON iot_devices(farmer_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_farmer_alerts_farmer_id ON farmer_alerts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_alerts_is_read ON farmer_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_farmer_alerts_created_at ON farmer_alerts(created_at);

COMMENT ON TABLE farmer_advisories IS 'AI-powered farmer advisory system';
COMMENT ON TABLE iot_devices IS 'IoT device registration for field monitoring';
COMMENT ON TABLE farmer_alerts IS 'Real-time alerts for farmers';