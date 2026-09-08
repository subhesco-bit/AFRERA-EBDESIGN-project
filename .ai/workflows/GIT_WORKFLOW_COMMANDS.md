# Git Workflow Commands: Devin + VS Code + Claude AI

**Quick Reference:** Every command needed for seamless multi-agent development

---

## DEVIN'S WORKFLOW (Implementation)

### 1. Start a New Task

```bash
# Pull latest from team
git fetch origin
git checkout main
git pull origin main

# Create new feature branch
git checkout -b feature/m###-task-name

# Example: implementing authentication
git checkout -b feature/m001-user-auth
```

### 2. During Implementation

```bash
# Make changes to files
# (edit files in your IDE)

# Every 15-30 minutes, commit your work
git add .
git commit -m "feat: implement JWT token generation (Devin)

- Add token generation with HS256 algorithm
- Add 1-hour expiration
- Add refresh token support

Co-Authored-By: Devin <devin@anthropic.com>"

# Push frequently so VS Code can test
git push -u origin feature/m###-task-name
```

### 3. Complete Implementation & Handoff

```bash
# Final check - ensure everything is pushed
git push

# Create handoff document for VS Code
# (Create file: .ai/handoffs/DEVIN_m###.md)

# Update task status in .ai/tasks/ACTIVE.md
# Change status from "In Progress" to "Ready for Testing"

# Commit the handoff
git add .ai/handoffs/DEVIN_m###.md
git add .ai/tasks/ACTIVE.md
git commit -m "docs: handoff m### to VS Code for testing

- Implementation complete
- All tests passing
- Ready for local review

Co-Authored-By: Devin <devin@anthropic.com>"

git push
```

---

## VS CODE USER'S WORKFLOW (Local Testing)

### 1. See What Devin Just Finished

```bash
# Pull latest from all branches
git fetch origin

# List all Devin's branches
git branch -r | grep feature/

# See what Devin committed
git log origin/feature/m###-task-name --oneline -5
```

### 2. Test Devin's Feature Locally

```bash
# Switch to Devin's branch
git checkout feature/m###-task-name

# Install any new dependencies
npm install

# Start development server
npm run dev

# In another terminal, run tests
npm test

# Manually test the feature in browser
# (open http://localhost:5173)
# Test the new feature thoroughly
```

### 3. If You Find Issues (Fix Locally)

```bash
# Make fixes to the files
# (edit files in VS Code)

# Commit your fix to the same branch
git add .
git commit -m "fix: improve email validation (VS Code review)

- Add regex validation
- Improve error message clarity
- Handle edge cases

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# Push your fix to same branch
git push

# Notify in handoff file
# (Update .ai/handoffs/REVIEW_m###.md)
```

### 4. If Everything Works (Approve for Claude)

```bash
# Update the review handoff with "APPROVED"
# (Edit .ai/handoffs/REVIEW_m###.md)
# Add your findings

# Commit your review notes
git add .ai/handoffs/REVIEW_m###.md
git commit -m "docs: review m### - approved for Claude

- ✅ All tests passing
- ✅ Feature works as designed
- ✅ No breaking changes
- Ready for Claude architecture review

Co-Authored-By: Claude Code <noreply@anthropic.com>"

git push

# Return to main branch
git checkout main
git pull origin main
```

### 5. During Waiting Period

```bash
# Keep your branch up to date
git fetch origin
git merge origin/feature/m###-task-name

# Start testing the next feature while Claude reviews
git checkout feature/m###-next-task
```

---

## CLAUDE AI'S WORKFLOW (Code Review & Polish)

### 1. See What's Ready for Review

```bash
# Fetch everything
git fetch origin

# List branches ready for review
git branch -r | grep feature/

# Read the handoff files
# File: .ai/handoffs/DEVIN_m###.md
# File: .ai/handoffs/REVIEW_m###.md
```

### 2. Detailed Code Review

```bash
# Compare against main branch
git diff main..feature/m###-task-name

# Look at commit by commit
git log main..feature/m###-task-name --oneline
git show <commit-hash>

# Look at specific file
git show feature/m###-task-name:backend/src/services/auth.js

# See blame for context
git blame backend/src/services/auth.js
```

### 3. Create Detailed Review

```bash
# Create review document
# File: .ai/reviews/REVIEW_m###.md
# Include: findings, recommendations, architecture assessment

# Example content:
# - Architecture Assessment: ✅ Good
# - Security Issues: ⚠️ 2 findings
# - Test Coverage: 🔴 0%
# - Recommendations: Add 10-15 tests
```

### 4. Optional: Create Polish Branch (for refactoring)

```bash
# If significant refactoring needed, create polish branch
git checkout feature/m###-task-name
git checkout -b polish/m###-refactor

# Make refactoring changes
git add .
git commit -m "polish: refactor auth service (Claude review)

- Extract token validation to separate module
- Add comprehensive JSDoc comments
- Move magic numbers to config
- Improve error handling

Co-Authored-By: Claude AI <noreply@anthropic.com>"

# Push polish branch
git push -u origin polish/m###-refactor

# Merge it into feature branch for final version
git checkout feature/m###-task-name
git merge polish/m###-refactor
git push
```

### 5. Finalize Review & Recommend Merge

```bash
# Commit your review findings
git add .ai/reviews/REVIEW_m###.md
git commit -m "review: m### code review complete

Architecture: ✅ Sound design
Security: ✅ No critical issues
Performance: ✅ Good
Test Coverage: ⚠️ Needs 10-15 tests (optional)

Recommendation: ✅ READY TO MERGE (with optional polish)

Co-Authored-By: Claude AI <noreply@anthropic.com>"

git push
```

