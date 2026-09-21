-- ============================================================================
-- 062_village_issue_integrity_reconciliation.sql
--
-- Final integrity pass for the village operational issue layer.
-- Keeps village_profiles as the only village master and hardens the issue
-- lifecycle so API validation and direct database writes share the same rules.
-- ============================================================================

-- Existing deployments may contain rows written before the application-level
-- validation was added. Reject only genuinely invalid future values.
ALTER TABLE village_issues
  ADD CONSTRAINT village_issue_source_valid
    CHECK (length(trim(source)) > 0),
  ADD CONSTRAINT village_issue_assigned_to_valid
    CHECK (assigned_to IS NULL OR length(trim(assigned_to)) > 0),
  ADD CONSTRAINT village_issue_owner_scope_valid
    CHECK (owner_scope IS NULL OR length(trim(owner_scope)) > 0);

ALTER TABLE village_issue_updates
  ADD CONSTRAINT village_issue_update_note_valid
    CHECK (length(trim(note)) > 0);

-- Database-level category allow-list matching the service contract.
ALTER TABLE village_issues
  ADD CONSTRAINT village_issue_category_known CHECK (
    category IN (
      'infrastructure','water','electricity','roads','health','education',
      'agriculture','fisheries','livestock','market','finance','livelihood',
      'warehouse','logistics','digital_connectivity','governance','environment',
      'climate','emergency','other'
    )
  );

-- Keep lifecycle timestamps consistent for direct SQL writes as well as API writes.
CREATE OR REPLACE FUNCTION sync_village_issue_lifecycle_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NULL THEN
    NEW.resolved_at = now();
  ELSIF NEW.status <> 'resolved' THEN
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

-- Efficient operational queries for overdue/high-impact village problems.
CREATE INDEX IF NOT EXISTS idx_village_issues_due_open
  ON village_issues (target_resolution_date, priority, village_id)
  WHERE status NOT IN ('resolved','closed','rejected')
    AND target_resolution_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_village_issues_assignee_open
  ON village_issues (assigned_to, status, priority, updated_at DESC)
  WHERE status NOT IN ('resolved','closed','rejected');

COMMENT ON COLUMN village_issues.owner_scope IS
  'Logical responsibility scope for the issue; must integrate with existing authorization/workflow scope rather than creating a second village hierarchy.';
COMMENT ON COLUMN village_issues.reported_by IS
  'Reporter identity from the authenticated/application identity context where available.';
