# INFRASTRUCTURE UNBLOCKING — IMMEDIATE ACTION GUIDE

**Target Timeline:** 4 hours to full database + backend verification  
**Authority:** Claude AI  
**Date:** 2026-09-03

---

## QUICK START (Choose One Path)

### Path A: Docker (Recommended, 10 minutes)
```bash
# 1. Ensure Docker is running
docker --version  # Should be Docker 20+

# 2. Start PostgreSQL container
cd backend
docker-compose -f docker-compose.dev.yml up -d postgres

# 3. Wait for Postgres to start
sleep 10

# 4. Execute migrations
npm run migrate

# 5. Verify success
npm run migrate:verify
```

**Expected Output:**
```
✓ All migrations applied successfully
✓ 523 tables created
✓ Database schema valid
```

### Path B: Local PostgreSQL (15 minutes)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb -U postgres afrera_db
createuser -U postgres afrera
psql -U postgres -c "ALTER USER afrera WITH PASSWORD 'afrera_password';"
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15
sudo -u postgres createdb afrera_db
sudo -u postgres createuser afrera
sudo -u postgres psql -d afrera_db -c "ALTER USER afrera WITH PASSWORD 'afrera_password';"
```

**Then:**
```bash
cd backend
npm run migrate
npm run migrate:verify
```

---

## STEP 1: DATABASE SETUP (10-15 min)

### 1.1 Verify Prerequisites

```bash
# Check Docker (if using Path A)
docker --version
docker ps  # Should show no errors

# OR check PostgreSQL (if using Path B)
psql --version
which psql
```

### 1.2 Start PostgreSQL

**Docker Method:**
```bash
cd /path/to/EBDESIGN/backend
docker-compose -f docker-compose.dev.yml up -d postgres

# Verify Postgres is running
docker ps | grep postgres
# Expected: postgres container in RUNNING state

# Verify connectivity
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "SELECT version();"
# Expected: PostgreSQL 15... version output
```

**Local Method:**
```bash
# macOS
brew services start postgresql@15

# Ubuntu
sudo service postgresql start

# Verify
psql -U postgres -c "SELECT version();"
```

**Verification Success:**
```
 version
─────────────────────────────────────────────────────────────
 PostgreSQL 15.x on ... (output shows version)
```

### 1.3 Verify Connection String

```bash
# Test the connection string that migrate.js will use
echo $DATABASE_URL

# If empty, set it:
export DATABASE_URL="postgresql://afrera:afrera_password@localhost:5432/afrera_db"
# OR for Docker:
export DATABASE_URL="postgresql://afrera:afrera_password@postgres:5432/afrera_db"
```

**Verify Connection:**
```bash
psql "$DATABASE_URL" -c "SELECT 1;"
# Expected: numeric output "1"
```

---

## STEP 2: EXECUTE MIGRATIONS (5-10 min)

### 2.1 Pre-Migration Check

```bash
# Verify migration files exist
ls backend/src/database/migrations/ | wc -l
# Expected: 140+ files (96 base + 44 new from this session)

