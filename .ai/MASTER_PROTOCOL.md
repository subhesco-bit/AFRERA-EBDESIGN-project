# 🤝 MASTER PROTOCOL — CLAUDE + DEVIN + VISUAL STUDIO
## Unified Coordination Protocol (Nothing Missed)

**Created:** September 11, 2026  
**Status:** ACTIVE  
**Agents:** Claude AI (Coordination), Devin (Implementation), Visual Studio (Quality)

---

## 📋 THE RULE: Everything in Writing, Everything Tracked

### Core Principle
**If it's not documented in this repo, it doesn't exist.**

---

## 🔄 WORKFLOW FOR EVERY TASK

### 1. Task Created
```
LOCATION: .ai/tasks/ACTIVE.md
├─ Task ID (unique)
├─ Title (clear description)
├─ Assigned to (Claude / Devin / VS)
├─ Deadline
├─ Status (0%)
├─ Blockers (if any)
└─ Created timestamp
```

### 2. Work Happens
```
If Claude:
├─ Writes .md design docs in .ai/
├─ Logs decisions in .ai/DECISION_LOG.md
└─ Creates handoff for Devin in .ai/handoffs/

If Devin:
├─ Writes code in backend/src/ or database/
├─ Writes tests in backend/__tests__/
├─ Logs work in .devin/in-progress/
└─ Creates handoff for Claude in .ai/handoffs/

If VS:
├─ Writes code in frontend/src/
├─ Writes tests in frontend/__tests__/
├─ Logs work in .vs/in-progress/
└─ Notifies via .ai/SYNC_LOG.md
```

### 3. Verification
```
Claude:
├─ Reviews design for completeness
├─ Checks against requirements
├─ Approves or requests changes
└─ Signs off in decision log

Devin:
├─ Runs tests (> 80% coverage)
├─ Verifies database migrations
├─ Tests endpoints with Postman
└─ Signs off with results

VS:
├─ Runs ESLint, Prettier
├─ Tests UI responsive
├─ Verifies accessibility
└─ Signs off with quality report
```

### 4. Sync & Merge
```
ALL THREE:
├─ Check .ai/SYNC_LOG.md for conflicts
├─ Resolve any disagreements
├─ Merge code to main branch
├─ Update .ai/CHECKPOINT.md
└─ Move task to .ai/tasks/COMPLETED.md
```

### 5. Document & Close
```
Complete handoff document:
├─ What was delivered
├─ Tests results (pass/fail rate)
├─ Quality metrics
├─ Known issues (if any)
├─ Next team member's action items
└─ Timestamp

Move to .ai/tasks/COMPLETED.md with evidence
```

---

## 🚨 CONFLICT RESOLUTION

### When Claude & Devin Disagree
```
1. Claude: "This architecture is wrong"
2. Devin: "But the code works"
3. Resolution:
   ├─ Log disagreement in .ai/DECISION_LOG.md
   ├─ Set deadline (2 hours max)
   ├─ Claude: State architectural concern
   ├─ Devin: Show test evidence
   ├─ VS: Evaluate code quality
   └─ Majority wins, log decision with rationale
```

### When Code Quality & Speed Conflict
```
1. VS: "This code violates standards"
2. Devin: "But deadline is tomorrow"
3. Resolution:
   ├─ Ship code with technical debt flag
   ├─ Create refactoring task for later
   ├─ Log in .ai/DECISION_LOG.md
   └─ Move forward
```

---

## 📊 STATUS TRACKING

### .ai/CHECKPOINT.md (Updated Every Hour)
```
# Current State - 2026-09-11 14:00 UTC

## In Progress (50% of work)
├─ Claude: [Task name] - 75% complete
├─ Devin: [Task name] - 50% complete
└─ VS: [Task name] - 30% complete

## Completed Today (30 tasks)
├─ Backend modules: M001-M030
├─ Frontend pages: M001-M050
└─ Tests: 85% of new code

## Blocked (2 items)
├─ Task X: Waiting for PostgreSQL connection
└─ Task Y: Conflict in payment module

## Next 3 Tasks
1. Complete M031 module (Claude design → Devin implement → VS QA)
2. Add insurance workflow (same flow)
3. Deploy to staging (coordinate all 3)

Last updated: 2026-09-11 14:00 UTC
```

---

## 🔒 THE ACCOUNTABILITY CHAIN

```
CLAUDE is accountable for:
├─ Architecture is sound
├─ Requirements are met
├─ Decisions are logged
└─ Nothing is missed (design-wise)

DEVIN is accountable for:
├─ Code actually works
├─ Tests prove it works
├─ Migrations are executable
└─ Nothing breaks in production

VS is accountable for:
├─ Code meets standards
├─ UI/UX is excellent
├─ Performance is good
└─ Security is verified

ALL THREE are accountable for:
├─ Communication in writing
├─ Handoffs are complete
├─ Conflicts resolved quickly
└─ Timestamp everything
```

---

## 🎯 NOTHING MISSED GUARANTEE

```
Every module (541 total):
├─ Has README.md in its folder explaining status
├─ Listed in .ai/knowledge/MODULE_CATALOG.md
├─ Tested (test.js exists and passes)
└─ Status tracked: SKELETON / PARTIAL / COMPLETE

Every page (790 total):
├─ Has status documented (STUB / PARTIAL / COMPLETE)
├─ Listed in .ai/knowledge/PAGE_MAPPING.md
├─ Routed in frontend/src/pages/index.js
└─ Tested (test.jsx exists and passes)

Every decision:
├─ Logged in .ai/DECISION_LOG.md
├─ Timestamped
├─ Attributed to Claude/Devin/VS
└─ Rationale explained

Every conflict:
├─ Logged in .ai/DECISION_LOG.md
├─ Resolution documented
├─ All parties agreed
└─ Decision implemented
```

---

## 📞 SYNC SCHEDULE

```
Every 15 minutes:
├─ Check .ai/SYNC_LOG.md
├─ Merge any non-conflicting work
├─ Flag conflicts for immediate resolution
└─ Update .ai/CHECKPOINT.md

Every 4 hours:
├─ Full sync call (all 3 agents)
├─ Discuss blockers
├─ Plan next 8-hour chunk
├─ Update timeline
└─ Log in .ai/SYNC_LOG.md

Daily (9 AM):
├─ Sprint standup (what's done, what's next)
├─ Review .ai/tasks/COMPLETED.md
├─ Plan next day's work
├─ Update .ai/CHECKPOINT.md
└─ All commit and push
```

---

## ✅ QUALITY GATES

```
Code cannot be merged without:
├─ [ ] Design reviewed by Claude
├─ [ ] Tests written by Devin (> 80% coverage)
├─ [ ] Code standards verified by VS
├─ [ ] Conflicts resolved
├─ [ ] Decision logged in .ai/DECISION_LOG.md
├─ [ ] Task status updated to COMPLETED in .ai/tasks/
└─ [ ] .ai/CHECKPOINT.md updated
```

---

## 🚀 THIS IS HOW NOTHING GETS MISSED

1. **Everything is written down** (no assumptions)
2. **Everything is tracked** (in .ai/ folder)
3. **Everything is verified** (tests + sign-off)
4. **Everything is synchronized** (all 3 agents aligned)
5. **Everything is timestamped** (audit trail)
6. **Everything is accountable** (who did what, when)

**RESULT:** 100% transparency, 0% missed work, complete coordination between Claude AI, Devin, and Visual Studio.

---

*This protocol ensures all three agents work as ONE unified team with zero missed items, zero conflicts, and complete accountability.*
