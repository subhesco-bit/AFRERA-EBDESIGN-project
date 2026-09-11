# Village-Level Resolution Audit

## Scope

This audit records the final reconciliation of the village master/profile and village operational issue layer without introducing a second village master.

## Resolved

- Canonical village master remains `village_profiles`.
- `villageProfileService.js` no longer assumes columns that do not exist in the canonical migration.
- Missing operational village-profile columns are reconciled by migration `053_village_profile_operational_reconciliation.sql`.
- Existing `name` is preserved as the canonical base name and backfilled into `village_name`.
- Existing `avg_income` is preserved and reconciled with `avg_income_per_household`.
- Population, household, irrigation, literacy, distance and facility-count sanity constraints are applied.
- Village profile search supports district, block, population, irrigation, road-access and crop filters.
- `/villages/search` is ordered before `/villages/:villageId` to avoid route shadowing.
- Village issues use `village_profiles.village_id`; no duplicate village registry is created.
- Village issues and issue updates are persisted in `village_issues` and `village_issue_updates`.
- Issue creation and its initial history entry are atomic.
- Issue mutation and its history entry are atomic.
- Issue update history can be retrieved explicitly.
- Reporter and actor identity is taken from authenticated request context when available.
- Issue status transitions are validated instead of allowing arbitrary lifecycle jumps.
- Issue lifecycle timestamps are synchronized at database level.
- Closing an issue preserves its `resolved_at` timestamp.
- Direct database writes receive category/source/assignment/scope/note integrity checks.
- Overdue and open-assignment indexes are provided for operational monitoring.
- The duplicate route-registration mechanism in `villageIssuesService.js` has been removed; `villageIssuesRoutes.js` is the route surface.

## Authoritative Data Flow

```text
village_profiles
      |
      +--> village profile/search/summary
      |
      +--> village_issues
              |
              +--> village_issue_updates
              |
              +--> ERP / workflow / risk / emergency / AI consumers
```

## Lifecycle

```text
OPEN
  -> ACKNOWLEDGED
  -> IN_PROGRESS
  -> BLOCKED
  -> RESOLVED
  -> CLOSED
```

Rejected is a terminal outcome. Resolved issues may be reopened to `in_progress`; closed and rejected issues are terminal.

## Integrity Principle

Village-level modules must reference the existing village master. New modules must not create another village table or an alternative village identity hierarchy.

## Verification Boundary

Repository changes have been committed to `feature/village-integration-2026-09-11`. Database execution and runtime integration tests still require an environment with the project's PostgreSQL/database services available; repository commits alone are not treated as proof of runtime execution.
