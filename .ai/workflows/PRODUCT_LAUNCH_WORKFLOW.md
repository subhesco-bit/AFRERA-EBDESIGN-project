# EBDESIGN Product Launch Workflow

**Document:** Product Launch & Deployment Workflow  
**Date:** September 10, 2026  
**Owner:** Multi-Agent Team  
**Status:** Active

---

## WORKFLOW PHASES

### Phase 1: Repository Cleanup (IMMEDIATE - Day 1)

**Goal:** Remove large files from git, reduce repository size

#### 1.1 Remove node_modules from Git History

**Why:** node_modules adds 400-500MB per backend/frontend  
**Risk:** High - affects git history  
**Time:** 1-2 hours

**Steps:**
```bash
# 1. Verify they're in .gitignore
cat .gitignore | grep node_modules

# 2. Verify no node_modules committed (check git ls-files)
git ls-files | grep node_modules | wc -l

# 3. If found, use BFG to remove (requires BFG tool)
# - Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# - Run: java -jar bfg.jar --delete-folders node_modules .
# - Run: git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 4. Force push (REQUIRES EXPLICIT APPROVAL)
git push origin --force-with-lease main
```

**Approval Gate:** ⚠️ **USER CONFIRMATION REQUIRED BEFORE FORCE PUSH**

**Expected Results:**
- Repository size reduced by ~400-500MB
- Git clone time reduced by 50%

#### 1.2 Remove Build Artifacts

**Affected Directories:**
- `backend/dist/` (if exists)
- `backend/build/` (if exists)
- `frontend/dist/` (if exists)
- `frontend/build/` (if exists)

**Steps:**
```bash
# Verify in .gitignore
grep -E "^(dist|build)/" .gitignore

# Clean local
rm -rf backend/dist backend/build
rm -rf frontend/dist frontend/build

# Commit .gitignore update if needed
git add .gitignore
git commit -m "ensure: build artifacts properly ignored"
```

#### 1.3 Optimize .vibecheck/provenance/edits.jsonl

**Current Size:** ~64MB  
**Concern:** Single file may exceed GitHub limits

**Steps:**
```bash
# Archive old entries (keep last 30 days)
python3 scripts/archive-edits.py --keep-days=30

# Verify size
du -sh .vibecheck/provenance/edits.jsonl

# Add to .gitignore if too large
echo "archive-edits-*.jsonl" >> .gitignore
```

---

### Phase 2: Frontend Completion (Days 2-3)

**Goal:** Implement all 150 frontend pages, 100% completeness

#### 2.1 Generate Missing 27 Pages

**Missing by Category:**
- Reports: 20 pages
- Dashboard: 5 pages
- Financial Services: 4 pages
- Farmer Portal: 7 pages
- Settings: 3 pages

**Process:**
```bash
# 1. Use template generator
npm run generate:pages --category=reports --count=20

# 2. Or manual: Create component structure
frontend/src/pages/reports/
├── ReportsOverview.jsx
├── FarmerEarningsReport.jsx
├── SupplyChainReport.jsx
├── MarketPriceReport.jsx
├── CropYieldReport.jsx
├── WeatherReport.jsx
├── LoanReport.jsx
├── PaymentReport.jsx
├── InsuranceReport.jsx
├── LogisticsReport.jsx
└── ...

# 3. Add routes to frontend/src/router.jsx
# 4. Test navigation
npm run dev
```

**Checklist per Page:**
- ✅ Component file created
- ✅ Route added to router
- ✅ Basic layout (header, content, footer)
- ✅ Zustand store for state
- ✅ API service integration
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive CSS
- ✅ Accessibility attributes
- ✅ Unit tests

#### 2.2 Complete Skeleton Page Implementations

**Current Issue:** Many pages are templates without real functionality

**Conversion Process:**

```javascript
// BEFORE (Skeleton)
export function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <p>Coming soon</p>
    </div>
  );
}

// AFTER (Production)
import { useAnalyticsData } from '../services/analyticsService';
import { useAnalyticsStore } from '../store/analyticsStore';

export function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dateRange, filters } = useAnalyticsStore();

  useEffect(() => {
    loadMetrics();
  }, [dateRange, filters]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getMetrics(dateRange, filters);
      setMetrics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="analytics-page">
      <header className="page-header">
        <h1>Analytics Dashboard</h1>
        <FilterControls />
      </header>
      
      <section className="metrics-grid">
        <MetricCard {...metrics.revenue} />
        <MetricCard {...metrics.transactions} />
        <MetricCard {...metrics.users} />
      </section>

      <section className="charts-grid">
        <PerformanceChart data={metrics.performance} />
        <TrendChart data={metrics.trends} />
      </section>
    </div>
  );
}
```

