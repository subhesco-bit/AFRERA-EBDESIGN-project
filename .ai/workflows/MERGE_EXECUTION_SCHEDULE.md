# MERGE EXECUTION SCHEDULE: Proper Protocol for Current + Future

**Status:** READY FOR IMPLEMENTATION  
**Date:** 2026-09-08  
**Current State:** Batch 1 merged, Tests running, Batches 2-4 pending  
**Protocol:** Copy → Merge → Check → Test (MANDATORY)

---

## Current Status (Sept 8, 8 PM)

```
✅ Batch 1: IDOR Security Fix
   - Merged: claude/keen-mclean-bbe8a1
   - Conflicts: Resolved
   - Status: Committed (ce0e9731)
   - Tests: RUNNING

🟡 Batch 2: Claim Payout Bug Fix
   - Branch: recovered/eloquent-napier-660f37
   - Status: PENDING (waiting for Batch 1 test results)

🔴 Batch 3: CVE Dependency Fixes
   - Branch: claude/inspiring-swirles-a1be24
   - Status: PENDING

🔴 Batch 4: Code Deduplication
   - Branch: claude-enhancement
   - Status: PENDING
```

---

## IMMEDIATE NEXT STEPS (After Test Results)

### Decision Tree:

**IF Batch 1 Tests Pass ✅**
```
→ Proceed to Batch 2
→ Create backup: git tag backup/before-batch2
→ Merge: recovered/eloquent-napier-660f37
→ Check: All features intact
→ Test: npm test + npm audit
→ Go/No-Go: Decide if push
→ If Pass: Push to remote
→ Then: Batch 3
```

**IF Batch 1 Tests Fail ❌**
```
→ STOP ALL MERGING
→ Recover: git reset --hard backup/before-batch1
→ Investigate: What broke in Batch 1?
→ Fix: Address the issue
→ Retry: Re-merge Batch 1 with fix
→ Test: Verify all pass
→ Then: Proceed to Batch 2 only after Batch 1 fully passes
```

---

## Batch 2: Claim Payout Bug Fix

**When:** After Batch 1 tests pass ✅

**Branch:** `recovered/eloquent-napier-660f37`

**Steps:**

```bash
# STEP 1: COPY (Backup)
git tag backup/before-batch2 HEAD
git push origin --tags

# STEP 2: MERGE (One branch)
git merge recovered/eloquent-napier-660f37 \
  -m "merge: claim payout bug fix (Batch 2)

Changes:
- Fix calculateClaimPayout ReferenceError
- Add claims module validation tests

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# If conflicts:
#  git status
#  # Resolve each conflict manually
#  git add [resolved-files]
#  git commit

# STEP 3: CHECK (All features)
echo "Verifying all features intact..."
ls -la backend/src/services/ | wc -l  # Should be 140+
ls -la backend/src/routes/ | wc -l    # Should be 107+
git diff HEAD~1 --name-status | grep "^D" | wc -l  # Should be 0

# STEP 4: TEST (Comprehensive)
cd backend && npm test 2>&1 | tee batch2-test.log
cd ../frontend && npm test 2>&1 | tee batch2-test.log
npm audit 2>&1 | tee batch2-audit.log

# DECISION
if tests_pass && audit_clean && features_intact; then
  echo "✅ Batch 2 APPROVED - Pushing to remote"
  git push origin audit/ui-api-fix
else
  echo "❌ Batch 2 FAILED - Reverting"
  git reset --hard backup/before-batch2
fi
```

---

## Batch 3: CVE Dependency Fixes

**When:** After Batch 2 tests pass ✅

**Branch:** `claude/inspiring-swirles-a1be24`

**Special:** Dependency update - requires fresh `npm install`

**Steps:**

```bash
# STEP 1: COPY
git tag backup/before-batch3 HEAD
git push origin --tags

# STEP 2: MERGE
git merge claude/inspiring-swirles-a1be24 \
  -m "merge: frontend CVE fixes (Batch 3)

Changes:
- Fix vitest critical CVE
- Fix vite critical CVE

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# STEP 3: CHECK
echo "Checking dependencies..."
npm list vitest | head -2  # Verify new version
npm list vite | head -2    # Verify new version

# STEP 4: TEST
rm -rf node_modules package-lock.json
npm install
npm test
npm audit  # CRITICAL: MUST have zero high/critical CVEs

# DECISION
if audit_passes_zero_cves && tests_pass; then
  echo "✅ Batch 3 APPROVED"
  git push origin audit/ui-api-fix
else
  echo "❌ Batch 3 FAILED"
  git reset --hard backup/before-batch3
fi
```

