# HYBRID SPRINT DAILY GUIDES
**Sep 6-8, 2026: Wave 1 Completion + Wave 2 Preparation**

---

## MASTER SCHEDULE (3 Days)

```
SEP 6 (Thursday):  8 hours (4 Track A + 4 Track B)
SEP 7 (Friday):    8 hours (4 Track A + 4 Track B)
SEP 8 (Saturday):  5 hours (2 Track A + 3 Track B + handoff)
─────────────────────────────────────────────────────
TOTAL:            21 hours (13 Track A + 20 Track B)
```

---

## DAILY STANDUP TEMPLATE (5 minutes each)

### **09:00 Standup Format**

**Developer 1 (Architecture):**
```
"I'm starting [Workflow Name] design.
Expected to complete: [Schema by 11:00, API by 13:00]
No blockers so far."
```

**Developer 2 (Testing):**
```
"I'm starting [Testing Task] with target [deliverable].
Expected to complete: [specific time]
No blockers so far."
```

---

## DAY 1 DETAILED GUIDE - THURSDAY, SEP 6

### **09:00 - 09:30: KICKOFF MEETING** (30 minutes)
**Both developers present**

**Agenda:**
1. Review sprint goals (5 min)
   - Track A: WCAG keyboard nav + API mapping starts
   - Track B: Booking + Policy workflows designed
2. Confirm resource availability (2 min)
3. Define done for today (3 min)
   - Dev 1: Booking schema + API contract + Policy schema
   - Dev 2: 5 pages keyboard tested + API mapping started
4. Identify known blockers (2 min)
5. Break and start tracks (1 min)

**Exit:** Both developers know exactly what they're building/testing

---

### **09:30 - 13:00: MORNING EXECUTION** (3.5 hours)

#### Track A (Developer 2 - Testing)
```
09:30 - 11:30: Keyboard Navigation Testing (2 hours)
├─ Dashboard page (0:30)
│  └─ Screenshot: Focus on main buttons
│
├─ Products page (0:30)
│  └─ Screenshot: Focus on grid items
│
├─ AI Chat page (0:30)
│  └─ Screenshot: Focus on message input
│
└─ Users page (0:30)
   └─ Screenshot: Focus on table controls

11:30 - 13:00: Lighthouse Audits (1.5 hours)
├─ Dashboard Lighthouse (0:45)
│  └─ Screenshot: Audit report (target >85)
│
└─ Marketplace Lighthouse (0:45)
   └─ Screenshot: Audit report (target >85)

Deliverables by 13:00:
✓ 4 keyboard nav screenshots
✓ 2 Lighthouse reports (with scores)
✓ Notes on any issues found
```

#### Track B (Developer 1 - Architecture)
```
09:30 - 11:30: Booking Workflow Design (2 hours)
├─ Database schema (1.5 hours)
│  └─ booking_schema.sql: tables, indexes, constraints
│
└─ API contract (0.5 hours)
   └─ booking_api_contract.md: endpoints, request/response

11:30 - 13:00: Policy Workflow Design (1.5 hours)
├─ Database schema (1 hour)
│  └─ policy_schema.sql
│
└─ Start API contract (0.5 hours)
   └─ policy_api_contract.md (first 2 endpoints)

Deliverables by 13:00:
✓ booking_schema.sql (complete)
✓ booking_api_contract.md (complete)
✓ policy_schema.sql (complete)
✓ policy_api_contract.md (partial)
```

---

### **13:00 - 14:00: LUNCH BREAK** ☕
*Both developers offline*

---

### **14:00 - 18:00: AFTERNOON EXECUTION** (4 hours)

#### Track A (Developer 2 - Testing)
```
14:00 - 15:00: API Mapping (1 hour)
├─ Identify all frontend API calls
├─ Cross-reference with backend routes
└─ Create initial mapping spreadsheet

15:00 - 16:30: Mismatch Identification (1.5 hours)
├─ Find orphan backend APIs
├─ Find missing backend APIs
├─ Document naming mismatches
└─ Prioritize critical issues

16:30 - 18:00: Priority Fixes (1.5 hours)
├─ Fix CRITICAL mismatches only
├─ Create git commits for each fix
└─ Re-test to verify fixes work

Deliverables by 18:00:
✓ T04-frontend-api-mapping.md (draft)
✓ T04-Mismatch-Report.csv (draft)
✓ Git commits for critical fixes
✓ Testing evidence for each fix
```

