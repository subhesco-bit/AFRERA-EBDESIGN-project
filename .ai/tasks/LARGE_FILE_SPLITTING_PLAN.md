# Large File Splitting Plan
**Purpose:** Convert 26+ files >25MB into multiple <25MB files  
**Date:** 2026-09-18  
**Impact:** Improves performance, easier to work with in tools

---

## FILES TO PROCESS (From Earlier Scan)

### JSONL Files (Activity Logs) - Safe to Split
```
1. _EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-snapshot.jsonl (442 MB)
   → Split into: activity-snapshot-part1.jsonl, activity-snapshot-part2.jsonl (221 MB each)
   → Reason: Activity logs are line-delimited, easy to split chronologically

2. _EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-ledger.jsonl (135 MB)
   → Split into: activity-ledger-part1.jsonl, activity-ledger-part2.jsonl, activity-ledger-part3.jsonl
   → Reason: Line-delimited format allows sequential splits

3. _ACTIVE_PROJECT/current/_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-ledger.jsonl (135 MB)
   → Duplicate of above
   → Action: DELETE or symlink to archive
```

### CSV Files (Data Catalogs) - Need Careful Splitting
```
4. _EBDESIGN_LIBRARY/03_CATALOGUE/IMPLEMENTATION_CATALOGUE.csv (31 MB)
   → Split by: Category/Module group (maintain header row)
   → Target: 3-4 files, <25 MB each

5. _EBDESIGN_LIBRARY/03_CATALOGUE/LOGICAL_ENTITY_CATALOGUE.csv (28 MB)
   → Split by: Entity type (1 entity type per file)
   → Target: 2-3 files, <25 MB each

6. _EBDESIGN_LIBRARY/04_AUTHORITY/IDENTITY_REGISTRY/PHYSICAL_ITEM_IDENTITY_REGISTRY.csv (26+ MB)
   → Split by: Item category or region
   → Target: 2 files, ~13 MB each

7. _EBDESIGN_LIBRARY/04_AUTHORITY/IDENTITY_REGISTRY/PHYSICAL_PATH_INDEX.csv (26+ MB)
   → Split by: Path segment (alphabetical or geographic)
   → Target: 2 files, ~13 MB each

8. _EBDESIGN_LIBRARY/05_CLASSIFICATION/CONTENT_FAMILY_CATALOGUE.csv (27 MB)
   → Split by: Content family groups
   → Target: 2 files, ~13-14 MB each

9. _EBDESIGN_LIBRARY/06_HOLDINGS/HOLDINGS_REGISTER.csv (26+ MB)
   → Split by: Holdings type or date range
   → Target: 2 files, ~13 MB each
```

### JSON Files (Summaries) - Can Split or Archive
```
10. docs/codex-enterprise-library-index-summary.json (26+ MB)
    → Action: Move to .archive/ (summary, not live data)

11. _EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-project-library-summary.json (25+ MB)
    → Action: Move to .archive/ (summary file, can regenerate)
```

### Database/System Files
```
12. .ai/inventory/inventory.db (25+ MB)
    → Action: Analyze structure, consider archiving old entries or splitting
    → Or: Move to .archive/ if not actively used
```

### Backup/Archive Files (Already Archived)
```
13-26. Various files in:
  - _EBDESIGN_LIBRARY/_CONTROL/LIBRARY_COMPLETION_20260821_131500/
  - _EBDESIGN_LIBRARY/_CONTROL/ONE_PASS_LIBRARY_COMPLETION_20260820_223355/
  - _MERGE_LAB/features/
  - _ACTIVE_PROJECT/
  - _UNIFIED_PROJECT/
  → Action: MOVE TO .archive/ (old snapshots, not active)
```

---

## SPLITTING STRATEGY

### Type 1: JSONL Files (Line-Delimited, Safe Split)
```bash
# For 442 MB file → 2 files of 221 MB each
wc -l enterprise-file-activity-snapshot.jsonl  # Count lines
# If 1M lines:
head -n 500000 enterprise-file-activity-snapshot.jsonl > enterprise-file-activity-snapshot-part1.jsonl
tail -n 500000 enterprise-file-activity-snapshot.jsonl > enterprise-file-activity-snapshot-part2.jsonl

# Verify
wc -l enterprise-file-activity-snapshot-part*.jsonl
# Sum should equal original
```

### Type 2: CSV Files (Header-Aware Split)
```bash
# For CSV with header, split by data rows
head -1 IMPLEMENTATION_CATALOGUE.csv > IMPLEMENTATION_CATALOGUE-part1.csv  # Copy header
tail -n +2 IMPLEMENTATION_CATALOGUE.csv | head -n 100000 >> IMPLEMENTATION_CATALOGUE-part1.csv

head -1 IMPLEMENTATION_CATALOGUE.csv > IMPLEMENTATION_CATALOGUE-part2.csv  # Copy header
tail -n +2 IMPLEMENTATION_CATALOGUE.csv | tail -n +100001 >> IMPLEMENTATION_CATALOGUE-part2.csv

# Verify row counts match original
wc -l IMPLEMENTATION_CATALOGUE-part*.csv
```

### Type 3: JSON Files (Archive)
```bash
# Move to archive (regenerable, not active data)
mv docs/codex-enterprise-library-index-summary.json .archive/docs/
```

---

## SPLITTING EXECUTION PLAN

