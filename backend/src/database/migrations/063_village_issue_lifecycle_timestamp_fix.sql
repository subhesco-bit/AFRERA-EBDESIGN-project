-- ============================================================================
-- 063_village_issue_lifecycle_timestamp_fix.sql
-- Preserve resolved_at when an issue transitions from resolved to closed.
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_village_issue_lifecycle_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = now();
  ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at = NULL;
  END IF;

  IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
    NEW.closed_at = now();
  ELSIF NEW.status <> 'closed' THEN
    NEW.closed_at = NULL;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_village_issue_lifecycle ON village_issues;
CREATE TRIGGER trg_village_issue_lifecycle
BEFORE INSERT OR UPDATE ON village_issues
FOR EACH ROW EXECUTE FUNCTION sync_village_issue_lifecycle_timestamps();
