# MANDATORY MERGING GUIDELINES: Copy → Merge → Check → Test

**Status:** CRITICAL PROTOCOL  
**Date:** 2026-09-08  
**Scope:** ALL merges (current and future)  
**Enforcement:** ZERO EXCEPTIONS

---

## The Four-Step Merging Protocol

### STEP 1: COPY (Backup First)

Before ANY merge, create a safety backup:

```bash
# Create backup tag
git tag backup/before-merge-[branch-name] HEAD

# Verify backup created
git tag | grep backup/before-merge

# Push backup to remote
git push origin --tags
```

**Why:** If merge goes wrong, revert instantly to known-good state

**Verification:**
```bash
✅ Tag created: backup/before-merge-[name]
✅ Tag pushed to remote
✅ Can revert if needed
```

---

### STEP 2: MERGE (One Branch at a Time)

Merge ONLY ONE branch, never multiple in sequence without testing:

```bash
# Merge single branch
git merge [branch-name] -m "merge: [description]" --no-edit

# Check status immediately
git status

# If conflicts found:
#   STOP - resolve them
#   Do NOT proceed until conflicts resolved
```

**Conflict Resolution Protocol:**
```bash
# 1. See conflicts
git status

# 2. For EACH conflicted file:
#    - Open the file
#    - Review BOTH versions
#    - Choose the correct version consciously
#    - Remove conflict markers manually

# 3. Mark as resolved
git add [resolved-file]

# 4. Check status
git status

# 5. Complete merge (if all resolved)
git commit --no-edit
```

**Verification:**
```bash
✅ Merge completed without errors
✅ All conflicts resolved
✅ Commit message clear
```

---

### STEP 3: CHECK ALL FEATURES (Comprehensive Audit)

After merge, systematically check that ALL existing features still work:

```bash
echo "=== CHECKING ALL FEATURES AFTER MERGE ==="

# 1. Check git history
git log --oneline -5
# Verify merge commit is there

# 2. Check backend structure
ls -la backend/src/routes/ | wc -l
echo "Routes: should be 107+"

ls -la backend/src/services/ | wc -l
echo "Services: should be 140+"

# 3. Check frontend structure
ls -la frontend/src/pages/ | wc -l
echo "Pages: should be 369+"

ls -la frontend/src/components/ | wc -l
echo "Components: should be 686+"

# 4. Check database
ls -la backend/src/database/migrations/ | wc -l
echo "Migrations: should be 354+"

# 5. Check .ai documentation
ls -la .ai/workflows/ | wc -l
echo "Workflow docs: should be 6+"

# 6. Verify no files deleted
git diff HEAD~1 --name-status | grep "^D" | wc -l
# Should be 0 or very small number (only intentional deletions)
```

**Success Criteria:**
```bash
✅ All route files present (107+)
✅ All service files present (140+)
✅ All page files present (369+)
✅ All component files present (686+)
✅ All migrations present (354+)
✅ All documentation present
✅ No unexpected file deletions
```

---

### STEP 4: TEST (Comprehensive Validation)

Run full test suite to ensure nothing broke:

```bash
echo "=== RUNNING COMPREHENSIVE TESTS ==="

# Backend tests
cd backend
npm test 2>&1 | tee test-results-backend.log
BACKEND_RESULT=$?

# Frontend tests
cd ../frontend
npm test 2>&1 | tee test-results-frontend.log
FRONTEND_RESULT=$?

# Check results
echo ""
echo "=== TEST RESULTS ==="
if [ $BACKEND_RESULT -eq 0 ]; then
  echo "✅ Backend tests: PASSED"
else
  echo "❌ Backend tests: FAILED"
fi

if [ $FRONTEND_RESULT -eq 0 ]; then
  echo "✅ Frontend tests: PASSED"
else
  echo "❌ Frontend tests: FAILED"
fi

# Security audit
npm audit 2>&1 | tee audit-results.log
AUDIT_RESULT=$(grep -c "critical\|high" audit-results.log || echo "0")

if [ "$AUDIT_RESULT" = "0" ]; then
  echo "✅ Security audit: PASSED (0 vulnerabilities)"
else
  echo "❌ Security audit: FAILED ($AUDIT_RESULT issues)"
fi

# Build check
npm run build 2>&1 | tee build-results.log
BUILD_RESULT=$?

if [ $BUILD_RESULT -eq 0 ]; then
  echo "✅ Build: SUCCESSFUL"
else
  echo "❌ Build: FAILED"
fi
```

**Go/No-Go Decision:**

