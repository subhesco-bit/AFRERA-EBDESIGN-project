# Enhancement Discovery — Token-Optimized (Audit + Testing + Missing-Concept Detection)

**Extends:** COMPLETE_TOKEN_OPTIMIZATION_SYSTEM.md, PLUGIN_TOKEN_OPTIMIZATION.md
**Scope:** Work that goes beyond writing code — finding what's missing, what's
weak, and what would meaningfully improve the project (gap analysis, feature
discovery, audit-driven enhancement proposals) — using the same
zero/low-token plugin pattern instead of manual token-heavy reasoning.
**Platform:** PowerShell-first entry points (`.ai/plugins/ps/`), same
underlying node plugins used from bash.

---

## WHY THIS LAYER EXISTS

Layers 1-3 (coding, audits, testing) optimize *doing known work* cheaply.
This layer optimizes *deciding what work to do* cheaply — the part that
otherwise costs the most tokens because it requires reading and reasoning
across many files at once (architecture review, feature-gap analysis,
"what did we forget").

## PATTERN: DELTA-ONLY GAP ANALYSIS

Never re-derive the full project state from scratch. Always diff against the
last known state.

```powershell
Import-Module .ai/plugins/ps/TokenOptimization.psm1 -Force

# 1. Zero-token structural facts (0 tokens)
$audit = Invoke-AuditChain

# 2. Compare against last cached gap report instead of re-reading everything (5-20 tokens)
$previous = Get-LatestPluginResult -Prefix 'gap-report'
# ... diff $audit against $previous.findings, report only what changed
```

**Rule:** if `.ai/plugins/results/gap-report-*.json` exists and is <7 days
old, read the cached delta first. Only re-scan the full tree when no cache
exists or the user asks for a fresh pass.

## PATTERN: MISSING-CONCEPT DETECTION (NOT JUST MISSING CODE)

"Missing concept" work (a whole capability the project hasn't considered,
not just an unwired route) is the most expensive kind of review to do
manually — it requires holding the whole architecture in context. Cut cost
by scoping the search instead of reading everything:

1. Pull the structural facts for free: `Invoke-AuditChain` (deps),
   `.ai/architecture/CODEBASE_MAP.md` (already-written map, don't regenerate it),
   `.ai/architecture/CURRENT_IMPLEMENTATION.md` (status matrix).
2. Grep for the *shape* of gaps instead of reading full files: TODO/FIXME,
   stub functions, empty route handlers, services with no route mounted
   (cross-reference dynamic route loader output vs `services/` directory).
3. Only read full file contents for the specific candidates the scoped
   search surfaces — never the whole tree.
4. Write findings to `.ai/enhancements/` as a dated proposal file (see
   existing `.ai/enhancements/` directory), not into chat — keeps future
   passes delta-only.

## PATTERN: AUDIT + TEST RESULTS FEED ENHANCEMENT PROPOSALS DIRECTLY

Don't re-analyze audit/test output twice (once to report pass/fail, again to
decide what to build next). One pass, two outputs:

```powershell
$audit = Invoke-AuditChain
# Same artifact answers both:
#   "is anything broken?"      -> audit.dependencies[].vulnerabilities
#   "what should we build?"    -> outdated majors imply upgrade-path features,
#                                  missing test coverage implies test-writer task,
#                                  recurring failed E2E routes imply a UX gap
```

Feed the same JSON artifact into both the audit report and an enhancement
backlog entry (`.ai/tasks/ACTIVE.md` or `.ai/enhancements/`), rather than
re-running or re-describing the scan.

## DEFAULT WORKFLOW FOR THIS PROJECT

```
1. Invoke-AuditChain                          (0 tokens, PowerShell)
2. Get-LatestPluginResult -Prefix gap-report   (0 tokens, cache check)
3. Scoped grep for stub/TODO/unmounted patterns (10-30 tokens)
4. Read only surfaced candidate files           (proportional to findings)
5. Write dated proposal to .ai/enhancements/    (50-100 tokens)
6. Update .ai/tasks/ACTIVE.md + MEMOIZED.json if a new pattern was found
7. Commit
```

This mirrors the batch-audit token budget in PLUGIN_TOKEN_OPTIMIZATION.md
(~80-130 tokens per pass) but is aimed at *what to build next* rather than
*is the current code broken*.

---

*Adopted as default alongside COMPLETE_TOKEN_OPTIMIZATION_SYSTEM.md — see
root CLAUDE.md "TOKEN OPTIMIZATION PROTOCOL" section.*
