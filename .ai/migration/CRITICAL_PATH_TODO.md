# CRITICAL PATH TODO & IMPLEMENTATION GAP MAP
**EBDESIGN Production Readiness - Master Execution Checklist**

**Authority:** Deepak Final.md + Current 7 TODO Items + Migration Framework  
**Purpose:** Convert documentation into executable implementation tasks  
**Completion Rule:** Nothing is complete without evidence  
**Status:** Phase 1 Analysis → Phase 2-7 Execution Ready

---

## EXECUTIVE PRIORITY MATRIX

### Blocker Tasks (Must Resolve Before Phase 2)
- [ ] T00a: PostgreSQL instance decision (Docker vs RDS) - Claude decision required
- [ ] T00b: ANTHROPIC_API_KEY provision - User action required
- [ ] T00c: Truthpack/vibecheck restoration - Reference verification

### Wave 1: Stabilization (72 hours, enables MVP)
- [ ] T01: Repair 2 failing frontend test suites (6 hours)
- [ ] T02: Browser accessibility & responsive validation (8 hours)
- [ ] T04: API/page/module mismatch audit (8 hours)
- [ ] T05a: Breaking-major dependency audit (4 hours)
- [ ] T07a: Mobile project structure assessment (2 hours)

### Wave 2: Core Workflow Implementation (5-7 days)
- [ ] T06a: Complete booking flow end-to-end (16 hours)
- [ ] T06b: Complete policy flow end-to-end (16 hours)
- [ ] T06c: Complete claim flow end-to-end (16 hours)
- [ ] T06d: Complete logistics flow end-to-end (16 hours)
- [ ] T06e: Complete loyalty flow end-to-end (8 hours)

### Wave 3: System Verification (3 days)
- [ ] T03: Reference attachment comparison (when available)
- [ ] T08: Database migration & integrity verification (8 hours)
- [ ] T09: Complete wiring/communication test (12 hours)
- [ ] T10: WCAG interaction & accessibility sign-off (10 hours)

---

## TIER 1: BLOCKER RESOLUTION (IMMEDIATE)

### T00a: PostgreSQL Instance Decision
**Owner:** Claude  
**Effort:** 1 hour decision + 2 hours setup  
**Status:** 🔴 BLOCKING PHASE 2

**Decision Required:**
- [ ] Option A: Docker PostgreSQL (for dev/testing)
  - Pros: No cloud account, instant local setup
  - Cons: Requires Docker running locally
- [ ] Option B: AWS RDS (for staging/production)
  - Pros: Managed, production-ready, no ops
  - Cons: Requires AWS account, monthly costs
- [ ] Option C: Google Cloud SQL
  - Pros: Alternative managed service
  - Cons: Different tooling/setup

**Implementation (Once Decided):**
```bash
# Option A: Docker
docker-compose -f docker-compose-db.yml up -d postgresql
docker exec postgresql pg_isready -U ebdesign_user

# Option B: AWS
# 1. Create RDS instance
# 2. Get endpoint
# 3. Add to backend/.env: DATABASE_URL=postgresql://...
psql $DATABASE_URL -c "SELECT version();"

# Verification
npm run db:test-connection
# Expected: ✅ PostgreSQL Connected
```

**Acceptance:**
- [x] PostgreSQL instance running and accessible
- [x] Connection string works from backend
- [x] Test query returns current timestamp
- [x] Connection pooling tested
- [x] Backup procedure documented

---

### T00b: ANTHROPIC_API_KEY Provision
**Owner:** User  
**Effort:** 5 minutes  
**Status:** 🔴 BLOCKING PHASE 5

