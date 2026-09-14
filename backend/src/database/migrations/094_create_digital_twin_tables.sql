-- Create Digital Twin Tables
CREATE TABLE IF NOT EXISTS digital_twins (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER UNIQUE REFERENCES farms(id),
  twin_data JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iot_devices (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  device_data JSONB,
  device_type VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  device_id VARCHAR(100),
  reading_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id),
  simulation_data JSONB,
  scenario VARCHAR(100),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_digital_twins_farm ON digital_twins(farm_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_farm ON iot_devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm ON sensor_readings(farm_id);
CREATE INDEX IF NOT EXISTS idx_simulations_farm ON simulations(farm_id);
