'use strict';

/**
 * Single source of truth for PostgreSQL connection identity.
 *
 * WHY THIS EXISTS
 *
 * Before this file, the platform resolved "which database am I talking to?"
 * in at least four incompatible ways:
 *
 *   - `database/connection.js`  read DATABASE_URL, else PG_*,  default afrera_db
 *   - `database/migrate.js`     read DB_* only (ignored DATABASE_URL entirely),
 *                               default ebdesign
 *   - `database/advanced_pool.js` read DATABASE_URL *and* PG_* simultaneously
 *   - `.env` / `.env.local` / `.env.example` each named a different database
 *
 * The practical result was that `npm start` and `npm run migrate` connected to
 * two different databases. Migrations were applied to one; the application read
 * the other and found no tables. That is the real cause behind the long-standing
 * "migrations created but not executed" symptom — they were executed, just not
 * anywhere the app was looking.
 *
 * Everything that opens a PostgreSQL connection must resolve its target through
 * this module so that divergence cannot silently reappear.
 *
 * PRECEDENCE (highest first)
 *   1. DATABASE_URL          — managed platforms (Railway, Heroku, Render, Fly,
 *                              Supabase) inject this and nothing else
 *   2. PG_*                  — what CI supplies
 *   3. DB_*                  — what the local .env files supply
 *   4. CANONICAL_DEFAULTS    — matches docker-compose.yml and .env.example
 *
 * PG_* is checked before DB_* because `connection.js` has ~800 importers and
 * already behaved that way; CI must keep working unchanged.
 */

/**
 * The canonical local identity. These values match, and must continue to match:
 *   - `docker-compose.yml` (the only compose file that creates a database)
 *   - `backend/.env.example`
 *
 * Changing the database name here is a breaking change for every developer's
 * local volume. Change it in all three places or not at all.
 */
const CANONICAL_DEFAULTS = Object.freeze({
  host: 'localhost',
  port: 5432,
  database: 'ebdesign',
  user: 'ebdesign_user',
  password: 'ebdesign_dev_password_change_in_prod',
});

/**
 * Pool sizing.
 *
 * `max` is deliberately conservative. PostgreSQL's default `max_connections` is
 * 100. One pool of 20 leaves headroom for migrations, psql sessions, and
 * monitoring to connect while the app is running. Raising this only helps if
 * the server's max_connections is raised to match — otherwise the 101st
 * connection is refused and every module reports a different symptom.
 */
const POOL_DEFAULTS = Object.freeze({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function parsePort(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * TLS is opt-in.
 *
 * Managed PostgreSQL almost always requires TLS, and its certificates are
 * usually not in the container's trust store. Defaulting `rejectUnauthorized`
 * to false everywhere would silently disable certificate verification in
 * production, so it has to be asked for explicitly.
 */
function resolveSsl(env) {
  if (env.PG_SSL !== 'true') return undefined;
  return { rejectUnauthorized: env.PG_SSL_STRICT !== 'false' };
}

/**
 * Resolve the PostgreSQL target as a node-postgres config object.
 *
 * @param {object} [env] - defaults to process.env; injectable for tests.
 * @returns {object} a config accepted by `new Pool()` / `new Client()`.
 */
function resolvePostgresConfig(env = process.env) {
  const ssl = resolveSsl(env);

  if (env.DATABASE_URL) {
    return ssl
      ? { connectionString: env.DATABASE_URL, ssl }
      : { connectionString: env.DATABASE_URL };
  }

  const config = {
    host: firstDefined(env.PG_HOST, env.DB_HOST) || CANONICAL_DEFAULTS.host,
    port: parsePort(firstDefined(env.PG_PORT, env.DB_PORT), CANONICAL_DEFAULTS.port),
    database: firstDefined(env.PG_DATABASE, env.DB_NAME) || CANONICAL_DEFAULTS.database,
    user: firstDefined(env.PG_USER, env.DB_USER) || CANONICAL_DEFAULTS.user,
    password: firstDefined(env.PG_PASSWORD, env.DB_PASSWORD) || CANONICAL_DEFAULTS.password,
  };

  if (ssl) config.ssl = ssl;
  return config;
}

/**
 * The same target, plus pool sizing. Use this wherever a `Pool` is constructed.
 *
 * @param {object} [overrides] - per-caller pool sizing (e.g. a migration runner
 *   that only needs one connection). Connection identity cannot be overridden.
 */
function resolvePoolConfig(overrides = {}, env = process.env) {
  return { ...resolvePostgresConfig(env), ...POOL_DEFAULTS, ...overrides };
}

/**
 * A redacted, human-readable description of the resolved target.
 *
 * Log this at startup. The single most expensive failure this module prevents
 * is two processes disagreeing about the target without either one saying which
 * one it picked — so every consumer should say it out loud.
 *
 * Never includes the password.
 */
function describePostgresTarget(env = process.env) {
  const config = resolvePostgresConfig(env);

  if (config.connectionString) {
    try {
      const url = new URL(config.connectionString);
      const database = url.pathname.replace(/^\//, '') || '(none)';
      return `${url.username || '(no user)'}@${url.hostname}:${url.port || 5432}/${database} (from DATABASE_URL)`;
    } catch {
      // A malformed DATABASE_URL must not crash startup logging — the
      // connection attempt itself will produce the real error.
      return '(unparseable DATABASE_URL)';
    }
  }

  const source = env.PG_HOST || env.PG_DATABASE ? 'PG_*' : (env.DB_HOST || env.DB_NAME ? 'DB_*' : 'defaults');
  return `${config.user}@${config.host}:${config.port}/${config.database} (from ${source})`;
}

module.exports = {
  CANONICAL_DEFAULTS,
  POOL_DEFAULTS,
  resolvePostgresConfig,
  resolvePoolConfig,
  describePostgresTarget,
};
