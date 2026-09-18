# PHASE 1 STARTUP GUIDE — DEVIN WORK INTEGRATION

**Prepared For:** Ben  
**Date:** 2026-09-10  
**Status:** Ready to Execute  

---

## 🚀 QUICK START (5 MINUTES)

### Step 1: Start Docker Services (2 min)
```bash
cd backend
docker-compose up -d
```

**What happens:**
- PostgreSQL 15 starts (port 5432)
- MongoDB 7 starts (port 27017)
- Redis 7 starts (port 6379)
- RabbitMQ starts (port 5672, admin UI: 15672)
- Elasticsearch starts (port 9200)
- Backend builds and starts with migrations (port 5000)

**Verify:**
```bash
docker-compose ps
# All services should show "Up"

curl http://localhost:5000/health
# Should return: {"status":"operational"}
```

---

### Step 2: Configure Environment (2 min)

**Already done:**
- ✅ `.env.local` created with full configuration template
- ✅ Commented instructions for each setting

**Action:**
1. Open `backend/.env.local`
2. Add your Claude API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-v7-YOUR_KEY_HERE
   ```
3. That's it! Everything else has sensible defaults for local development

---

### Step 3: Backend Integration (1 min)

The backend will automatically:
1. ✅ Connect to PostgreSQL
2. ✅ Execute 96 migrations (523+ tables created)
3. ✅ Initialize library knowledge service
4. ✅ Initialize all routes (107 files)
5. ✅ Start on port 5000

**Verify:**
```bash
# Check services are loaded
curl http://localhost:5000/api/v1/system/services \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.total'  # Should show 140+

# Check routes are mounted
curl http://localhost:5000/api/v1/system/routes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.total'  # Should show 107+
```

---

### Step 4: Frontend Integration (1 min)

**Critical:**

The new AI/security components need to be wired to routes. Before running frontend:

```bash
cd frontend
npm run dev
```

You will see **EXPECTED WARNINGS** for new components not yet routed:
- `/ai/chat` (404)
- `/ai/collaboration` (404)
- `/security/mfa` (404)
- `/privacy/gdpr` (404)
- `/library/browse` (404)
- `/admin/platform` (404)

**This is OK — we'll wire them in Phase 2.**

---

## 📊 INTEGRATION PROGRESS CHECKLIST

### Phase 1 - Critical Blockers
- [ ] **Docker Compose running** — `docker-compose ps` shows all "Up"
- [ ] **PostgreSQL connected** — `curl http://localhost:5000/health` returns "operational"
- [ ] **Migrations executed** — `docker-compose logs backend | grep "Migration"`
- [ ] **Backend started** — Listen on http://localhost:5000
- [ ] **Claude API key configured** — Added to `.env.local`
- [ ] **Frontend dev server running** — Listen on http://localhost:5173

### Phase 1 - Integration Tests
- [ ] **Health check passes** — GET `/health` returns 200
- [ ] **Services loaded** — GET `/api/v1/system/services` returns 140+
- [ ] **Routes mounted** — GET `/api/v1/system/routes` returns 107+
- [ ] **Database migrated** — Check PostgreSQL has 523+ tables
- [ ] **AI coordinator working** — POST `/api/v1/ai/unified` with test query
- [ ] **Library indexed** — GET `/api/v1/library/search?q=test` returns results
- [ ] **Frontend renders** — http://localhost:5173 loads without errors

---

## 🔍 TROUBLESHOOTING

### Docker Services Won't Start

**Problem:** `docker-compose up -d` fails

**Solution:**
```bash
# Check if ports are in use
netstat -ano | findstr :5432  # PostgreSQL
netstat -ano | findstr :27017 # MongoDB
netstat -ano | findstr :6379  # Redis

# Kill existing processes or use different ports in docker-compose.yml
```

### PostgreSQL Connection Timeout

**Problem:** Backend stuck at "Connecting to database..."

**Solution:**
```bash
# Check PostgreSQL is healthy
docker-compose logs postgres | tail -20

# Give it more time to initialize (first run can take 30s)
# Wait 1 minute, then try again

docker-compose restart postgres
```

### Backend Fails to Start

**Problem:** `npm run dev` fails with error

**Solution:**
```bash
# Check for syntax errors
cd backend && npm run lint

# Check environment variables
cat .env.local | grep -v "^#"

# Check migrations ran
docker-compose logs backend | grep "Migration"
```

### Frontend Routes Show 404

**Problem:** New components (AI, MFA, GDPR) show 404

**Solution:**
This is EXPECTED — Phase 2 task. New components exist in `frontend/src/components/` but aren't routed yet.

