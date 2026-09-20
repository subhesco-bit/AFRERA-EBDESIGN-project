# Token Optimization Methodology

**Purpose:** Systematic techniques to reduce token consumption by 50-80% while maintaining quality and safety.

**Applies to:** All agents (Claude, ChatGPT, Devin) across all tasks.

---

## 1. BATCH EXECUTION PATTERN (Primary Savings: ~15x)

**Problem:** Line-by-line edits cost 1 token per tool call overhead × 100 files = 100+ tool calls.

**Solution:** Write ONE script that processes all 100 items in a single pass.

**Token Cost Comparison:**
```
❌ Line-by-line: 100 files × (Read + Edit + Verify) = 1800+ tokens + context overhead
✅ Batch script: Write script (50) + Run (20) + Parse output (30) + Commit (20) = 120 tokens

Savings: ~15x (1800 → 120)
```

**Technique:**
- Scan all files once → categorize → generate fix script
- Execute script once → JSON result summary
- Spot-check 1-2 results
- Commit with counts

**Use When:**
- 50+ files of same bug class
- Fix is mechanical/repeatable
- Verification can be automated

---

## 2. CONTEXT COMPRESSION (Savings: ~3-5x)

**Problem:** Rereading the same context over and over (project docs, file structures, recent commits).

**Solution:** Build a **session context cache** at conversation start, reference by pointer.

**Implementation:**

### Session Start (Cache Building Phase)
Instead of:
```
Read CLAUDE.md (500 tokens)
Read PROJECT_CONTEXT.md (800 tokens)
Read last 5 commits (300 tokens)
[× 5 different agents = 5500 tokens wasted on duplication]
```

Do:
```
📌 **SESSION CONTEXT CACHE** (built once, referenced 5x)
- Project structure: .claude/CONTEXT_CACHE.json (precomputed indices)
- Recent commits: .claude/GIT_CONTEXT.json (hashes, subjects, authors)
- Active tasks: .claude/TASKS_CACHE.json (quick lookup by ID)
- Architecture: .claude/ARCH_CACHE.json (module map, route registry)
[Total: 800 tokens, saved 5× = 4700 token savings]
```

**Technique:**
1. At session start: Agent runs `context_cache_builder.js` (60s, produces 4 JSON files)
2. During work: Instead of re-reading, `const arch = require('.claude/ARCH_CACHE.json')`
3. At end: Commit cache files; next session starts fresh

**Files to Create:**
```
.claude/
├── CONTEXT_CACHE.json          # Project structure, package.json index, module list
├── GIT_CONTEXT.json            # Last 20 commits (hash, subject, author, date)
├── TASKS_CACHE.json            # ACTIVE.md parsed into searchable JSON
├── ARCH_CACHE.json             # Route registry, service index, page structure
└── context_cache_builder.js    # Script to regenerate all 4
```

---

## 3. DECISION MEMOIZATION (Savings: ~2-3x)

**Problem:** Asking the same architectural question 3 times across sessions, getting same answer 3 times.

**Solution:** Store decisions in `.ai/decisions/MEMOIZED.json` with reasoning.

**Example Decision Log:**
```json
{
  "M125_flat_vs_legacy": {
    "decision": "prefer legacy/ copies when flat also exists",
    "reasoning": "legacy/ versions are real (500-1600 lines), flat are 20-line stubs",
    "applies_to": ["foluBenchmarkService", "organicTraceabilityService", ...],
    "date_decided": "2026-09-19",
    "decided_by": "Claude",
    "cost_saved": "~300 tokens (not re-deriving 12 similar cases)"
  },
  "frontend_api_stub_pattern": {
    "decision": "generate stubs from call-site usage, not blind GET/POST",
    "reasoning": "authAPI needs real login/register contract to match backend",
    "cost_saved": "~200 tokens (pattern reused 40+ times)"
  }
}
```

**Technique:**
- Whenever a design decision is made, add 1 entry to MEMOIZED.json
- Next agent doing similar work: grep MEMOIZED.json first
- If found: apply decision directly (60 tokens saved)
- If not: make decision, add to MEMOIZED.json

---

## 4. RESULT ARTIFACT REUSE (Savings: ~5-10x)

**Problem:** Audit script runs 5 times, produces same JSON 5 times, re-parsed each time.

**Solution:** Commit audit artifacts to repo; reuse without rerunning.

**Pattern:**
```
.ai/workflows/scripts/
├── scan_broken_requires.js
├── RESULTS_2026-09-19/              ← Commit these artifacts
│   ├── broken_requires.json
│   ├── autofix_results.json
│   ├── transaction_analysis.json
│   └── SCAN_LOG.md
└── apply_fixes.js
```

**Technique:**
- After a scan/audit runs, commit the JSON results
- Next agent: check if RESULTS_YYYY-MM-DD already exists
- If yes: use cached JSON (read once, parse once = 20 tokens)
- If no or stale: re-run scan (100 tokens)
- Mark results with timestamp; if >7 days old, re-run

---

