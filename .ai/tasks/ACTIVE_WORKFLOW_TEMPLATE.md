# ACTIVE WORKFLOW - Multi-Agent Coordination

**Updated:** 2026-09-08  
**Workflow:** Devin → VS Code Review → Claude Polish → Merge

---

## Current Work Status

### 🚀 IN PROGRESS

#### Task: [TASK_ID] - [Task Name]
- **Assigned To:** [Devin/VS Code/Claude AI]
- **Branch:** `feature/[id]-[name]`
- **Status:** [Not Started / In Progress / Ready for Review / In Review / Ready to Merge]
- **Priority:** [P0/P1/P2]
- **Est. Completion:** [Date]
- **Description:** [What needs to be done]

**Phase Status:**
```
Devin Implementation:   [██████░░░░] 60%
VS Code Testing:       [░░░░░░░░░░] 0%
Claude Review:         [░░░░░░░░░░] 0%
Merge Ready:           [░░░░░░░░░░] 0%
```

**Notes:**
- What was done so far
- Any blockers
- Next steps

---

## Quick Template (Copy This Section for New Tasks)

```markdown
#### Task: M### - [Feature Name]
- **Assigned To:** Devin
- **Branch:** feature/m###-[name]
- **Status:** Not Started
- **Priority:** P1
- **Est. Completion:** 2026-09-09
- **Description:** [What needs to be done]

**Phase Status:**
```
Devin Implementation:   [░░░░░░░░░░] 0%
VS Code Testing:       [░░░░░░░░░░] 0%
Claude Review:         [░░░░░░░░░░] 0%
Merge Ready:           [░░░░░░░░░░] 0%
```

**Handoffs:**
- Devin → VS Code: `.ai/handoffs/DEVIN_M###.md` (Not created yet)
- VS Code → Claude: `.ai/handoffs/REVIEW_M###.md` (Not created yet)
- Claude → Merge: `.ai/reviews/REVIEW_M###.md` (Not created yet)

**Notes:**
- [Notes here]
```

---

## Coordination Rules

### Devin's Checklist (Before Handoff to VS Code)

- [ ] Feature implemented and tested locally
- [ ] All commits pushed to `feature/[id]` branch
- [ ] Code follows project style guidelines
- [ ] No console errors or warnings
- [ ] Created `.ai/handoffs/DEVIN_[ID].md` with:
  - [ ] What was implemented
  - [ ] How to test it
  - [ ] Known limitations
  - [ ] Setup requirements

**Devin's Commit Message Format:**
```
feat: [feature name] (Devin implementation)

- What was added
- How it works
- Links to related tasks

Co-Authored-By: Devin <devin@anthropic.com>
```

---

### VS Code User's Checklist (Testing Phase)

- [ ] Pulled Devin's branch: `git checkout feature/[id]`
- [ ] Ran locally: `npm run dev`
- [ ] Ran tests: `npm test`
- [ ] Manual testing completed
- [ ] No new errors or warnings
- [ ] Created/updated `.ai/handoffs/REVIEW_[ID].md` with:
  - [ ] ✅ What worked
  - [ ] ❌ Issues found (if any)
  - [ ] Suggestions for improvement
  - [ ] Ready for Claude review? YES/NO

**VS Code User's Commit Format (if fixes needed):**
```
fix: [issue name] (VS Code local review)

- What was fixed
- Why it needed fixing

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

---

### Claude AI's Checklist (Review Phase)

- [ ] Read `.ai/handoffs/DEVIN_[ID].md` and `.ai/handoffs/REVIEW_[ID].md`
- [ ] Reviewed full git diff: `git diff main..feature/[id]`
- [ ] Code review completed against checklist:
  - [ ] Architecture sound
  - [ ] Security issues identified
  - [ ] Performance concerns noted
  - [ ] Test coverage adequate
  - [ ] Documentation complete
- [ ] Created `.ai/reviews/REVIEW_[ID].md` with:
  - [ ] Architecture assessment
  - [ ] Security findings
  - [ ] Test coverage report
  - [ ] Recommendations
  - [ ] Ready to merge? YES/NO

**Claude AI's Commit Format (if polish needed):**
```
polish: [improvement name] (Claude review & refinement)

- What was improved
- Why this matters
- Links to architectural decision

Co-Authored-By: Claude AI <noreply@anthropic.com>
```

---

## Merge Checklist (Before Merging to Main)

- [ ] All three phases complete
- [ ] All tests passing locally
- [ ] No merge conflicts
- [ ] `.ai/tasks/ACTIVE.md` updated (status = COMPLETE)
- [ ] `.ai/history/IMPLEMENTATION_HISTORY.md` updated
- [ ] PR created with full description
- [ ] All three tools reviewed PR
- [ ] Approved by at least 2 tools
- [ ] Merge button clicked
- [ ] Branch deleted: `git branch -d feature/[id]`

---

## Real-Time Status Symbols

| Symbol | Meaning |
|--------|---------|
| ✅ | Done, verified |
| 🚀 | In progress |
| ⏳ | Waiting on another tool |
| ❌ | Blocked, needs decision |
| ⚠️ | Warning/caution needed |
| 🔄 | Changes requested, in loop |

---

## Communication Channels (In Order of Priority)

1. **Git commits** — primary communication
2. `.ai/tasks/ACTIVE.md` — status updates
3. `.ai/handoffs/` files — detailed handoff info
4. `.ai/reviews/` files — feedback and findings
5. Comments in code — inline documentation

**DO NOT USE:**
- ❌ Email
- ❌ Slack
- ❌ Discord
- ❌ Separate files
- ❌ Manual file transfer

---

## If Stuck

**Devin doesn't know what to implement:**
1. Read `.ai/tasks/ACTIVE.md` for current task
2. Read requirements in `.ai/requirements/`
3. Read architecture in `.ai/architecture/`
4. Post question in `.ai/tasks/ACTIVE.md` under task notes
5. Claude AI will respond in `.ai/decisions/`

**VS Code user finds a bug:**
1. Document in `.ai/handoffs/REVIEW_[ID].md`
2. Push comment to branch
3. Wait for Devin or Claude to fix
4. Test fix locally after they commit

**Claude AI needs more context:**
1. Read `.ai/handoffs/DEVIN_[ID].md`
2. Check git history: `git log feature/[id]`
3. Review git diff: `git diff main..feature/[id]`
4. Look at actual code, not just diff
5. Post detailed findings in `.ai/reviews/REVIEW_[ID].md`

---

## Weekly Cleanup

Every Friday at 17:00:

- [ ] Archive completed tasks to `.ai/tasks/COMPLETED.md`
- [ ] Review `.ai/handoffs/` and `.ai/reviews/` for lingering issues
- [ ] Update `.ai/history/IMPLEMENTATION_HISTORY.md`
- [ ] Review `.ai/decisions/` for conflicts
- [ ] Plan next week's priorities
- [ ] Update `.ai/PROJECT_CONTEXT.md` if status changed

---

*This template keeps all three tools synchronized without file duplication or manual transfers.*