---

## 📝 MANUAL INTEGRATION CHECKLIST

If you prefer to integrate step-by-step manually:

### 1. Add aiCollaborationService to Backend Startup

**File:** `backend/src/index.js` (around line 425)

```javascript
// Initialize AI collaboration service
try {
  const aiCollaborationService = require('./services/aiCollaborationService');
  await aiCollaborationService.initialize({ syncDatabase: Boolean(db) });
  app.locals.aiCollaborationService = aiCollaborationService;
  logger.info('✅ AI collaboration service initialized');
} catch (error) {
  logger.warn('⚠️  AI collaboration service initialization deferred', { error: error.message });
}
```

### 2. Add MFA & GDPR Middleware

**File:** `backend/src/index.js` (around line 298)

```javascript
// MFA Middleware (protect sensitive routes)
app.use('/api/v1/settings', mfaMiddleware);
app.use('/api/v1/admin', mfaMiddleware);
```

### 3. Wire Frontend Routes

**File:** `frontend/src/config/routes.js`

```javascript
// Add imports at top
const AIChat = lazy(() => import('../components/AI/AIChat'));
const AICollaborationDashboard = lazy(() => import('../components/AI/AICollaborationDashboard'));
const MFASetup = lazy(() => import('../components/Security/MFASetup'));
const GDPRConsent = lazy(() => import('../components/Privacy/GDPRConsent'));
const LibraryBrowser = lazy(() => import('../components/Library/LibraryBrowser'));
const PlatformDashboard = lazy(() => import('../components/Platform/PlatformDashboard'));

// Add routes
export const adminRoutes = [
  // ... existing routes
  {
    path: '/admin/platform',
    component: PlatformDashboard,
    title: 'Platform Dashboard',
    requiresAuth: true,
    roles: ['admin', 'superadmin'],
  },
];

export const protectedRoutes = [
  // ... existing routes
  {
    path: '/ai/chat',
    component: AIChat,
    title: 'AI Assistant',
    requiresAuth: true,
  },
  {
    path: '/ai/collaboration',
    component: AICollaborationDashboard,
    title: 'AI Collaboration',
    requiresAuth: true,
    roles: ['admin'],
  },
  {
    path: '/security/mfa',
    component: MFASetup,
    title: 'Multi-Factor Authentication',
    requiresAuth: true,
  },
  {
    path: '/privacy/gdpr',
    component: GDPRConsent,
    title: 'Privacy & Data',
    requiresAuth: true,
  },
  {
    path: '/library/browse',
    component: LibraryBrowser,
    title: 'Knowledge Library',
    requiresAuth: true,
  },
];
```

---

## ✅ SUCCESS CRITERIA

**Phase 1 is complete when:**

1. ✅ All Docker services running and healthy
2. ✅ PostgreSQL has 523+ tables (migrations executed)
3. ✅ Backend starts without errors
4. ✅ Health check returns "operational"
5. ✅ Frontend loads without console errors
6. ✅ Claude API key configured
7. ✅ All 140+ services loaded
8. ✅ All 107 routes mounted
9. ✅ AI coordinator responding to requests
10. ✅ Library knowledge indexed

**You will see:**
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:5173
- ✅ PostgreSQL with 523+ tables
- ✅ All services initialized
- ✅ Log: "✅ Database connected"
- ✅ Log: "✅ Library knowledge service initialized"
- ✅ Log: "✅ Routes mounted"

---

## 📍 NEXT PHASE

**After Phase 1 completes (all blockers unblocked):**

1. **Wire frontend routes** (6 new components)
2. **Run full system audit** (find all shortcomings)
3. **Fix shortcomings** (bugs, broken code, gaps)
4. **Implement VS Code + Copilot** (dev environment)
5. **Set up comprehensive testing** (unit + integration + E2E)

---

## 📞 QUICK REFERENCE

| Component | URL | Port | Status Command |
|-----------|-----|------|-----------------|
| Backend API | http://localhost:5000 | 5000 | `curl http://localhost:5000/health` |
| Frontend | http://localhost:5173 | 5173 | Browser navigate |
| PostgreSQL | localhost:5432 | 5432 | `docker-compose logs postgres` |
| MongoDB | localhost:27017 | 27017 | `docker-compose logs mongodb` |
| Redis | localhost:6379 | 6379 | `docker-compose logs redis` |
| RabbitMQ Admin | http://localhost:15672 | 15672 | Login: afrera/afrera_password |
| Elasticsearch | http://localhost:9200 | 9200 | `curl http://localhost:9200` |

---

**Ready? Run:** `cd backend && docker-compose up -d`