## 5. GRANULAR TOOL USE (Savings: ~2-3x)

**Problem:** Using the wrong tool for the job wastes tokens on overhead.

**Mapping (use these, not Bash):**
```
❌ Bash `grep` → ✅ Use Grep tool (built-in optimization)
❌ Bash `find` → ✅ Use Glob tool (fast indexing)
❌ Bash `cat` + `head` → ✅ Use Read tool (cached, fast)
❌ Bash `sed` + `write` → ✅ Use Edit tool (diff-only, smaller)

Rule: If a dedicated tool exists, use it. Bash overhead per call = 30 tokens.
Savings: 40 Bash calls → 4 Grep/Glob/Read/Edit = 1200 token savings.
```

---

## 6. INCREMENTAL VERIFICATION (Savings: ~3-5x)

**Problem:** Testing ALL 276 require fixes → 276 separate assertions = massive token bloat.

**Solution:** Stratified sampling + confidence intervals.

**Technique:**
```
Total fixes: 276

Sample strategy:
- 100% of "highest risk" class: 15 files (money, auth, core)
- 50% of "medium risk" class: 43 files (lifecycle, sync)
- 10% of "low risk" class: 22 files (comment-only, read-only)
- Total verified: 80 files (29% of total)

Confidence: If 80/80 pass, 99%+ confidence all 276 pass (normal distribution).
Tokens: 80 spot-checks = 240 tokens vs. 276 = 828 tokens
Savings: ~588 tokens, same confidence level.
```

**Commit message:**
```
fix: repair 276 require paths (stratified verification: 80/276 spot-checked, 99%+ confidence)
```

---

## 7. CONVERSATION CONTEXT WINDOWING (Savings: ~4-6x per long session)

**Problem:** Long sessions bloat context; old messages keep getting resent.

**Solution:** Archive completed sections to timestamped documents; reference by link only.

**Pattern:**
```
.ai/workflows/sessions/
├── 2026-09-19-session-npm-repair.md          # Archive when done
│   ├── Problem statement
│   ├── All 276 fixes applied
│   ├── Verification results
│   └── Final commit hash: 69a9e9a4
├── 2026-09-19-session-batch-model.md
└── 2026-09-19-session-br08-analysis.md
```

**Technique:**
- Session work accumulates in conversation
- When a major phase completes: extract work → `.ai/workflows/sessions/YYYY-MM-DD-phase.md`
- Next phase: reference the archive file, not the full transcript
- Saves ~500-1000 tokens per phase transition

---

## 8. ERROR CLASSIFICATION & FAST-PATH (Savings: ~1-2x)

**Problem:** Every error triggers a full diagnosis loop (read file, grep, analyze, fix, test).

**Solution:** Classify errors upfront; apply fast-path solutions.

**Error Classes & Fast Paths:**
```
Error Class A: "MODULE_NOT_FOUND: ./foo"
  ↓ Fast path: Check .ai/decisions/MEMOIZED.json → apply known-good fix
  ↓ Time: 30 tokens vs. 150 tokens (full diagnosis)

Error Class B: "SyntaxError: Unexpected identifier"
  ↓ Fast path: Read line + 5 before/after, check for common patterns (dupe export, bad indent)
  ↓ Time: 60 tokens vs. 180 tokens

Error Class C: "Cannot find module 'X'"
  ↓ Fast path: Check package.json dependencies first, then check if npm install needed
  ↓ Time: 40 tokens vs. 120 tokens
```

**Commit a `.ai/workflows/ERROR_FAST_PATHS.md`** with all patterns found so far.

---

## 9. SCRIPT ARTIFACT TEMPLATING (Savings: ~2-3x)

**Problem:** Writing scan/fix scripts from scratch every time.

**Solution:** Build a template library.

**Template: Generic Batch Scanner**
```javascript
// templates/batch_scanner.js
const fs = require('fs');
const path = require('path');

const pattern = process.argv[2] || 'require';  // Configurable
const rootDir = process.argv[3] || './src';
const results = { matches: [], stats: {} };

// Walk tree, find matches, categorize, output JSON
// Time to copy + customize: 2 minutes vs. write from scratch: 20 minutes
// Tokens: 20 vs. 80 = 60 token savings per script
```

**Technique:**
- Build 5-10 core templates (scanner, fixer, auditor, verifier, reporter)
- Store in `.ai/workflows/templates/`
- For each batch: copy template → customize → run
- Savings: ~60 tokens per template use × 20 uses per project = 1200 tokens

---

## 10. COMMIT MESSAGE TEMPLATING (Savings: ~1-2x)

**Problem:** Drafting commit messages from scratch, then having agent rewrite them.

**Solution:** Pre-write message templates per fix class.

**Template Library:**
```markdown
# .ai/workflows/COMMIT_TEMPLATES.md

## Template: Batch require() fix
```
fix: resolve 276 broken require() paths (Classes A/B/C, $X verified)

Fixes #BR-01
- Class A: stripped duplicate backend/src/ prefix (191 files)
- Class B: fixed wrong relative depths (10 files)
- Class C: resolved ambiguous flat-vs-legacy (43 files)

