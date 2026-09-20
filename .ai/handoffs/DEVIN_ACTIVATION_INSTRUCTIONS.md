# DEVIN ACTIVATION INSTRUCTIONS

**Status:** Ready for activation  
**Activation Date:** September 10, 2026 @ 1:30 PM IST  
**Expected Start:** After quota reset (automatic)  
**Expected Duration:** 2-4 hours

---

## 🚀 HOW DEVIN STARTS WORK

### Step 1: Receive Handoff Session

When activated on Sept 10 @ 1:30+ PM IST, Claude will run:

```bash
cd backend
node scripts/trigger_devin_handoff.js
```

This creates a **Devin session** with:
- ✅ Complete project context
- ✅ Full handoff prompt (all priorities)
- ✅ 4-level priority work queue
- ✅ Standing rules & verification methodology

---

## 📋 WORK QUEUE (Priority Order)

### **PRIORITY 1: Frontend-Backend API Wiring** 🔴 CRITICAL

**Scope:** 3 frontend pages need API remapping  
**Time:** ~30-45 minutes

#### Task 1.1: OrchardManagementPage.jsx
- **File:** `frontend/src/pages/OrchardManagementPage.jsx`
- **Issue:** Uses `orchardAPI` calling non-existent paths
- **Fix:** Repoint to `/api/v1/backend-modules/M141/:operation`
- **Backend Methods:** listOrchards, getOrchard, createOrchard, updateOrchard, deleteOrchard, getOrchardProduction, recordOrchardProduction
- **Verification:** Page loads without errors, list view shows orchards

#### Task 1.2: PondManagementPage.jsx
- **File:** `frontend/src/pages/PondManagementPage.jsx`
- **Issue:** Uses `pondAPI` calling non-existent paths
- **Fix:** Repoint to `/api/v1/backend-modules/M132/:operation`
- **Backend Methods:** listPonds, getPond, createPond, updatePond, deletePond, plus sensor/AI operations
- **Verification:** Page loads without errors, pond list operational

#### Task 1.3: FarmerHealthWelfarePage.jsx
- **File:** `frontend/src/pages/FarmerHealthWelfarePage.jsx`
- **Issue:** Uses `farmerWelfareAPI` calling non-existent paths
- **Fix:** Repoint to `/api/v1/backend-modules/M029/:operation`
- **Backend Methods:** listHealthRecords, getHealthRecord, createHealthRecord, updateHealthRecord, deleteHealthRecord
- **Verification:** Page loads without errors, health records accessible

---

### **PRIORITY 2: UI/Backend Mismatch Pages** 🟠 HIGH

**Scope:** 2 frontend pages assume CRUD; backend has action-only APIs  
**Time:** ~45-60 minutes  
**Reference Pattern:** `frontend/src/pages/WaterManagementPage.jsx` (action cards, not list view)

#### Task 2.1: VillageRegistryPage.jsx
- **File:** `frontend/src/pages/VillageRegistryPage.jsx`
- **Issue:** Page expects CRUD list; backend only has: createVillage, addVillageResource, getVillageAnalytics
- **Fix:** Redesign from list-view to action-cards (see WaterManagementPage.jsx pattern)
- **Backend Target:** `backend/src/modules/M041/service.js`
- **Verification:** Page renders action cards, not list table; all actions work

#### Task 2.2: PoultryManagementPage.jsx
- **File:** `frontend/src/pages/PoultryManagementPage.jsx`
- **Issue:** Page expects CRUD list; backend only has: registerPoultryFlock, updateFlockHealth, trackFlockPerformance, generatePoultryReport
- **Fix:** Redesign from list-view to action-cards (see WaterManagementPage.jsx pattern)
- **Backend Target:** `backend/src/modules/M123/service.js`
- **Verification:** Page renders action cards, not list table; all actions work

---

### **PRIORITY 3: Module ID Verification** 🟡 CRITICAL RESEARCH

**Scope:** Verify ~19 module ID mismatches before any backend work  
**Time:** ~60-90 minutes  
**Method:** Read file header + exports; verify against frontend comments  
**IMPORTANT:** Do NOT trust comments or README claims — verify by reading actual code

#### Known Mismatches to Verify:

| Frontend Claim | Actual Content | M ID | Action |
|---|---|---|---|
| FPO Governance | Product Catalog | M052 | Verify & correct label |
| FPO Marketing | Shipping Management | M057 | Verify & correct label |
| Block/District/State Mgmt | Crop Registration/Variety/Seed | M043/044/045 | Verify & correct |
| Nutrient/Fertility Mgmt | Goat/Sheep Management | M073/074 | Verify & correct |
| Drought/Flood Monitoring | Analytics/Real-time Monitoring | M085/086 | Verify & correct |
| Role/Permission/SSO/etc | SSO/MFA/Identity/Privacy/Profile | M014-M020 | Verify & correct |
| Feature Flag/TimeZone/Config | Role&Perm/Security/Notification | M007/009/010 | Verify & correct |

