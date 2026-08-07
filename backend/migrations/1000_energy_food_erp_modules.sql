/**
 * Database Migration: Energy, Food, and ERP Module Schemas
 * Migration Version: 1000_energy_food_erp_modules.sql
 * Date: 2026-08-05
 * Status: Ready for execution
 */

-- ============================================================================
-- ENERGY MODULE SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS energy_cost_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL,
  grid_tariff_per_unit DECIMAL(10, 4) NOT NULL,
  diesel_cost_per_liter DECIMAL(10, 4) NOT NULL,
  avg_outage_hours_annually INT DEFAULT 0,
  solar_irradiation DECIMAL(8, 4),
  biomass_available BOOLEAN DEFAULT FALSE,
  biogas_available BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(village_id),
  CONSTRAINT valid_tariff CHECK (grid_tariff_per_unit > 0),
  CONSTRAINT valid_diesel_cost CHECK (diesel_cost_per_liter > 0)
);

CREATE TABLE IF NOT EXISTS energy_stack_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL,
  grid_percentage INT CHECK (grid_percentage >= 0 AND grid_percentage <= 100),
  solar_percentage INT CHECK (solar_percentage >= 0 AND solar_percentage <= 100),
  battery_capacity_kwh DECIMAL(12, 2),
  biogas_percentage INT DEFAULT 0,
  biomass_percentage INT DEFAULT 0,
  estimated_lifetime_cost DECIMAL(18, 2),
  capex_cost DECIMAL(18, 2),
  annual_opex_cost DECIMAL(15, 2),
  reliability_score DECIMAL(5, 2),
  configuration_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'PROPOSED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT percentage_sum CHECK (
    (grid_percentage + solar_percentage + biogas_percentage + biomass_percentage) <= 100
  )
);

CREATE TABLE IF NOT EXISTS energy_demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL,
  forecast_date DATE NOT NULL,
  average_daily_demand_kwh DECIMAL(12, 2),
  peak_demand_kw DECIMAL(10, 2),
  irrigation_demand_kwh DECIMAL(12, 2),
  processing_demand_kwh DECIMAL(12, 2),
  cold_chain_demand_kwh DECIMAL(12, 2),
  ev_charging_demand_kwh DECIMAL(12, 2),
  industrial_demand_kwh DECIMAL(12, 2),
  forecast_confidence DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_demand CHECK (average_daily_demand_kwh >= 0),
  CONSTRAINT valid_peak CHECK (peak_demand_kw >= 0)
);

CREATE TABLE IF NOT EXISTS productive_equipment_energy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL,
  equipment_type VARCHAR(100),
  quantity INT NOT NULL,
  power_rating_kw DECIMAL(8, 2),
  utilization_hours_per_day INT,
  daily_consumption_kwh DECIMAL(10, 2),
  annual_consumption_kwh DECIMAL(12, 2),
  equipment_status VARCHAR(50) DEFAULT 'OPERATIONAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_energy_village ON energy_cost_profiles(village_id);
CREATE INDEX IF NOT EXISTS idx_energy_stack_village ON energy_stack_configurations(village_id);
CREATE INDEX IF NOT EXISTS idx_energy_demand_village_date ON energy_demand_forecasts(village_id, forecast_date);


-- ============================================================================
-- FOOD MODULE SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  product_id UUID,
  product_name VARCHAR(255) NOT NULL,
  quantity_kg DECIMAL(12, 2) NOT NULL,
  source_location VARCHAR(255),
  harvest_date DATE,
  processing_method VARCHAR(50),
  target_shelf_life INT,
  current_stage VARCHAR(100),
  quality_score DECIMAL(5, 2),
  initial_quality DECIMAL(5, 2) DEFAULT 100,
  processing_loss_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'INITIALIZED',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_quantity CHECK (quantity_kg > 0),
  CONSTRAINT valid_quality CHECK (quality_score >= 0 AND quality_score <= 100)
);

