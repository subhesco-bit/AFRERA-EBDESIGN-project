# Multi-Agent Sync Protocol: Devin + VS Code + Claude AI

**Status:** Active Workflow  
**Version:** 1.0  
**Date:** 2026-09-08

## Overview

This protocol enables **Devin**, **VS Code (with Claude Copilot)**, and **Claude AI** to work on the same codebase simultaneously without file duplication, transfer issues, or merge conflicts.

**Core principle:** Git is the source of truth. All tools sync through git commits and branches.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  LOCAL REPOSITORY (Git)                             │
│  ├── main branch (stable)                           │
│  ├── feature branches (work-in-progress)            │
│  ├── .ai/ (shared intelligence)                     │
│  └── backend/, frontend/ (codebase)                 │
└─────────────────────────────────────────────────────┘
         ↑         ↑         ↑
         │         │         │
    ┌────┴────┬────┴────┬────┴────┐
    │          │         │         │
    ▼          ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐
│ Devin  │ │VS Code │ │Claude│ │ Claude   │
│(Agent) │ │(IDE)   │ │ Code │ │Copilot   │
└────────┘ └────────┘ └──────┘ └──────────┘
```

---

## Three-Tool Workflow

### Role Definition

| Tool | Role | Responsibility | Time |
|------|------|---|---|
| **Devin** | Implementation Agent | Write code, create features, fix bugs | ~2-4 hours/session |
| **VS Code** | Local IDE | Local development, running code, quick edits | Continuous |
| **Claude AI** | Evaluation & Architecture | Code review, refactoring, optimization, decisions | ~1 hour/session |
| **Claude Copilot** | Local Intelligence | Quick suggestions while coding in VS Code | As-needed |

---

## Sync Flow (Step-by-Step)

### Phase 1: Devin Implements (2-4 hours)

```
1. Read .ai/tasks/ACTIVE.md (what needs to be done)
2. Check git status & recent commits from VS Code user
3. Create feature branch: git checkout -b feature/[task-id]
4. Write code, test locally
5. Commit frequently: git commit -m "message"
6. Update .ai/tasks/ACTIVE.md with progress
7. Push to origin: git push -u origin feature/[task-id]
8. Create handoff: .ai/handoffs/DEVIN_[task-id].md
```

**Devin's Commits:**
```bash
git commit -m "feat: implement user authentication service

- Add JWT token generation
- Add refresh token rotation
- Add logout mechanism

