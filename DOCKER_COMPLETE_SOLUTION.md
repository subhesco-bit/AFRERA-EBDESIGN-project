# 🐳 EBDESIGN Docker Complete Solution

## Overview: Two-Port Architecture

This Docker setup resolves ALL blockers by creating a **proper two-port architecture**:

```
Internet
   ↓
┌─────────────────────────┐
│  Nginx (Port 3000)      │  ← Frontend UI
│  ├─ React/Vite App      │
│  └─ API Proxy → :3001   │
└─────────────────────────┘
          ↓
   Docker Network (ebdesign-net)
   Hostname Resolution: backend, redis, postgres
          ↓
┌──────────────────────────────────────────┐
│  Backend Container (Port 3001)           │
│  ├─ Node.js Express API                  │
│  ├─ Health checks (/health, /health/ready) │
│  └─ Auto-runs migrations                 │
└──────────────────────────────────────────┘
          ↓
    ┌─────────────┐  ┌─────────────┐
    │ PostgreSQL  │  │   Redis     │
    │ Container   │  │ Container   │
    └─────────────┘  └─────────────┘
```

---

## Installation & Setup

### Prerequisites

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10+

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 1.29+
```

### Step 1: ONE-COMMAND STARTUP

```bash
# From project root directory
bash DOCKER_QUICK_START.sh
```

**This script automatically:**
- ✅ Stops old containers
- ✅ Builds images (backend, frontend)
- ✅ Starts all 4 services (postgres, redis, backend, frontend)
- ✅ Waits for health checks
- ✅ Tests endpoints
- ✅ Shows access URLs

### Step 2: Verify It Works (30 seconds)

```bash
# Terminal 1: See all services
docker-compose -f docker-compose.full.yml ps
# Should show 4 containers, all "healthy"

# Terminal 2: Test backend
curl http://localhost:3001/health
# Expected: {"success": true, "data": {"status": "healthy"}}

curl http://localhost:3001/health/ready
# Expected: {"status": "ready", "checks": {...}}

# Terminal 3: Open browser
http://localhost:3000
# Frontend loads, can access backend via /api/v1/*
```

---

## Architecture Details

### Port Mapping

| Service    | Container Port | Host Port | URL              |
|-----------|-----------------|-----------|------------------|
| Frontend  | 80              | 3000      | http://localhost:3000 |
| Backend   | 3000            | 3001      | http://localhost:3001 |
| PostgreSQL| 5432            | 5432      | localhost:5432    |
| Redis     | 6379            | 6379      | localhost:6379    |

### Docker Network

All containers communicate via the `ebdesign-net` bridge network:

```yaml
networks:
  ebdesign-net:
    driver: bridge
```

**Inside containers**, services resolve by name:
- `postgres:5432` (PostgreSQL)
- `redis:6379` (Redis)
- `backend:3000` (Backend API)

### Healthchecks

Each service has automated healthchecks:

```yaml
postgres:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 5s
  timeout: 5s
  retries: 10
  start_period: 10s

redis:
  test: ["CMD", "redis-cli", "ping"]
  interval: 5s
  timeout: 3s
  retries: 10

backend:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