#### 2.3 Add State Management (Zustand)

**Required for Each Feature Area:**

```javascript
// src/store/farmerStore.js
import { create } from 'zustand';

export const useFarmerStore = create((set) => ({
  farmers: [],
  selectedFarmerId: null,
  filters: {},
  loading: false,
  error: null,

  setFarmers: (farmers) => set({ farmers }),
  setSelectedFarmerId: (id) => set({ selectedFarmerId: id }),
  setFilters: (filters) => set({ filters }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

---

### Phase 3: API Completion (Days 2-3 in parallel)

**Goal:** Verify all routes, complete skeleton services

#### 3.1 Verify All 107 API Routes

**Verification Script:**
```bash
# Test all endpoints
npm run test:api

# Or manual verification
curl -X GET http://localhost:5000/api/farmers -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:5000/api/crops -H "Authorization: Bearer $TOKEN"
curl -X GET http://localhost:5000/api/orders -H "Authorization: Bearer $TOKEN"
# ... continue for all 107 routes
```

**Per-Route Validation:**
- ✅ Endpoint returns correct HTTP status
- ✅ Response shape matches contract
- ✅ Required fields present
- ✅ Pagination works (if applicable)
- ✅ Filtering works (if applicable)
- ✅ Sorting works (if applicable)
- ✅ Error responses are consistent

#### 3.2 Complete M031-M100 Services

**Process:**
```
M031-M040: Supply Chain → 50% implementation
M041-M050: Logistics → 50% implementation
M051-M070: Advanced → 30% implementation
M071-M100: Enterprise → 20% implementation
```

**Per-Service Template:**
```javascript
// backend/src/modules/M031/service.js
const { db } = require('../../core/database');

class SupplyChainService {
  async getChains(filters = {}) {
    const query = db.knex('supply_chains');
    // Apply filters
    if (filters.status) query.where('status', filters.status);
    // Return results
    return query;
  }

  async createChain(data) {
    // Validate
    // Insert
    // Return
  }

  async updateChain(id, data) {
    // Validate
    // Update
    // Return
  }

  async deleteChain(id) {
    // Check references
    // Delete
  }
}

module.exports = new SupplyChainService();
```

---

### Phase 4: Build & Optimization (Day 4)

**Goal:** Production-ready builds, optimized bundle sizes

#### 4.1 Frontend Build

```bash
# Build production bundle
cd frontend
npm run build

# Verify size
du -sh dist/

# Analyze bundle
npm run analyze:bundle

# Target: < 2MB gzipped
# Expected result: dist/ folder ~8-12MB uncompressed
```

#### 4.2 Backend Build

```bash
# Create production-ready backend
cd backend
npm run build:backend

# Verify dependencies (no dev deps in production)
npm prune --production

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

#### 4.3 Environment Configuration

**Create `.env.production`:**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@prod-db:5432/ebdesign
REDIS_URL=redis://prod-redis:6379
MONGODB_URI=mongodb://prod-mongo:27017/ebdesign
JWT_SECRET=<GENERATED_SECRET>
JWT_EXPIRY=7d
CLAUDE_API_KEY=<YOUR_API_KEY>
STRIPE_API_KEY=<YOUR_KEY>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<YOUR_KEY>
AWS_SECRET_ACCESS_KEY=<YOUR_KEY>
LOG_LEVEL=info
SENTRY_DSN=<YOUR_DSN>
```

---

### Phase 5: Database & Migrations (Day 4)

**Goal:** Initialize production database

#### 5.1 Pre-Migration Checklist

- ✅ PostgreSQL 15+ running
- ✅ Database created: `createdb ebdesign_prod`
- ✅ User created with permissions
- ✅ Backup strategy in place
- ✅ Connection string verified

#### 5.2 Run Migrations

```bash
# Run migration script
cd backend
npm run migrate

# Output should show:
# ✓ Migration 000_base_schema.sql
# ✓ Migration 001_users.sql
# ... (96+ migrations total)

# Verify schema
npm run verify:db

# Seed initial data (if needed)
npm run seed:db
```

#### 5.3 Database Verification

```sql
-- Verify tables created
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 523+

-- Verify key tables
SELECT * FROM information_schema.tables 
WHERE table_name IN ('users', 'farmers', 'crops', 'orders');
```

---

### Phase 6: Testing (Day 5)

**Goal:** >80% test coverage, all critical paths passing

#### 6.1 Unit Tests

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Generate coverage report
npm run test:coverage

# Target: >80% for critical paths
```

#### 6.2 Integration Tests

```bash
# Test API endpoints with real database
npm run test:integration

# Test user registration → login flow
npm run test:auth-flow

# Test farmer marketplace flow
npm run test:marketplace-flow
```