---

## MERGE TO MAIN (All Three Tools)

### Before Merge

```bash
# ALL TOOLS: Verify everything is good
git fetch origin

# Switch to feature branch
git checkout feature/m###-task-name

# Verify tests pass
npm test

# Verify no console errors
npm run dev
# (Check browser console - should be clean)

# Verify against main
git diff main..feature/m###-task-name
# (Review all changes)
```

### Perform the Merge

```bash
# Switch to main
git checkout main
git pull origin main

# Merge feature branch
git merge feature/m###-task-name

# Verify merge succeeded
git log --oneline -5

# Push merged code
git push origin main
```

### After Merge

```bash
# Clean up feature branch
git branch -d feature/m###-task-name
git push origin --delete feature/m###-task-name

# Update task status
# (.ai/tasks/ACTIVE.md: mark as COMPLETE)

# Update history
# (.ai/history/IMPLEMENTATION_HISTORY.md: add entry)

# Commit these updates
git add .ai/tasks/ACTIVE.md .ai/history/IMPLEMENTATION_HISTORY.md
git commit -m "chore: mark m### complete and deployed

Feature: m### - [Task Name]
- Implementation: Devin
- Testing: VS Code user
- Review: Claude AI
- Status: ✅ MERGED

Co-Authored-By: Claude Code <noreply@anthropic.com>"

git push origin main
```

---

## EMERGENCY PROCEDURES

### If Merge Conflict Occurs

```bash
# 1. Don't panic - this is normal with multi-agent work

# 2. Check conflict
git status

# 3. Open the conflicted file and look for conflict markers
# <<<<<<<<<<< HEAD
#   your version
# =============
#   their version
# >>>>>>>>>>>>

# 4. Manually resolve by choosing the right version
# (edit the file, remove the conflict markers)

# 5. Stage the resolution
git add <conflicted-file>

# 6. Complete the merge
git commit -m "resolve: merge conflict in [file]

Chose [which version] because [reason]

Co-Authored-By: Claude Code <noreply@anthropic.com>"

# 7. Push the resolution
git push
```

### If Devin & VS Code Edit Same Line

```bash
# Option 1: Rebase (recommended)
git fetch origin
git rebase origin/main
# Handle conflicts above

# Option 2: Merge (alternative)
git fetch origin
git merge origin/main
# Handle conflicts above
```

### If Wrong Commit Was Pushed

```bash
# DO NOT FORCE PUSH! Instead:

# 1. Create a revert commit
git revert <commit-hash>
git push

# 2. Document why in .ai/decisions/
# File: .ai/decisions/REVERT_m###.md

# 3. Notify other tools in .ai/tasks/ACTIVE.md
```

### If Need to Undo Last Commit (before pushing)

```bash
# Show last 5 commits
git log --oneline -5

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Fix the issue
git add .
git commit -m "corrected: [fix message]"

git push
```

---

## Daily Commands

### Morning: Sync Up

```bash
# Pull latest from team
git fetch origin
git checkout main
git pull origin main

# See what Devin did
git log origin/main --oneline -10

# See what's ready to test
git branch -r | grep feature/

# Check for your branch
git branch -a | grep $(whoami)
```

### Before Starting Work

```bash
# Ensure you're on main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/m###-task-name

# Verify it's created
git branch
# (should show * on your new branch)
```

### During Work (Every 30 mins)

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: description here"

# Push to remote
git push
```

### End of Day

```bash
# Ensure everything is pushed
git push

# Update task status in .ai/tasks/ACTIVE.md
git add .ai/tasks/ACTIVE.md
git commit -m "chore: update task status - end of day"
git push

# Switch back to main
git checkout main
git pull origin main
```

---

## Useful Status Commands

```bash
# See current status
git status

# See your commits today
git log --oneline --since="6 hours ago"

# See everyone's commits
git log --all --oneline -20

# See what Devin did
git log --all --author="Devin" --oneline -10

# See branches
git branch -a

# See incoming changes
git fetch origin
git log main..origin/main --oneline

# See what you've changed
git diff

# See what's staged
git diff --cached

# See commits in feature branch not in main
git log main..HEAD --oneline
```

---

## Alias Shortcuts

Add these to your git config for faster workflow:

```bash
git config --global alias.sync "!git fetch origin && git pull origin main"
git config --global alias.status-short "!git status -s && git branch -a | grep -E '^\*|feature|polish'"
git config --global alias.features "!git branch -r | grep feature"
git config --global alias.mywork "!git log --oneline --author=$(git config user.name) -10"
git config --global alias.team "!git log --oneline --all -20"
git config --global alias.unstaged "diff"
git config --global alias.staged "diff --cached"
git config --global alias.last "log --oneline -5"

# Usage:
git sync              # Pull latest
git status-short      # Quick status with branches
git features          # List Devin's feature branches
git mywork            # Your commits
git team              # Team commits
```

---

## Troubleshooting

| Issue | Command | Explanation |
|-------|---------|---|
| "Branch is behind" | `git pull origin feature/m###` | Your local is old, update it |
| "Branch has diverged" | `git rebase origin/feature/m###` | Rebase your changes on top |
| "Permission denied" | `ssh -T git@github.com` | Check SSH key setup |
| "Merge conflicts" | `git mergetool` | Visual conflict resolver |
| "Lost commits" | `git reflog` | See all recent commits |
| "Need to undo" | `git revert <hash>` | Safe undo (creates new commit) |
| "Stash work" | `git stash save "description"` | Save uncommitted changes |
| "Apply stash" | `git stash pop` | Restore stashed changes |

---

*This guide keeps all three tools in sync through git, the single source of truth.*
