-- ============================================================================
-- 061_village_issues_integration.sql
-- Village-level issue / needs / escalation layer.
-- Uses the existing village_profiles table as the village master.
-- ============================================================================

CREATE TABLE IF NOT EXISTS village_issues (
  issue_id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES village_profiles(village_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  source TEXT NOT NULL DEFAULT 'village_user',
  reported_by TEXT,
  assigned_to TEXT,
  owner_scope TEXT,
  location_description TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  affected_households INTEGER,
  affected_people INTEGER,
  estimated_cost NUMERIC(14,2),
  target_resolution_date DATE,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT village_issue_priority_valid CHECK (priority IN ('low','medium','high','critical')),
  CONSTRAINT village_issue_status_valid CHECK (status IN ('open','acknowledged','in_progress','blocked','resolved','closed','rejected')),
  CONSTRAINT village_issue_category_valid CHECK (length(trim(category)) > 0),
  CONSTRAINT village_issue_title_valid CHECK (length(trim(title)) > 0),
  CONSTRAINT village_issue_affected_households_valid CHECK (affected_households IS NULL OR affected_households >= 0),
  CONSTRAINT village_issue_affected_people_valid CHECK (affected_people IS NULL OR affected_people >= 0),
  CONSTRAINT village_issue_cost_valid CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  CONSTRAINT village_issue_lat_valid CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT village_issue_lon_valid CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS village_issue_updates (
  update_id BIGSERIAL PRIMARY KEY,
  issue_id BIGINT NOT NULL REFERENCES village_issues(issue_id) ON DELETE CASCADE,
  status TEXT,
  note TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT,
  attachment_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_issue_update_status_valid CHECK (
    status IS NULL OR status IN ('open','acknowledged','in_progress','blocked','resolved','closed','rejected')
  )
);

CREATE INDEX IF NOT EXISTS idx_village_issues_village_status
  ON village_issues (village_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_village_issues_category
  ON village_issues (category, status);
CREATE INDEX IF NOT EXISTS idx_village_issues_open_priority
  ON village_issues (priority, created_at DESC)
  WHERE status NOT IN ('resolved','closed','rejected');
CREATE INDEX IF NOT EXISTS idx_village_issue_updates_issue
  ON village_issue_updates (issue_id, created_at DESC);

CREATE OR REPLACE FUNCTION set_village_issue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_village_issue_updated_at ON village_issues;
CREATE TRIGGER trg_village_issue_updated_at
BEFORE UPDATE ON village_issues
FOR EACH ROW EXECUTE FUNCTION set_village_issue_updated_at();

COMMENT ON TABLE village_issues IS
  'Village operational issues, needs and service-delivery problems linked to the existing village master.';
COMMENT ON TABLE village_issue_updates IS
  'Auditable lifecycle updates and field/management notes for village issues.';