**Action:**
1. [ ] User has API key from Anthropic dashboard
2. [ ] Key is added to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-v0-xxxxx
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   ```
3. [ ] Key is NOT committed to git
4. [ ] Key rotation procedure documented

**Verification:**
```bash
node backend/src/core/claudeAICoordinator.js --test-connection
# Expected: ✅ Claude AI connection successful
```

**Acceptance:**
- [x] API key stored securely in .env
- [x] No key appears in git history
- [x] Connection test passes
- [x] Rate limits understood

---

### T00c: Truthpack Restoration (Reference Verification)
**Owner:** Claude  
**Effort:** 2 hours  
**Status:** 🟡 VALIDATE IF REQUIRED

**Check:**
- [ ] Does `.vibecheck/truthpack/` exist?
- [ ] If yes: are all files present? (product.json, routes.json, etc.)
- [ ] If no: can they be regenerated?

**If Truthpack Required:**
```bash
cd .vibecheck
vibecheck truthpack --regenerate

# Verify regenerated truthpack
vibecheck truthpack --validate
# Expected: ✅ All truthpack files valid
```

**If Optional:** Mark as DEFERRED post-MVP

---

## TIER 2: WAVE 1 STABILIZATION (72 HOURS)

### T01: Repair 2 Failing Frontend Test Suites
**Owner:** Devin  
**Effort:** 6 hours  
**Status:** 🔴 CRITICAL BLOCKER  
**Details:** See current test failure screenshot

**Step 1: Identify Failing Suites (30 min)**
```bash
cd frontend
npm test 2>&1 | tee test-output.log

# Capture:
# - Which 2 test files fail?
# - What is the exact failure? (assertion / rendering / routing / async)
# - Full stack trace
# - Test environment state
```

**Step 2: Root Cause Analysis (2 hours)**

For each failing test:
- [ ] Run test in isolation: `npm test -- specific-test.js`
- [ ] Add console.log to understand state
- [ ] Check for timing issues: async/await, setTimeout, promises
- [ ] Check for missing mocks: API calls, localStorage, document
- [ ] Check for rendering issues: React hooks, state updates
- [ ] Check for routing issues: Link components, navigation
- [ ] Compare test against production code behavior

**Step 3: Fix Production Code (if defect found)**

If test exposes real bug:
- [ ] Fix source code
- [ ] Re-run test
- [ ] Add regression coverage
- [ ] Verify no new failures introduced

**Step 4: Fix Test Infrastructure (if test is wrong)**

If test is broken:
- [ ] Update test mocks
- [ ] Update async handling
- [ ] Update assertions
- [ ] Re-run test
- [ ] Add similar tests to prevent regression

**Step 5: Full Suite Verification (1 hour)**
```bash
npm test -- --coverage
# Expected:
# ✅ PASS: 2 suites (previously failing)
# ✅ PASS: All other suites
# ✅ No regressions
# ⚠️  Record: Exact pass count
```

**Acceptance Criteria:**
- [x] Two specific failing suites identified
- [x] Root cause documented
- [x] Production code fixed OR test fixed (not both)
- [x] Both suites now passing
- [x] No regression in previously passing tests
- [x] Full suite passes with 0 failures
- [x] Pass count recorded for evidence

**Evidence Required:**
- Screenshot of: `npm test` output showing 0 failures
- Git log showing fix commits
- Test output log file

---

### T02: Browser Accessibility & Responsive Validation
**Owner:** Devin  
**Effort:** 8 hours  
**Status:** 🟡 PHASE 2 BLOCKER

**Setup (30 min)**
```bash
# Start frontend dev server
cd frontend
npm run dev
# Access: http://localhost:5173

# Open browser dev tools
# Chrome: F12 → Lighthouse
# Firefox: F12 → Accessibility tab
```

**Phase A: Keyboard-Only Navigation (2 hours)**
- [ ] Start frontend on http://localhost:5173
- [ ] Unplug mouse / disable touchpad
- [ ] Tab through every page:
  - Dashboard
  - User management
  - Product management
  - Farmer portal
  - Marketplace
  - Financial services
  - All new components (AI, MFA, GDPR, Library)
  
**For each page, verify:**
- [x] Tab order is logical (left-to-right, top-to-bottom)
- [x] Focus is visible on every interactive element
- [x] Tab reaches all actionable buttons/links
- [x] Enter/Space activates buttons
- [x] Escape closes modals/drawers
- [x] No focus trap except in modals
- [x] Arrow keys work in menus/tabs
- [x] No keyboard shortcuts conflict with browser shortcuts

**Record:** List any pages with keyboard issues

**Phase B: Semantic Landmarks & Heading Hierarchy (1.5 hours)**
```bash
# Use browser tools:
# Chrome: Lighthouse → Accessibility
# Firefox: Accessibility Inspector

