-- FK TYPE FIX 2026-08-04: 10 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Logistics Enhancements Migration
-- Fleet Management, Real-time Tracking, Temperature Monitoring, and Warehouse Integration

-- Fleet Vehicles Table
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  capacity DECIMAL(10, 2),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  driver_id UUID REFERENCES users(id),
  features JSONB DEFAULT '[]',
  current_location JSONB,
  mileage DECIMAL(10, 2),
  fuel_level DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive', 'retired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_type ON fleet_vehicles(type);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_driver_id ON fleet_vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);

-- Vehicle Maintenance Table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES fleet_vehicles(id),
  type VARCHAR(50) NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  description TEXT,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  performed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_status ON vehicle_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_scheduled_date ON vehicle_maintenance(scheduled_date);

-- Shipment Tracking Table
CREATE TABLE IF NOT EXISTS shipment_tracking (
  id SERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  timestamp TIMESTAMP NOT NULL,
  status VARCHAR(50),
  accuracy DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: shipment_tracking is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5, 2);
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2);
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS speed DECIMAL(6, 2);

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_timestamp ON shipment_tracking(timestamp);

-- Shipment Geofences Table
CREATE TABLE IF NOT EXISTS shipment_geofences (
  id SERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL UNIQUE REFERENCES shipments(id),
  type VARCHAR(50) NOT NULL,
  radius DECIMAL(10, 2),
  coordinates JSONB NOT NULL,
  alert_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_geofences_shipment_id ON shipment_geofences(shipment_id);

-- Temperature Readings Table
CREATE TABLE IF NOT EXISTS temperature_readings (
  id SERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  sensor_id VARCHAR(100) NOT NULL,
  temperature DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2),
  timestamp TIMESTAMP NOT NULL,
  zone VARCHAR(50),
  battery_level DECIMAL(5, 2),
  signal_strength INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_shipment_id ON temperature_readings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_timestamp ON temperature_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_sensor_id ON temperature_readings(sensor_id);

-- Temperature Alerts Table
CREATE TABLE IF NOT EXISTS temperature_alerts (
  id SERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  min_temp DECIMAL(5, 2),
  max_temp DECIMAL(5, 2),
  min_humidity DECIMAL(5, 2),
  max_humidity DECIMAL(5, 2),
  alert_channels JSONB DEFAULT '[]',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shipment_id)
);

CREATE INDEX IF NOT EXISTS idx_temperature_alerts_shipment_id ON temperature_alerts(shipment_id);

-- Temperature Alert Log Table
CREATE TABLE IF NOT EXISTS temperature_alert_log (
  id SERIAL PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  alert_id INTEGER REFERENCES temperature_alerts(id),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  triggered_at TIMESTAMP NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  notified BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_temperature_alert_log_shipment_id ON temperature_alert_log(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_alert_log_triggered_at ON temperature_alert_log(triggered_at);

-- Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location JSONB NOT NULL,
  type VARCHAR(50) NOT NULL,
  capacity DECIMAL(15, 2),
  zones JSONB DEFAULT '[]',
  features JSONB DEFAULT '[]',
  temperature_controlled BOOLEAN DEFAULT false,
  humidity_controlled BOOLEAN DEFAULT false,
  security_level VARCHAR(50) DEFAULT 'standard',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);
CREATE INDEX IF NOT EXISTS idx_warehouses_manager_id ON warehouses(manager_id);

-- Warehouse Inventory Table
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(12, 2) NOT NULL,
  zone VARCHAR(50),
  location VARCHAR(100),
  expiry_date DATE,
  batch_number VARCHAR(100),
  quality_grade VARCHAR(50),
  last_counted DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warehouse_id, product_id, location)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse_id ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product_id ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_zone ON warehouse_inventory(zone);

-- Warehouse Shipments Table
CREATE TABLE IF NOT EXISTS warehouse_shipments (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('inbound', 'outbound', 'transfer')),
  items JSONB NOT NULL,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'cancelled')),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_warehouse_id ON warehouse_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_type ON warehouse_shipments(type);
CREATE INDEX IF NOT EXISTS idx_warehouse_shipments_status ON warehouse_shipments(status);

-- Audit triggers
DROP TRIGGER IF EXISTS update_fleet_vehicles_updated_at ON fleet_vehicles;
CREATE TRIGGER update_fleet_vehicles_updated_at BEFORE UPDATE ON fleet_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_maintenance_updated_at ON vehicle_maintenance;
CREATE TRIGGER update_vehicle_maintenance_updated_at BEFORE UPDATE ON vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipment_geofences_updated_at ON shipment_geofences;
CREATE TRIGGER update_shipment_geofences_updated_at BEFORE UPDATE ON shipment_geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_temperature_alerts_updated_at ON temperature_alerts;
CREATE TRIGGER update_temperature_alerts_updated_at BEFORE UPDATE ON temperature_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_inventory_updated_at ON warehouse_inventory;
CREATE TRIGGER update_warehouse_inventory_updated_at BEFORE UPDATE ON warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_shipments_updated_at ON warehouse_shipments;
CREATE TRIGGER update_warehouse_shipments_updated_at BEFORE UPDATE ON warehouse_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically expire old tracking data
CREATE OR REPLACE FUNCTION cleanup_old_tracking_data()
RETURNS void AS $$
BEGIN
  DELETE FROM shipment_tracking
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM temperature_readings
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE fleet_vehicles IS 'Stores fleet vehicle information';
COMMENT ON TABLE vehicle_maintenance IS 'Stores vehicle maintenance records';
COMMENT ON TABLE shipment_tracking IS 'Stores real-time shipment tracking data';
COMMENT ON TABLE shipment_geofences IS 'Stores geofence configurations for shipments';
COMMENT ON TABLE temperature_readings IS 'Stores temperature and humidity readings';
COMMENT ON TABLE temperature_alerts IS 'Stores temperature alert configurations';
COMMENT ON TABLE temperature_alert_log IS 'Stores triggered temperature alerts';
COMMENT ON TABLE warehouses IS 'Stores warehouse information';
COMMENT ON TABLE warehouse_inventory IS 'Stores warehouse inventory levels';
COMMENT ON TABLE warehouse_shipments IS 'Stores warehouse shipment records';
