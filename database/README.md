# The database — one identity, one place

**Last updated:** 2026-09-12

This file is the single connection story for the platform. If anything else in
the repo contradicts it, this file is right and the other document is stale.

---

## The canonical identity

| | |
|---|---|
| Engine | PostgreSQL 16 |
| Host | `localhost` (`postgres` from inside the compose network) |
| Port | `5432` |
| Database | `ebdesign` |
| User | `ebdesign_user` |

Declared in exactly three places, which must stay in step:

1. `docker-compose.yml` — the only file that creates a database
2. `backend/.env.example` — the committed contract for local env files
3. `backend/src/config/database.js` — `CANONICAL_DEFAULTS`

Changing the database name means changing all three and dropping local volumes.

---

## How a connection target is resolved

Everything that opens a PostgreSQL connection goes through
`backend/src/config/database.js`. Precedence, highest first:

1. **`DATABASE_URL`** — managed platforms (Railway, Heroku, Render, Fly,
   Supabase) inject this and nothing else
2. **`PG_*`** — what CI supplies
3. **`DB_*`** — what local `.env` files supply
4. **`CANONICAL_DEFAULTS`** — the table above

The defaults deliberately equal the configured values, so a missing `.env` now
connects to the same place as a present one rather than silently somewhere else.

Both the server and the migration runner load `backend/.env.local` then
`backend/.env`, in that order. **dotenv does not overwrite an already-set
variable, so `.env.local` wins.**

---

## Running it

```bash
docker compose up -d                  # postgres + redis
cd backend && npm run migrate         # apply migrations
cd backend && npm run dev             # start the API
```

Optional service groups:

```bash
docker compose --profile tools up -d  # + pgAdmin on :5050
docker compose --profile full up -d   # + mongodb, rabbitmq, elasticsearch
docker compose --profile app up -d    # + backend & frontend dev images
docker compose --profile prod up -d   # combined production image + nginx
```

Both the server and the migration runner print their resolved target on
startup. If those two lines ever disagree, stop and fix it before running
anything — that disagreement is the exact failure this layout exists to prevent.

---

## What was wrong before 2026-09-12

Worth knowing, because the symptoms are still described in older documents.

**Seven PostgreSQL identities.** Five compose files each created a different
database (`afrera_prod`, `ebdesign_db` ×2, `subh_dev`, `ebdesign`), the env
files named two more (`ebdesign_prod`, `afrera_db`), and all of them bound the
same host port so only one could run at a time.

**The app and the migration runner used different databases.** `migrate.js`
ignored `DATABASE_URL` and read only `DB_*`, while the server read
`DATABASE_URL`. With `backend/.env` setting both to different values,
migrations were applied to one database and the application read another. This
is the real explanation for the long-standing "migrations created but not
executed" symptom — they were executed, just not where anything looked.

**Migrations were not actually transactional.** The runner issued `BEGIN`, the
migration body and `COMMIT` as separate `pool.query()` calls. A pool hands each
call whatever connection is free, so the migration ran outside the transaction
it appeared to be wrapped in, and `ROLLBACK` on failure did nothing. Same
defect existed in `executeMigrationsComplete.js` and in the GDPR
right-to-be-forgotten path.

**`executeMigrationsComplete.js` could never run.** It called `db.query()` on
`./connection`, which exports no `query` method.

---

## Access layer — three modules, one pool

These look like parallel database layers. They are not, and should not be
merged:

| Module | Role |
|---|---|
| `backend/src/database/connection.js` | Owns the single pool (~800 importers) |
| `backend/src/database/pool.js` | Lazy **proxy** over it; exposes `query()` / `connect()` only |
| `backend/src/database/dbConnection.js` | Query **builder** over it |

`pool.js` exists because 42 services once each did
`new Pool({ connectionString: ... })` — 420 connections against a server whose
default `max_connections` is 100. Use `require('../database/pool')` in services.
Never construct a `Pool` in a service.

Note `pool.js` intentionally has **no `end()`**. Closing the shared pool is
`connection.close()`'s job.

---

## Known remaining work

1. **746 migration files in one flat directory**, with 25 duplicate-prefix
   groups (`014_` ×4) and eleven unnumbered files that sort *after* every
   numbered one. Execution order is decided by
   `backend/src/database/migrationOrder.js`; ~105 table names are declared by
   more than one migration, and `CREATE TABLE IF NOT EXISTS` silently keeps the
   first, so order decides the live schema.
2. **Five migration directories** still exist: `backend/src/database/migrations`
   (the live one), `backend/migrations`, `database/migrations/canonical`,
   `.ai/migration`, `_SQL_INFRA/03_MIGRATIONS`.
3. **`backend/src/database/indexes/comprehensive_indexes.sql`** — 14 KB of real
   index definitions that no runner applies. It is *not* safe to apply as-is:
   its `CREATE INDEX` statements are unguarded and reference columns that may
   not exist in the surviving schema. It needs a column-existence audit first,
   then the same guarded treatment as
   `migrations/zzzz_20260912_fk_performance_indexes.sql`.
4. **~31 loose `.sql` schema files** sit directly in `backend/src/database/`,
   outside the migration sequence entirely.
5. **JSON file-stores** (`auth_store.json`, `form_store.json`) act as real
   persistence but are gitignored and outside PostgreSQL.
