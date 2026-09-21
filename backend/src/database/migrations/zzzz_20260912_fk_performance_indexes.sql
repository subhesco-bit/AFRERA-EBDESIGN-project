-- Performance: index every foreign-key column that lacks one.
--
-- PostgreSQL creates an index for a PRIMARY KEY and for a UNIQUE constraint,
-- but NOT for a FOREIGN KEY. An unindexed FK column costs twice:
--   1. every join across it degrades to a sequential scan, and
--   2. every DELETE or UPDATE of the PARENT row must scan the whole child
--      table to enforce the constraint — so deleting one user scans every
--      row of user_roles, cart, payments and so on.
--
-- Source: backend/src/database/migrations/__missing_fk_indexes.json
-- (43 columns across 28 tables), produced by the FK audit.
--
-- WHY THIS IS DATA-DRIVEN RATHER THAN 43 CREATE INDEX STATEMENTS
--
-- This schema is assembled from ~746 migration files with duplicate numeric
-- prefixes, and roughly 105 table names are declared more than once. Which
-- declaration wins depends on collation order (see database/migrationOrder.js),
-- so a plain CREATE INDEX on a table or column that did not survive would abort
-- the whole migration. Each index below is therefore created only after
-- confirming the table and column actually exist in the live schema.
--
-- CREATE INDEX (not CONCURRENTLY): the runner wraps each migration in a
-- transaction, and CONCURRENTLY cannot run inside one.

DO $$
DECLARE
  target   RECORD;
  idx_name TEXT;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
    ('user_profiles', 'user_id'),
    ('user_roles', 'user_id'),
    ('user_roles', 'role_id'),
    ('user_roles', 'assigned_by'),
    ('categories', 'parent_id'),
    ('products', 'unit_id'),
    ('products', 'created_by'),
    ('cart', 'user_id'),
    ('cart', 'product_id'),
    ('payments', 'order_id'),
    ('payments', 'user_id'),
    ('fpos', 'address_id'),
    ('farmers', 'farm_location_id'),
    ('farmer_certifications', 'farmer_id'),
    ('training_records', 'farmer_id'),
    ('credit_scores', 'farmer_id'),
    ('loans', 'farmer_id'),
    ('emi_schedule', 'loan_id'),
    ('advances', 'farmer_id'),
    ('financial_transactions', 'user_id'),
    ('policies', 'user_id'),
    ('policies', 'farmer_id'),
    ('policies', 'product_id'),
    ('claims', 'policy_id'),
    ('claims', 'user_id'),
    ('shipments', 'order_id'),
    ('shipments', 'mode_id'),
    ('drivers', 'assigned_vehicle_id'),
    ('contracts', 'farmer_id'),
    ('contracts', 'buyer_id'),
    ('contracts', 'crop_id'),
    ('contract_milestones', 'contract_id'),
    ('escrow_accounts', 'contract_id'),
    ('assets', 'type_id'),
    ('assets', 'location_id'),
    ('assets', 'responsible_user_id'),
    ('asset_bookings', 'asset_id'),
    ('asset_bookings', 'user_id'),
    ('maintenance_records', 'asset_id'),
    ('subsidy_claims', 'farmer_id'),
    ('subsidy_claims', 'scheme_id'),
    ('compliance_records', 'verified_by'),
    ('recommendations', 'user_id')
    ) AS t(table_name, column_name)
  LOOP
    -- Skip anything the surviving schema does not actually have.
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name   = target.table_name
        AND c.column_name  = target.column_name
    ) THEN
      RAISE NOTICE 'skip %.% (not present in live schema)', target.table_name, target.column_name;
      CONTINUE;
    END IF;

    -- Skip if an index already LEADS with this column; a composite index whose
    -- first column is the FK already serves both the join and the FK check, so
    -- adding a single-column duplicate would only cost write throughput.
    IF EXISTS (
      SELECT 1
      FROM pg_index i
      JOIN pg_class  t ON t.oid = i.indrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = i.indkey[0]
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = target.table_name
        AND a.attname = target.column_name
    ) THEN
      RAISE NOTICE 'skip %.% (already indexed)', target.table_name, target.column_name;
      CONTINUE;
    END IF;

    idx_name := format('idx_%s_%s', target.table_name, target.column_name);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
      idx_name, target.table_name, target.column_name
    );
    RAISE NOTICE 'created %', idx_name;
  END LOOP;
END
$$;

-- NOTE ON THE FILENAME
--
-- The `zzzz_` prefix is not decoration. Execution order in this project is
-- filename order (database/migrationOrder.js), and eleven migrations are still
-- unnumbered — advanced_search_schema.sql, gdpr_schema.sql, mfa_schema.sql,
-- unified_ai_schema.sql and friends — which sort AFTER any numeric prefix.
-- A date-prefixed name ran 11 files too early and would have silently skipped
-- indexing whatever those files create. Indexes must run last, so this sorts
-- last by the only mechanism available today.
--
-- When the migration set is renumbered into a single ordered sequence, give
-- this file a normal number at the end and delete this note.
