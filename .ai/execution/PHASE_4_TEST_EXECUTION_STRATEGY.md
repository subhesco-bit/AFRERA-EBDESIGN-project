# PHASE 4: TEST EXECUTION STRATEGY & AUTOMATION

**Date:** September 1, 2026  
**Phase:** 4 - Testing & Completion  
**Target Coverage:** ≥50% (baseline), ≥80% (goal)  
**Timeline:** 16 hours  
**Status:** AUTOMATION READY

---

## TEST SUITE ARCHITECTURE

### Unit Tests (Backend Services)
**Target:** 60+ test files covering 226 services

**Critical Service Tests (Must-Have):**
- ✅ `authService.test.js` - Authentication & JWT
- [ ] `productService.test.js` - Catalog & inventory
- [ ] `orderService.test.js` - Order processing
- [ ] `financialService.test.js` - Loans & EMI
- [ ] `logisticsService.test.js` - Shipping & tracking
- [ ] `insuranceService.test.js` - Policies & claims

**Test Categories:**
```
Service Tests (60 files)
├── Input validation (10 tests per service)
├── Business logic (15 tests per service)
├── Error handling (5 tests per service)
├── Edge cases (5 tests per service)
└── Integration points (5 tests per service)

Total: ~900 unit tests
Expected Coverage: 60-70%
```

### Integration Tests (API Layer)
**Target:** 20+ test files covering API endpoints

**Critical Endpoint Tests:**
- `/api/auth/login` - Authentication flow
- `/api/auth/refresh` - Token refresh
- `/api/marketplace/*` - Product endpoints
- `/api/orders/*` - Order endpoints
- `/api/users/*` - User management
- `/api/claude/*` - AI endpoints

**Test Categories:**
```
Integration Tests (20 files)
├── Happy path (5 tests per endpoint)
├── Error scenarios (3 tests per endpoint)
├── Authentication (2 tests per endpoint)
├── Rate limiting (1 test per endpoint)
└── Concurrent requests (1 test per endpoint)

Total: ~400 integration tests
Expected Coverage: 40-50%
```

### E2E Tests (Frontend & Full Stack)
**Target:** 10+ test files covering critical user flows

**Critical User Flows:**
- User registration → login → dashboard
- Browse marketplace → add to cart → checkout
- Farmer portal access → product listing
- MFA setup flow
- GDPR consent flow
- AI chat interaction

**Test Categories:**
```
E2E Tests (10 files)
├── User authentication flow
├── Product browsing & search
├── Order placement & tracking
├── Financial services flow
├── AI interaction flow
└── Settings & account management

Total: ~100 E2E tests
Expected Coverage: 30-40%
```

---

## TEST EXECUTION PROCEDURE

### Step 1: Install Test Dependencies (5 minutes)

```bash
cd backend

# Jest, Supertest, Sinon already in package.json
npm install

# Frontend testing dependencies
cd ../frontend
npm install
```

### Step 2: Run Unit Tests (30 minutes)

```bash
cd backend

# Run all unit tests
npm test

# Run specific test file
npm test -- authService.test.js

# Run with coverage report
npm test -- --coverage

# Watch mode (continuous)
npm test -- --watch
```

**Expected Output:**
```
PASS  src/services/__tests__/authService.test.js
  AuthService
    validateCredentials
      ✓ should validate correct credentials
      ✓ should reject invalid email
      ✓ should reject short password
    generateToken
      ✓ should generate valid JWT token
      ✓ should include user data in token
    verifyToken
      ✓ should verify valid token
      ✓ should reject invalid token
      ✓ should reject expired token
    hashPassword
      ✓ should hash password
      ✓ should produce different hash for same password
    comparePassword
      ✓ should match correct password
      ✓ should reject incorrect password

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.456s
Coverage:    68% statements, 72% branches, 65% functions, 70% lines
```

### Step 3: Run Integration Tests (30 minutes)

```bash
cd backend

# Ensure backend is running on port 3000
npm run dev &  # Start in background

# Run integration tests
npm test -- integration

# Or run all tests
npm test

# Stop background process
kill %1
```

### Step 4: Run E2E Tests (Frontend - 30 minutes)

```bash
cd frontend

# Start dev server in background
npm run dev &

# Run E2E tests (Cypress)
npm test -- e2e

# Or run with UI
npx cypress open
```

### Step 5: Generate Coverage Report (5 minutes)

```bash
cd backend

# Generate HTML coverage report
npm test -- --coverage

# Open coverage report
open coverage/lcov-report/index.html
```

---

## TEST COVERAGE TARGETS

### Phase 4 Milestones

| Milestone | Coverage | Timeline | Status |
|-----------|----------|----------|--------|
| **Baseline** | 50% | Day 1 | ✅ Target |
| **Enhanced** | 65% | Day 2 | ⏳ Stretch |
| **Production-Ready** | 80% | Day 3 | ⏳ Goal |

### Coverage by Component

