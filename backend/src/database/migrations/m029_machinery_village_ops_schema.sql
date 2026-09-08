-- Migration M029: Machinery, Equipment & Village Operations Schema
-- System 29 - Machinery, Equipment & Village Ops
-- Created: 2026-09-08
-- Description: Database schema for machinery management and village operations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MACHINERY MANAGEMENT TABLES
-- ============================================================================

-- Machinery assets table
CREATE TABLE IF NOT EXISTS machinery_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL, -- tractor, harvester, plow, cultivator, etc.
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  year_manufactured INTEGER,
  specifications JSONB,
  ownership_type VARCHAR(50) NOT NULL, -- individual, cooperative, village, rental
  village_id UUID,
  ai_classification JSONB,
  availability_status VARCHAR(50) DEFAULT 'available', -- available, in_use, maintenance, retired
  maintenance_schedule JSONB,
  registered_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Machinery maintenance table
CREATE TABLE IF NOT EXISTS machinery_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machinery_id UUID NOT NULL REFERENCES machinery_assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL, -- routine, repair, upgrade, inspection
  scheduled_date DATE NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  estimated_cost DECIMAL(15,2),
  required_parts JSONB,
  ai_predictive_analysis JSONB,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  completed_date DATE,
  actual_cost DECIMAL(15,2),
  notes TEXT,
  scheduled_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VILLAGE OPERATIONS TABLES
-- ============================================================================

-- Village operations table
CREATE TABLE IF NOT EXISTS village_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(100) NOT NULL, -- harvesting, planting, infrastructure, community
  village_id UUID NOT NULL,
  description TEXT,
  required_machinery JSONB,
  required_personnel JSONB,
  timeline JSONB,
  budget_estimate DECIMAL(15,2),
  ai_optimization JSONB,
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  start_date DATE,
  end_date DATE,
  actual_cost DECIMAL(15,2),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Village resource pools table
CREATE TABLE IF NOT EXISTS village_resource_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_name VARCHAR(255) NOT NULL,
  pool_type VARCHAR(100) NOT NULL, -- machinery, labor, equipment, tools
  village_id UUID NOT NULL,
  resource_categories TEXT[],
  sharing_rules JSONB,
  contribution_requirements JSONB,
  ai_sharing_optimization JSONB,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Village infrastructure table
CREATE TABLE IF NOT EXISTS village_infrastructure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  infrastructure_type VARCHAR(100) NOT NULL, -- road, irrigation, storage, power, communication
  village_id UUID NOT NULL,
  location JSONB NOT NULL,
  specifications JSONB,
  capacity DECIMAL(15,2),
  current_utilization DECIMAL(3,2), -- 0.00 to 1.00
  condition_status VARCHAR(50) DEFAULT 'good', -- excellent, good, fair, poor, critical
  ai_planning_recommendations JSONB,
  notes TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- EQUIPMENT EXCHANGE TABLES
-- ============================================================================

-- Equipment exchange listings table (extends existing equipment_exchange_listings)
CREATE TABLE IF NOT EXISTS equipment_exchange_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listed_by UUID NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100) NOT NULL,
  condition_grade VARCHAR(50) NOT NULL, -- excellent, good, fair, poor
  description TEXT,
  images JSONB,
  pricing_type VARCHAR(20) DEFAULT 'priced', -- free, priced
  price_inr DECIMAL(15,2),
  location_address TEXT,
  state_id UUID,
  status VARCHAR(50) DEFAULT 'available', -- available, reserved, exchanged, withdrawn
  reserved_by UUID,
  reserved_at TIMESTAMP,
  exchanged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Machinery asset indexes
CREATE INDEX IF NOT EXISTS idx_machinery_assets_type ON machinery_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_machinery_assets_village ON machinery_assets(village_id);
CREATE INDEX IF NOT EXISTS idx_machinery_assets_status ON machinery_assets(availability_status);
CREATE INDEX IF NOT EXISTS idx_machinery_assets_ownership ON machinery_assets(ownership_type);

-- Machinery maintenance indexes
CREATE INDEX IF NOT EXISTS idx_machinery_maintenance_machinery ON machinery_maintenance(machinery_id);
CREATE INDEX IF NOT EXISTS idx_machinery_maintenance_status ON machinery_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_machinery_maintenance_scheduled_date ON machinery_maintenance(scheduled_date);

-- Village operation indexes
CREATE INDEX IF NOT EXISTS idx_village_operations_village ON village_operations(village_id);
CREATE INDEX IF NOT EXISTS idx_village_operations_type ON village_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_village_operations_status ON village_operations(status);

-- Village resource pool indexes
CREATE INDEX IF NOT EXISTS idx_village_resource_pools_village ON village_resource_pools(village_id);
CREATE INDEX IF NOT EXISTS idx_village_resource_pools_type ON village_resource_pools(pool_type);
CREATE INDEX IF NOT EXISTS idx_village_resource_pools_status ON village_resource_pools(status);

-- Village infrastructure indexes
CREATE INDEX IF NOT EXISTS idx_village_infrastructure_village ON village_infrastructure(village_id);
CREATE INDEX IF NOT EXISTS idx_village_infrastructure_type ON village_infrastructure(infrastructure_type);
CREATE INDEX IF NOT EXISTS idx_village_infrastructure_condition ON village_infrastructure(condition_status);

-- Equipment exchange indexes
CREATE INDEX IF NOT EXISTS idx_equipment_exchange_listed_by ON equipment_exchange_listings(listed_by);
CREATE INDEX IF NOT EXISTS idx_equipment_exchange_type ON equipment_exchange_listings(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_exchange_status ON equipment_exchange_listings(status);
CREATE INDEX IF NOT EXISTS idx_equipment_exchange_state ON equipment_exchange_listings(state_id);

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

CREATE TRIGGER update_machinery_assets_updated_at BEFORE UPDATE ON machinery_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machinery_maintenance_updated_at BEFORE UPDATE ON machinery_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_village_operations_updated_at BEFORE UPDATE ON village_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_village_resource_pools_updated_at BEFORE UPDATE ON village_resource_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_village_infrastructure_updated_at BEFORE UPDATE ON village_infrastructure
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_exchange_listings_updated_at BEFORE UPDATE ON equipment_exchange_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE machinery_assets IS 'Machinery asset registry and management';
COMMENT ON TABLE machinery_maintenance IS 'Machinery maintenance scheduling and tracking';
COMMENT ON TABLE village_operations IS 'Village-level operations coordination';
COMMENT ON TABLE village_resource_pools IS 'Shared village resource pools';
COMMENT ON TABLE village_infrastructure IS 'Village infrastructure inventory';
COMMENT ON TABLE equipment_exchange_listings IS 'Second-use equipment exchange marketplace';