# For each page:
- [ ] Main landmark exists
- [ ] Navigation landmark exists
- [ ] Footer landmark exists
- [ ] Heading hierarchy: h1 → h2 → h3 (no skips)
- [ ] All form labels present and associated
- [ ] All images have alt text
- [ ] Buttons/links have accessible names
```

**Phase C: Dynamic Content & States (2 hours)**
- [ ] Loading states: Are they announced?
- [ ] Error messages: Are they linked to fields?
- [ ] Success notifications: Are they announced?
- [ ] Modals: Focus trapped and trapped correctly?
- [ ] Dropdowns: Arrow keys work?
- [ ] Tables: Headers associated?
- [ ] Forms: Required field indicator visible/programmatic?

**Phase D: Responsive Validation (2 hours)**

**Desktop (1920px)**
- [ ] All content visible
- [ ] No horizontal scroll
- [ ] Text readable
- [ ] Images display correctly
- [ ] Buttons clickable size

**Tablet (768px)**
- [ ] Layout adapts
- [ ] Navigation adapts (drawer/hamburger?)
- [ ] No horizontal scroll
- [ ] Touch targets ≥48x48px
- [ ] Tables scroll or collapse

**Mobile (375px)**
- [ ] Single column layout
- [ ] Large touch targets
- [ ] Navigation hamburger menu
- [ ] No horizontal scroll
- [ ] Form fields full width
- [ ] Buttons full width or proper spacing

**Test orientation changes:**
- [ ] Rotate device
- [ ] Content reflows
- [ ] No loss of functionality

**Accessibility.js Tool (if available):**
```bash
npm install --save-dev @axe-core/react
# Then test with: npm run test:a11y
```

**Acceptance Criteria:**
- [x] Keyboard navigation works on all pages
- [x] No keyboard traps except modals
- [x] All interactive elements focusable
- [x] Focus visible on all elements
- [x] Semantic landmarks present
- [x] Heading hierarchy correct
- [x] Form labels associated
- [x] No automatic content changes
- [x] Desktop viewport (1920px) responsive ✅
- [x] Tablet viewport (768px) responsive ✅
- [x] Mobile viewport (375px) responsive ✅
- [x] Touch targets ≥48x48px
- [x] No horizontal scroll on any viewport
- [x] WCAG 2.2 AA target achieved

**Evidence Required:**
- Accessibility report (Chrome Lighthouse / WAVE tool)
- Screenshots from each viewport
- Keyboard navigation test notes
- Pass/fail summary

---

### T04: Complete API/Page/Module/Enterprise Mismatch Audit
**Owner:** Devin  
**Effort:** 8 hours  
**Status:** 🟡 CRITICAL DEPENDENCY MAP

**Objective:** Find and reconcile all disconnections between frontend, backend, APIs, and database.

**Phase 1: Inventory (2 hours)**

**Frontend Routes Audit:**
```bash
cd frontend
grep -r "useNavigate\|Link\|<Route" src/ | grep -oP "path=['\"]([^'\"]+)" | sort -u > /tmp/frontend-routes.txt

# Expected output: List of all frontend routes
# /dashboard, /users, /products, etc.
```

**Backend Routes Audit:**
```bash
cd backend
grep -r "router\.\(get\|post\|put\|delete\|patch\)" src/routes/ | grep -oP "'([^']+)'" | sort -u > /tmp/backend-routes.txt

# Expected: All backend routes
# /api/v1/users, /api/v1/products, etc.
```

**Database Tables Audit:**
```bash
# After migrations executed:
psql $DATABASE_URL -c "\dt public.*" | grep -oP 'public\s+\|(\S+)' | sort -u > /tmp/db-tables.txt

