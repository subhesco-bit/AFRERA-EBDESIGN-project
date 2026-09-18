BEGIN;
-- Presentation/planning coverage, never a claim that local operations or schemes are live.
CREATE TABLE IF NOT EXISTS india_jurisdiction_coverage (
  name TEXT PRIMARY KEY,
  jurisdiction_type TEXT NOT NULL CHECK (jurisdiction_type IN ('state','union_territory')),
  focus_region TEXT NOT NULL DEFAULT 'india',
  market_launch_scope BOOLEAN NOT NULL DEFAULT TRUE,
  rollout_stage TEXT NOT NULL DEFAULT 'candidate' CHECK (rollout_stage IN ('candidate','pilot','active','paused')),
  presentation_priority INTEGER NOT NULL DEFAULT 100 CHECK (presentation_priority BETWEEN 1 AND 1000),
  source_url TEXT NOT NULL,
  source_reviewed_on DATE NOT NULL,
  local_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS india_jurisdiction_coverage_events (
  id BIGSERIAL PRIMARY KEY,
  jurisdiction_name TEXT NOT NULL REFERENCES india_jurisdiction_coverage(name),
  previous_stage TEXT,
  next_stage TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rationale TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION india_coverage_event_immutable() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'coverage events are append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_india_coverage_event_immutable ON india_jurisdiction_coverage_events;
CREATE TRIGGER trg_india_coverage_event_immutable BEFORE UPDATE OR DELETE ON india_jurisdiction_coverage_events FOR EACH ROW EXECUTE FUNCTION india_coverage_event_immutable();

WITH official(name, jurisdiction_type, focus_region, presentation_priority, rollout_stage) AS (VALUES
 ('Andhra Pradesh','state','india',100,'candidate'),('Arunachal Pradesh','state','northeast',20,'candidate'),
 ('Assam','state','northeast',20,'candidate'),('Bihar','state','india',100,'candidate'),
 ('Chhattisgarh','state','india',100,'candidate'),('Goa','state','india',100,'candidate'),
 ('Gujarat','state','india',100,'candidate'),('Haryana','state','india',100,'candidate'),
 ('Himachal Pradesh','state','india',100,'candidate'),('Jharkhand','state','india',100,'candidate'),
 ('Karnataka','state','india',100,'candidate'),('Kerala','state','india',100,'candidate'),
 ('Madhya Pradesh','state','india',100,'candidate'),('Maharashtra','state','india',100,'candidate'),
 ('Manipur','state','northeast',20,'candidate'),('Meghalaya','state','northeast',20,'candidate'),
 ('Mizoram','state','northeast',20,'candidate'),('Nagaland','state','northeast',10,'candidate'),
 ('Odisha','state','india',100,'candidate'),('Punjab','state','india',100,'candidate'),
 ('Rajasthan','state','india',100,'candidate'),('Sikkim','state','northeast',20,'candidate'),
 ('Tamil Nadu','state','india',100,'candidate'),('Telangana','state','india',100,'candidate'),
 ('Tripura','state','northeast',20,'candidate'),('Uttar Pradesh','state','india',100,'candidate'),
 ('Uttarakhand','state','india',100,'candidate'),('West Bengal','state','india',100,'candidate'),
 ('Andaman and Nicobar Islands','union_territory','india',100,'candidate'),
 ('Chandigarh','union_territory','india',100,'candidate'),
 ('Dadra and Nagar Haveli and Daman and Diu','union_territory','india',100,'candidate'),
 ('Delhi','union_territory','india',100,'candidate'),
 ('Jammu and Kashmir','union_territory','india',100,'candidate'),
 ('Lakshadweep','union_territory','india',100,'candidate'),
 ('Puducherry','union_territory','india',100,'candidate'),
 ('Ladakh','union_territory','india',100,'candidate')
)
INSERT INTO india_jurisdiction_coverage (name,jurisdiction_type,focus_region,presentation_priority,rollout_stage,source_url,source_reviewed_on)
SELECT name,jurisdiction_type,focus_region,presentation_priority,rollout_stage,
 'https://www.india.gov.in/calendar/lakshadweep-ut', DATE '2026-09-15' FROM official
ON CONFLICT (name) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_india_coverage_rollout ON india_jurisdiction_coverage(presentation_priority,name);
COMMIT;
