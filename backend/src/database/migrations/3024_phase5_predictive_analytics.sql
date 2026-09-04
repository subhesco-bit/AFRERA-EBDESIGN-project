-- Phase 5: Predictive Analytics Schema
CREATE TABLE demand_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  prediction_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_demand_predictions_product ON demand_predictions(product_id);