CREATE TABLE IF NOT EXISTS food_processing_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES food_processing_batches(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes INT,
  operator_id UUID,
  notes TEXT,
  quality_check_passed BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_composition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type VARCHAR(100) UNIQUE NOT NULL,
  calories DECIMAL(8, 2),
  protein_g DECIMAL(8, 2),
  carbohydrates_g DECIMAL(8, 2),
  fat_g DECIMAL(8, 2),
  fiber_g DECIMAL(8, 2),
  water_g DECIMAL(8, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_traceability_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) NOT NULL,
  checkpoint_order INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  operator_id UUID,
  timestamp TIMESTAMP NOT NULL,
  temperature DECIMAL(6, 2),
  humidity DECIMAL(5, 2),
  notes TEXT,
  blockchain_hash VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  verifier_id UUID,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_checkpoint CHECK (checkpoint_order > 0)
);

CREATE TABLE IF NOT EXISTS shelf_life_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) NOT NULL,
  base_shelf_life_days INT,
  adjusted_shelf_life_days INT,
  storage_temperature DECIMAL(6, 2),
  storage_humidity DECIMAL(5, 2),
  packaging_type VARCHAR(100),
  initial_quality DECIMAL(5, 2),
  expiration_date DATE,
  quality_degradation_daily DECIMAL(5, 2),
  risk_factors TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) NOT NULL,
  product_type VARCHAR(100),
  processing_facility_id UUID,
  fssai_compliant BOOLEAN,
  iso22000_compliant BOOLEAN,
  haccp_compliant BOOLEAN,
  organic_compliant BOOLEAN,
  labeling_compliant BOOLEAN,
  overall_compliant BOOLEAN DEFAULT FALSE,
  audit_date DATE,
  next_audit_date DATE,
  certifications_eligible TEXT,
  remediation_actions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_certification_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id VARCHAR(255) NOT NULL,
  farm_id UUID,
  eligibility_score INT CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
  recommendation VARCHAR(50),
  chemical_usage_count INT DEFAULT 0,
  pest_management_count INT DEFAULT 0,
  estimated_eligibility_date DATE,
  status VARCHAR(50) DEFAULT 'ASSESSMENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batch_product ON food_processing_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_batch_status ON food_processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_traceability_batch ON food_traceability_chain(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_location ON food_traceability_chain(location);
CREATE INDEX IF NOT EXISTS idx_compliance_batch ON food_compliance_records(batch_id);


-- ============================================================================
-- ERP MODULE SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES cost_centres(id) ON DELETE SET NULL,
  department VARCHAR(100),
  manager_id UUID,
  budget_annual DECIMAL(18, 2),
  cost_type VARCHAR(50),
  profit_centre BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  hierarchy_level INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_budget CHECK (budget_annual >= 0)
);

CREATE TABLE IF NOT EXISTS cost_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_centre_id UUID NOT NULL REFERENCES cost_centres(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,
  cost_type VARCHAR(50),
  amount DECIMAL(18, 2) NOT NULL,
  allocation_basis VARCHAR(50),
  driver_id UUID,
  allocated_by UUID,
  approval_status VARCHAR(50) DEFAULT 'PENDING',
  approved_by UUID,
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS cost_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_centre_id UUID NOT NULL REFERENCES cost_centres(id) ON DELETE CASCADE,
  cost_type VARCHAR(50) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  invoice_number VARCHAR(100),
  vendor_id UUID,
  description TEXT,
  document_date DATE,
  period VARCHAR(7),
  status VARCHAR(50) DEFAULT 'RECORDED',
  verification_status VARCHAR(50) DEFAULT 'PENDING',
  verified_by UUID,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_consumption CHECK (amount >= 0)
);

