# WAVE 1 + WAVE 2 HYBRID EXECUTION PLAN
**Parallel Testing & Preparation Strategy**

**Timeline:** Sep 6-8, 2026 (3 days, 72 hours)  
**Goal:** Complete Wave 1 validation + fully prepare Wave 2 workflows  
**Outcome:** Zero delay between phases, maximum parallelization

---

## EXECUTION SCHEDULE

### DAY 1: Sep 6 (Thursday)
**Morning (4 hours):** WCAG Testing + Workflow Design  
**Afternoon (4 hours):** API Mapping + Database Schema Design

```
09:00 - 13:00 [PARALLEL TRACK A: T02 WCAG Testing]
├─ Keyboard navigation (2 pages/hour = 4 pages)
├─ Evidence: Screenshots + notes
└─ Target: Dashboard, Products, AI Chat, Users pages

09:00 - 13:00 [PARALLEL TRACK B: Wave 2 Booking Workflow Design]
├─ Database schema creation (3 hours)
├─ API contract definition (1 hour)
└─ Output: booking_schema.sql, API endpoints

14:00 - 18:00 [PARALLEL TRACK A: T04 API Mapping Start]
├─ Cross-reference 50+ frontend API calls
├─ Identify orphan routes (1 hour)
└─ Target: 70% of mismatch report complete

14:00 - 18:00 [PARALLEL TRACK B: Wave 2 Policy Workflow Design]
├─ Database schema (2 hours)
├─ API contract (1 hour)
└─ UI stepper design (1 hour)
```

### DAY 2: Sep 7 (Friday)
**Morning (4 hours):** WCAG Completion + Claim/Logistics Design  
**Afternoon (4 hours):** API Resolution + Loyalty & Integration Planning

```
09:00 - 13:00 [PARALLEL TRACK A: T02 Lighthouse + T04 Completion]
├─ Lighthouse accessibility audit (3 pages) (2 hours)
├─ Responsive testing (3 viewports) (2 hours)
└─ Output: Lighthouse reports, responsive screenshots

09:00 - 13:00 [PARALLEL TRACK B: Wave 2 Claim Workflow Design]
├─ Database schema (2 hours)
├─ API contract + business rules (2 hours)
└─ Output: claim_schema.sql, workflow state machine

14:00 - 18:00 [PARALLEL TRACK A: T04 API Mismatch Resolution]
├─ Identify all missing/broken APIs (1 hour)
├─ Create remediation plan (2 hours)
└─ Git commits for fixes (1 hour)

14:00 - 18:00 [PARALLEL TRACK B: Wave 2 Logistics & Loyalty]
├─ Logistics: Schema + API (2 hours)
├─ Loyalty: Schema + API (1 hour)
├─ Integration planning (1 hour)
└─ Output: logistics_schema.sql, loyalty_schema.sql
```

### DAY 3: Sep 8 (Saturday)
**Full Day:** Testing Completion + Master Implementation Guide

```
09:00 - 12:00 [PARALLEL TRACK A: T02/T04 Sign-Off]
├─ Screenshot evidence consolidation (1 hour)
├─ Mismatch report finalization (1 hour)
├─ WCAG/API audit completion (1 hour)
└─ Output: T02-WCAG-Final-Report.md, T04-Mismatch-Report.csv

09:00 - 17:00 [PARALLEL TRACK B: Wave 2 Master Plan]
├─ Consolidate all 5 workflow specs (4 hours)
├─ Create deployment scripts (2 hours)
├─ Write end-to-end testing plan (2 hours)
└─ Output: WAVE2-MASTER-IMPLEMENTATION-GUIDE.md

Expected completion: Sep 8 EOD  
Ready for Wave 2 start: Sep 9 09:00
```

---

## PARALLEL TRACK DETAILS

### TRACK A: Wave 1 Completion (Testing & Validation)