---

## Batch 4: Code Deduplication

**When:** After Batch 3 tests pass ✅

**Branch:** `claude-enhancement`

**Steps:**

```bash
# STEP 1: COPY
git tag backup/before-batch4 HEAD
git push origin --tags

# STEP 2: MERGE
git merge claude-enhancement \
  -m "merge: service deduplication (Batch 4)

Changes:
- Remove 13 duplicate service exports
- Consolidate module exports
- Improve performance

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# STEP 3: CHECK
echo "Checking service structure..."
grep -c "module.exports" backend/src/services/*.js
# Should be reasonable count without duplicates

# STEP 4: TEST
npm test
npm run lint  # Lint check important for this batch
npm run build

# DECISION
if build_successful && tests_pass && lint_passes; then
  echo "✅ Batch 4 APPROVED"
  git push origin audit/ui-api-fix
else
  echo "❌ Batch 4 FAILED"
  git reset --hard backup/before-batch4
fi
```

---

## FINAL: Comprehensive Verification

**When:** After all 4 batches merged and pushed

**Steps:**

```bash
# Full clean test
rm -rf node_modules package-lock.json
npm install

# Backend tests
cd backend && npm test 2>&1 | tee final-backend.log
BACKEND_PASS=$?

# Frontend tests  
cd ../frontend && npm test 2>&1 | tee final-frontend.log
FRONTEND_PASS=$?

# Security audit
npm audit 2>&1 | tee final-audit.log
CVE_COUNT=$(grep -c "critical\|high" final-audit.log || echo "0")

# Build verification
npm run build 2>&1 | tee final-build.log
BUILD_PASS=$?

# Lint check
npm run lint 2>&1 | tee final-lint.log
LINT_PASS=$?

# Summary
echo "==================================="
echo "FINAL VERIFICATION RESULTS"
echo "==================================="
echo "Backend Tests: $([ $BACKEND_PASS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Frontend Tests: $([ $FRONTEND_PASS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Security Audit: $([ "$CVE_COUNT" = "0" ] && echo '✅ PASS (0 CVEs)' || echo "❌ FAIL ($CVE_COUNT CVEs)")"
echo "Build: $([ $BUILD_PASS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Lint: $([ $LINT_PASS -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "==================================="

if [ $BACKEND_PASS -eq 0 ] && [ $FRONTEND_PASS -eq 0 ] && [ "$CVE_COUNT" = "0" ] && [ $BUILD_PASS -eq 0 ] && [ $LINT_PASS -eq 0 ]; then
  echo "✅✅✅ ALL CHECKS PASSED ✅✅✅"
  echo "100% INTEGRATION COMPLETE - READY FOR LAUNCH"
else
  echo "❌ SOME CHECKS FAILED"
  echo "Review logs for details and fix issues before launch"
fi
```

---

## Timeline (If All Passes)

```
Current: 20:00 PM - Batch 1 tests running
         20:30 PM - Batch 1 results + decision
         20:35 PM - Backup + Batch 2 merge + test
         21:10 PM - Batch 2 results + decision
         21:15 PM - Backup + Batch 3 merge + test
         21:50 PM - Batch 3 results + decision
         21:55 PM - Backup + Batch 4 merge + test
         22:30 PM - Batch 4 results + decision
         22:35 PM - Final verification (60 min)
         23:35 PM - ✅ 100% INTEGRATION COMPLETE
```

**Total Time:** ~3.5 hours if all passes on first try

---

## For ALL Future Merges (After Today)

This protocol is **MANDATORY** for every merge:

1. ✅ **COPY** - Create backup tag before merge
2. ✅ **MERGE** - One branch only
3. ✅ **CHECK** - Verify all features intact
4. ✅ **TEST** - Run full test suite
5. ✅ **DECIDE** - Go/No-Go decision
6. ✅ **PUSH** - Only if all pass

**No shortcuts. No exceptions. No assumptions.**

---

*Merge Execution Schedule established September 8, 2026 | READY TO EXECUTE*

Verified By VibeCheck ✅
