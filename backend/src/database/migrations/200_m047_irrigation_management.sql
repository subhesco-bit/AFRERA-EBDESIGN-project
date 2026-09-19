-- M047 Irrigation Management Schema
-- Production irrigation scheduling and delivery tracking.
-- Reconciled for PostgreSQL syntax while preserving the MAIN contract.

CREATE TABLE IF NOT EXISTS water_sources (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  source_type VARCHAR(100) NOT NULL CHECK (source_type IN ('well', 'canal', 'pond', 'borehole', 'river', 'tank')),
  source_name VARCHAR(200),
  capacity_liters INTEGER CHECK (capacity_liters IS NULL OR capacity_liters >= 0),
  current_level_liters INTEGER CHECK (current_level_liters IS NULL OR current_level_liters >= 0),
  is_operational BOOLEAN DEFAULT true,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  ph_level DECIMAL(3,1),
  salinity_ppm INTEGER CHECK (salinity_ppm IS NULL OR salinity_ppm >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_sources_farm_id ON water_sources(farm_id);
CREATE INDEX IF NOT EXISTS idx_water_sources_type ON water_sources(source_type);

CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_type VARCHAR(100) NOT NULL,
  water_volume INTEGER NOT NULL CHECK (water_volume > 0),
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('manual', 'automated', 'sensor_triggered')),
  frequency_days INTEGER CHECK (frequency_days > 0 AND frequency_days <= 30),
  start_time TIME,
  end_time TIME,
  water_source_id INTEGER REFERENCES water_sources(id),
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP,
  next_scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (farm_id, crop_type, schedule_type)
);

CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_farm_active ON irrigation_schedules(farm_id, is_active);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_crop ON irrigation_schedules(crop_type);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_next ON irrigation_schedules(next_scheduled_at);

CREATE TABLE IF NOT EXISTS irrigation_delivery_logs (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES irrigation_schedules(id) ON DELETE CASCADE,
  actual_volume INTEGER NOT NULL CHECK (actual_volume > 0),
  duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  water_pressure DECIMAL(5,2),
  delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'completed' CHECK (delivery_status IN ('completed', 'partial', 'failed', 'skipped')),
  notes TEXT,
  operator_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_irrigation_delivery_schedule_date ON irrigation_delivery_logs(schedule_id, delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_delivery_status ON irrigation_delivery_logs(delivery_status);

CREATE TABLE IF NOT EXISTS irrigation_efficiency_metrics (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  scheduled_volume INTEGER CHECK (scheduled_volume IS NULL OR scheduled_volume >= 0),
  actual_volume INTEGER CHECK (actual_volume IS NULL OR actual_volume >= 0),
  efficiency_percentage DECIMAL(5,2) CHECK (efficiency_percentage IS NULL OR (efficiency_percentage >= 0 AND efficiency_percentage <= 100)),
  crop_type VARCHAR(100),
  measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  measurement_period_days INTEGER CHECK (measurement_period_days IS NULL OR measurement_period_days > 0),
  optimization_score DECIMAL(3,1) CHECK (optimization_score IS NULL OR (optimization_score >= 0 AND optimization_score <= 10)),
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_irrigation_efficiency_farm_date ON irrigation_efficiency_metrics(farm_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_irrigation_efficiency_percentage ON irrigation_efficiency_metrics(efficiency_percentage);

ALTER TABLE irrigation_schedules ADD COLUMN IF NOT EXISTS audit_user_id INTEGER REFERENCES users(id);
ALTER TABLE irrigation_delivery_logs ADD COLUMN IF NOT EXISTS audit_user_id INTEGER REFERENCES users(id);