#### T02: WCAG 2.2 AA Accessibility (Sep 6 morning + Sep 7 morning)
**Responsibility:** Manual tester or user  
**Deliverables:**
- ✅ Keyboard navigation test (10 pages × screenshots)
- ✅ Lighthouse accessibility reports (3+ pages)
- ✅ Semantic structure validation (heading hierarchy)
- ✅ Form label audit (all pages)
- ✅ Color contrast verification
- ✅ Responsive screenshots (1920/768/375px)
- ✅ Touch target measurements
- ✅ WCAG Compliance Report

**Evidence Location:** `.ai/wave1-evidence/T02-screenshots/`

#### T04: API/Page/Module Audit (Sep 6 afternoon + Sep 7 afternoon)
**Responsibility:** Manual auditor  
**Deliverables:**
- ✅ Frontend→Backend API mapping (215 routes × backend endpoints)
- ✅ Orphan API identification (unused backend routes)
- ✅ Orphan page identification (frontend pages with no backend)
- ✅ Naming convention mismatches
- ✅ Missing implementation list
- ✅ Git commits for fixes
- ✅ API Mismatch Resolution Report

**Evidence Location:** `.ai/wave1-evidence/T04-audit/`

#### T05a: Dependency Review (Sep 7-8)
**Responsibility:** Developer  
**Deliverables:**
- ✅ Breaking changes impact analysis
- ✅ Migration sequence plan
- ✅ Effort estimation per package
- ✅ Defer/Migrate/Skip decisions for each outdated package

**Evidence Location:** `.ai/wave1-evidence/T05a-dependency-review/`

---

### TRACK B: Wave 2 Preparation (Workflow Design & Planning)

#### T06a: Booking Workflow (Sep 6 morning + Sep 7 morning)
**Responsibility:** Architect/Designer  
**Deliverables:**
```sql
-- booking_schema.sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  farmer_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2),
  total_value DECIMAL(12,2),
  status ENUM('quoted', 'accepted', 'confirmed', 'completed'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  -- ... full schema
);
```

**API Contracts:**
```
POST   /api/v1/bookings/quote       - Get shipping quote
POST   /api/v1/bookings              - Create booking
GET    /api/v1/bookings/:id         - Get booking status
PUT    /api/v1/bookings/:id/confirm - Confirm booking
```

**UI Design:**
```
Stepper (11 steps):
1. Product Selection
2. Quantity Input
3. Buyer Verification
4. Logistics Quote
5. Price Confirmation
6. Payment Method
7. Delivery Address
8. Booking Review
9. Confirmation
10. Payment Processing
11. Completion
```

**Evidence:** `booking_schema.sql`, `booking_api_contract.md`, `booking_ui_design.md`

---

#### T06b: Policy Workflow (Sep 7 afternoon)
**Responsibility:** Architect/Designer  
**Deliverables:**
- Database schema (policies, claims, coverage)
- 4 API endpoints (create, list, update, cancel)
- UI stepper design (8 steps)
- Business rules documentation
- State machine diagram

**Evidence:** `policy_schema.sql`, `policy_api_contract.md`

---

#### T06c: Claim Workflow (Sep 7 afternoon + Sep 8 morning)
**Responsibility:** Architect/Designer  
**Deliverables:**
- Database schema (claims, assessments, payouts)
- 5 API endpoints (create, list, update, assess, approve)
- UI stepper design (7 steps)
- Approval workflow rules
- Document upload specifications

**Evidence:** `claim_schema.sql`, `claim_api_contract.md`

---

#### T06d: Logistics Workflow (Sep 8 morning)
**Responsibility:** Architect/Designer  
**Deliverables:**
- Database schema (shipments, tracking, custody)
- 6 API endpoints (create, track, transfer, sign, complete, audit)
- UI dashboard design (real-time tracking)
- Custody chain validation rules
- Integration with tracking providers

**Evidence:** `logistics_schema.sql`, `logistics_api_contract.md`

---

#### T06e: Loyalty Workflow (Sep 8 morning)
**Responsibility:** Architect/Designer  
**Deliverables:**
- Database schema (points, tiers, rewards)
- 4 API endpoints (earn, redeem, list, transfer)
- UI rewards dashboard
- Gamification rules
- Integration with other workflows

