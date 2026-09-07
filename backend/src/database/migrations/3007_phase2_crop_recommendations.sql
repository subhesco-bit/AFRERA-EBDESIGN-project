-- Phase 2: Crop Recommendation Schema
CREATE TABLE crop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES users(id),
  crop_type VARCHAR(100),
  confidence DECIMAL(3,2),
  roi INT,
  season VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type VARCHAR(100),
  phase VARCHAR(50),
  guidance TEXT,
  created_at TIMESTAMP
);

CREATE TABLE farm_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES users(id),
  location POINT,
  size_hectares DECIMAL(10,2),
  soil_type VARCHAR(100),
  water_source VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE crop_market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_type VARCHAR(100),
  price_trend VARCHAR(50),
  demand VARCHAR(50),
  expected_price DECIMAL(10,2),
  updated_at TIMESTAMP
);

CREATE INDEX idx_recommendations_farmer ON crop_recommendations(farmer_id);
CREATE INDEX idx_guidance_crop ON crop_guidance(crop_type);
CREATE INDEX idx_farm_profiles_farmer ON farm_profiles(farmer_id);
CREATE INDEX idx_market_data_crop ON crop_market_data(crop_type);
