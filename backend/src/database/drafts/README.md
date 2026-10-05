# Schema drafts (not executed)

Files here are design drafts, **not** migrations. `migrate.js` only reads
`../migrations/`, so nothing in this folder is ever applied.

## 001_skeleton_complete_schema.sql

Added to `migrations/` on 2026-09-06 as a "skeleton" mapping of the 96
architecture points. Moved here on 2026-10-05 because it broke the migration
chain:

- it re-declares 22 tables that `000_base_schema.sql` and later migrations
  already own (`products`, `orders`, `shipments`, `roles`, `permissions`,
  `organizations`, `sessions`, `crops`, ...) with *different* columns, so
  `CREATE TABLE IF NOT EXISTS` silently skipped them and the follow-up
  statements failed (`column "code" of relation "roles" does not exist`);
- it accounted for 9 of the `tools/schema-collisions.js` errors;
- the 16 tables only it defined (`districts`, `plots`, `crop_cycles`,
  `cold_storage_nodes`, `reefer_vehicles`, `lab_tests`, ...) are referenced by
  no service, route, controller or later migration.

To adopt any of its tables, write a new numbered migration that creates them
under names that do not collide with the existing schema.