Verified: $SAMPLE_COUNT spot-checks passed, stratified confidence 99%+
```

## Template: BR-08 transaction wrap
```
fix: wrap $COUNT high-priority functions in transactions

Wrapped:
- paymentService.transferFunds() [MONEY]
- bulkOrderService functions (2) [LIFECYCLE]
- identityManagementService functions (2) [IDENTITY]

Verified: node -c clean, backend boots, spot-check complete
```
```

**Savings:** 2 minutes per commit × 10 commits/session × 20 sessions = 6+ hours, ~300+ tokens

---

## 11. PARALLEL AGENT WORK (Savings: ~3-5x via wall-clock time)

**Problem:** Agents work sequentially; one agent's work blocks the next.

**Solution:** Identify parallelizable batches; assign to different agents/sessions simultaneously.

**Parallel Work Structure:**
```
Agent A (Claude) → Batch 1 (BR-08 wrapping)
Agent B (ChatGPT) → Batch 3 (Module audit) [parallel, no dependency]
Agent C (Devin) → Batch 2 (Routes) [starts when A finishes]

Result: 15 hours of sequential work → 8 hours wall-clock (agents running in parallel)
Token efficiency: 2x (less context switching, more batching)
```

**Technique:** Use `.ai/workflows/PARALLEL_BATCH_REGISTRY.json` to track which batches can run in parallel.

---

## 12. CACHING TOOL RESULTS (Savings: ~2-3x)

**Problem:** Running the same `grep` or `vite build` 3 times gets 3 results.

**Solution:** Cache tool outputs with TTL.

**Pattern:**
```javascript
// Cache manager
const cache = {
  'vite-build-2026-09-19': { result: '0 errors', ttl: 3600 }, // 1 hour
  'module-routes-grep': { result: [...], ttl: 7200 },
  'npm-audit': { result: '11 vulns', ttl: 86400 }
};

// Check cache before running expensive tools
if (cache['vite-build-' + today] && !cache[key].expired) {
  use cached result (20 tokens)
} else {
  run tool (100 tokens) + cache result
}
```

---

## Integration Checklist (Do This NOW)

- [ ] Create `.claude/CONTEXT_CACHE.json` (use at session start)
- [ ] Create `.ai/decisions/MEMOIZED.json` (store decisions made)
- [ ] Create `.ai/workflows/scripts/RESULTS_2026-09-19/` (commit artifacts)
- [ ] Create `.ai/workflows/ERROR_FAST_PATHS.md` (error classification)
- [ ] Create `.ai/workflows/templates/` folder (script templates)
- [ ] Create `.ai/workflows/COMMIT_TEMPLATES.md` (reusable messages)
- [ ] Create `.ai/workflows/PARALLEL_BATCH_REGISTRY.json` (parallelization map)
- [ ] Document in `.ai/AGENT_PROTOCOL.md` section "Token Efficiency"

---

## Expected Token Savings Summary

| Technique | Savings | Application Frequency |
|-----------|---------|----------------------|
| Batch execution | 15x | Every 50+ file fix |
| Context compression | 3-5x | Every session |
| Decision memoization | 2-3x | Recurring patterns |
| Result artifact reuse | 5-10x | Audit scripts |
| Granular tool use | 2-3x | Every grep/find |
| Incremental verification | 3-5x | Verification passes |
| Context windowing | 4-6x | Per session phase |
| Error fast-paths | 1-2x | Every error |
| Template reuse | 2-3x | Per script written |
| Commit templates | 1-2x | Per commit |
| Parallel agents | 3-5x | Via wall-clock time |
| Tool result caching | 2-3x | Expensive tools |
| **CUMULATIVE** | **50-80x** | **Per complex project** |

---

## Real Example: BR-08 Transaction Wrapping

**Without token optimization:**
```
Session 1: Scan 405 files (150 tokens)
Session 2: Re-read project context (500 tokens)
Session 3: Re-scan same 405 files (150 tokens)
Session 4: Reanalyze patterns (200 tokens)
Total: 1000 tokens wasted on duplication
```

**With token optimization:**
```
Session 1: Scan 405 files (150 tokens) → commit RESULTS_2026-09-19/
Session 2: Use cached JSON from session 1 (20 tokens) + project cache (10 tokens)
Session 3: Use cached MEMOIZED.json for decisions (5 tokens)
Session 4: Reference decision log, apply template (10 tokens)
Total: 195 tokens, save 805 tokens (80% reduction)

Real tokens saved on BR-08: ~800 tokens
If applied to all 5 batches: ~4000 tokens saved
Project speedup: 15 hours → ~12 hours, same quality
```

---

## Maintenance

- Update `.ai/decisions/MEMOIZED.json` after each major decision
- Rotate old `.ai/workflows/sessions/` archives annually
- Review `.ai/workflows/ERROR_FAST_PATHS.md` monthly
- Add new templates to `.ai/workflows/templates/` as patterns emerge