#### Track B (Developer 1 - Architecture)
```
14:00 - 17:00: Claim Workflow Design (3 hours)
├─ Database schema (2 hours)
│  └─ claim_schema.sql: claims, assessments, payouts
│
├─ API contract (1 hour)
│  └─ claim_api_contract.md: 5 endpoints
│
└─ Business rules (30 min) [start only]

17:00 - 18:00: Integration Planning (1 hour)
├─ Document Booking → Policy → Claim links
└─ Identify data flows between workflows

Deliverables by 18:00:
✓ claim_schema.sql (complete)
✓ claim_api_contract.md (complete)
✓ integration_notes.md (draft)
```

---

### **18:00 - 18:30: END-OF-DAY SYNC** (30 minutes)

**Developer 1 Summary:**
```
"Completed: Booking + Policy schemas and APIs (100%)
           Claim workflow design (80%, business rules tomorrow)
Blockers:  None
Tomorrow:  Logistics + Loyalty, then master guide consolidation"
```

**Developer 2 Summary:**
```
"Completed: 4 keyboard nav tests, 2 Lighthouse audits (100%)
           API mapping and mismatch ID (50%)
Blockers:  [If any: database questions, unclear routes, etc.]
Tomorrow:  Complete API audit, resolve critical fixes, responsive testing"
```

**Adjustments for Tomorrow:**
- If Track A is behind: Defer responsive testing detail to Day 2 afternoon
- If Track B is ahead: Start creating E2E test scenarios

---

## DAY 2 DETAILED GUIDE - FRIDAY, SEP 7

### **09:00 - 09:15: STANDUP**

**Developer 1:**
```
"I'm starting Logistics workflow design.
Will complete: Logistics schema + API contract (by 13:00)
             Loyalty workflow (by 17:00)
No blockers."
```

**Developer 2:**
```
"I'm completing API audit and starting responsive design testing.
Will complete: API mismatch report finalized (by 14:00)
             Responsive testing on 3 viewports (by 17:00)
Blockers: [If any]"
```

---

### **09:30 - 13:00: MORNING EXECUTION** (3.5 hours)

#### Track A (Developer 2 - Testing)
```
09:30 - 11:00: Lighthouse + Responsive (1.5 hours)
├─ AI Chat Lighthouse audit (0:45)
│  └─ Screenshot: Score
│
└─ Desktop responsive validation (0:45)
   ├─ 1920px screenshot (Dashboard)
   ├─ 1920px screenshot (Products)
   └─ 1920px screenshot (AI Chat)

11:00 - 13:00: Tablet & Mobile Responsive (2 hours)
├─ Tablet (768px) testing (1 hour)
│  ├─ Dashboard screenshot
│  ├─ Products screenshot
│  └─ AI Chat screenshot
│
└─ Mobile (375px) testing (1 hour)
   ├─ Dashboard screenshot
   ├─ Products screenshot
   └─ AI Chat screenshot

Deliverables by 13:00:
✓ 3 Lighthouse reports (Dashboard, Marketplace, AI Chat)
✓ 9 responsive screenshots (3 pages × 3 viewports)
✓ T02-Responsive-Validation.md (findings)
```

#### Track B (Developer 1 - Architecture)
```
09:30 - 12:30: Logistics Workflow Design (3 hours)
├─ Database schema (2 hours)
│  └─ logistics_schema.sql: shipments, custody, tracking
│
├─ API contract (1 hour)
│  └─ logistics_api_contract.md: 6 endpoints
│
└─ Integration documentation (30 min)

12:30 - 13:00: Loyalty Workflow START (30 min)
└─ loyalty_schema.sql skeleton

Deliverables by 13:00:
✓ logistics_schema.sql (complete)
✓ logistics_api_contract.md (complete)
✓ logistics_integration.md (draft)
✓ loyalty_schema.sql (partial)
```

---

### **14:00 - 18:00: AFTERNOON EXECUTION** (4 hours)