**Verification Checklist:**
- [ ] Read each module's service.js header comment
- [ ] List all exported methods
- [ ] Compare against frontend usage
- [ ] Update README if mismatch found
- [ ] Commit: "docs: correct module ID mismatches for M0XX"

---

### **PRIORITY 4: Empty Backend Module Implementation** 🟢 LOWEST

**Scope:** ~50 modules need real backend implementation  
**Time:** Only after Priority 1-3 complete  
**Method:** Create service + routes + schema for each

#### Modules Needing Implementation:
```
M063-M068 (6)
M088-M097 (10) 
M099-M100 (2)
M106 (1)
M113-M120 (8)
M124, M126, M129-M131 (5)
M133-M140 (8)
M142-M143 (2)
M145-M147 (3)
M149-M150 (2)
M048-M049 (2)
```

**Do NOT start until Priority 1-3 complete.**

---

## ✅ STANDING RULES

**Always follow these rules:**

1. **Verify by running code, not reading it**
   - "It looks right" is NOT "it works"
   - Test every change live before committing

2. **When two implementations exist, merge them**
   - Copy features from both → merge into one
   - Verify merged version works
   - Delete/remove duplicate AFTER verification

3. **No shadowing of same-named functions**
   - If function signatures differ, keep both under distinct names
   - Never let one silently shadow another

4. **No fake completion**
   - Don't mark something done without running it
   - Don't claim it's wired without testing
   - Don't say production-ready without verification

5. **Read project files FIRST**
   - `.ai/PROJECT_CONTEXT.md` — Complete context
   - `.ai/AGENT_PROTOCOL.md` — Collaboration rules
   - `CLAUDE.md` — Project intelligence
   - `.ai/architecture/CURRENT_IMPLEMENTATION.md` — Current state

6. **Commit frequently**
   - One logical change per commit
   - Clear commit message naming the work
   - Include: `Co-Authored-By: Devin <noreply@devin.ai>`

7. **Update .ai/tasks/ACTIVE.md as you work**
   - Mark priority sections ✅ DONE as complete
   - Note any blockers or decisions
   - Update estimated remaining time

---

## 🔄 WORKFLOW

1. **Start:** Fire handoff session (Sept 10 @ 1:30 PM IST)
2. **Read:** Project context, this file, standing rules
3. **Priority 1:** Wire 3 frontend pages to existing backends
   - Commit after each page
   - Test each change live
   - Update ACTIVE.md
4. **Priority 2:** Redesign 2 action-based pages
   - Use WaterManagementPage.jsx as pattern
   - Commit after each page
   - Test live
   - Update ACTIVE.md
5. **Priority 3:** Verify module ID mismatches
   - Read actual code (not comments)
   - Correct README labels where wrong
   - Commit: "docs: correct module mismatches"
   - Update ACTIVE.md
6. **Priority 4:** (Only if Priority 1-3 done) Implement empty modules
   - Create schema + service + routes for each
   - Test each implementation
   - Commit module by module
   - Update ACTIVE.md

---

## 📊 COMPLETION CHECKLIST

- [ ] Priority 1 (3 pages wired) — DONE
- [ ] Priority 2 (2 pages redesigned) — DONE
- [ ] Priority 3 (19 modules verified) — DONE
- [ ] Priority 4 (50 modules implemented) — DONE (if time permits)
- [ ] All ACTIVE.md sections marked complete
- [ ] All commits pushed to GitHub
- [ ] Ready for Claude review & merge

---

## 🚨 BLOCKERS & ESCALATION

**If you hit any of these:**

1. **Database not running** → Expected; use `/api/v1/backend-modules/:moduleId/:operation` bridge
2. **Missing migration** → Check `backend/src/database/migrations/`; create if needed
3. **Service method doesn't exist** → Read the actual service.js file; verify method name
4. **Frontend component broken** → Check browser console; read React component carefully
5. **Git conflict** → Resolve locally; commit with clear message

**Escalation:** If something truly blocks progress, commit what you have and note the blocker in ACTIVE.md.

---

## 📞 CONTACT & RESOURCES

- **Project Context:** `.ai/PROJECT_CONTEXT.md`
- **Current State:** `.ai/architecture/CURRENT_IMPLEMENTATION.md`
- **Task History:** `.ai/tasks/ACTIVE.md` (keep updated as you work)
- **Architecture:** `.ai/architecture/` directory
- **Backend Entry:** `backend/src/index.js`
- **Routes:** `backend/src/routes/` directory
- **Services:** `backend/src/services/` directory
- **Frontend:** `frontend/src/` directory

---

## 🎯 SUCCESS CRITERIA

✅ **Work complete when:**
- All Priority 1 pages wired and tested
- All Priority 2 pages redesigned and tested
- All Priority 3 mismatches verified and corrected
- All commits pushed to GitHub
- ACTIVE.md fully updated
- Ready for Claude's review and merge

---

**Devin, this is your work queue. Execute in order, follow standing rules, test everything, keep ACTIVE.md updated. Ready to start Sept 10 @ 1:30 PM IST. 🚀**

*Last updated: 2026-09-09 by Claude*