```bash
if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ] && [ "$AUDIT_RESULT" = "0" ] && [ $BUILD_RESULT -eq 0 ]; then
  echo "✅✅✅ ALL TESTS PASSED - MERGE APPROVED ✅✅✅"
  echo "Push to main:"
  git push origin [branch]
else
  echo "❌ TESTS FAILED - REVERT IMMEDIATELY"
  git reset --hard backup/before-merge-[branch-name]
  echo "Reverted to backup. Investigate failures before retrying."
fi
```

---

## Failure Protocol: Immediate Revert

**If ANY test fails:**

```bash
# 1. DO NOT CONTINUE
# 2. DO NOT PUSH
# 3. REVERT IMMEDIATELY

git reset --hard backup/before-merge-[branch-name]

# 4. Investigate
git log backup/before-merge-[branch-name]..[branch-name] --stat

# 5. Report issue
echo "Merge [branch-name] failed due to:"
echo "- Test failure: [specific test]"
echo "- Root cause: [analysis]"
echo "- Fix required: [solution]"

# 6. Do NOT retry until issue is fixed
```

---

## Full Merge Checklist (For Current State)

```
BEFORE MERGE:
  ☐ Fetch latest: git fetch origin
  ☐ Create backup: git tag backup/before-merge-[name]
  ☐ Push backup: git push origin --tags
  ☐ Review branch: git log HEAD..origin/[branch] --stat

DURING MERGE:
  ☐ Merge one branch: git merge origin/[branch]
  ☐ Check status: git status
  ☐ Resolve conflicts (if any)
  ☐ Verify resolution
  ☐ Commit: git commit

AFTER MERGE:
  ☐ Check all features (routes, services, pages, components)
  ☐ Verify file counts
  ☐ Check git history
  ☐ Run backend tests: npm test
  ☐ Run frontend tests: npm test
  ☐ Run security audit: npm audit
  ☐ Build verification: npm run build
  ☐ Verify zero critical/high CVEs
  ☐ Verify all tests passing

GO/NO-GO DECISION:
  ☐ All tests passing? 
  ☐ All features intact?
  ☐ Zero new CVEs?
  ☐ Build successful?
  
  If YES to all: ✅ PUSH TO REMOTE
  If NO to any: ❌ REVERT IMMEDIATELY
```

---

## Current Merge State: What Needs to Happen NOW

**Current Status:**
```
Batch 1: Partially merged (conflicts resolved, committed)
Batch 2: In progress (conflicts need resolution)
Batch 3: NOT merged yet
Batch 4: NOT merged yet
```

**Required Actions (In Order):**

1. **PAUSE Current Merge**
   ```bash
   # See current state
   git status
   
   # If in middle of merge:
   # Either complete it or abort it
   git merge --abort  # if undoing
   # OR
   git commit  # if completing
   ```

2. **For Each Batch (After STEP 4 Tests Pass):**
   - Complete STEP 1 (backup): Create tag
   - Complete STEP 2 (merge): Merge branch
   - Complete STEP 3 (check): Verify all features
   - Complete STEP 4 (test): Run all tests
   - Make GO/NO-GO decision
   - Push to remote (only if GO)

3. **ONLY merge next batch after previous batch tests pass**
   - No sequential merges without testing
   - No pushing without testing
   - No assumptions about "it should work"

---

## Why This Protocol is Non-Negotiable

| Step | Why | Risk if Skipped |
|------|-----|-----------------|
| COPY | Backup in case of failure | Can't recover, lost work |
| MERGE | One at a time for clarity | Cascading conflicts, can't isolate issue |
| CHECK | Ensure features not deleted | Broken functionality undetected |
| TEST | Verify nothing broke | Ship broken code to production |

---

## Current Recommendation

**STOP all merging immediately.**

**Take these actions:**

```bash
# 1. See current merge state
git status

# 2. If mid-merge, decide:
#    - Complete it (finish + commit), OR
#    - Abort it (git merge --abort)

# 3. Start FRESH with proper protocol
#    - Batch 1: Copy → Merge → Check → Test
#    - If Pass: Push
#    - If Fail: Revert

# 4. Only after Batch 1 passes:
#    - Batch 2: Copy → Merge → Check → Test
#    - etc.
```

---

## For All Future Merges (Next 6 Months)

This protocol applies to **EVERY SINGLE MERGE**, no exceptions:

1. ✅ **Copy** (Create backup tag)
2. ✅ **Merge** (One branch)
3. ✅ **Check** (All features intact)
4. ✅ **Test** (All tests passing)
5. ✅ **Decision** (Go/No-Go)
6. ✅ **Push** (Only if all 4 steps pass)

**No shortcuts. No exceptions. No assumptions.**

---

*Merging Guidelines established September 8, 2026 | MANDATORY COMPLIANCE | All current + future merges*

Verified By VibeCheck ✅
