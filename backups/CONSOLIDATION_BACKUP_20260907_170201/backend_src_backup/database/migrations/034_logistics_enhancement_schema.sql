-- Logistics Enhancement Database Schema
-- CAP-XXX: Fleet Management, Real-time Tracking, Temperature Monitoring, Warehouse Integration

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- FLEET VEHICLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS fleet_vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    capacity DECIMAL(10,2),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    driver_id INTEGER,
    features JSONB,
    status VARCHAR(50) DEFAULT 'active',
    current_location JSONB,
    mileage DECIMAL(15,2),
    fuel_level DECIMAL(5,2),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: fleet_vehicles is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_type ON fleet_vehicles(type);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_registration ON fleet_vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_driver ON fleet_vehicles(driver_id);

-- ============================================================================
-- VEHICLE MAINTENANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    description TEXT,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    priority VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled',
    performed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: vehicle_maintenance is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE vehicle_maintenance ADD COLUMN IF NOT EXISTS actual_date DATE;

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_status ON vehicle_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_date ON vehicle_maintenance(scheduled_date);

-- ============================================================================
-- SHIPMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipment_tracking (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    speed DECIMAL(10,2),
    heading DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    altitude DECIMAL(10,2),
    accuracy DECIMAL(10,2),
    battery_level DECIMAL(5,2),
    signal_strength INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: shipment_tracking is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS altitude DECIMAL(10,2);
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS battery_level DECIMAL(5,2);
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS signal_strength INTEGER;

CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment ON shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_timestamp ON shipment_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_status ON shipment_tracking(status);

-- ============================================================================
-- SHIPMENT GEOFENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS shipment_geofences (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    radius DECIMAL(10,2),
    coordinates JSONB NOT NULL,
    alert_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipment_geofences_shipment ON shipment_geofences(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_geofences_type ON shipment_geofences(type);

-- ============================================================================
-- TEMPERATURE READINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS temperature_readings (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    sensor_id VARCHAR(100),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    zone VARCHAR(50),
    battery_level DECIMAL(5,2),
    sensor_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: temperature_readings is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS sensor_status VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_temperature_readings_shipment ON temperature_readings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_timestamp ON temperature_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_sensor ON temperature_readings(sensor_id);

-- ============================================================================
-- TEMPERATURE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS temperature_alerts (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    sensor_id VARCHAR(100),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50),
    temperature DECIMAL(5,2),
    threshold DECIMAL(5,2),
    duration_minutes INTEGER,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    resolution_notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: temperature_alerts is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS alert_type VARCHAR(50);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolved_by INTEGER;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(100);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(50);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS temperature DECIMAL(5,2);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS threshold DECIMAL(5,2);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_temperature_alerts_shipment ON temperature_alerts(shipment_id);
CREATE INDEX IF NOT EXISTS idx_temperature_alerts_status ON temperature_alerts(status);
CREATE INDEX IF NOT EXISTS idx_temperature_alerts_severity ON temperature_alerts(severity);

-- ============================================================================
-- WAREHOUSE LOCATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_type VARCHAR(50),
    zone VARCHAR(50),
    aisle VARCHAR(50),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    capacity DECIMAL(10,2),
    current_occupancy DECIMAL(10,2),
    temperature_controlled BOOLEAN DEFAULT false,
    temperature_range JSONB,
    humidity_controlled BOOLEAN DEFAULT false,
    accessibility VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse ON warehouse_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_code ON warehouse_locations(location_code);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_zone ON warehouse_locations(zone);
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_status ON warehouse_locations(status);

-- ============================================================================
-- WAREHOUSE INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    location_id INTEGER REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    product_id INTEGER,
    batch_number VARCHAR(100),
    quantity DECIMAL(15,2),
    unit VARCHAR(50),
    expiry_date DATE,
    received_date DATE,
    last_count_date DATE,
    status VARCHAR(50) DEFAULT 'in_stock',
    quality_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: warehouse_inventory is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS last_count_date DATE;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS quality_status VARCHAR(50);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_location ON warehouse_inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_batch ON warehouse_inventory(batch_number);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_status ON warehouse_inventory(status);

-- ============================================================================
-- INVENTORY MOVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    inventory_id INTEGER REFERENCES warehouse_inventory(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL,
    from_location_id INTEGER REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    to_location_id INTEGER REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    quantity DECIMAL(15,2),
    unit VARCHAR(50),
    reason VARCHAR(255),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    performed_by INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);

-- ============================================================================
-- WAREHOUSE PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouse_performance (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL,
    performance_date DATE NOT NULL,
    total_inbound_shipments INTEGER,
    total_outbound_shipments INTEGER,
    average_processing_time_hours DECIMAL(10,2),
    inventory_accuracy DECIMAL(5,4),
    space_utilization DECIMAL(5,4),
    labor_efficiency DECIMAL(5,4),
    order_fulfillment_rate DECIMAL(5,4),
    damaged_items INTEGER,
    lost_items INTEGER,
    returned_items INTEGER,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_performance_warehouse ON warehouse_performance(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_performance_date ON warehouse_performance(performance_date);

-- ============================================================================
-- ROUTE OPTIMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_optimization (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255),
    route_type VARCHAR(50),
    origin JSONB NOT NULL,
    destination JSONB NOT NULL,
    waypoints JSONB,
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    fuel_consumption_liters DECIMAL(10,2),
    traffic_conditions JSONB,
    weather_conditions JSONB,
    optimization_score DECIMAL(5,4),
    alternative_routes JSONB,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_route_optimization_type ON route_optimization(route_type);
CREATE INDEX IF NOT EXISTS idx_route_optimization_date ON route_optimization(created_at);

-- ============================================================================
-- DELIVERY SCHEDULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_schedules (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER NOT NULL,
    vehicle_id INTEGER REFERENCES fleet_vehicles(id) ON DELETE SET NULL,
    route_id INTEGER REFERENCES route_optimization(id) ON DELETE SET NULL,
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    driver_id INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    delay_minutes INTEGER,
    delay_reason TEXT,
    delivery_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_schedules_shipment ON delivery_schedules(shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_vehicle ON delivery_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_status ON delivery_schedules(status);
CREATE INDEX IF NOT EXISTS idx_delivery_schedules_date ON delivery_schedules(scheduled_start);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_fleet_vehicles_updated_at ON fleet_vehicles;
CREATE TRIGGER update_fleet_vehicles_updated_at BEFORE UPDATE ON fleet_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_maintenance_updated_at ON vehicle_maintenance;
CREATE TRIGGER update_vehicle_maintenance_updated_at BEFORE UPDATE ON vehicle_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipment_geofences_updated_at ON shipment_geofences;
CREATE TRIGGER update_shipment_geofences_updated_at BEFORE UPDATE ON shipment_geofences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_locations_updated_at ON warehouse_locations;
CREATE TRIGGER update_warehouse_locations_updated_at BEFORE UPDATE ON warehouse_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_inventory_updated_at ON warehouse_inventory;
CREATE TRIGGER update_warehouse_inventory_updated_at BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_schedules_updated_at ON delivery_schedules;
CREATE TRIGGER update_delivery_schedules_updated_at BEFORE UPDATE ON delivery_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for vehicle status summary
CREATE OR REPLACE VIEW vehicle_status_summary AS
SELECT 
    fv.*,
    COUNT(vm.id) as maintenance_count,
    MAX(vm.scheduled_date) as next_maintenance,
    COUNT(DISTINCT ds.id) as active_deliveries
FROM fleet_vehicles fv
LEFT JOIN vehicle_maintenance vm ON fv.id = vm.vehicle_id AND vm.status = 'scheduled'
LEFT JOIN delivery_schedules ds ON fv.id = ds.vehicle_id AND ds.status = 'in_progress'
GROUP BY fv.id;

-- View for temperature summary by shipment
CREATE OR REPLACE VIEW shipment_temperature_summary AS
SELECT 
    shipment_id,
    COUNT(*) as reading_count,
    AVG(temperature) as avg_temperature,
    MIN(temperature) as min_temperature,
    MAX(temperature) as max_temperature,
    AVG(humidity) as avg_humidity,
    MIN(timestamp) as first_reading,
    MAX(timestamp) as last_reading
FROM temperature_readings
GROUP BY shipment_id;

-- View for warehouse capacity utilization
CREATE OR REPLACE VIEW warehouse_capacity_utilization AS
SELECT 
    wl.warehouse_id,
    COUNT(*) as total_locations,
    SUM(CASE WHEN wl.status = 'active' THEN 1 ELSE 0 END) as active_locations,
    SUM(wl.capacity) as total_capacity,
    SUM(wl.current_occupancy) as total_occupancy,
    CASE 
        WHEN SUM(wl.capacity) > 0 
        THEN (SUM(wl.current_occupancy) / SUM(wl.capacity)) * 100 
        ELSE 0 
    END as utilization_percentage
FROM warehouse_locations wl
GROUP BY wl.warehouse_id;
