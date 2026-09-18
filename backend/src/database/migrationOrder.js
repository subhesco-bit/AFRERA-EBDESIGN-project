/**
 * The single definition of the order migrations run in.
 *
 * WHY THIS EXISTS
 * Migration order is not cosmetic here: this schema has ~105 table names
 * declared by more than one migration, and PostgreSQL's
 * `CREATE TABLE IF NOT EXISTS` silently skips every declaration after the
 * first. Whichever file sorts first therefore DECIDES the live shape of that
 * table, and everything downstream (schema-decisions.json, the collision
 * checker, the FK type checks in migration_preflight.js) is reasoning about
 * "the definition that wins".
 *
 * migrate.js has always used numeric-aware collation, so `999_x.sql` runs
 * before `1000_x.sql`. Four other places — migration_preflight.js,
 * tools/schema-collisions.js, tools/gen-reconciliation.js, and the two
 * alternate runners execute-migrations.js / executeMigrationsComplete.js —
 * used a plain `.sort()`, where `"1000_"` sorts before `"999_"` because it
 * compares character by character.
 *
 * That disagreement had two consequences:
 *   - the checkers named the WRONG winner for warehouses, edge_computing,
 *     purchase_orders, production_orders and journal_entries, so their
 *     reports described a database nobody would ever get; and
 *   - the alternate runners would have produced a genuinely different
 *     database than `npm run migrate`, for those same tables.
 *
 * Everything that orders migration files must import this comparator. Do not
 * require() migrate.js for it — that module runs the migrations on load.
 */

/** Comparator matching `npm run migrate`. Numeric-aware: 999_ before 1000_. */
function compareMigrationNames(left, right) {
  return left.localeCompare(right, undefined, { numeric: true });
}

/** Sort a list of migration filenames into execution order (does not mutate). */
function sortMigrationNames(files) {
  return [...files].sort(compareMigrationNames);
}

module.exports = { compareMigrationNames, sortMigrationNames };
