# 02_LINKAGE_CANDIDATES.csv — split into <25MB parts

`02_LINKAGE_CANDIDATES.csv` (96MB, 1,025,702 data rows, 3 columns:
System/File/LinkageCandidate) was split into 6 header-aware parts on
2026-09-20 per `.ai/tasks/LARGE_FILE_SPLITTING_PLAN.md` (keep everything in
git, no file over 25MB). Each part carries its own copy of the header row,
so each part is independently usable as a valid CSV (not just a reassembly
fragment) — you don't need all 6 to read any one part's data.

Row-count integrity was verified before the original was removed from
tracking: `tail -n +2 -q 02_LINKAGE_CANDIDATES-part*.csv | wc -l` = 1025702,
exactly matching the original's data-row count.

## To reconstruct the single original file (if something needs the whole
thing as one CSV)

```bash
cd .system-audit/EBDESIGN
head -1 02_LINKAGE_CANDIDATES-part00.csv > 02_LINKAGE_CANDIDATES.csv
for f in 02_LINKAGE_CANDIDATES-part*.csv; do tail -n +2 "$f" >> 02_LINKAGE_CANDIDATES.csv; done
```