#### Track A (Developer 2 - Testing)
```
14:00 - 17:00: API Mismatch Resolution (3 hours)
├─ Finalize T04-Mismatch-Report.csv
├─ Write T04-Orphan-Routes-Report.md
├─ Write T04-Missing-Implementations.md
└─ Create T04-Fix-Summary.md with git commits

17:00 - 18:00: Dependency Audit (1 hour)
├─ Analyze outdated packages
├─ Identify breaking changes
└─ Create T05a-Dependency-Review.md (draft)

Deliverables by 18:00:
✓ T04-Mismatch-Report.csv (complete)
✓ T04-Orphan-Routes.md (complete)
✓ T04-Missing-Implementations.md (complete)
✓ Git commits for API fixes
✓ T05a-Dependency-Review.md (draft)
```

#### Track B (Developer 1 - Architecture)
```
14:00 - 17:30: Loyalty Workflow + Integration (3.5 hours)
├─ loyalty_schema.sql (complete) (1 hour)
├─ loyalty_api_contract.md (1 hour)
├─ loyalty_integration.md (0.5 hour)
│
└─ Integration Master Map (1 hour)
   ├─ All 5 workflows linked
   ├─ Data flows documented
   └─ Deployment sequence defined

17:30 - 18:00: Master Guide Start (30 min)
└─ WAVE2-MASTER-IMPLEMENTATION-GUIDE.md (skeleton)

Deliverables by 18:00:
✓ loyalty_schema.sql (complete)
✓ loyalty_api_contract.md (complete)
✓ loyalty_integration.md (complete)
✓ WAVE2-MASTER-INTEGRATION-MAP.md (complete)
✓ WAVE2-MASTER-IMPLEMENTATION-GUIDE.md (20% complete)
```

---

### **18:00 - 18:30: END-OF-DAY SYNC**

**Developer 1 Summary:**
```
"Completed: Logistics + Loyalty workflows (100%)
           Integration master map (100%)
           Master guide started (20%)
Tomorrow: Master guide completion, E2E test plan
No blockers. On track for Sep 8 completion."
```

**Developer 2 Summary:**
```
"Completed: API audit finalized (100%)
           Responsive testing (100%)
           Dependency review (70%)
Blockers: [If any found]
Tomorrow: Final documentation and sign-off"
```

---

## DAY 3 DETAILED GUIDE - SATURDAY, SEP 8

### **09:00 - 09:15: STANDUP**

**Developer 1:**
```
"Completing master implementation guide and E2E test plan.
Will finish: All deliverables (by 15:00)
Ready for: 17:30 final handoff meeting
No blockers."
```

**Developer 2:**
```
"Finalizing all Wave 1 testing reports and sign-off.
Will finish: All evidence organized (by 15:00)
Ready for: 17:30 final handoff meeting"
```

---

### **09:30 - 12:00: MORNING EXECUTION** (2.5 hours)

#### Track A (Developer 2 - Testing)
```
09:30 - 10:00: Finalize WCAG Report (30 min)
├─ T02-WCAG-Final-Report.md (complete)
└─ Screenshot evidence organized

10:00 - 10:30: Finalize Dependency Review (30 min)
└─ T05a-Dependency-Review.md (complete)

10:30 - 11:00: Create Master Sign-Off (30 min)
├─ WAVE1-SIGN-OFF.md (complete)
└─ Evidence index

11:00 - 12:00: Organize All Evidence (1 hour)
├─ .ai/wave1-evidence/ structure finalized
├─ All screenshots organized in folders
└─ All reports in proper location

Deliverables by 12:00:
✓ T02-WCAG-Final-Report.md (complete)
✓ T04-Mismatch-Report-Final.md (complete)
✓ T05a-Dependency-Review.md (complete)
✓ WAVE1-SIGN-OFF.md (complete)
✓ All evidence organized
```

#### Track B (Developer 1 - Architecture)
```
09:30 - 11:00: Master Implementation Guide (1.5 hours)
├─ Consolidate all 5 workflow specs
├─ Database migration sequence
├─ Deployment steps
└─ WAVE2-MASTER-IMPLEMENTATION-GUIDE.md (complete)

11:00 - 12:00: E2E Testing Plan (1 hour)
├─ Write comprehensive test scenarios
├─ Create testing checklist
└─ WAVE2-E2E-TESTING-PLAN.md (complete)

Deliverables by 12:00:
✓ WAVE2-MASTER-IMPLEMENTATION-GUIDE.md (complete)
✓ WAVE2-E2E-TESTING-PLAN.md (complete)
✓ database_migration_deployment.sh (deployment script)
```

