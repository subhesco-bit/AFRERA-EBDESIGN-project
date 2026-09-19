# Batch Repair Orchestration Model

**Purpose:** Token-efficient bulk repair workflow where Claude/agents instruct batch scripts instead of editing files incrementally.

**Problem:** Line-by-line file edits consume enormous tokens for large fixes:
- Repair npm breakage across 276 require() paths = 276+ individual tool calls + verification passes
- Frontend API stub generation across 142 missing exports = 142+ individual edits
- Module route wiring for 150+ services = per-file turnaround

**Solution:** Write one comprehensive script that does everything, execute it once, monitor output.

## The Pattern

### Phase 1: Analyze & Script (Claude)
1. **Scan** the problem scope (e.g., grep broken requires, inventory missing deps)
2. **Categorize** fixes by type (e.g., Class A: path prefix bugs, Class B: wrong relative depth, Class C: ambiguous flat-vs-legacy)
3. **Write one PowerShell or Node.js script** that:
   - Reads all broken files at once
   - Applies all fixes in a single pass
   - Writes all output
   - Produces a **result summary** (JSON/CSV: what changed, what failed, why)
4. **Commit the script** to scratchpad for auditing

### Phase 2: Execute & Monitor (Claude + Human)
1. **Run the script** with timeout, capture full output
2. **Parse the result summary** — human sees:
   - ✅ Count of successful fixes
   - ⚠️ Count of skipped/ambiguous cases (with reasoning)
   - ❌ Count of failures (with file + error)
3. **Verify one sample** from each fix class (spot-check)
4. **Commit changes** with a single message naming the script and result counts

### Phase 3: Residual Cleanup (if needed)
- Only fix truly ambiguous/manual cases after script succeeds
- Add to `.ai/tasks/ACTIVE.md` if decision needed from another agent
- Do NOT re-run the script; hand-edit the residuals

---

## Example: npm Require() Path Repair (what was just done)

### Script: `autofix_requires.js` + `apply_fixes.js`
```powershell
# 1. Scan all broken requires (produces JSON inventory)
node scan_broken_requires.js > broken_requires.json

# 2. Auto-resolve each: try basename matching, prefer legacy/ for ambiguous
node autofix_requires.js < broken_requires.json > autofix_results.json

# 3. Apply all fixes in batch
node apply_fixes.js < autofix_results.json
# Output: "Applied unambiguous fixes: 191/191, Applied ambiguous fixes: 43/43, Skipped: 4"
```

### Result Summary (autofix_results.json)
```json
{
  "fixed": [
    {"file": "backend/src/modules/M001/.../service.js", "oldReq": "require('../../../backend/src/...')", "newReq": "require('...')"},
    ... 191 total
  ],
  "ambiguous": [
    {"file": "backend/src/services/index.js", "oldReq": "foluService", "candidates": ["services/foluService.js", "services/legacy/foluService.js"]}
    ... 43 total
  ],
  "notfound": [4 items],
  "skipped": [4 items - comments, non-breaking patterns]
}
```

### Token Cost
- **One-by-one edits:** ~600 files × (Read + Edit + Verify) × 3 tokens/tool = **1800+ tokens** just in tool overhead, plus context for each file
- **Batch script:** Write script (50 tokens) + Run (20 tokens) + Parse output (30 tokens) + One commit (20 tokens) = **~120 tokens** total

**Savings:** ~15x fewer tokens.

---

## When to Use Batch Orchestration

✅ **Use batch:**
- Fixing the same bug class across 50+ files (require paths, missing exports, broken imports)
- Generating similar code in bulk (API stubs, route wiring, module services)
- Inventory + remediation (find all X, apply fix to all X)
- Tests that can be run as a suite
- Database migrations, schema changes applied to many files

❌ **Don't use batch:**
- Fixes requiring domain judgment per file (architecture redesigns, business logic changes)
- One-off bugs in a single file
- Changes that need human approval before commit
- Cases where failure of one item should block the rest

---

## Artifact Convention: The Repair Script

Store all batch-repair scripts in `.ai/workflows/scripts/`:
```
.ai/workflows/scripts/
├── scan_broken_requires.js       # Inventory phase
├── autofix_requires.js           # Resolution phase
├── apply_fixes.js                # Execution phase
├── RESULTS_2026-09-19.json       # Output from last run
└── REPAIR_LOG_2026-09-19.md      # Human summary: what passed, what failed
```

Each script should:
1. **Read once** (load entire input set upfront, don't loop filesystem repeatedly)
2. **Process in memory** (no intermediate writes unless checkpointing)
3. **Write once** (output all changes in a single batch)
4. **Report structure** (JSON: {fixed: [], ambiguous: [], notfound: [], skipped: []})
5. **Be idempotent** (running twice should skip already-fixed items, not double-fix)

---

## Handoff Format (for other agents)

When handing off a batch repair to ChatGPT/Devin:

```markdown
## Batch Repair: [Name] (Token-Efficient Model)

**Problem:** [Scope]
**Script:** `.ai/workflows/scripts/[name].js`
**Result:** Last run: [Date], [X fixed], [Y ambiguous], [Z failed]

### To execute:
\`\`\`powershell
cd backend
node ../.ai/workflows/scripts/[name].js
\`\`\`

### Residuals needing judgment:
- [Specific ambiguous cases from result.json]
- [Cases where decision blocks automation]

### After execution:
- Review .ai/workflows/scripts/RESULTS_[date].json
- Commit changes with script name + counts in message
```

---

## Cost Model for Planning

Estimate token usage before committing:

| Task | One-by-One | Batch Script |
|------|-----------|--------------|
| Fix 100 require paths | ~600 tokens | ~100 tokens |
| Generate 50 API stubs | ~800 tokens | ~120 tokens |
| Wire 30 routes | ~500 tokens | ~80 tokens |
| **Total for trio** | **~1900 tokens** | **~300 tokens** |

Save ~1600 tokens → redirect to actual feature work instead of plumbing.

---

## Why This Works for Multi-Agent Sync

1. **No duplicate work:** Script output is machine-readable; ChatGPT can parse `RESULTS.json` and skip already-fixed items
2. **Fault isolation:** If one fix fails, rest still succeed; easy to spot the outlier
3. **Audit trail:** Script + input + output is complete; another agent can re-run and verify
4. **Hand-offs:** "Run this script, review RESULTS.json, then pick up where the ambiguous cases are" is clear and minimal
5. **Token-efficient:** Leaves budget for actual development, not debugging plumbing

---

## Next Repair Using This Model

When the next bulk issue is found (e.g., missing route mounts, broken TypeScript imports):

1. Write the scan + fix + apply scripts in `.ai/workflows/scripts/`
2. Commit scripts before running (for auditing)
3. Execute once, capture RESULTS
4. Commit changes + RESULTS + a summary to `.ai/tasks/ACTIVE.md`
5. Hand off to ChatGPT: "Scripts are ready, RESULTS.json shows what passed; residuals in the ambiguous list"
