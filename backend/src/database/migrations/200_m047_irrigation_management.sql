-- M047 Irrigation Management Schema
-- Production irrigation scheduling and delivery tracking

CREATE TABLE IF NOT EXISTS irrigation_schedules (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,

  -- Crop and irrigation details
  crop_type VARCHAR(100) NOT NULL,
  water_volume INTEGER NOT NULL CHECK (water_volume > 0),
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('manual', 'automated', 'sensor_triggered')),

  -- Scheduling parameters
  frequency_days INTEGER CHECK (frequency_days > 0 AND frequency_days <= 30),
  start_time TIME,
  end_time TIME,

  -- Water source
  water_source_id INTEGER REFERENCES water_sources(id),

  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP,
  next_scheduled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common queries
  INDEX idx_farm_id_active (farm_id, is_active),
  INDEX idx_crop_type (crop_type),
  INDEX idx_next_scheduled (next_scheduled_at),
  UNIQUE (farm_id, crop_type, schedule_type)
);

-- Irrigation delivery logs
CREATE TABLE IF NOT EXISTS irrigation_delivery_logs (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES irrigation_schedules(id) ON DELETE CASCADE,

  -- Delivery metrics
  actual_volume INTEGER NOT NULL CHECK (actual_volume > 0),
  duration_minutes INTEGER,
  water_pressure DECIMAL(5,2),

  -- Delivery details
  delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_status VARCHAR(50) DEFAULT 'completed' CHECK (delivery_status IN ('completed', 'partial', 'failed', 'skipped')),

  -- Notes and observations
  notes TEXT,
  operator_id INTEGER REFERENCES users(id),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_schedule_id_date (schedule_id, delivery_date DESC),
  INDEX idx_status (delivery_status)
);

-- Water sources registry
CREATE TABLE IF NOT EXISTS water_sources (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,

  -- Water source details
  source_type VARCHAR(100) NOT NULL CHECK (source_type IN ('well', 'canal', 'pond', 'borehole', 'river', 'tank')),
  source_name VARCHAR(200),

  -- Capacity and status
  capacity_liters INTEGER,
  current_level_liters INTEGER,
  is_operational BOOLEAN DEFAULT true,

  -- Geographic location
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),

  -- Quality metrics
  ph_level DECIMAL(3,1),
  salinity_ppm INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_farm_id (farm_id),
  INDEX idx_source_type (source_type)
);

-- Irrigation efficiency tracking
CREATE TABLE IF NOT EXISTS irrigation_efficiency_metrics (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,

  -- Efficiency metrics
  scheduled_volume INTEGER,
  actual_volume INTEGER,
  efficiency_percentage DECIMAL(5,2),

  -- Crop and period
  crop_type VARCHAR(100),
  measurement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  measurement_period_days INTEGER,

  -- Recommendations
  optimization_score DECIMAL(3,1) CHECK (optimization_score >= 0 AND optimization_score <= 10),
  recommendations TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_farm_date (farm_id, measurement_date DESC),
  INDEX idx_efficiency (efficiency_percentage)
);

-- Add audit columns if not present
ALTER TABLE irrigation_schedules ADD COLUMN IF NOT EXISTS audit_user_id INTEGER REFERENCES users(id);
ALTER TABLE irrigation_delivery_logs ADD COLUMN IF NOT EXISTS audit_user_id INTEGER REFERENCES users(id);

COMMIT;