# Expected: 523+ tables
```

**Phase 2: Frontend-to-API Mapping (2 hours)**

For every frontend page/component:
| Route | Component | API Calls | Status |
|-------|-----------|-----------|--------|
| /dashboard | Dashboard.jsx | GET /api/v1/dashboard/metrics | ✅ |
| /users | UserList.jsx | GET /api/v1/users | ✅ |
| /products | ProductList.jsx | GET /api/v1/products | ❌ MISSING |

**Actions:**
- [ ] Identify every API call in frontend
- [ ] Verify API exists in backend
- [ ] Verify HTTP method matches
- [ ] Verify endpoint path is correct
- [ ] Test actual API call from Postman/curl

**Mismatch Examples (Find These):**
```
❌ Frontend calls: GET /api/v1/dashboard/metrics
   Backend has: GET /api/v1/metrics (wrong path)

❌ Frontend calls: POST /api/v1/products
   Backend has: POST /api/v1/product (wrong pluralization)

❌ Frontend calls: GET /api/v1/users/123
   Backend has no such endpoint (orphan frontend feature)

❌ Backend has: DELETE /api/v1/products/bulk
   No frontend consumer (dead API)
```

**Phase 3: Backend-to-Database Mapping (2 hours)**

For every API endpoint:
| API | Controller | Service | Repository | Table | Status |
|-----|------------|---------|------------|-------|--------|
| GET /api/v1/users | userController | userService | userRepository | users | ✅ |
| GET /api/v1/products | productController | ❌ MISSING | ❌ MISSING | products | ❌ BROKEN |

**Check:**
- [ ] API has controller
- [ ] Controller has service
- [ ] Service has repository
- [ ] Repository has table
- [ ] Table has schema/migration

**Phase 4: Mismatch Resolution (2 hours)**

**For each mismatch, decide:**
1. **Orphan Frontend Feature** (frontend calls nonexistent API)
   - [ ] Remove frontend feature
   - [ ] Remove tests for feature
   - [ ] Document removal

2. **Orphan Backend API** (backend API has no consumer)
   - [ ] Remove backend route
   - [ ] Remove controller method
   - [ ] Remove service method
   - [ ] Document removal
   - OR
   - [ ] Implement frontend consumer
   - [ ] Add tests

3. **Mismatch (names/paths don't align)**
   - [ ] Decide which side to fix (usually backend for consistency)
   - [ ] Update code
   - [ ] Update tests
   - [ ] Verify actual call works

4. **Missing Implementation** (documented but not implemented)
   - [ ] Implement backend
   - [ ] Implement frontend
   - [ ] Add tests
   - [ ] Verify end-to-end

**Acceptance Criteria:**
- [x] Complete frontend route inventory
- [x] Complete backend route inventory
- [x] Complete database table inventory
- [x] Every frontend API call maps to real backend endpoint
- [x] Every backend endpoint either:
  - Has a frontend consumer, OR
  - Is a documented public API, OR
  - Is explicitly removed
- [x] Every backend controller has a service
- [x] Every service has a repository (where needed)
- [x] Every repository maps to a database table
- [x] Zero orphan APIs remain
- [x] Zero orphan frontend features remain
- [x] Zero broken chains (frontend → backend → db)

**Evidence Required:**
- Route inventory files
- Mismatch report (CSV/table)
- Git commits for each fix
- API test results (Postman/curl)

---

### T05a: Breaking-Major Dependency Audit
**Owner:** Devin  
**Effort:** 4 hours (audit only; migration is separate T05b)  
**Status:** 🟡 PHASE 2 BLOCKER

**Objective:** Identify all breaking-major version upgrades available and assess safety.

**Phase 1: Inventory (1 hour)**

**Frontend:**
```bash
cd frontend
npm outdated --long 2>/dev/null | tee /tmp/frontend-outdated.txt

