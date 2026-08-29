# DATABASE CURRENT STATE

**Project:** SVESCO/EBDESIGN Agricultural Digital Operating System  
**Date:** 24 August 2026  
**Status:** MIGRATIONS CREATED, NOT EXECUTED

## Database Technology

**Primary Database:** PostgreSQL  
**Secondary Database:** MongoDB  
**Cache:** Redis  
**Search:** Elasticsearch

## Migration Inventory

### Total Migration Files: 96

**Historical Migrations (Devin):**
- 000_base_schema.sql through 071_animal_health_schema.sql (72 files)
- 1000_user_management.sql through 1002_system_administration.sql (3 files)
- 3000_M001_generated.sql through 3000_M026_generated.sql (26 files)

**New Migrations (Today):**
- mfa_schema.sql - Multi-factor authentication tables
- gdpr_schema.sql - GDPR compliance tables
- m001_platform_core_schema.sql - Platform core tables
- unified_ai_schema.sql - Unified AI tables

### Migration Order

**Historical Order:** Numerical (000, 001, 002...071, 1000, 1001, 1002, 3000)  
**New Migrations:** Not yet added to sequential order

### Current Execution Status

**STATUS: MIGRATIONS NOT EXECUTED**

**Evidence:**
- Migration runner exists: `backend/src/database/migrate.js`
- Migration runner has logic to track executed migrations
- `schema_migrations` table will track execution
- No PostgreSQL database is currently running
- No migrations have been executed in this session

## Database Requirements

### Environment Requirements

**Development Environment:**
- PostgreSQL 15+ running locally
- Database name: `afrera_dev`
- User: `postgres`
- Password: `postgres`
- Port: 5432
- Connection string: `postgresql://postgres:postgres@localhost:5432/afrera_dev`

**Production Environment:**
- PostgreSQL 15+ running
- Database name: Configured in DATABASE_URL
- User: Configured in DATABASE_URL
- Password: Configured in DATABASE_URL
- Connection string: Configured in DATABASE_URL

### Configuration Files