**Evidence:** `loyalty_schema.sql`, `loyalty_api_contract.md`

---

## RESOURCE ALLOCATION

### Team Structure (Recommended)
```
Primary Developer:
├─ Sep 6-8: Wave 2 Workflow Design (TRACK B) [Priority]
│   ├─ 4 hours/day database schema design
│   ├─ 2 hours/day API contract definition
│   └─ 2 hours/day integration planning
│
└─ Manual Tester/QA:
  └─ Sep 6-8: Wave 1 Testing (TRACK A)
      ├─ Sep 6 morning: WCAG keyboard nav
      ├─ Sep 6 afternoon: API mapping start
      ├─ Sep 7 morning: Lighthouse + responsive
      └─ Sep 7 afternoon: API mismatch resolution
```

### Alternative: Single Developer
**Sep 6 Morning:**
- 09:00-11:00: WCAG testing (keyboard nav)
- 11:00-13:00: Booking schema design

**Sep 6 Afternoon:**
- 14:00-16:00: API mapping
- 16:00-18:00: Policy workflow design

(Continue alternating 2-hour blocks)

---

## DELIVERABLES CHECKLIST

### By Sep 8 EOD - Wave 1 Complete ✅
- [ ] T02-WCAG-Final-Report.md (all accessibility findings)
- [ ] T02-screenshots/ (all evidence images)
- [ ] T04-Mismatch-Report.csv (all orphan routes)
- [ ] T04 API fixes (git commits)
- [ ] T05a-Dependency-Review.md (migration recommendations)
- [ ] WAVE1-SIGN-OFF.md (formal completion)

### By Sep 8 EOD - Wave 2 Ready ✅
- [ ] booking_schema.sql + API contract + UI design
- [ ] policy_schema.sql + API contract + UI design
- [ ] claim_schema.sql + API contract + UI design
- [ ] logistics_schema.sql + API contract + UI design
- [ ] loyalty_schema.sql + API contract + UI design
- [ ] WAVE2-MASTER-IMPLEMENTATION-GUIDE.md
- [ ] Database migration scripts (5 new tables collections)
- [ ] E2E testing plan for all 5 workflows

---

## SUCCESS CRITERIA

### Wave 1 Completion (TRACK A)
- ✅ All keyboard navigation tests documented
- ✅ Lighthouse accessibility score >85 (3+ pages)
- ✅ Zero critical contrast violations
- ✅ Responsive design validated (3 viewports)
- ✅ All API mismatches identified & resolved
- ✅ Zero orphan routes remaining
- ✅ All evidence collected & organized

### Wave 2 Readiness (TRACK B)
- ✅ All 5 workflows have complete database schemas
- ✅ All workflows have API contract definitions
- ✅ All workflows have UI/UX designs
- ✅ All workflows have business rule specifications
- ✅ Master implementation guide written
- ✅ Database migration scripts created
- ✅ E2E test plan prepared

### Combined Success
- ✅ Wave 1: 100% complete with evidence
- ✅ Wave 2: 100% planned with clear specs
- ✅ Zero gaps between phases
- ✅ Zero re-work required
- ✅ Ready to implement on Sep 9

---

## RISK MITIGATION

### Risk: WCAG Testing Takes Longer Than Expected
**Mitigation:** Focus on 3 critical pages first (Dashboard, AI Chat, Products)  
**Fallback:** Defer detailed testing to Wave 2.1 if needed

### Risk: API Mapping Uncovers Many Mismatches
**Mitigation:** Prioritize fixes for critical paths only  
**Fallback:** Document as tech debt, fix in Wave 2.1

### Risk: Wave 2 Workflow Specs Become Complex
**Mitigation:** Use templates to standardize (see below)  
**Fallback:** Defer advanced features to Wave 2.1

### Risk: Team Bandwidth Overload
**Mitigation:** Stagger morning/afternoon shifts  
**Fallback:** Compress Schedule to 4 days if needed

---

## TEMPLATES (For TRACK B)

