# IMMEDIATE STARTUP GUIDE
**Get EBDESIGN running in 30 minutes**

## STEP 1: PostgreSQL + Redis Setup (10 minutes)

### Windows with Docker Desktop:

```bash
# Navigate to project root
cd C:\Users\DIYA GOEL\Downloads\EBDESIGN

# Start containers
docker-compose -f docker-compose-postgres.yml up -d

# Verify containers are running
docker ps

# Expected output:
# ebdesign-postgres (STATUS: Up)
# ebdesign-redis (STATUS: Up)
# ebdesign-pgadmin (STATUS: Up)
```

**Verification:**
```bash
# Test PostgreSQL connection
psql -h localhost -U ebdesign_user -d ebdesign -c "SELECT version();"
# Expected: PostgreSQL 15.x on...
```

### PgAdmin Access (Optional - Visual DB Management):
- URL: http://localhost:5050
- Email: admin@ebdesign.local
- Password: admin

---

## STEP 2: Backend Configuration (5 minutes)

### Copy environment template:
```bash
cd backend

# Copy .env template
cp .env.example .env

# Edit .env and add your ANTHROPIC_API_KEY
# Open: backend/.env
# Find: ANTHROPIC_API_KEY=sk-ant-v0-[PASTE_YOUR_KEY_HERE]
# Replace with: ANTHROPIC_API_KEY=sk-ant-v0-xxxxxxxxxxxx
```

**Quick verification:**
```bash
cat backend/.env | grep ANTHROPIC_API_KEY
# Should show your key (not [PASTE_YOUR_KEY_HERE])
```

---

## STEP 3: Backend Startup (10 minutes)

```bash
cd backend

# Install dependencies (if not done)
npm install

# Run database migrations
npm run migrate

# Expected output:
# ✅ Starting migration execution...
# [1/96] 000_initial_schema.sql ... OK (2.3s)
# [2/96] 001_users_table.sql ... OK (1.1s)
# ...
# [96/96] advanced_search_schema.sql ... OK (3.2s)
# ✅ All 96 migrations completed successfully (156.4s total)
```

**Verify database is ready:**
```bash
npm run db:test-connection
# Expected: ✅ PostgreSQL Connected
# Tables created: 523+
```

### Start backend server:
```bash
npm run dev

# Expected output:
# ✅ Server running on port 3000
# ⏳ Initializing Library Knowledge Service...
# ✅ Library indexed: 524 cards
# ✅ AI Collaboration initialized
# ✅ Health checks ready at /health
```

**Test backend is running:**
```bash
curl http://localhost:3000/health
# Expected: { "status": "healthy", "services": {...} }
```

---

## STEP 4: Frontend Startup (5 minutes)

**In a new terminal:**
```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Expected output:
# ✅ VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

**Access frontend:**
- Open browser: http://localhost:5173
- Expected: Dashboard loads, no console errors

---

## STEP 5: Verify Full System (5 minutes)

### Backend Health:
```bash
curl http://localhost:3000/health/live
# Expected: { "status": "alive" }

curl http://localhost:3000/health/ready
# Expected: { "status": "ready" }
```

### Database Connectivity:
```bash
npm run db:validate
# Expected: ✅ All 523 tables present
```

### Frontend Load:
```bash
# Visit: http://localhost:5173
# Expected: Dashboard visible, no errors in console
```

### API Call (Test):
```bash
curl -X GET http://localhost:3000/api/v1/library/catalog \
  -H "Authorization: Bearer [token]"
# Should return library data or 401 if no auth
```

---

## QUICK TROUBLESHOOTING

### PostgreSQL Connection Failed
```bash
# Check if container is running
docker ps | grep postgres

# If not running:
docker-compose -f docker-compose-postgres.yml up -d postgres

# Check logs:
docker logs ebdesign-postgres
```

### Migrations Failed
```bash
# Check migration status
npm run db:status

# Rollback and retry
npm run db:rollback
npm run migrate
```

### API Key Not Working
```bash
# Verify key is set
echo $ANTHROPIC_API_KEY  # Should print key, not placeholder

# Test connection
node backend/src/core/claudeAICoordinator.js --test
# Expected: ✅ Claude AI connection successful
```

### Port Already in Use
```bash
# If port 3000 (backend) in use:
kill $(lsof -t -i:3000)
npm run dev

# If port 5173 (frontend) in use:
kill $(lsof -t -i:5173)
npm run dev
```

---

## STOP/RESTART (When Needed)

### Stop all services:
```bash
# Stop backend (in backend terminal): Ctrl+C
# Stop frontend (in frontend terminal): Ctrl+C

# Stop Docker containers:
docker-compose -f docker-compose-postgres.yml down

# Clean restart:
docker-compose -f docker-compose-postgres.yml down -v  # Remove volumes
docker-compose -f docker-compose-postgres.yml up -d
```

---

## STATUS CHECKLIST

```
✅ PostgreSQL running (docker ps shows ebdesign-postgres)
✅ Redis running (docker ps shows ebdesign-redis)
✅ Backend migrations complete (523 tables)
✅ Backend server running on port 3000
✅ Backend health check passes
✅ Frontend running on port 5173
✅ Frontend dashboard loads
✅ ANTHROPIC_API_KEY configured
✅ Claude AI connection works

If all above are ✅, system is READY for T01-T04 execution.
```

---

## NEXT: Execute Wave 1 Tasks

Once this startup is complete, proceed with:
- **T01:** Repair 2 failing frontend test suites
- **T02:** Browser a11y & responsive validation
- **T04:** API/page/module audit
- **T05a:** Dependency audit

See **CRITICAL_PATH_TODO.md** for detailed task instructions.

---

**Estimated Time to Full Startup:** 30 minutes  
**Status:** READY FOR WAVE 1 EXECUTION

