-- Phase 5: Farm Analytics Schema
CREATE TABLE farm_analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID,
  report_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farm_analytics_reports_farm ON farm_analytics_reports(farm_id);