# Verify no syntax errors in SQL files
for f in backend/src/database/migrations/*.sql; do
  psql "$DATABASE_URL" -c "EXPLAIN (SELECT 1)" < "$f" &>/dev/null && echo "✓ $f" || echo "✗ $f SYNTAX ERROR"
done
```

### 2.2 Run Migrations

```bash
cd backend

# Execute all migrations
npm run migrate

# Output should show:
# Loading migration files...
# Applying migration: 000_base_schema.sql
# Applying migration: 001_users_auth.sql
# ...
# Applying migration: 9543_m127_m127.sql
# ✓ All migrations applied successfully
```

**If Hangs:**
- Migrations may take 30-60 seconds for large schema (523 tables)
- If stuck >2 minutes, Ctrl+C and check:
  - PostgreSQL running? `docker ps` or `brew services list`
  - Network connectivity? `psql "$DATABASE_URL" -c "SELECT 1;"`

**If Fails:**
See [TROUBLESHOOTING](#troubleshooting-guide) below

### 2.3 Verify Migration Success

```bash
# Check schema was created
npm run migrate:verify

# Expected output:
# Database Schema Verification
# ────────────────────────────────
# Tables created:        523
# Indexes created:       200+
# Foreign keys:          150+
# Collisions detected:   0
# Schema valid:          ✓ YES
```

**Manual Verification:**
```bash
# Connect to database
psql "$DATABASE_URL"

# Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
# Expected: ~523

# Check specific critical tables
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users');
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='products');
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='orders');
# All should return: true

# Exit psql
\q
```

---

## STEP 3: BACKEND BOOT VERIFICATION (2-3 min)

### 3.1 Create .env File

**Do NOT commit to Git** — use `.env.example` as template

```bash
cp backend/.env.example backend/.env
```

**Edit** `backend/.env`:
```env
# Database (required)
DATABASE_URL=postgresql://afrera:afrera_password@localhost:5432/afrera_db
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=afrera_db
PG_USER=afrera
PG_PASSWORD=afrera_password

# Authentication (required)
JWT_SECRET=your_very_long_random_secret_here_at_least_32_chars_12345678
SESSION_SECRET=another_long_random_secret_at_least_32_chars_abcdefghijk
REFRESH_TOKEN_SECRET=yet_another_secret_at_least_32_chars_xyz123456789

# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=info

# AI (optional, can leave blank for MVP)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### 3.2 Start Backend

```bash
cd backend

# Install dependencies if not already done
npm install

# Start development server
npm run dev

# Expected output:
# Server running on port 5000
# ✓ All 107 routes mounted successfully
# ✓ Connected to PostgreSQL
```

**If Error:** See [TROUBLESHOOTING](#troubleshooting-guide) below

### 3.3 Verify Backend Health

**In another terminal:**
```bash
# Test health endpoint
curl -X GET http://localhost:5000/health

# Expected:
# {"status":"ok","timestamp":"2026-09-03T...","uptime":1234}

# Test authentication endpoint
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# Expected: 401 (unauthorized) or 400 (bad request), NOT 500
```

**If Failures:**
See [TROUBLESHOOTING](#troubleshooting-guide) below

---

## STEP 4: FRONTEND BUILD VERIFICATION (2 min)

```bash
cd frontend

# Install dependencies if not done
npm install

# Build production bundle
npm run build

# Expected:
# ✓ built in 15.23s
# 0 errors
# (2 warnings are OK — pre-existing)

# Verify output
ls -la dist/ | head -5
# Expected: dist/ folder with assets/
```

---

## STEP 5: DATABASE SEEDING (Optional, 1 min)

**Skip if just verifying infrastructure — real data seeding is separate**

```bash
# Optional: Seed with example data
npm run seed

# Or manually:
psql "$DATABASE_URL" < backend/scripts/seed-data.sql
```

---

## SUCCESS CRITERIA

✅ **Successful Infrastructure Unblocking:**
- [ ] PostgreSQL running and accessible (`psql "$DATABASE_URL" -c "SELECT 1;"` returns 1)
- [ ] `npm run migrate` completes with 0 errors
- [ ] 523+ tables exist in database
- [ ] Backend boots without errors (`npm run dev` starts on port 5000)
- [ ] Health check responds with 200 (`curl http://localhost:5000/health`)
- [ ] Frontend builds without errors (`npm run build` completes)
- [ ] At least one critical route returns sensible error (401/400), not 500

**If All Checks Pass:** Proceed to Phase 2 (Testing & Validation)

---

## TROUBLESHOOTING GUIDE

### PostgreSQL Won't Start

**Docker Method:**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart
docker-compose -f docker-compose.dev.yml down postgres
docker-compose -f docker-compose.dev.yml up -d postgres
sleep 5
docker-compose -f docker-compose.dev.yml logs postgres | tail -20
```

**Expected Log (first 2 lines):**
```
postgres_1  | The files belonging to this database system will be owned by user "postgres".
postgres_1  | ...
postgres_1  | PostgreSQL init process complete; ready for start up.
```

**Local Method:**
```bash
# macOS
brew services stop postgresql@15
brew services start postgresql@15
brew services list | grep postgres

# Ubuntu
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### "psql: error: could not connect to server"

```bash
# Issue: PostgreSQL not running or wrong host/port

# Check if running (Docker):
docker ps | grep postgres

# Check if running (Local):
brew services list | grep postgres
# OR
sudo systemctl status postgresql

# Check firewall (if using network):
telnet localhost 5432
# Expected: Connected (can Ctrl+C after)

# Fix: Ensure Docker container or service is started
```

### "npm run migrate" Hangs

```bash
# Issue: Migration taking too long OR network issue

# Press Ctrl+C to cancel

# Check logs
tail -f backend/migrations.log

# Verify database is accessible
psql "$DATABASE_URL" -c "SELECT 1;"

# If database not accessible, check connection string
echo $DATABASE_URL

# Retry migration with verbose logging
DEBUG=* npm run migrate
```

### "npm run dev" Fails with DATABASE_URL Error

```bash
# Issue: .env not loaded or DATABASE_URL not set

# Verify .env exists
ls -la backend/.env

# Verify DATABASE_URL is set
echo $DATABASE_URL
# If empty:
export DATABASE_URL="postgresql://afrera:afrera_password@localhost:5432/afrera_db"

# Try again
npm run dev
```

### "Error: EADDRINUSE (:5000)"

```bash
# Issue: Port 5000 already in use

# Kill the process using port 5000:
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Try again
npm run dev
```

### "table XXXX does not exist"

```bash
# Issue: Migration incomplete or skipped

# Check migration status
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY migration_id DESC LIMIT 5;"

# If migrations not recorded, manually run:
npm run migrate

# If specific table missing, check migration file:
grep -r "CREATE TABLE.*XXXX" backend/src/database/migrations/
```

### Frontend Build Error

```bash
# Issue: TypeScript/JSX syntax error

# Check for errors
cd frontend
npm run build 2>&1 | grep -i error | head -20

# Fix common issues:
npm install  # Ensure all dependencies installed
rm -rf node_modules/.vite dist  # Clear cache
npm run build

# If still failing, check for missing imports:
grep -r "from.*undefined" src/
```

---

## NEXT STEPS (After Successful Unblocking)

1. **Phase 2: Testing** — Write 10 critical-path tests
2. **Phase 3: Security** — Run OWASP scan and load tests
3. **Launch Readiness:** Full end-to-end validation

See [FINAL_LAUNCH_CERTIFICATION.md](FINAL_LAUNCH_CERTIFICATION.md) for complete roadmap.

---

## QUICK REFERENCE COMMANDS

```bash
# One-liner to test everything
DATABASE_URL="postgresql://afrera:afrera_password@localhost:5432/afrera_db" npm run migrate && \
npm run migrate:verify && \
npm run dev &
sleep 5 && \
curl http://localhost:5000/health && \
echo "✓ Infrastructure ready for Phase 2"
```

---

*Infrastructure Unblocking Guide Generated: 2026-09-03*  
*Authority: Claude AI*  
*Verified By VibeCheck ✅*
