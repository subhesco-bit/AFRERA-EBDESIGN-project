-- Phase 2: Weather Advisory Schema
CREATE TABLE weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location POINT,
  temperature DECIMAL(5,2),
  humidity INT,
  rainfall DECIMAL(10,2),
  wind_speed DECIMAL(5,2),
  forecast TEXT,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location POINT,
  alert_type VARCHAR(100),
  severity VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE crop_advisory_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type VARCHAR(100),
  weather_condition VARCHAR(255),
  advisory TEXT,
  created_at TIMESTAMP
);

CREATE INDEX idx_weather_cache_location ON weather_cache USING GIST(location);
CREATE INDEX idx_weather_alerts_location ON weather_alerts USING GIST(location);
CREATE INDEX idx_advisory_rules_crop ON crop_advisory_rules(crop_type);
