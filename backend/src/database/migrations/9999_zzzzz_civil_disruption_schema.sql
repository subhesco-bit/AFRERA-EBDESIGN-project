-- Civil Disruption / Blockade Tracking — real, recurring operational
-- reality in Northeast India (economic blockades on NH-2/NH-29,
-- bandhs/strikes) that genuinely disrupts agri-logistics. Confirmed
-- genuinely absent from this codebase before building (2026-08-15).
--
-- HONESTY NOTE: matching disruptions to shipments is done by free-text
-- ILIKE against shipments.origin_address/destination_address, not GPS
-- routing — this codebase's geospatial normalization is deliberately
-- incremental (see migration 997_geospatial_indexes.sql's decision
-- block). A text match on district/route name is a real, if approximate,
-- signal — never presented as precise geofencing it isn't.

CREATE TABLE IF NOT EXISTS civil_disruption_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disruption_type VARCHAR(30) NOT NULL CHECK (disruption_type IN ('economic_blockade', 'bandh_strike', 'natural_disaster', 'road_closure', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affected_state VARCHAR(100) NOT NULL,
  affected_district VARCHAR(100),
  affected_route_names TEXT[],
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'unverified')),
  reported_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  source_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_civil_disruption_status ON civil_disruption_events(status);
CREATE INDEX IF NOT EXISTS idx_civil_disruption_state ON civil_disruption_events(affected_state);
CREATE INDEX IF NOT EXISTS idx_civil_disruption_dates ON civil_disruption_events(start_date, end_date);