### Database Schema Template
```sql
-- {workflow}_schema.sql
-- Workflow: {Name}
-- Purpose: {Description}
-- Created: Sep {day}, 2026

-- Main table
CREATE TABLE {workflow}s (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  {key_fields},
  status ENUM('{status_1}', '{status_2}', ...),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id)
);

-- Supporting tables
CREATE TABLE {workflow}_items (
  id UUID PRIMARY KEY,
  {workflow}_id UUID NOT NULL REFERENCES {workflow}s(id),
  {item_fields}
);

-- Indexes
CREATE INDEX idx_{workflow}_status ON {workflow}s(status);
CREATE INDEX idx_{workflow}_created_by ON {workflow}s(created_by);
```

### API Contract Template
```markdown
# {Workflow} API Contract

## Endpoints

### 1. Create {Workflow}
**POST** `/api/v1/{workflows}`

**Request:**
\`\`\`json
{
  "seller_id": "uuid",
  "{field_1}": "value",
  "{field_2}": 123
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "uuid",
  "status": "pending",
  "created_at": "2026-09-09T..."
}
\`\`\`

**Errors:**
- 400: Invalid input
- 401: Not authenticated
- 403: Insufficient permissions
- 500: Server error

### 2. Get {Workflow}
**GET** `/api/v1/{workflows}/:id`

...
```

### UI Stepper Template
```markdown
# {Workflow} Stepper Design

## Step 1: {Action}
- Input fields: {field_1}, {field_2}
- Validation: {rules}
- Next button: Enabled after validation

## Step 2: {Action}
...

## Review Step
- Display all collected data
- Allow editing
- Show total cost/impact

## Confirmation
- Show order number
- Provide download option
- Enable next steps
```

---

## COMMUNICATION PLAN

### Daily Standup (Sep 6-8)
**09:00** - Quick sync (5 min each track)
- TRACK A: "Finished keyboard nav testing pages 1-4, Lighthouse starting"
- TRACK B: "Booking schema complete, starting API contracts"

**17:00** - EOD summary
- Deliverables completed
- Blockers identified
- Next day priorities

### Status Updates
- **Wave 1:** Documented in `T02-WCAG-Final-Report.md` + `T04-Mismatch-Report.csv`
- **Wave 2:** Documented in `WAVE2-MASTER-IMPLEMENTATION-GUIDE.md`

---

## FINAL OUTPUT (Sep 8 EOD)

### Folder Structure
```
.ai/wave1-evidence/
├── T02-WCAG-Final-Report.md          ✅ Complete
├── T02-screenshots/
│   ├── keyboard-nav/ (10 images)
│   ├── lighthouse/ (4 reports)
│   ├── responsive/ (3 viewports)
│   └── contrast/ (evidence)
├── T04-Mismatch-Report.csv           ✅ Complete
└── T05a-Dependency-Review.md         ✅ Complete

.ai/migration/
├── WAVE2-MASTER-IMPLEMENTATION-GUIDE.md
└── workflows/
    ├── booking_schema.sql
    ├── booking_api_contract.md
    ├── policy_schema.sql
    ├── policy_api_contract.md
    ├── claim_schema.sql
    ├── claim_api_contract.md
    ├── logistics_schema.sql
    ├── logistics_api_contract.md
    ├── loyalty_schema.sql
    └── loyalty_api_contract.md

.ai/handoffs/
└── WAVE1-WAVE2-HYBRID-COMPLETION.md  ✅ Final summary
```

---

## SUCCESS SCENARIO (Sep 9 09:00)

**Wave 1:** ✅ Complete with full evidence + sign-off  
**Wave 2:** ✅ Fully planned with all specs ready  
**Team:** Ready to begin workflow implementation  
**Timeline:** On track for production launch

---

**Status:** HYBRID EXECUTION PLAN READY  
**Start Date:** Sep 6, 2026 09:00  
**Expected Completion:** Sep 8, 2026 17:00  
**Ready for:** Sep 9 Wave 2 Implementation Launch