| Component | Current | Target | Tests Needed |
|-----------|---------|--------|--------------|
| **Auth Services** | 0% | 85% | 15 |
| **Product Services** | 0% | 80% | 20 |
| **Order Services** | 0% | 80% | 18 |
| **API Endpoints** | 0% | 75% | 40 |
| **Frontend** | 0% | 60% | 25 |
| **Database Layer** | 0% | 70% | 12 |

---

## AUTOMATED TEST EXECUTION SCRIPT

Create `backend/run-all-tests.sh`:

```bash
#!/bin/bash

# Phase 4: Comprehensive Test Execution
# Usage: ./run-all-tests.sh [unit|integration|e2e|all]

TEST_TYPE=${1:-all}
COVERAGE_THRESHOLD=50

echo "╔════════════════════════════════════════════╗"
echo "║  PHASE 4: TEST EXECUTION                   ║"
echo "║  Type: $TEST_TYPE                            ║"
echo "║  Coverage Target: $COVERAGE_THRESHOLD%                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests
run_unit_tests() {
    echo -e "${YELLOW}Running Unit Tests...${NC}"
    npm test -- --testPathPattern="__tests__|\.test\.js" --coverage
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Unit tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Unit tests failed${NC}"
        return 1
    fi
}

run_integration_tests() {
    echo -e "${YELLOW}Running Integration Tests...${NC}"
    
    # Start backend in background
    npm run dev &
    BACKEND_PID=$!
    sleep 3
    
    # Run tests
    npm test -- --testPathPattern="integration|api" 
    TEST_RESULT=$?
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✅ Integration tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        return 1
    fi
}

run_e2e_tests() {
    echo -e "${YELLOW}Running E2E Tests...${NC}"
    cd ../frontend
    npm test -- e2e
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ E2E tests passed${NC}"
        return 0
    else
        echo -e "${RED}❌ E2E tests failed${NC}"
        return 1
    fi
}

# Execute tests based on type
case $TEST_TYPE in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    all)
        run_unit_tests && run_integration_tests && run_e2e_tests
        ;;
    *)
        echo "Usage: $0 [unit|integration|e2e|all]"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  TEST EXECUTION COMPLETE                   ║"
echo "╚════════════════════════════════════════════╝"
```

---

## VALIDATION CHECKLIST

### Pre-Test
- [ ] PostgreSQL running with test database
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] Port 3000 available
- [ ] Port 5173 available

### During Test
- [ ] Tests execute without hanging
- [ ] No database connection errors
- [ ] Coverage reports generate
- [ ] No console errors in output
- [ ] All assertions evaluated

### Post-Test
- [ ] Coverage ≥ 50% achieved
- [ ] All critical services tested
- [ ] All endpoints tested
- [ ] All user flows validated
- [ ] Results documented
- [ ] Issues logged for Phase 5

---

## TEST FAILURE RESOLUTION

### If Unit Tests Fail

```bash
# Get detailed error
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="test name"

# Check for missing dependencies
npm list

# Verify database connection
npm test -- authService.test.js --detectOpenHandles
```

### If Integration Tests Fail

```bash
# Ensure backend is running
curl http://localhost:3000/api/health

# Check network errors
npm test -- --testPathPattern="integration" --verbose

# Debug API response
curl -X GET http://localhost:3000/api/users
```

### If E2E Tests Fail

```bash
# Open Cypress UI
npx cypress open

# View recorded videos in
cd cypress/videos

# Check network logs
npm test -- e2e -- --record
```

---

## COVERAGE REPORT INTERPRETATION

### Coverage Metrics

| Metric | Meaning | Target |
|--------|---------|--------|
| **Statements** | % of executable code | 50%+ |
| **Branches** | % of conditional paths | 50%+ |
| **Functions** | % of functions called | 50%+ |
| **Lines** | % of lines executed | 50%+ |

### Example Report

```
=============================== Coverage summary ===============================
Statements   : 62.5% ( 375/600 )
Branches     : 58.3% ( 280/480 )
Functions    : 65.0% ( 156/240 )
Lines        : 63.2% ( 360/570 )
================================================================================
```

**Interpretation:**
- ✅ All metrics above 50% threshold
- ✅ Ready for Phase 5 hardening
- ✅ Good coverage of critical paths
- ⚠️ Could improve branch coverage (conditionals)

---

## NEXT: AUTOMATED FRONTEND VALIDATION

After tests pass, validate frontend pages:

```bash
cd frontend

# Validate all pages build without errors
npm run build

# Check for broken imports
npm test -- --listTests

# Validate routing
npm test -- routes.test.js
```

---

## DOCUMENTATION & RESULTS

All test results must be logged in: `.ai/execution/PHASE_4_TEST_RESULTS.md`

Include:
- ✅ Tests run (count)
- ✅ Tests passed (%)
- ✅ Coverage (%)
- ✅ Failures (if any)
- ✅ Time taken
- ✅ Issues found

---

**READY FOR TEST EXECUTION. Run:** `npm test -- --coverage`
