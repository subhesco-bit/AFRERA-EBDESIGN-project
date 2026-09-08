# INFRASTRUCTURE REQUIREMENTS ANALYSIS

**Generated:** 2026-09-01  
**Purpose:** Verify actual infrastructure requirements from repository  
**Analysis Method:** Repository-wide code search and dependency tracing

## INFRASTRUCTURE REQUIREMENTS SUMMARY

### PostgreSQL: REQUIRED ✅

**Status:** Service exists (postgresql-x64-18) but cannot start due to permissions

**Usage:** 31+ files across the codebase
- Primary transactional database
- Used by all core services (auth, finance, logistics, commerce, etc.)
- 300+ migration files ready to execute
- Critical for all business logic

**Configuration:**
- Connection: DATABASE_URL or PG_* environment variables
- Database: afrera_db (default) or afrera_production
- Port: 5432
- User: postgres (default) or configured user
- Password: configured via environment

**Migration Count:** 300+ SQL migration files in backend/src/database/migrations/

**Blocker:** Service exists but cannot be started due to Windows permissions

**Action Required:** 
- Need administrative privileges to start PostgreSQL service
- Alternative: Use elevated PowerShell prompt or request admin access

### MongoDB: MINIMAL USAGE ⚠️

**Status:** NOT production-critical for core functionality

**Usage:** Only 3 services (aiService, advancedAIService, aiDecisionService)
- `aiService.js`: Fraud patterns storage (fraud_patterns collection)
- `advancedAIService.js`: Similar AI pattern storage
- `aiDecisionService.js`: Decision context storage

**Purpose:** Document storage for AI patterns and historical data

**Analysis:**
- MongoDB is used for fraud pattern storage in AI services
- This functionality could be migrated to PostgreSQL
- Not critical for core business operations
- Could be initially skipped or migrated to PostgreSQL

**Recommendation:** 
- SKIP for initial production-hardening
- Migrate fraud patterns to PostgreSQL table
- Remove MongoDB dependency

### Redis: REQUIRED ✅

**Status:** Not installed or running

**Usage:** 24+ files across the codebase
- `redis.js`: Cache manager
- `rateLimit.js`/`rateLimiter.js`: Rate limiting
- `database_enhancements.js`: Database caching
- Multiple services: Caching layers for performance

**Purpose:**
- Application caching
- Rate limiting
- Session storage
- Distributed caching

**Configuration:**
- Connection: REDIS_URL or REDIS_HOST/PORT
- Port: 6379
- Database: 0 (default)

**Analysis:**
- Required for production performance
- Critical for rate limiting and caching
- Can be optionally installed locally or use cloud Redis

**Recommendation:**
- Required for production-hardening
- Can use local Redis or cloud alternative
- For development: Can be temporarily disabled with graceful degradation

### Elasticsearch: OPTIONAL ⚠️

**Status:** Referenced in configuration but minimal actual usage

**Usage:** Configuration only, minimal production dependency

**Purpose:** Search functionality

**Recommendation:** 
- Can be deferred
- Not critical for initial production-hardening
- Can be added later for advanced search

## DEPENDENCY MATRIX

| Database | Required For | Core Functionality | Production Critical | Action |
|----------|-------------|-------------------|-------------------|--------|
| PostgreSQL | All services | ✅ | ✅ | PRIORITY 1 - Resolve permissions |
| MongoDB | AI services (3) | ❌ | ❌ | SKIP - Migrate to PostgreSQL |
| Redis | Caching, rate limiting | ✅ | ✅ | PRIORITY 2 - Install or use cloud |
| Elasticsearch | Search | ❌ | ❌ | DEFER - Not critical |

## INFRASTRUCTURE BLOCKERS

### Critical Blocker: PostgreSQL Service Cannot Start

**Error:** `Start-Service: Service 'postgresql-x64-18' cannot be started due to the following error: Cannot open 'postgresql-x64-18' service on computer '.'.`

**Root Cause:** Windows permissions - need administrative privileges

**Resolution Options:**
1. **Elevated PowerShell:** Run PowerShell as Administrator
2. **Request Admin Access:** Ask user to provide admin privileges
3. **Alternative Installation:** Use Docker (not available on this machine)
4. **Cloud Database:** Use cloud PostgreSQL (RDS, Supabase, etc.)

**Current Status:** BLOCKED - Cannot proceed with database migrations without PostgreSQL

## MIGRATION STRATEGY

### MongoDB Migration to PostgreSQL

Since MongoDB is only used for AI fraud patterns (minimal usage), recommend migration:

**Current MongoDB Schema:**
- `fraud_patterns` collection in aiService
- AI decision context storage

**PostgreSQL Migration Plan:**
```sql
CREATE TABLE ai_fraud_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_data JSONB NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_decision_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id TEXT NOT NULL,
  context_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Benefits:**
- Single database system of record
- Reduced infrastructure complexity
- Better transactional guarantees
- Easier backup and recovery

## PARALLEL WORK PROCEEDING

While PostgreSQL permissions are being resolved, proceeding with infrastructure-independent work:

1. ✅ Math.random cleanup audit
2. ✅ Frontend completion
3. ✅ Backend service completion
4. ✅ API hardening
5. ✅ Security review
6. ✅ Orphan file audit
7. ✅ Testing infrastructure setup
8. ✅ Documentation updates

## INFRASTRUCTURE ACTION PLAN

### Immediate (Requires Admin Access)
1. Start PostgreSQL service with elevated privileges
2. Create EBDESIGN database and user
3. Execute database migrations
4. Verify database connectivity

### Medium Priority
1. Install Redis locally or configure cloud Redis
2. Test Redis connectivity
3. Configure caching layer

### Low Priority
1. Migrate MongoDB patterns to PostgreSQL
2. Remove MongoDB dependency
3. Add Elasticsearch for search (deferred)

## NEXT STEPS

**For User:**
- Provide administrative privileges to start PostgreSQL service
- Or authorize use of cloud PostgreSQL service
- Or authorize Redis installation/configuration

**For Claude:**
- Continue infrastructure-independent work in parallel
- Prepare database configuration for when PostgreSQL is available
- Create comprehensive testing framework ready for execution
- Document exact procedures for infrastructure setup

---

**Analysis Complete:** Infrastructure requirements verified  
**Critical Blocker:** PostgreSQL service permissions  
**Parallel Work:** Infrastructure-independent engineering proceeding