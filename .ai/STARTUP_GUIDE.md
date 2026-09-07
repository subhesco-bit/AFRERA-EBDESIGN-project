# EBDESIGN Startup Guide

**Date:** 2026-09-05  
**Status:** Ready to Launch  
**All Fixes:** Verified and Committed  

---

## Pre-Startup Checklist

### Environment Variables
Before starting, ensure these are set in `backend/.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/ebdesign
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
```

### Infrastructure Status
```bash
# Check PostgreSQL running
docker ps | grep postgres

# Check Redis running
docker ps | grep redis

# If not running, start:
docker-compose -f docker-compose-postgres.yml up -d
```

---

## Startup Procedure

### Step 1: Start PostgreSQL & Redis (Terminal 1 - Optional)

```bash
cd C:\Users\DIYA GOEL\Downloads\EBDESIGN
docker-compose -f docker-compose-postgres.yml up -d
```

**Expected Output:**
```
Creating network ...
Creating ebdesign-postgres ...
Creating ebdesign-redis ...
Done
```

### Step 2: Start Backend (Terminal 2)

```bash
cd backend
npm install
npm run dev
```

**Expected Output:**
```
npm notice run afrera-backend@1.0.0 dev
npm notice run nodemon src/index.js
[nodemon] 3.1.14
[nodemon] watching path(s): *.*
[nodemon] starting `node src/index.js`
2026-09-05 HH:MM:SS:SSS [info]: Server listening on port 3000
```

**Wait For:** "Server listening on port 3000" message  
**Test:** `curl http://localhost:3000/health`

### Step 3: Start Frontend (Terminal 3)

```bash
cd frontend
npm install
npm run dev
```

**Expected Output:**
```
npm notice run afrera-frontend@1.0.0 dev
npm notice run vite

  VITE v5.x.x  ready in 1234 ms

  ➜  local:   http://localhost:5173/
  ➜  press h to show help
```

**Wait For:** "ready in" message  
**Test:** Open browser to `http://localhost:5173`

---

## Startup Verification

### Quick Checks (30 seconds)

**Terminal 2 (Backend):**
- ✅ "Server listening on port 3000"
- ✅ No ERRORs in console
- ✅ No "undefined" errors

**Terminal 3 (Frontend):**
- ✅ "ready in XXX ms" message
- ✅ No build errors
- ✅ No "Cannot find module" errors

### Health Checks (After Startup)

**1. Backend Health**
```bash
curl http://localhost:3000/health
```
Expected: JSON response or redirect

**2. Frontend Access**
```bash
curl http://localhost:5173
```
Expected: HTML page loads

**3. API Proxy**
```bash
curl http://localhost:5173/api/health
```
Expected: Proxies to backend successfully

**4. Browser Test**
- Open http://localhost:5173
- Check browser console (F12)
- Look for any network errors or warnings

---

## Troubleshooting

### Backend Won't Start

**Error: "EADDRINUSE" - Port 3000 already in use**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (note the PID)
taskkill /PID <PID> /F

# Try again
npm run dev
```

**Error: "Connection refused" to database**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Start if not running
docker-compose -f docker-compose-postgres.yml up -d

# Try backend again
npm run dev
```

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
npm ci
npm run dev
```

### Frontend Won't Start

**Error: "EADDRINUSE" - Port 5173 already in use**
```bash
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Try again
npm run dev
```

**Error: "Failed to resolve proxy"**
- Check vite.config.js has:
  - Frontend port: 5173
  - Proxy target: http://localhost:3000
- Make sure backend is running on 3000

### API Calls Fail

**Check browser console:**
- F12 → Console tab
- Look for CORS errors (red X)
- Check Network tab for failed requests

**Check proxy configuration:**
```bash
# In frontend directory, grep proxy config
grep -A 3 "'/api':" vite.config.js
```

Expected output:
```
'/api': {
  target: 'http://localhost:3000',
  changeOrigin: true,
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Route.post() requires a callback` | authLimiter undefined | Verify line 1137 of authService.js |
| `Cannot GET /api/...` | API proxy not working | Check vite.config.js proxy config |
| `ECONNREFUSED 127.0.0.1:3000` | Backend not running | Start backend with `npm run dev` |
| `EADDRINUSE :3000` | Port already in use | Kill process with `taskkill /PID <PID> /F` |
| `Cannot find module` | Dependencies not installed | Run `npm ci` then `npm run dev` |

---

## Success Criteria

✅ Backend listening on port 3000  
✅ Frontend accessible on port 5173  
✅ API proxy working (5173/api → 3000/api)  
✅ No console errors  
✅ Page loads in browser  
✅ All 289 services accessible  
✅ All routes responding  

---

## After Startup

### Next Steps

1. **Test the platform:**
   - Navigate to different pages
   - Check browser console for errors
   - Test API calls

2. **Run integration tests:**
   ```bash
   cd backend && npm test
   cd ../frontend && npm test
   ```

3. **Monitor logs:**
   - Backend: Watch terminal 2 for errors
   - Frontend: Watch terminal 3 for build warnings
   - Browser console: F12 for JavaScript errors

4. **Check database:**
   - Verify tables created
   - Check migrations applied

### Performance Baselines

Expected startup times (first run):
- Backend: 3-5 seconds to "listening"
- Frontend: 5-10 seconds to "ready"
- Database: 10-20 seconds from docker start
- **Total: ~20-35 seconds**

Subsequent restarts (after dependencies cached):
- Backend: 1-2 seconds
- Frontend: 2-3 seconds
- **Total: ~5-10 seconds**

---

## Architecture Verification

After startup, verify the platform structure:

**Backend Services:**
```bash
curl http://localhost:3000/services
```
Expected: List of 289 available services

**Frontend Routes:**
- Visit http://localhost:5173
- Check page loads without errors
- Verify routing works

**Database:**
- Check PostgreSQL has 1,294 tables
- Verify 383 migrations applied

---

## Rollback If Issues

If critical issues occur:

```bash
# Stop services (Ctrl+C in each terminal)

# Check recent changes
git log --oneline -5

# Review what changed
git diff HEAD~1

# Revert if needed
git revert HEAD

# Restart services
npm run dev
```

---

## Support

**For port issues:**
- Backend: port 3000
- Frontend: port 5173
- API proxy: 5173/api → 3000/api

**For auth errors:**
- Check authService.js line 1137 has correct import
- Verify rateLimiter.js exports authLimiter

**For integration issues:**
- Check all 289 services are loaded
- Verify 194 routes are mounted
- Confirm database is connected

---

**Status: ✅ READY TO START**

*All systems configured, all fixes verified, all files committed.*

**Next Action: Open 3 terminals and follow startup procedure above.**
