-- ============================================================
-- SUBH CANONICAL POSTGRES FOUNDATION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS farmer;
CREATE SCHEMA IF NOT EXISTS land;
CREATE SCHEMA IF NOT EXISTS village;
CREATE SCHEMA IF NOT EXISTS fpo;
CREATE SCHEMA IF NOT EXISTS crop;
CREATE SCHEMA IF NOT EXISTS livestock;
CREATE SCHEMA IF NOT EXISTS fisheries;
CREATE SCHEMA IF NOT EXISTS horticulture;
CREATE SCHEMA IF NOT EXISTS supply_chain;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS warehouse;
CREATE SCHEMA IF NOT EXISTS market;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS insurance;
CREATE SCHEMA IF NOT EXISTS government;
CREATE SCHEMA IF NOT EXISTS engineering;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS gis;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS notification;
CREATE SCHEMA IF NOT EXISTS integration;

CREATE TABLE IF NOT EXISTS platform.schema_migration_registry(
    migration_id text PRIMARY KEY,
    checksum text,
    applied_at timestamptz NOT NULL DEFAULT now(),
    execution_ms bigint,
    status text NOT NULL,
    error_message text
);

CREATE TABLE IF NOT EXISTS audit.audit_event(
    audit_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    actor_id uuid,
    event_type text NOT NULL,
    entity_type text,
    entity_id text,
    action text NOT NULL,
    before_data jsonb,
    after_data jsonb,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_event_entity
ON audit.audit_event(entity_type,entity_id);

CREATE INDEX IF NOT EXISTS ix_audit_event_actor
ON audit.audit_event(actor_id);

CREATE INDEX IF NOT EXISTS ix_audit_event_created
ON audit.audit_event(created_at);

CREATE OR REPLACE FUNCTION platform.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at=now();
    RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS platform.system_health(
    component text PRIMARY KEY,
    status text NOT NULL,
    checked_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb
);
