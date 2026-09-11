# Village Profile Schema Reconciliation

## Purpose

The platform already had one authoritative `village_profiles` table created by migration `052_economic_layer.sql`. The application service had evolved to require additional operational fields that were not present in the original table definition.

This is resolved by **extending the existing table in migration `053_village_profile_operational_reconciliation.sql`**. No second village master, duplicate village table, or parallel village identity is introduced.

## Canonical model

```text
village_profiles
      |
      +-- village profile / economic baseline
      +-- village operational metrics
      +-- village issues / needs
      +-- future village ERP modules
```

All village-level modules must reference the same `village_profiles.village_id`.

## Reconciliation

Migration 053 adds the fields required by `villageProfileService.js`, backfills `village_name` from the original `name`, and maps the existing `avg_income` into `avg_income_per_household` when the latter is empty.

It also adds sanity constraints and indexes for common geographic and operational queries.

## Compatibility

The service continues to maintain the original `name` field and the newer `village_name` field together so existing consumers are not broken while the application contract is standardized.

The village search route is registered before `/villages/:villageId` so `/villages/search` cannot be interpreted as a village ID.

## Rule

Do not create another village master. If a future module needs village data, reference `village_profiles` and extend the model through a migration only when the data is genuinely owned by the village profile domain.
