-- Migration M011: Water & Irrigation Management Schema
-- System 11 - Water & Irrigation Management
-- Created: 2026-09-08
-- Description: Database schema for water resource management and irrigation operations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- WATER MANAGEMENT TABLES
-- ============================================================================

-- Water budgets table
CREATE TABLE IF NOT EXISTS water_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_name VARCHAR(255) NOT NULL,
  source VARCHAR(100) NOT NULL, -- well, canal, rainwater, river, tank
  demand_liters DECIMAL(15,2) NOT NULL,
  supply_liters DECIMAL(15,2) NOT NULL,
  season VARCHAR(50) NOT NULL, -- kharif, rabi, summer, winter
  ai_optimization JSONB,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Water quality readings table
CREATE TABLE IF NOT EXISTS water_quality_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location VARCHAR(255) NOT NULL,
  parameter VARCHAR(100) NOT NULL, -- ph, turbidity, dissolved_oxygen, conductivity, etc.
  value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  reading_date DATE NOT NULL,
  ai_analysis JSONB,
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- IRRIGATION MANAGEMENT TABLES
-- ============================================================================

-- Irrigation schedules table
CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_name VARCHAR(255) NOT NULL,
  crop VARCHAR(100) NOT NULL,
  method VARCHAR(100) NOT NULL, -- drip, sprinkler, flood, subsurface
  frequency_days INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  water_source VARCHAR(100) NOT NULL,
  ai_timing_optimization JSONB,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Irrigation water sources table
CREATE TABLE IF NOT EXISTS irrigation_water_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- well, borewell, canal, tank, river
  capacity_liters DECIMAL(15,2),
  location JSONB,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Irrigation logs table
CREATE TABLE IF NOT EXISTS irrigation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES irrigation_schedules(id) ON DELETE SET NULL,
  field_name VARCHAR(255) NOT NULL,
  volume_liters DECIMAL(15,2),
  duration_minutes INTEGER,
  logged_at TIMESTAMP NOT NULL,
  ai_efficiency_analysis JSONB,
  notes TEXT,
  logged_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RAINWATER HARVESTING TABLES
-- ============================================================================

-- Rainwater harvesting structures table
CREATE TABLE IF NOT EXISTS rainwater_harvesting_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  structure_name VARCHAR(255) NOT NULL,
  structure_type VARCHAR(100) NOT NULL, -- tank, pond, check_dam, recharge_well
  village VARCHAR(255) NOT NULL,
  capacity_liters DECIMAL(15,2) NOT NULL,
  built_date DATE,
  ai_design_optimization JSONB,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WATERSHED MANAGEMENT TABLES
-- ============================================================================

-- Watersheds table
CREATE TABLE IF NOT EXISTS watersheds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  area_hectares DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, degraded, restored
  villages_covered TEXT[],
  ai_management_plan JSONB,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WATER ANALYTICS TABLES
-- ============================================================================

-- Water analytics records table
CREATE TABLE IF NOT EXISTS water_analytics_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric VARCHAR(100) NOT NULL, -- water_usage, efficiency, conservation, quality_index
  period VARCHAR(50) NOT NULL, -- daily, weekly, monthly, seasonal
  value DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  ai_insights JSONB,
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Water budget indexes
CREATE INDEX IF NOT EXISTS idx_water_budgets_season ON water_budgets(season);
CREATE INDEX IF NOT EXISTS idx_water_budgets_source ON water_budgets(source);
CREATE INDEX IF NOT EXISTS idx_water_budgets_created_by ON water_budgets(created_by);

-- Water quality indexes
CREATE INDEX IF NOT EXISTS idx_water_quality_location ON water_quality_readings(location);
CREATE INDEX IF NOT EXISTS idx_water_quality_parameter ON water_quality_readings(parameter);
CREATE INDEX IF NOT EXISTS idx_water_quality_date ON water_quality_readings(reading_date);

-- Irrigation schedule indexes
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_field ON irrigation_schedules(field_name);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_status ON irrigation_schedules(status);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_created_by ON irrigation_schedules(created_by);

-- Irrigation water source indexes
CREATE INDEX IF NOT EXISTS idx_irrigation_water_sources_type ON irrigation_water_sources(type);
CREATE INDEX IF NOT EXISTS idx_irrigation_water_sources_status ON irrigation_water_sources(status);

-- Irrigation log indexes
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_schedule ON irrigation_logs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_field ON irrigation_logs(field_name);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_logged_at ON irrigation_logs(logged_at);

-- Rainwater harvesting indexes
CREATE INDEX IF NOT EXISTS idx_rainwater_harvesting_type ON rainwater_harvesting_structures(structure_type);
CREATE INDEX IF NOT EXISTS idx_rainwater_harvesting_village ON rainwater_harvesting_structures(village);

-- Watershed indexes
CREATE INDEX IF NOT EXISTS idx_watersheds_status ON watersheds(status);
CREATE INDEX IF NOT EXISTS idx_watersheds_created_by ON watersheds(created_by);

-- Water analytics indexes
CREATE INDEX IF NOT EXISTS idx_water_analytics_metric ON water_analytics_records(metric);
CREATE INDEX IF NOT EXISTS idx_water_analytics_period ON water_analytics_records(period);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_water_budgets_updated_at BEFORE UPDATE ON water_budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_quality_readings_updated_at BEFORE UPDATE ON water_quality_readings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_schedules_updated_at BEFORE UPDATE ON irrigation_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_water_sources_updated_at BEFORE UPDATE ON irrigation_water_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irrigation_logs_updated_at BEFORE UPDATE ON irrigation_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rainwater_harvesting_structures_updated_at BEFORE UPDATE ON rainwater_harvesting_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watersheds_updated_at BEFORE UPDATE ON watersheds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_analytics_records_updated_at BEFORE UPDATE ON water_analytics_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE water_budgets IS 'Water budget planning and allocation';
COMMENT ON TABLE water_quality_readings IS 'Water quality monitoring and analysis';
COMMENT ON TABLE irrigation_schedules IS 'Irrigation scheduling and management';
COMMENT ON TABLE irrigation_water_sources IS 'Irrigation water source inventory';
COMMENT ON TABLE irrigation_logs IS 'Irrigation activity logging';
COMMENT ON TABLE rainwater_harvesting_structures IS 'Rainwater harvesting structure registry';
COMMENT ON TABLE watersheds IS 'Watershed management and conservation';
COMMENT ON TABLE water_analytics_records IS 'Water usage analytics and insights';