---

### **12:00 - 13:00: LUNCH**

---

### **13:00 - 15:00: FINAL REVIEW & QUALITY CHECK** (2 hours)

#### Track A (Developer 2 - Testing)
```
13:00 - 13:30: Final Review
├─ All reports have no typos
├─ All screenshots properly labeled
├─ All evidence in correct folders
└─ Ready for handoff

13:30 - 15:00: Available for
├─ Developer 1 questions
├─ Additional testing if needed
└─ Final adjustments
```

#### Track B (Developer 1 - Architecture)
```
13:00 - 14:00: Final Review
├─ All schemas run without errors
├─ All API contracts consistent
├─ All integration points documented
├─ Master guide is complete

14:00 - 15:00: Final Validation
├─ Self-test: Create database from migration scripts
├─ Verify: All files committed to git
└─ Confirm: No syntax errors in any deliverable
```

---

### **15:00 - 17:30: CONTINGENCY & BUFFER**

If both tracks are complete by 15:00:
- [ ] Both developers verify peer work (cross-review)
- [ ] Identify any last-minute issues
- [ ] Fix critical items only
- [ ] Prepare for handoff presentation

If either track is behind:
- [ ] Focus on completion
- [ ] Extend to 17:30 if needed
- [ ] Prioritize critical deliverables

---

### **17:30 - 18:00: FINAL HANDOFF MEETING** (30 minutes)

**Attendees:** Developer 1, Developer 2, Project Lead (if available)

**Agenda:**

**Part 1: Track A Completion (10 min)**
```
Developer 2 presents:
├─ T02-WCAG-Final-Report.md summary
├─ T04-Mismatch-Report summary (critical fixes made)
├─ T05a-Dependency-Review summary
└─ All evidence organized and ready
```

**Part 2: Track B Completion (10 min)**
```
Developer 1 presents:
├─ WAVE2-MASTER-IMPLEMENTATION-GUIDE.md overview
├─ Database schemas status (all 5 complete)
├─ API contracts status (all 5 complete)
└─ Ready for Sep 9 implementation team
```

**Part 3: Sign-Off (10 min)**
```
Both developers confirm:
✅ All deliverables complete
✅ All evidence collected
✅ All files committed to git
✅ Ready for Wave 2 launch Sep 9 09:00
```

**Exit:** Wave 1 COMPLETE + Wave 2 100% READY for implementation

---

## GIT COMMIT PROTOCOL

### Track A (Testing) Commits
```bash
# After keyboard nav testing complete
git commit -m "Wave 1: T02 WCAG keyboard navigation testing complete"

# After API audit complete
git commit -m "Wave 1: T04 API audit and mismatch identification complete"

# After sign-off
git commit -m "Wave 1: Complete - WCAG + API validation signed off (Sep 8)"
```

### Track B (Architecture) Commits
```bash
# Daily schema completion
git commit -m "Wave 2: T06a Booking workflow schema + API contract"
git commit -m "Wave 2: T06b Policy workflow schema + API contract"
git commit -m "Wave 2: T06c Claim workflow schema + API contract"
git commit -m "Wave 2: T06d Logistics workflow schema + API contract"
git commit -m "Wave 2: T06e Loyalty workflow schema + API contract"

# Master guide completion
git commit -m "Wave 2: Master implementation guide + E2E testing plan (Sep 8)"
```

---

## SUCCESS CRITERIA - By Sep 8 17:30

✅ **Track A Complete:**
- All WCAG testing done (keyboard nav + Lighthouse + responsive)
- All API audits done (mismatches found and resolved)
- All evidence collected and organized
- Sign-off document complete

✅ **Track B Complete:**
- All 5 workflow schemas complete
- All 5 workflow API contracts complete
- All integration points documented
- Master implementation guide complete
- E2E testing plan complete

✅ **Both Tracks:**
- All files committed to git
- All deliverables ready for Wave 2 team
- Zero rework needed
- Production launch on track for Sep 16

---

**Ready to launch Wave 2 Sep 9 09:00.** 🚀