# Look for "major" versions
# Example output:
# react 18.2.0 18.3.0 19.0.0 19.0.0 (major: 19 available)
```

**Backend:**
```bash
cd backend
npm outdated --long 2>/dev/null | tee /tmp/backend-outdated.txt
```

**Phase 2: Breaking Change Analysis (2 hours)**

For each major upgrade:
| Package | Current | Latest | Breaking Changes | API Changes | Migratable? |
|---------|---------|--------|------------------|-------------|------------|
| react | 18.2.0 | 19.0.0 | Concurrency API | Minor | YES |
| express | 4.18.2 | 5.0.0 | Error handler signature | Major | CHECK |

**For each breaking change:**
- [ ] Read changelog
- [ ] Identify API changes
- [ ] Search codebase for affected code
- [ ] Estimate effort to migrate
- [ ] Assess risk (side effects?)
- [ ] Decide: Migrate now / Defer / Skip

**Phase 3: Migration Sequencing (1 hour)**

**Build dependency graph:**
```
express → body-parser → (express 5 includes body-parser)
react → react-dom → (must match versions)
typescript → @types/* → (must be compatible)
```

**Determine order:**
1. Dependencies with no dependents first
2. Then dependencies that depend on #1
3. Chain until all planned upgrades complete

**Acceptance Criteria:**
- [x] Complete inventory of all major upgrades available
- [x] Every major upgrade: breaking changes identified
- [x] Every package: decision made (migrate / defer / skip)
- [x] Dependency graph created
- [x] Migration sequence planned
- [x] Effort estimated for actual migration (T05b)

**Evidence Required:**
- npm outdated output
- Changelog excerpts for each breaking change
- Dependency graph
- Migration sequence document
- Effort estimate

---

### T07a: Mobile Project Structure Assessment
**Owner:** Claude  
**Effort:** 2 hours  
**Status:** 🟡 DECISION REQUIRED

**Question:** Is a real MAUI mobile application required for MVP?

**Determination:**
1. [ ] Review documented architecture
2. [ ] Check business requirements for mobile
3. [ ] Assess farmer-access requirements
4. [ ] Determine if mobile is required or future-phase

**If Mobile NOT Required for MVP:**
- [ ] Mark T07 as DEFERRED
- [ ] Proceed with web-only MVP
- [ ] Document decision

**If Mobile IS Required:**
- [ ] Proceed to T07b (Full Mobile Implementation)
- [ ] Allocate 60+ hours for mobile platform
- [ ] Add to Phase 4 timeline

**Decision Record:**
```
DECISION: [Mobile Required / Mobile Future-Phase]
RATIONALE: [business reason]
IMPACT: [timeline impact]
VERIFICATION: [evidence used to decide]
```

---

## TIER 3: WAVE 2 WORKFLOW IMPLEMENTATION (5-7 DAYS)

### T06a-e: Complete 5 Core Workflows End-to-End
**Owner:** Devin  
**Total Effort:** 72 hours (5 workflows × 14-16 hours each)  
**Status:** 🟡 PHASE 4-5 BLOCKER

#### For Each Workflow (Booking / Policy / Claim / Logistics / Loyalty):

**Complete Chain Implementation:**
```
Requirement 
  → UI/Stepper 
    → API Design 
      → Controller 
        → Service 
          → Business Rules 
            → Database Persistence 
              → Events/Notifications 
                → Audit Logging 
                  → Tests 
                    → Browser Validation
```

**T06a: BOOKING WORKFLOW (16 hours)**

**UI/Stepper Complete (4 hours)**
- [x] Stepper component exists
- [x] Step 1-11 screens implemented
- [x] Navigation works (next/back)
- [x] Form validation at each step
- [x] Resume/edit capability
- [x] Cancellation flow

**API Design (2 hours)**
```
POST /api/v1/bookings/quote
  Request: { serviceType, origin, destination, date, cargo }
  Response: { quoteId, price, eta, availability }
  
POST /api/v1/bookings
  Request: { quoteId, customerDetails, confirmation }
  Response: { bookingId, bookingRef, status }
  
GET /api/v1/bookings/{id}
  Response: { booking, status, tracking }
```

**Controller & Service (4 hours)**
```javascript
// backend/src/routes/bookingRoutes.js
router.post('/bookings/quote', getQuote);
router.post('/bookings', createBooking);
router.get('/bookings/:id', getBookingStatus);

// backend/src/services/bookingService.js
async function getQuote(serviceType, origin, destination, cargo) {
  // Calculate freight, check availability
  // Return quote
}

async function createBooking(quoteId, customerDetails) {
  // Validate quote
  // Create booking record
  // Emit event: booking:created
  // Return booking reference
}
```

**Database & Persistence (2 hours)**
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  customer_id UUID REFERENCES customers(id),
  origin POINT,
  destination POINT,
  cargo_details JSONB,
  status VARCHAR (created, confirmed, dispatched, delivered, cancelled),
  booking_ref VARCHAR UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE booking_audit (
  id SERIAL PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  action VARCHAR,
  actor_id UUID,
  details JSONB,
  timestamp TIMESTAMP
);
```

**Events & Notifications (2 hours)**
```javascript
// When booking is created:
eventBus.emit('booking:created', { bookingId, customerId });

// When booking is dispatched:
eventBus.emit('booking:dispatched', { bookingId, vehicleId, driverId });
notificationService.send({
  channel: ['SMS', 'WhatsApp'],
  template: 'booking_dispatched',
  recipient: customerId,
  data: { bookingRef, tracking }
});
```

**Tests (2 hours)**
```javascript
// backend/src/routes/__tests__/bookingRoutes.test.js
describe('POST /bookings/quote', () => {
  test('returns quote with price', async () => {
    const response = await request(app)
      .post('/api/v1/bookings/quote')
      .send({ serviceType: 'freight', ... });
    expect(response.status).toBe(200);
    expect(response.body.quoteId).toBeDefined();
  });
});

describe('POST /bookings', () => {
  test('creates booking and returns reference', async () => {
    const response = await request(app)
      .post('/api/v1/bookings')
      .send({ quoteId: '...', customerDetails: {...} });
    expect(response.status).toBe(201);
    expect(response.body.bookingRef).toMatch(/^BK/);
  });
});
```

**Browser E2E Test (2 hours)**
```javascript
// frontend/src/__tests__/bookings.e2e.js
describe('Booking Workflow E2E', () => {
  test('complete booking from selection to confirmation', async () => {
    // 1. Navigate to bookings
    cy.visit('/bookings');
    
    // 2. Step 1: Select service type
    cy.contains('Freight').click();
    cy.contains('Next').click();
    
    // 3. Step 2: Enter origin
    cy.get('input[name="origin"]').type('Village A');
    cy.contains('Next').click();
    
    // ... continue through all steps
    
    // Final: Confirm and verify booking created
    cy.contains('Confirm Booking').click();
    cy.contains('Booking Reference').should('be.visible');
    cy.url().should('include', '/bookings');
  });
});
```

**Acceptance:**
- [x] Stepper UI complete and navigable
- [x] All API endpoints implemented
- [x] Authentication/authorization verified
- [x] Database schema created and migrated
- [x] Business logic (pricing, validation, rules) implemented
- [x] Events emitted at key points
- [x] Notifications sent
- [x] Audit log recorded
- [x] Unit tests pass (API layer)
- [x] Integration tests pass (service → database)
- [x] E2E test passes (UI → API → database)
- [x] Error paths handled (invalid input, authorization denied, database error)
- [x] Idempotency verified (duplicate submission handling)

---

**T06b: POLICY WORKFLOW (16 hours)**
*Same structure as T06a, substituting workflow-specific details*

**T06c: CLAIM WORKFLOW (16 hours)**
*Same structure as T06a, substituting workflow-specific details*

**T06d: LOGISTICS WORKFLOW (16 hours)**
*Same structure as T06a, substituting workflow-specific details*

**T06e: LOYALTY WORKFLOW (8 hours)**
*Simplified version (8 hours instead of 16): balance inquiry, points accrual, redemption*

---

## TIER 4: WAVE 3 SYSTEM VERIFICATION (3 DAYS)

### T03: Reference Attachment Comparison
**Owner:** Devin  
**Effort:** 8 hours (when reference attachments available)  
**Status:** 🟡 BLOCKED ON EXTERNAL DEPENDENCY

**Prerequisite:** Reference attachments must be provided

**Process (Once Reference Available):**

1. [ ] Extract reference UI/content
2. [ ] Build route-by-route comparison
3. [ ] Capture screenshot of reference
4. [ ] Capture current implementation screenshot
5. [ ] Document every mismatch (missing/incomplete/incorrect)
6. [ ] Classify: intentional enhancement vs. bug
7. [ ] Fix bugs
8. [ ] Re-compare
9. [ ] Sign off

**Acceptance:**
- [x] Reference attachment inventory complete
- [x] All mismatches identified
- [x] All bugs resolved
- [x] All intentional enhancements documented
- [x] Final comparison passed

---

### T08: Database Migration & Integrity Verification
**Owner:** Devin  
**Effort:** 8 hours  
**Status:** 🟡 PHASE 2+ BLOCKER

**Once PostgreSQL is running:**

```bash
# Execute migrations
npm run migrate

# Verify table count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
# Expected: 523+

# Check for migration errors
npm run db:validate
# Expected: ✅ All 96 migrations executed

# Test rollback
npm run db:rollback

# Re-run migrations
npm run migrate

# Verify idempotent
npm run migrate
# Expected: ✅ No errors (already migrated)
```

**Integrity Checks:**
- [x] All tables created
- [x] All indexes created
- [x] All constraints in place
- [x] Foreign keys validated
- [x] Unique constraints working
- [x] Check constraints working
- [x] Rollback tested
- [x] Clean bootstrap from zero tested
- [x] Upgrade from prior version tested

---

### T09: Complete Wiring/Communication Test
**Owner:** Devin  
**Effort:** 12 hours  
**Status:** 🟡 PHASE 4+ BLOCKER

**Audit every communication edge:**

| Component | Communicates With | Protocol | Auth | Test Status |
|-----------|------------------|----------|------|------------|
| React Component | Zustand Store | Direct | - | PASS / FAIL |
| Zustand Store | API Client | HTTP/HTTPS | JWT | PASS / FAIL |
| API Client | Backend Controller | REST | JWT | PASS / FAIL |
| Controller | Service | Direct | - | PASS / FAIL |
| Service | Repository | Direct | - | PASS / FAIL |
| Repository | PostgreSQL | SQL | Connection Pool | PASS / FAIL |
| Service | Event Bus | Direct | - | PASS / FAIL |
| Event Bus | Notification Service | Direct | - | PASS / FAIL |
| Backend | Payment Gateway | HTTPS | API Key | PASS / FAIL |
| Backend | SMS Service | HTTPS | API Key | PASS / FAIL |

**For each edge:**
- [ ] Test actual execution
- [ ] Verify authentication
- [ ] Verify authorization
- [ ] Verify error handling
- [ ] Verify timeout behavior
- [ ] Verify retry logic
- [ ] Add integration test

---

### T10: WCAG Interaction & Accessibility Sign-off
**Owner:** Devin  
**Effort:** 10 hours  
**Status:** 🟡 PHASE 2+ BLOCKER

**Complete WCAG 2.2 AA validation across all routes.**

*See T02 for detailed checklist*

---

## TIER 5: EVIDENCE & TRACKING

### Central Completion Matrix
**Format:** Machine-readable CSV/JSON

```
Module,Requirement,UI,API,Controller,Service,DB,Tests,Browser,Status
Booking,Complete flow,✓,✓,✓,✓,✓,✓,✓,PASS
Policy,Complete flow,✓,✓,✓,✓,✓,✓,✓,PASS
Claim,Complete flow,✓,✗,✗,✗,✗,✗,✗,IN_PROGRESS
Logistics,Complete flow,✓,✓,✓,✓,✓,✗,✗,PARTIAL
Loyalty,Complete flow,✓,✓,✓,✓,✓,✓,✓,PASS
```

### Evidence Repository
**Every task completion requires:**
- Git commit with clear message
- Test output (passing tests)
- Browser screenshot (for UI)
- Curl/Postman test (for APIs)
- Database query result (for data)
- Code review (peer verified)

---

## EXECUTION TIMELINE

```
Week 1:
  Day 1-2 (Sep 5-6):
    - T00a/b/c: Blocker resolution
    - T01: Test suite repair (6 hrs)
    - T02: Accessibility validation (8 hrs)
  Day 3-4 (Sep 7-8):
    - T04: API/module mismatch audit (8 hrs)
    - T05a: Dependency audit (4 hrs)
    - T07a: Mobile assessment (2 hrs)
    
Week 2-3:
  Day 5-11 (Sep 9-15):
    - T06a-e: 5 workflow implementations (72 hrs)
    - T08: Database verification (8 hrs)
    - T09: Wiring tests (12 hrs)
    
Week 4:
  Day 12-14 (Sep 16-18):
    - T03: Reference comparison (if available)
    - T10: Final WCAG sign-off (10 hrs)
    - Final verification & launch readiness
```

---

## FINAL RELEASE GATE

**All of these must be PASS to proceed to production:**

- [x] T01: All frontend tests passing (0 failures)
- [x] T02: WCAG 2.2 AA compliance validated
- [x] T04: All API/page/module mismatches resolved
- [x] T05a: Breaking dependencies assessed and sequenced
- [x] T06a-e: All 5 core workflows implemented end-to-end
- [x] T08: Database migrations verified (523+ tables)
- [x] T09: All component communication edges tested
- [x] T10: Final accessibility/responsive validation passed
- [x] T03: Reference comparison resolved (if applicable)
- [x] T07a: Mobile decision made and actioned if required
- [x] Central completion matrix: 100% PASS
- [x] Zero orphan components/APIs/workflows
- [x] Zero unverified required capabilities
- [x] Production deployment tested successfully

---

## EVIDENCE COLLECTION CHECKLIST

### For Each Completed Task

**T01 - Test Repair:**
- [ ] `npm test` output showing 0 failures
- [ ] Git commits with fix
- [ ] Regression test added
- [ ] Full suite passes

**T02 - Accessibility:**
- [ ] Chrome Lighthouse report (Accessibility > 90)
- [ ] Manual keyboard navigation test notes
- [ ] Responsive screenshots (desktop/tablet/mobile)
- [ ] WCAG conformance checklist (all items checked)

**T04 - API Audit:**
- [ ] Route inventory CSV
- [ ] Mismatch report
- [ ] Git commits for each fix
- [ ] API contract tests passing

**T05a - Dependency Audit:**
- [ ] npm outdated output
- [ ] Changelog excerpts
- [ ] Dependency graph diagram
- [ ] Migration effort estimate

**T06a-e - Workflow Implementation:**
- [ ] Stepper working end-to-end (browser video/screenshot)
- [ ] API tests passing
- [ ] Database schema created
- [ ] E2E test passing
- [ ] Browser validation passed

**T08 - Database Verification:**
- [ ] Migration execution log
- [ ] Table count query result
- [ ] Rollback test result
- [ ] Integrity check output

**T09 - Wiring Tests:**
- [ ] Integration test output
- [ ] Communication matrix (all tested)
- [ ] Error path tests passing

**T10 - WCAG Final Sign-off:**
- [ ] Accessibility audit report
- [ ] Interaction test checklist
- [ ] Screenshots from all viewports

---

**FINAL STATUS:** 📋 EXECUTABLE ROADMAP READY

This master TODO provides the bridge between "documented as complete" and "production-verified complete."

Every checkbox requires evidence before it can be marked PASS.

