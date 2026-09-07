-- Fixes a genuine runtime bug found in the 2026-09-07 Platform/Identity
-- audit: organizationManagementService.js (createOrganization/
-- updateOrganization) and tenantManagementService.js (createTenant/
-- updateTenant) INSERT/UPDATE columns that never existed on the live
-- tables, so every call failed with a Postgres "column does not exist"
-- error - org/tenant creation was completely broken end-to-end despite
-- both services otherwise being real, DB-backed implementations.
--
-- Root cause: migration 001 creates `organizations` (id UUID, name, type,
-- code, parent_org_id, description, logo_url, is_active) and migration 014
-- creates `tenants` (id SERIAL, name, domain, subdomain, status, plan,
-- max_users, max_storage, settings, metadata) via CREATE TABLE IF NOT
-- EXISTS - 014's own (different-shaped, id SERIAL) `organizations` re-
-- definition is therefore a silent no-op, since 001 runs first. Neither
-- surviving shape has the columns the service layer actually writes to.
--
-- This migration adds the missing columns rather than rewriting either
-- service's query layer, matching this project's established pattern of
-- landing a late `9999_zzz...` migration to patch a service/schema gap
-- (see 9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_identity_management_schema.sql).

-- organizations (migration 001) has `is_active BOOLEAN`, no `status` -
-- added here too since organizationManagementService.deleteOrganization
-- soft-deletes via `status`, matching the pattern tenants (migration 014)
-- already uses.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS size VARCHAR(50),
  ADD COLUMN IF NOT EXISTS structure JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS allocated_resources JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- organizationManagementService.getOrganizationUnits/addUnit query
-- `organizational_units` - never created anywhere in the migration set.
CREATE TABLE IF NOT EXISTS organizational_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES organizational_units(id),
  hierarchy_level INTEGER DEFAULT 0,
  profile JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_organizational_units_org ON organizational_units(organization_id);
