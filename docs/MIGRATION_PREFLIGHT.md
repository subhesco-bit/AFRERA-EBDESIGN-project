# Migration Preflight

`backend/src/database/migration_preflight.js` is a credential-free, read-only migration audit. It parses the current SQL files and the two local migration-runner definitions; it never opens a PostgreSQL connection and never edits a schema.

Run it from the repository root:

```powershell
node backend/src/database/migration_preflight.js
node backend/src/database/migration_preflight.js --json > docs/migration-preflight.json
```

The command exits `0` when no blocking findings are detected and `1` when it detects a mechanically certain type/FK mismatch:

- duplicate filename prefixes, reported as deterministic lexical-order warnings;
- duplicate `CREATE TABLE` ownership, reported as legacy no-op/collision warnings;
- inline or table-level foreign keys whose declared UUID/integer-family type conflicts with every known referenced type;
- mixed referenced types, reported as ambiguous warnings;
- legacy `schema_migrations` definitions, handled by the shared additive compatibility contract.

This is a static preflight, not a substitute for applying migrations in an isolated PostgreSQL instance. It intentionally reports conflicts without rewriting migration SQL.

## Current Run

Run on 2026-09-03 against the checked-in migration directory:

| Check | Result |
| --- | ---: |
| SQL migrations scanned | 352 |
| Table definitions parsed | 1,343 |
| Duplicate prefix groups (warnings) | 8 |
| Duplicate table ownership findings (warnings) | 40 |
| Blocking UUID/integer FK mismatches | 10 |
| Ambiguous mixed-type FK targets (warnings) | 68 |
| Legacy `schema_migrations` definitions | 0 |
| Blocking findings | 10 |

The duplicate prefix groups are `013`, `014`, `015`, `016`, `3000`, `999`, `9997`, and `9999`. The canonical metadata contract is `backend/src/database/schema_migrations.js`; both runners use it, and legacy installations are upgraded with additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements. Because 10 mechanically certain FK mismatches remain, the command exits with status `1`. No PostgreSQL credentials are required, and migration SQL files are not modified.