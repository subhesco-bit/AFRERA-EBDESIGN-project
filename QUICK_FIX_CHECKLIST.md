# Quick Fix Checklist - Copy & Paste Ready

## ✅ ALREADY APPLIED (Auto-Fixed)

### 1. Frontend Route Performance
- **File**: `./frontend/src/App.jsx`
- **Status**: ✅ DONE
- **Verify**:
```bash
cd frontend
npm run build
# Bundle should be ~15-20KB smaller
```

### 2. Logger Redaction Fix
- **File**: `./backend/src/utils/logger.js`
- **Status**: ✅ DONE
- **Verify**:
```bash
cd backend
npm start
# Logs should not redact innocent 6-digit numbers
```

### 3. Email Validation Utility
- **File**: `./backend/src/utils/validation.js`
- **Status**: ✅ DONE (NEW FILE)
- **Verify**:
```bash
cd backend
node -e "const v = require('./src/utils/validation'); v.validateEmail('test@example.com'); console.log('✓ Valid')"
```

---

## 📋 MANUAL PATCHES REQUIRED (Instructions Provided)

### 1. Auth Service Fixes
**File**: `./backend/src/services/authService.js`
**Guide**: `./backend/FIXES_authService_GUIDE.md`

**Step 1**: Add validation import (line 16)
```javascript
const { validateEmail, validatePassword, validateTOTPCode } = require('../utils/validation');
```

**Step 2**: Fix loginUser() function (around line 500)
- Search for: `const userResult = await pg.query(userQuery, [email.toLowerCase()]);`
- Replace with:
```javascript
const normalizedEmail = validateEmail(email);
const userResult = await pg.query(userQuery, [normalizedEmail]);
```

**Step 3**: Fix refreshAccessToken() function (around line 750)
- Search for: `WHERE user_id = $1 AND token = $2 AND revoked = FALSE`
- Replace with: `WHERE user_id = $1 AND token = $2 AND revoked = FALSE AND expires_at > NOW()`
- Add after getting result:
```javascript
const tokenRow = tokenResult.rows[0];
if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
  await pg.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1', [tokenRow.id]);
  throw new Error('Refresh token expired');
}
```

**Step 4**: Fix verifyTwoFactor() (around line 810)
- Add at start: `validateTOTPCode(code);`

**Step 5**: Fix registerUser() (around line 280)
- Replace: `const normalizedEmail = (userData.email || '').toLowerCase();`
- With: `const normalizedEmail = validateEmail(userData.email);`
- Add: `validatePassword(userData.password);`

**Time**: 15-20 minutes

---

### 2. Dynamic Loader Optimization
**File**: `./backend/src/core/dynamicServiceLoader.js`
**Guide**: `./backend/FIXES_dynamicLoaders_GUIDE.md`

**Step 1**: Modify _registerService() (around line 70)
- Add property to service entry: `hasSetupRoutes: false`
- Cache detection:
```javascript
let hasSetupRoutes = false;
try {
  const source = fs.readFileSync(filePath, 'utf8');
  hasSetupRoutes = /setupRoutes\s*[:(]/.test(source);
} catch (error) {
  logger.warn(`Could not check setupRoutes: ${serviceName}`);
}
this.services.set(serviceName, {
  // ... existing fields ...
  hasSetupRoutes,  // ← ADD THIS
});
```

**Step 2**: Replace mountServiceRoutes() method (around line 200)
- Replace entire for loop with:
```javascript
for (const [serviceName, entry] of this.services.entries()) {
  if (!entry.hasSetupRoutes) continue;  // ← Use cached flag instead of fs.readFileSync
  
  withSetupRoutes++;
  try {
    const instance = await this.loadService(serviceName);
    const fn = instance?.setupRoutes || instance?.default?.setupRoutes;
    if (typeof fn === 'function') {
      fn.call(instance, app);
      mounted++;
      logger.info(`✅ Mounted service routes: ${serviceName}`);
    }
  } catch (error) {
    logger.warn(`❌ Could not mount setupRoutes for ${serviceName}`, { error: error.message });
  }
}
```

**Step 3**: Add cleanup() method to class
```javascript
async cleanup() {
  const memoryMB = process.memoryUsage().heapUsed / 1024 / 1024;
  const MAX_HEAP_MB = parseInt(process.env.SERVICE_LOADER_MAX_HEAP_MB || '500');
  
  if (memoryMB > MAX_HEAP_MB) {
    logger.warn(`Service loader memory high (${memoryMB.toFixed(0)}MB), evicting...`);
    
    const loadedServices = Array.from(this.services.values())
      .filter(s => s.loaded)
      .sort((a, b) => (a.callCount || 0) - (b.callCount || 0));
    
    const evictionCount = Math.ceil(loadedServices.length * 0.1);
    for (let i = 0; i < evictionCount && i < loadedServices.length; i++) {
      this.unloadService(loadedServices[i].name);
    }
    
    logger.info(`Evicted ${evictionCount} services`);
  }
}
```

**Step 4**: Add periodic cleanup in index.js startup
- In startup() function, after service initialization:
```javascript
if (process.env.NODE_ENV === 'production') {
  setInterval(() => serviceLoader.cleanup(), 60000);  // Every 1 minute
}
```

**Time**: 20-25 minutes

---

## VERIFICATION COMMANDS

### After fixing auth service:
```bash
# Test email validation
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"test"}'
# Expected: "Invalid email format"

# Test valid email
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"test"}'
# Expected: Normal response or auth error (not validation error)
```

### After fixing dynamic loaders:
```bash
# Check startup time (should be 50% faster)
time npm start
# Should be <30s instead of 40-60s

# Check for multiple fs.readFileSync in logs
npm start 2>&1 | grep -i "readFileSync\|setupRoutes" | wc -l
# Should be 0 after caching is applied
```

---

## TIMELINE

| Task | Time | When |
|------|------|------|
| Apply auth fixes | 20 min | Now |
| Apply loader fixes | 25 min | After auth |
| Run tests | 10 min | After both |
| Staging deployment | 15 min | After tests pass |
| Verify in staging | 30 min | Next hour |
| Production deployment | 15 min | If staging OK |
| Monitor (1 hour) | 60 min | After prod |

**Total**: ~2.5 hours

---

## ROLLBACK PLAN

If something goes wrong:

### Frontend:
```bash
git checkout frontend/src/App.jsx
npm run build
```

### Backend (specific files):
```bash
git checkout backend/src/utils/logger.js
git checkout backend/src/utils/validation.js
# Then manually revert authService.js and dynamicServiceLoader.js changes
```

---

## CONTACT

If patches fail or have issues:
1. Check against the guide files
2. Verify file paths match your structure
3. Ensure imports are correct
4. Run: `npm test` to verify no syntax errors

**Issues**: Review the corresponding FIXES_*.md guide file
