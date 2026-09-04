-- Phase 2: Price Forecasting Schema
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255),
  model_type VARCHAR(100),
  version INT,
  trained_date TIMESTAMP,
  accuracy DECIMAL(5,2),
  created_at TIMESTAMP
);

CREATE TABLE price_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  forecasted_date DATE,
  forecasted_price DECIMAL(10,2),
  confidence INT,
  created_at TIMESTAMP
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_date ON price_history(date);
CREATE INDEX idx_forecasts_product ON price_forecasts(product_id);