#### 6.3 E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Scenarios:
# 1. Farmer onboarding (5 min)
# 2. Market browsing & purchase (10 min)
# 3. Payment checkout (5 min)
# 4. Report generation (3 min)
```

---

### Phase 7: Deployment (Day 6)

**Goal:** Production deployment

#### 7.1 Pre-Deployment Checklist

- ✅ All tests passing
- ✅ Code reviewed
- ✅ Security audit completed
- ✅ Performance benchmarks met
- ✅ Database backups configured
- ✅ Monitoring/alerting configured
- ✅ Runbooks documented
- ✅ Team trained

#### 7.2 Deployment

```bash
# Deploy backend
git push origin main
# → GitHub Actions triggers
# → Runs tests
# → Builds production image
# → Deploys to production
# → Runs smoke tests

# Deploy frontend
# → Build Vite bundle
# → Deploy to CDN
# → Invalidate cache
# → Verify live

# Expected downtime: < 30 seconds
```

#### 7.3 Post-Deployment Verification

```bash
# Check health endpoints
curl https://api.ebdesign.com/health
curl https://api.ebdesign.com/status

# Monitor error rates (Sentry)
# Monitor performance (New Relic/DataDog)
# Check user activity (Analytics)
```

---

## COMMUNICATION PROTOCOL

### Status Updates (Daily at 9 AM)

**Format:**
```
🟢 PHASE 1: Repository Cleanup
├─ ✅ Task 1: Completed
├─ 🔄 Task 2: In Progress (60%)
├─ 📋 Task 3: Queued
└─ ⏸️  Task 4: Blocked by [reason]

Current Blockers: None
Next 24h Goals: Complete tasks 1-2, unblock task 4
```

### Decision Points (Approval Gates)

1. **Git Force Push** (Phase 1) - REQUIRES EXPLICIT USER APPROVAL
2. **Database Migrations** (Phase 5) - REQUIRES BACKUP CONFIRMATION
3. **Production Deployment** (Phase 7) - REQUIRES FINAL SIGN-OFF

### Escalation Path

1. Technical blocker → Document in `.ai/blockers/`
2. Design decision needed → Create `.ai/decisions/DECISION_[NAME].md`
3. Critical issue → Notify via pinned message

---

## TEAM ROLES & RESPONSIBILITIES

| Role | Responsibility | Phase |
|------|-----------------|-------|
| Frontend Agent | Complete UI pages, state management | 2, 5 |
| Backend Agent | API routes, services, tests | 3, 5 |
| Database Agent | Migrations, schema, optimization | 5, 6 |
| DevOps Agent | Build, deployment, monitoring | 4, 6, 7 |
| QA Agent | Testing, verification, sign-off | 5, 6, 7 |

---

## TOOLS & COMMANDS

### Repository Commands
```bash
git status                    # Current state
git log --oneline -20        # Recent commits
git diff main                # What changed
git stash                    # Save work
git reset --hard origin/main # Discard changes
```

### Development Commands
```bash
npm run dev                  # Start development
npm run build                # Build production
npm test                     # Run tests
npm run lint                 # Check code quality
npm run type-check           # TypeScript checks
```

### Database Commands
```bash
npm run migrate              # Run migrations
npm run seed                 # Seed data
npm run db:reset             # Reset to clean state
npm run db:backup            # Create backup
npm run db:restore           # Restore from backup
```

### Deployment Commands
```bash
npm run deploy:staging       # Deploy to staging
npm run deploy:production    # Deploy to production
npm run health:check         # Verify health
npm run logs                 # View logs
npm run rollback             # Rollback deployment
```

---

## RISK MITIGATION

### Risk: Large Git Force Push Breaks Workflow

**Mitigation:**
- Notify all team members before push
- Create backup branch before push
- Use `--force-with-lease` (safer than `--force`)
- Verify clone works after push

### Risk: Database Migration Fails

**Mitigation:**
- Test migrations on staging first
- Create backup before running
- Document rollback procedure
- Have DBA available during execution

### Risk: Build/Deployment Fails

**Mitigation:**
- Run on staging environment first
- Have health checks ready
- Rollback procedure documented
- Team available for monitoring

### Risk: Performance Degrades in Production

**Mitigation:**
- Load test before deployment
- Monitor key metrics (response time, error rate)
- Have scaling plan ready
- CDN configured for static assets

---

## DEFINITIONS

**PHASE COMPLETE:** All tasks in phase marked ✅

**LAUNCH READY:** All 7 phases complete + sign-off obtained

**PRODUCTION:** Live system serving real users

**ROLLBACK:** Revert to previous stable version

---

*Last Updated: 2026-09-10*  
*Status: ACTIVE - Ready for Phase 1 Execution*