### Phase 1: Archive Old Snapshots (Fast, Low Risk)
**Files:** _CONTROL/, _MERGE_LAB/, _ACTIVE_PROJECT/, _UNIFIED_PROJECT/  
**Time:** 30 minutes  
**Risk:** LOW (old backups, not used)

### Phase 2: Split JSONL Activity Logs (Medium Risk, High Benefit)
**Files:** enterprise-file-activity-snapshot.jsonl, enterprise-file-activity-ledger.jsonl  
**Time:** 1-2 hours (need to verify line counts, test splits)  
**Risk:** MEDIUM (but reversible - keep originals during testing)

### Phase 3: Split CSV Catalogs (Medium Risk, Need Verification)
**Files:** IMPLEMENTATION_CATALOGUE.csv, LOGICAL_ENTITY_CATALOGUE.csv, IDENTITY_REGISTRY files  
**Time:** 2-3 hours (need to preserve data integrity)  
**Risk:** MEDIUM (loss of data integrity if split incorrectly)

### Phase 4: Archive JSON Summaries (Low Risk)
**Files:** codex-enterprise-library-index-summary.json, enterprise-project-library-summary.json  
**Time:** 15 minutes  
**Risk:** LOW (summaries, can regenerate)

### Phase 5: Database Optimization (If Needed)
**File:** .ai/inventory/inventory.db  
**Action:** Analyze, consider archiving old records or vacuum  
**Time:** 1-2 hours  
**Risk:** MEDIUM (database integrity)

---

## IMPLEMENTATION STEPS

### Step 1: Archive Old Backups
```bash
mkdir -p .archive/_OLD_PROJECTS

# Move old snapshots
mv _EBDESIGN_LIBRARY/_CONTROL .archive/LIBRARY_CONTROL_BACKUPS
mv _EBDESIGN_LIBRARY/_CONTROL .archive/LIBRARY_CONTROL_BACKUPS
mv _MERGE_LAB .archive/MERGE_LAB_OLD
mv _ACTIVE_PROJECT .archive/ACTIVE_PROJECT_OLD
mv _UNIFIED_PROJECT .archive/UNIFIED_PROJECT_OLD

# Commit
git add .archive/
git commit -m "archive: Move old project snapshots to .archive/ (cleanup)"
```

### Step 2: Split JSONL Files (Safe Split)
```bash
cd _EBDESIGN_LIBRARY/25_DISCOVERY_INDEX

# Count lines
wc -l enterprise-file-activity-snapshot.jsonl
# Let's say: 1000000 lines

# Split at 500000 lines
head -n 500000 enterprise-file-activity-snapshot.jsonl > enterprise-file-activity-snapshot-part1.jsonl
tail -n +500001 enterprise-file-activity-snapshot.jsonl > enterprise-file-activity-snapshot-part2.jsonl

# Verify
wc -l enterprise-file-activity-snapshot-part*.jsonl
# Should show: 500000, 500000

# Remove original
rm enterprise-file-activity-snapshot.jsonl

# Repeat for activity-ledger
```

### Step 3: Split CSV Files (Header-Aware)
```bash
cd _EBDESIGN_LIBRARY/03_CATALOGUE

# Count data rows (exclude header)
wc -l IMPLEMENTATION_CATALOGUE.csv  # e.g., 100001 (1 header + 100000 data)

# Extract header
head -1 IMPLEMENTATION_CATALOGUE.csv > header.txt

# Split data into ~50000 row chunks
tail -n +2 IMPLEMENTATION_CATALOGUE.csv | split -l 50000 - part_

# Add header to each part
for file in part_*; do
  cat header.txt | cat - "$file" > "IMPLEMENTATION_CATALOGUE-$file.csv"
  rm "$file"
done

# Verify
wc -l IMPLEMENTATION_CATALOGUE-part_*.csv
rm header.txt
```

### Step 4: Archive JSON Summaries
```bash
mkdir -p .archive/docs
mv docs/codex-enterprise-library-index-summary.json .archive/docs/
mv _EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-project-library-summary.json .archive/
```

### Step 5: Git Cleanup
```bash
# Add all changes
git add -A

# Commit large file splits
git commit -m "refactor: split large files (>25MB) into multiple <25MB files

- Split JSONL activity logs (442MB → 2×221MB)
- Split JSONL activity ledger (135MB → 3×45MB)
- Split CSV catalogs (28-31MB → 2×13-14MB each)
- Archive old project snapshots to .archive/
- Move JSON summaries to .archive/

This improves performance and reduces friction in version control."
```

---

## VERIFICATION CHECKLIST

- [ ] All JSONL splits verified (row counts match original)
- [ ] All CSV splits verified (header present, data integrity)
- [ ] Old archives moved to .archive/
- [ ] No source code files split (only data)
- [ ] Git commits successful
- [ ] All files accessible post-split

---

## EXPECTED OUTCOME

**Before:**
- 26+ files > 25MB
- ~1.5GB of large data files
- Difficult to work with in tools

**After:**
- 0 files > 25MB (except node_modules, .git)
- All data files split or archived
- Better performance, easier management
- ~500MB of live working data
- ~1GB archived to .archive/

---

## ROLLBACK PLAN (If Issues)

Each step is reversible:
1. JSONL splits: Can concatenate back together
2. CSV splits: Can concatenate with header row
3. Archives: Kept in .archive/, can restore if needed

---

*Plan created by: Claude Haiku 4.5*  
*Ready for: Execution*  
*Estimated total time: 4-5 hours*