CREATE TABLE IF NOT EXISTS indirect_cost_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_name VARCHAR(255) NOT NULL,
  cost_driver VARCHAR(100) NOT NULL,
  period VARCHAR(7) NOT NULL,
  total_amount DECIMAL(18, 2),
  status VARCHAR(50) DEFAULT 'OPEN',
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS abc_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_pool_id UUID NOT NULL REFERENCES indirect_cost_pools(id),
  cost_centre_id UUID NOT NULL REFERENCES cost_centres(id),
  driver_value DECIMAL(18, 4),
  rate_per_driver DECIMAL(18, 6),
  allocated_amount DECIMAL(18, 2),
  allocation_percentage DECIMAL(7, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_centre_profitability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_centre_id UUID NOT NULL REFERENCES cost_centres(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,
  revenue DECIMAL(18, 2) DEFAULT 0,
  direct_costs DECIMAL(18, 2) DEFAULT 0,
  allocated_indirect_costs DECIMAL(18, 2) DEFAULT 0,
  gross_profit DECIMAL(18, 2),
  net_profit DECIMAL(18, 2),
  gross_profit_margin DECIMAL(7, 2),
  net_profit_margin DECIMAL(7, 2),
  roi DECIMAL(7, 2),
  performance_rating VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cost_centre_id, period)
);

CREATE TABLE IF NOT EXISTS cost_variance_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_centre_id UUID NOT NULL REFERENCES cost_centres(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,
  budgeted_amount DECIMAL(18, 2),
  actual_amount DECIMAL(18, 2),
  forecast_amount DECIMAL(18, 2),
  budget_variance DECIMAL(18, 2),
  budget_variance_percent DECIMAL(7, 4),
  forecast_variance DECIMAL(18, 2),
  variance_status VARCHAR(50),
  variance_reason TEXT,
  correction_actions TEXT,
  trend VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cost_centre_id, period)
);

CREATE TABLE IF NOT EXISTS fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code VARCHAR(100) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  cost_centre_id UUID REFERENCES cost_centres(id),
  description TEXT,
  acquisition_cost DECIMAL(18, 2),
  acquisition_date DATE,
  useful_life_years INT,
  salvage_value DECIMAL(18, 2),
  depreciation_method VARCHAR(50),
  accumulated_depreciation DECIMAL(18, 2) DEFAULT 0,
  book_value DECIMAL(18, 2),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  disposal_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_acquisition_cost CHECK (acquisition_cost >= 0),
  CONSTRAINT valid_useful_life CHECK (useful_life_years > 0)
);

CREATE TABLE IF NOT EXISTS depreciation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  period VARCHAR(7),
  depreciation_amount DECIMAL(18, 2),
  accumulated_depreciation DECIMAL(18, 2),
  book_value DECIMAL(18, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(100) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(18, 2),
  actual_cost DECIMAL(18, 2) DEFAULT 0,
  manager_id UUID,
  status VARCHAR(50) DEFAULT 'PLANNING',
  progress_percent INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_budget CHECK (budget > 0),
  CONSTRAINT valid_progress CHECK (progress_percent >= 0 AND progress_percent <= 100)
);

CREATE TABLE IF NOT EXISTS project_work_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wbs_code VARCHAR(100) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  parent_task_id UUID REFERENCES project_work_breakdown(id),
  budgeted_cost DECIMAL(18, 2),
  actual_cost DECIMAL(18, 2) DEFAULT 0,
  allocated_cost DECIMAL(18, 2),
  start_date DATE,
  end_date DATE,
  progress_percent INT DEFAULT 0,
  responsible_centre_id UUID REFERENCES cost_centres(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_centre_department ON cost_centres(department);
CREATE INDEX IF NOT EXISTS idx_cost_centre_status ON cost_centres(status);
CREATE INDEX IF NOT EXISTS idx_allocation_period ON cost_allocations(period);
CREATE INDEX IF NOT EXISTS idx_consumption_period ON cost_consumptions(period);
CREATE INDEX IF NOT EXISTS idx_consumption_cc_period ON cost_consumptions(cost_centre_id, period);
CREATE INDEX IF NOT EXISTS idx_profitability_period ON cost_centre_profitability(period);
CREATE INDEX IF NOT EXISTS idx_asset_cc ON fixed_assets(cost_centre_id);
CREATE INDEX IF NOT EXISTS idx_project_status ON projects(status);