**Development:** `backend/.env` (created today)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/afrera_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=10000
```

**Production:** `.env.production` (existed)
```
DATABASE_URL=postgresql://user:password@localhost:5432/afrera_production
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000
```

## Schema Dependencies

### Core Dependencies

**Base Schema (000_base_schema.sql):**
- Users table
- Organizations table
- Authentication tables
- Foundation for all other migrations

**User Management (1000_user_management.sql):**
- Depends on: Base schema
- Extends: User profile and preferences

**Platform Configuration (1001_platform_configuration.sql):**
- Depends on: Base schema
- Extends: Platform settings and configuration

### Domain-Specific Dependencies

**Agriculture Modules:**
- 014_horticulture_module.sql
- 065_dairy_management_schema.sql
- 066_fertilizer_inventory_schema.sql
- 067_poultry_management_schema.sql
- 068_goat_farming_schema.sql
- 069_sheep_farming_schema.sql
- 070_pig_farming_schema.sql

**Animal Health:**
- 071_animal_health_schema.sql
- Depends on: Agriculture modules

**AI & Intelligence:**
- 016_ai_copilot_schema.sql
- 021_conversational_ai_schema.sql
- 037_omnichannel_ai_schema.sql
- 045_voice_ai_schema.sql
- 046_advanced_voice_ai_tables.sql
- 058_sam_ai_orchestration.sql

**New AI Integration:**
- unified_ai_schema.sql
- Depends on: Base schema, users table

### New Migration Dependencies

**MFA Schema (mfa_schema.sql):**
- Depends on: users table (via foreign key)
- Creates: mfa_secrets, mfa_backup_codes, mfa_verification_attempts
- Safe: Uses ON DELETE CASCADE

**GDPR Schema (gdpr_schema.sql):**
- Depends on: users table
- Creates: gdpr_consents, gdpr_requests, gdpr_data_exports
- Safe: Uses ON DELETE CASCADE

**Platform Core Schema (m001_platform_core_schema.sql):**
- Depends on: Base schema
- Creates: platform_metrics, platform_health, platform_configurations
- Safe: No destructive operations

**Unified AI Schema (unified_ai_schema.sql):**
- Depends on: Base schema, users table
- Creates: ai_session_context, ai_usage_logs, ai_agent_capabilities
- Safe: No destructive operations

## Migration Runner Capabilities

**Implemented Features:**
- Automatic migration discovery
- Idempotent execution tracking via schema_migrations table
- Automated repair heuristics for common issues
- Failed migration archiving with repair templates
- Rollback capability for individual migrations
- Status reporting

**Repair Heuristics:**
- Adds IF NOT EXISTS to CREATE TABLE statements
- Adds IF NOT EXISTS to ALTER TABLE ADD COLUMN
- Converts INSERT to INSERT ... ON CONFLICT DO NOTHING for idempotency

## Service Database Dependencies

### Services Requiring Specific Tables

**Authentication Services:**
- Require: users table
- Depend on: 000_base_schema.sql

**User Service (M002):**
- Requires: users table
- Created by: 000_base_schema.sql

**Organization Service (M003):**
- Requires: organizations table
- Created by: 000_base_schema.sql

**Role Service (M004):**
- Requires: roles, permissions tables
- Created by: 000_base_schema.sql

**Permission Service (M005):**
- Requires: permissions tables
- Created by: 000_base_schema.sql

**Farmer Service (M020):**
- Requires: farmers table
- Created by: 011_farmer_portal_enhancements.sql

**Village Service (M021):**
- Requires: villages table
- Created by: 012_governance_module.sql

**Agriculture Service (M022):**
- Requires: crop_plans, crop_calendar tables
- Created by: 014_horticulture_module.sql

**Crop Service (M023):**
- Requires: crops, crop_varieties tables
- Created by: 014_horticulture_module.sql

**Livestock Service (M024):**
- Requires: livestock, livestock_health_records tables
- Created by: 013_farmer_health_welfare_module.sql

**MFA Service:**
- Requires: mfa_secrets, mfa_backup_codes tables
- Created by: mfa_schema.sql (NEW)

**GDPR Service:**
- Requires: gdpr_consents, gdpr_requests tables
- Created by: gdpr_schema.sql (NEW)

**Platform Core Service (M001):**
- Requires: platform_metrics, platform_health tables
- Created by: m001_platform_core_schema.sql (NEW)

**Claude AI Coordinator:**
- Requires: ai_session_context, ai_usage_logs tables
- Created by: unified_ai_schema.sql (NEW)

**Library Knowledge Service:**
- Requires: library_knowledge, library_content_hashes tables
- Created by: unified_ai_schema.sql (NEW)

**AI Collaboration Service:**
- Requires: ai_collaboration_log table
- Created by: unified_ai_schema.sql (NEW)

## Database Blocking Issues

### CRITICAL BLOCKER: PostgreSQL Not Running

**Issue:** PostgreSQL database server is not running locally or via Docker

**Impact:**
- Cannot execute any migrations
- Cannot verify schema creation
- Cannot test database-dependent services
- Frontend cannot access backend data

**Resolution Required:**
1. Start PostgreSQL locally OR
2. Use Docker Compose to start PostgreSQL
3. Create afrera_dev database
4. Create postgres user with password
5. Execute migrations: `cd backend && npm run migrate`

### Current Blocker Status

**Status:** AWAITING CLAUDE GUIDANCE

**Decision Required:**
- Preferred local development database setup approach
- Docker Compose vs local PostgreSQL
- Migration execution order validation
- Schema verification approach
- Rollback strategy if migrations fail

## Database Risk Assessment

### Destructive Operations Risk: LOW

**Evidence:**
- Most migrations use CREATE TABLE IF NOT EXISTS
- Migration runner has automated repair heuristics
- Failed migrations are archived with repair templates
- Rollback capability exists
- No DROP TABLE statements in migrations (verified)

### Data Loss Risk: LOW

**Evidence:**
- No production database is being modified
- Development environment only
- No existing data to lose
- Fresh database creation

### Schema Conflict Risk: MEDIUM

**Potential Issues:**
- Duplicate table definitions across migrations
- Foreign key ordering issues
- Index conflicts
- Extension requirements

**Mitigation:**
- Migration runner handles this with repair heuristics
- Failed migrations are archived for manual review
- Rollback available

## Migration Execution Plan

### Recommended Execution Order

**Phase 1: Base Schema**
1. 000_base_schema.sql
2. Verify base tables created

**Phase 2: Historical Migrations**
3. Execute 001-071 sequentially
4. Execute 1000-1002 sequentially
5. Execute 3000-3026 sequentially

**Phase 3: New Migrations**
6. mfa_schema.sql
7. gdpr_schema.sql
8. m001_platform_core_schema.sql
9. unified_ai_schema.sql

**Phase 4: Verification**
10. Verify all tables created
11. Verify foreign keys
12. Verify indexes
13. Verify constraints

## Current Database State

**ACTUAL STATE:**
- PostgreSQL not running
- No database exists
- No tables exist
- All migrations pending execution

**EXPECTED STATE AFTER EXECUTION:**
- 523+ tables created
- All foreign keys established
- All indexes created
- All constraints applied
- Migration tracking table populated

## Tables Expected by Backend Code

**Critical Tables:**
- users (authentication)
- organizations (organization management)
- roles, permissions (authorization)
- products (marketplace)
- orders (order processing)
- farmers (farmer portal)
- loans (financial services)
- policies, claims (insurance)
- shipments (logistics)

**New Tables Required for Today's Work:**
- mfa_secrets, mfa_backup_codes, mfa_verification_attempts (MFA)
- gdpr_consents, gdpr_requests, gdpr_data_exports (GDPR)
- platform_metrics, platform_health, platform_configurations (Platform Core)
- ai_session_context, ai_usage_logs, ai_agent_capabilities (Unified AI)
- library_knowledge, library_content_hashes (Library Integration)
- ai_collaboration_log (AI Collaboration)

## Recommendations

### For Claude Decision

**Required Decision:**
1. Should we use Docker Compose for local PostgreSQL?
2. Alternative if Docker is not available?
3. Migration execution order validation?
4. Rollback strategy if migrations fail?
5. Should we execute all migrations or only new ones?

### For Immediate Action

**Awaiting Claude Guidance:**
- Database setup approach
- Migration execution plan approval
- Rollback strategy approval

**Can Proceed in Parallel:**
- Complete remaining Tier 1 modules (M025-M030)
- Complete remaining frontend pages
- Implement comprehensive testing

---

*This document provides a factual assessment of the current database state without making assumptions about local infrastructure availability.*