Co-Authored-By: Devin <devin@anthropic.com>"
```

---

### Phase 2: VS Code User Pulls & Reviews Locally (30 mins)

```
1. git fetch origin (see Devin's branch)
2. git checkout feature/[task-id] (switch to Devin's branch)
3. npm run dev (start local dev server)
4. Test the feature locally in VS Code
5. Run tests: npm test
6. If issues found:
   - Make quick fixes locally
   - git commit -m "fix: [issue] (from VS Code review)"
   - git push
7. If approved:
   - Leave comment in .ai/handoffs/DEVIN_[task-id].md
8. git checkout main (return to main)
```

---

### Phase 3: Claude AI Reviews & Polishes (1-2 hours)

```
1. Read .ai/handoffs/DEVIN_[task-id].md (what was done)
2. Review the feature branch: git diff main..feature/[task-id]
3. Check test coverage, security, performance
4. Create polishing tasks:
   - Refactoring needed?
   - Documentation gaps?
   - Test coverage issues?
5. Create detailed review: .ai/reviews/REVIEW_[task-id].md
6. Propose changes in .ai/decisions/
7. Prepare polishing commits (optional):
   - git checkout feature/[task-id]
   - Make refinements
   - git commit -m "polish: [improvements] (from Claude review)"
   - git push
8. Request Devin/VS Code approval for merge
```

---

### Phase 4: Merge to Main

```
1. VS Code: Create pull request from feature/[task-id] → main
2. All three tools review the PR
3. Approve: PR merge → main
4. Clean up: git branch -d feature/[task-id]
5. Update .ai/tasks/ACTIVE.md (mark complete)
6. Update .ai/history/IMPLEMENTATION_HISTORY.md
```

---

## File Structure: Coordination Hub

### `.ai/tasks/` — Real-Time Task Tracking

```yaml
# .ai/tasks/ACTIVE.md
## IN PROGRESS

- [ ] Task 001: User Auth Service
  - Assigned: Devin
  - Branch: feature/auth-service
  - Status: Code review
  - Next: Claude AI review
  - Due: 2026-09-10
  - Notes: JWT + refresh token rotation

- [ ] Task 002: Product Search Index
  - Assigned: VS Code (local polish)
  - Branch: feature/search-elasticsearch
  - Status: Implementation pending
  - Next: Devin implementation
```

### `.ai/handoffs/` — Pass Information Between Tools

**Devin → VS Code:**
```yaml
# .ai/handoffs/DEVIN_AUTH_001.md
## Implementation Completed: User Authentication

**What Was Done:**
- JWT token generation (48 lines)
- Refresh token rotation (32 lines)
- Token validation middleware (28 lines)

**How to Test:**
1. npm run dev
2. POST /api/auth/login { email, password }
3. Check token in response
4. Send token in Authorization header

**Known Limitations:**
- Token expiry: 1 hour (configurable)
- Requires PostgreSQL running

**Branch:** feature/auth-service
**Commits:** 3 commits
```

**VS Code → Claude AI:**
```yaml
# .ai/handoffs/REVIEW_AUTH_001.md
## Local Testing Complete: Auth Service

**Local Testing Results:**
✅ Login works
✅ Token refresh works
✅ Invalid tokens rejected
⚠️ Error message could be clearer

**Issues Found:**
1. Line 45: Missing input validation for email
2. Line 78: Password validation too strict (rejects valid chars)
3. Documentation: Setup guide incomplete

**Ready for Claude Review**
```

**Claude AI → Devin:**
```yaml
# .ai/reviews/REVIEW_AUTH_001.md
## Code Review: User Authentication

**Architecture Assessment:** ✅ Good
**Security Review:** ⚠️ Needs fixes
**Test Coverage:** 🔴 0% tests written
**Documentation:** ⚠️ Incomplete

**Recommendations:**
1. Add unit tests (10-15 tests)
2. Add input validation library (zod/joi)
3. Fix password validation regex
4. Add rate limiting to login endpoint

**Polishing Needed:**
- Refactor token validation to separate module
- Extract magic numbers to config
- Add JSDoc comments

**Branch:** feature/auth-service (polish commits optional)
**Estimated Effort:** 2-3 hours for fixes + tests
```

---

## Git Strategy: Branch Discipline

### Branch Naming Convention

```
main                          # Stable, production-ready
├── feature/[id]-[name]      # Devin's implementation branches
│   ├── feature/m001-auth    # Task M001
│   ├── feature/m002-search  # Task M002
│
├── polish/[id]-[task]       # Claude's refinement branches
│   ├── polish/m001-tests    # Add tests for M001
│   └── polish/m002-docs     # Docs & refactoring for M002
│
└── audit/ui-api-fix          # Current review branch
```

### Commit Message Format

**Devin's commits:**
```
feat: implement auth service (Devin)
- Add JWT token generation
- Add refresh token rotation

Co-Authored-By: Devin <devin@anthropic.com>
```

**VS Code's commits:**
```
fix: validate email input (VS Code review)
- Add zod validation to login endpoint
- Add error message for invalid email

Co-Authored-By: Claude Code <noreply@anthropic.com>
```

**Claude's commits:**
```
polish: refactor token validation (Claude review)
- Extract token logic to separate module
- Add JSDoc comments
- Extract magic numbers to config

Co-Authored-By: Claude AI <noreply@anthropic.com>
```

---

## Real-Time Coordination: No File Transfer

### Key Rules

1. **Always work in the same repo** — never export/import files
2. **Use git branches** — not email, Slack, or file shares
3. **Commit frequently** — every 15-30 mins (Devin), every edit (VS Code)
4. **Update .ai/tasks/** — so other tools know status
5. **No manual file transfer** — git is the transfer mechanism

### VS Code Local Workflow

**Setup in VS Code:**

```json
// .vscode/settings.json
{
  "git.autofetch": true,
  "git.autorefresh": true,
  "git.ignoreMissingGitWarning": false,
  "[javascript]": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```

**VS Code User's Daily Workflow:**

```bash
# 1. Morning: pull latest from Devin
git pull origin main

# 2. Check what Devin worked on
git log --oneline -10

# 3. Check Devin's open branches
git branch -r | grep feature/

# 4. Test Devin's latest feature
git checkout feature/[task-id]
npm run dev
npm test

# 5. Make quick fixes locally
# (VS Code Copilot suggests improvements)
# Edit files...

# 6. Commit local fixes
git commit -am "fix: [issue] (local review)"

# 7. Push to same branch
git push

# 8. File handoff for Claude review
# Update .ai/handoffs/REVIEW_[task-id].md
```

---

## Avoiding Duplication

### The Three-Version Problem

❌ **BAD:** Three separate copies of the same file
```
Devin's version → Export to file
VS Code version → Manual edit
Claude's version → Review suggestions
= 3 versions, conflicts, confusion
```

✅ **GOOD:** One version in git
```
Main repo version (single source of truth)
Devin edits → git commit → git push
VS Code pulls → git checkout → local edits → git commit
Claude reviews → git diff → proposes changes → git commit
= 1 version, 1 history, 1 source of truth
```

### Conflict Prevention

**If merge conflicts occur:**

```bash
# 1. Don't panic — this is expected in multi-agent work
# 2. Get the version
git checkout --theirs backend/auth.js  # Claude's version
git checkout --ours backend/auth.js     # Devin's version

# 3. Look at both and merge manually
# 4. Commit the resolution
git commit -m "resolve: merge conflict in auth (resolved)"

# 5. Update .ai/tasks/ACTIVE.md with the resolution
```

---

## Real-Time Status Dashboard

Create this as a quick reference:

```markdown
# .ai/status/REALTIME.md

## Current Work Status

**Last Updated:** 2026-09-08 14:30 UTC

### Devin
- Status: Implementing Task M003
- Branch: feature/m003-marketplace
- Progress: 60% complete
- Expected Completion: 2026-09-08 18:00

### VS Code
- Status: Testing Task M002
- Branch: feature/m002-search
- Issues Found: 2 (email validation, error messages)
- Next: Push fixes, notify Claude

### Claude AI
- Status: Reviewing Task M001
- Branch: feature/m001-auth
- Findings: 5 recommendations
- Next: Push review to .ai/reviews/

### Tasks Queue
1. ✅ M001: Auth - Ready for merge
2. 🔄 M002: Search - Claude review in progress
3. 🚀 M003: Marketplace - Devin working
```

Update this every 30 minutes during active development.

---

## Integration with Claude Copilot

VS Code's built-in Claude Copilot works alongside this workflow:

```javascript
// Example: Copilot assists while VS Code user is testing Devin's code
// Copilot suggests improvements while reviewing

// Devin wrote:
function validateEmail(email) {
  return email.includes('@');
}

// Copilot suggests:
// "Use a proper regex or zod validator. Regular expressions for email 
//  are complex, but the 'email-validator' package is simpler."

// VS Code user can:
// 1. Accept Copilot suggestion → commit as local fix
// 2. Push to same branch
// 3. Devin/Claude see the fix in next pull
```

---

## Emergency Procedures

### Devin Makes Breaking Change

```bash
# 1. VS Code user tests and finds breaking change
# 2. Document in .ai/tasks/ACTIVE.md
# 3. Claude AI reviews the architecture impact
# 4. Decision:
#    a. Revert: git revert <commit>
#    b. Fix: Create fix commit
#    c. Discuss: Update .ai/decisions/

# Example revert:
git revert <commit-hash>
git push
# Notify Devin in .ai/handoffs/
```

### VS Code User and Devin Edit Same File

```bash
# This is a real possibility. Solution:
# 1. Git will handle if different lines touched
# 2. If same line:
#    - Merge conflict marker appears
#    - Manually choose the right version
#    - git commit -m "resolve: merge conflict"

# To avoid:
# 1. Read .ai/tasks/ACTIVE.md before starting
# 2. See who's working on what
# 3. Comment in .ai/tasks/ACTIVE.md if working same file
# 4. Coordinate via git, not chat
```

### Claude AI Wants to Refactor Devin's Code

```bash
# 1. Claude creates polish/[id] branch
# 2. Makes refactoring commits
# 3. VS Code user pulls and tests locally
# 4. If approved: merge polish/[id] into feature/[id]
# 5. If issues: revert and discuss in .ai/decisions/

# Example:
git checkout feature/auth
git merge polish/auth-refactor
# Test it...
git push
```

---

## Weekly Sync

Once a week, do an explicit sync:

```bash
# 1. All three tools read .ai/PROJECT_CONTEXT.md
# 2. Update .ai/tasks/ACTIVE.md priorities
# 3. Review .ai/history/ for insights
# 4. Check for architectural conflicts in .ai/decisions/
# 5. Plan next week's work
# 6. Create handoff records for next phase
```

---

## Success Metrics

✅ **No file duplication** — single version in git  
✅ **No manual file transfer** — everything via git commit/push  
✅ **Clear history** — git log shows all three tools' contributions  
✅ **Coordinated workflow** — tools know who's doing what  
✅ **Zero lost work** — git preserves every change  
✅ **Fast handoffs** — .ai/handoffs/ files are the coordination medium  
✅ **Traceable decisions** — .ai/decisions/ shows why changes were made  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| VS Code's version conflicts with Devin's | Merge conflict → manual resolution → git commit |
| Devin doesn't see VS Code's fixes | VS Code forgot to push → git push → Devin pulls |
| Claude's review is unclear | Add detail to .ai/reviews/ → VS Code/Devin ask questions |
| Multiple people editing same file | Coordinate in .ai/tasks/ comments → commit in order |
| Lost changes | Check git log → git reflog → recover via commits |

---

*This protocol makes three tools act as one coordinated development team, with git as the source of truth.*
