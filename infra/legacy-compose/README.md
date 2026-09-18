# Superseded compose files

These four files were replaced by the single root `docker-compose.yml` on
2026-09-12. They are kept for reference only — **do not run them.** Each one
creates its own PostgreSQL with a different identity, which is the problem the
consolidation removed.

| File | Database | User | Host port | Volume |
|---|---|---|---|---|
| `docker-compose.dev.yml` | `ebdesign_db` | `postgres` | 5432 | `postgres_data` |
| `docker-compose.full.yml` | `ebdesign_db` | `postgres` | 5432 | `postgres_data` |
| `docker-compose.database.yml` | `subh_dev` | `subh_admin` | 5432 | `subh_postgres_data` |
| `docker-compose-postgres.yml` | `ebdesign` | `ebdesign_user` | **15432** | `postgres_data` |

## What was carried forward

Nothing was dropped. Every service and setting now lives in the root file
behind a profile:

- `dev.yml` / `full.yml` postgres + redis → the default (no-profile) services
- `full.yml` backend + frontend dev images (bind mounts, per-directory
  Dockerfiles) → `--profile app`
- `-postgres.yml` pgAdmin → `--profile tools`
- `database.yml` init-script mount (`./database/docker/init`) → default postgres
- `database.yml` `${VAR:-default}` substitution style and redis `--appendonly`
  → adopted throughout
- original root file's mongodb / rabbitmq / elasticsearch → `--profile full`
- original root file's nginx + combined production image → `--profile prod`

## Two things worth knowing before reading them

1. **`docker-compose.database.yml` never worked.** Its healthcheck blocks are
   invalid YAML — `interval:10s` and `test:["CMD",...]` are missing the space
   after the colon, so YAML reads them as scalars rather than mappings and
   Compose rejects the file.
2. **`docker-compose-postgres.yml` is where port 15432 came from.** It published
   `15432:5432`, and `backend/.env` was written to match it — but with database
   `ebdesign_prod` instead of the `ebdesign` that file actually creates. So even
   that pairing was broken.

Once the team is confident nothing references them, this whole directory can go.