frontend:
  test: ["CMD", "curl", "-f", "http://localhost:80/"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s
```

Services only start when dependencies are healthy (`depends_on: condition: service_healthy`).

---

## File Structure

```
EBDESIGN/
├── docker-compose.full.yml      ← Main Docker orchestration
├── DOCKER_QUICK_START.sh         ← One-command startup
├── DOCKER_COMPLETE_SOLUTION.md   ← This file
│
├── backend/
│   ├── Dockerfile               ← Backend image
│   ├── package.json
│   ├── src/
│   └── ... (existing backend files)
│
└── frontend/
    ├── Dockerfile               ← Frontend image (Nginx + React)
    ├── nginx.conf               ← Nginx configuration
    ├── package.json
    ├── src/
    └── ... (existing frontend files)
```

---

## Common Commands

### Start Services

```bash
# Using script (recommended)
bash DOCKER_QUICK_START.sh

# Or direct command
docker-compose -f docker-compose.full.yml up -d
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.full.yml logs -f

# Specific service
docker-compose -f docker-compose.full.yml logs -f backend
docker-compose -f docker-compose.full.yml logs -f frontend
docker-compose -f docker-compose.full.yml logs -f postgres
docker-compose -f docker-compose.full.yml logs -f redis
```

### Execute Commands Inside Containers

```bash
# Backend shell
docker-compose -f docker-compose.full.yml exec backend sh

# Run tests
docker-compose -f docker-compose.full.yml exec backend npm test

# Run migrations manually
docker-compose -f docker-compose.full.yml exec backend npm run migrate

# PostgreSQL CLI
docker-compose -f docker-compose.full.yml exec postgres psql -U postgres -d ebdesign_db

# Redis CLI
docker-compose -f docker-compose.full.yml exec redis redis-cli
```

### Stop & Remove Services

```bash
# Stop (keeps data in volumes)
docker-compose -f docker-compose.full.yml stop

# Stop and remove (keeps volumes)
docker-compose -f docker-compose.full.yml down

# Full cleanup (removes everything including volumes)
docker-compose -f docker-compose.full.yml down -v
```

### Rebuild Images

```bash
# Rebuild after code changes
docker-compose -f docker-compose.full.yml up -d --build

# Rebuild specific service
docker-compose -f docker-compose.full.yml up -d --build backend
docker-compose -f docker-compose.full.yml up -d --build frontend
```

---

## Troubleshooting

### Issue: "Port 3000 already in use"

```bash
# Find what's using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use a different port:
# Edit docker-compose.full.yml:
#   ports:
#     - "3002:80"  # Use 3002 instead of 3000
```

### Issue: Backend returns 503 on /health/ready

```bash
# Check logs
docker-compose -f docker-compose.full.yml logs backend

# Wait 30+ seconds for backend to initialize
# Migrations take time on first run

# Check if postgres is healthy
docker-compose -f docker-compose.full.yml exec postgres pg_isready
```

### Issue: "redis" hostname not found

This should NOT happen with proper docker-compose setup. If it does:

```bash
# Verify network
docker network ls
docker network inspect ebdesign_ebdesign-net

# Rebuild
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up -d --build
```

### Issue: Frontend can't reach backend API

Check nginx.conf:

```nginx
# Should proxy to http://backend:3000 (NOT localhost:3000)
location /api/ {
    proxy_pass http://backend:3000;  # ← Correct
}
```

### Issue: Containers crash immediately

```bash
# Check logs
docker-compose -f docker-compose.full.yml logs backend

# Common causes:
# - PORT already in use
# - DATABASE_URL misconfigured
# - Missing npm dependencies
# - Migration failures

# Rebuild with fresh dependencies
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up -d --build
```

---

## Environment Variables

### Backend (.env)

Inside the container, these are set automatically:

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:[REDACTED]@postgres:5432/ebdesign_db
DATABASE_HOST=postgres
DATABASE_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
```

### Frontend

Inside the container:

```bash
VITE_API_URL=http://localhost:3001
```

---

## Testing

### Run All Tests

```bash
docker-compose -f docker-compose.full.yml exec backend npm test
```

### Run Specific Test File

```bash
docker-compose -f docker-compose.full.yml exec backend npm test -- path/to/test.js
```

### Run Tests in Watch Mode

```bash
docker-compose -f docker-compose.full.yml exec backend npm test -- --watch
```

### Run Tests with Coverage

```bash
docker-compose -f docker-compose.full.yml exec backend npm test -- --coverage
```

---

## Performance & Optimization

### Enable Volume Caching

The current setup uses:

```yaml
volumes:
  - ./backend:/app                # Live code reload
  - /app/node_modules             # Exclude node_modules from bind mount
```

This provides:
- ✅ Hot reload on code changes
- ✅ Node modules persist in container

### Database Optimization

PostgreSQL container includes:

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  start_period: 10s  # Wait 10s before first check
```

First migration run takes 30-60 seconds. Subsequent starts are instant.

### Network Optimization

Docker bridge network `ebdesign-net`:
- ✅ Internal DNS resolution (service names resolve automatically)
- ✅ Container-to-container communication optimized
- ✅ Isolation from host network

---

## Production Deployment

### Changes for Production

1. **Use environment files instead of hardcoded values**

```bash
# Create .env.production
DATABASE_URL=postgresql://user:pass@prod-postgres:5432/ebdesign_db
REDIS_HOST=prod-redis.internal
FRONTEND_URL=https://example.com
JWT_SECRET=<strong-secret>
```

2. **Update docker-compose for production**

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
  - JWT_SECRET=${JWT_SECRET}
```

3. **Use persistent volumes**

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
      o: size=1024m
```

4. **Enable logging and monitoring**

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Monitoring & Debugging

### Container Resource Usage

```bash
docker stats --no-stream
```

### View Container Details

```bash
docker inspect ebdesign-backend
docker inspect ebdesign-frontend
```

### Save Logs to File

```bash
docker-compose -f docker-compose.full.yml logs > docker-logs.txt
```

### Real-time Monitoring

```bash
# Terminal multiplexer (tmux/screen)
docker-compose -f docker-compose.full.yml logs -f
# Press Ctrl+C to exit (services keep running)
```

---

## Cleanup & Reset

### Remove All Containers (Keep Volumes)

```bash
docker-compose -f docker-compose.full.yml down
```

### Full Reset (Remove Everything)

```bash
docker-compose -f docker-compose.full.yml down -v
```

### Clean Docker Images

```bash
docker rmi ebdesign-backend ebdesign-frontend
```

### Restart Specific Service

```bash
docker-compose -f docker-compose.full.yml restart backend
docker-compose -f docker-compose.full.yml restart frontend
```

---

## Success Criteria Checklist

After running `bash DOCKER_QUICK_START.sh`:

- [ ] All 4 containers show "healthy" in `docker ps`
- [ ] `curl http://localhost:3001/health` returns 200
- [ ] `curl http://localhost:3001/health/ready` returns 200
- [ ] `curl http://localhost:3000/` returns HTML
- [ ] Browser: http://localhost:3000 loads React app
- [ ] No errors in `docker-compose logs`
- [ ] Backend migrations ran successfully
- [ ] Frontend proxies /api/ to backend
- [ ] Login works (test@example.com / test123)

---

## Two-Port Architecture Benefits

| Benefit | Details |
|---------|---------|
| **Port Isolation** | Frontend 3000, Backend 3001—no conflicts |
| **Proper Routing** | Nginx handles /api/ → backend:3000 |
| **Hostname Resolution** | Services use names (postgres, redis, backend) |
| **Health Checks** | Automatic startup dependency management |
| **Network Security** | Bridge network isolates services |
| **Production Ready** | Nginx is production HTTP server |
| **Scalability** | Easy to add more services to network |
| **Hot Reload** | Code changes reflect immediately |

---

## Support & Issues

If you encounter issues:

1. **Check logs first:**
   ```bash
   docker-compose -f docker-compose.full.yml logs
   ```

2. **Verify services are healthy:**
   ```bash
   docker-compose -f docker-compose.full.yml ps
   ```

3. **Test endpoints:**
   ```bash
   curl http://localhost:3001/health/ready
   ```

4. **Full reset and rebuild:**
   ```bash
   docker-compose -f docker-compose.full.yml down -v
   docker-compose -f docker-compose.full.yml up -d --build
   ```

---

## Next Steps

✅ **Run:** `bash DOCKER_QUICK_START.sh`
✅ **Wait:** 20-30 seconds for services to be healthy
✅ **Test:** `curl http://localhost:3001/health/ready`
✅ **Browse:** http://localhost:3000
✅ **Done!** Two-port architecture working perfectly

---

*Last Updated: 2026-09-03*
*EBDESIGN Docker Solution v1.0*
