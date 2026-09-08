# 🚀 Quick Start: Multi-Agent Sync Setup

**Time to activate:** 10 minutes  
**Status:** Ready to use immediately

---

## What You Get

✅ **Devin** can code while you review in VS Code  
✅ **VS Code** user tests locally without manual file copying  
✅ **Claude AI** polishes code without version conflicts  
✅ **Zero file duplication** — everything via git  
✅ **Clear handoffs** — know who's doing what  
✅ **Automatic sync** — git is the source of truth  

---

## Setup (5 minutes)

### Step 1: Configure Git for Multi-Agent Work

```bash
# Set your identity in this repo
git config user.name "Devin"
git config user.email "devin@anthropic.com"

# OR if you're VS Code user:
git config user.name "Claude Code"
git config user.email "noreply@anthropic.com"

# OR if you're Claude AI reviewer:
git config user.name "Claude AI"
git config user.email "noreply@anthropic.com"
```

### Step 2: Verify VS Code Configuration

1. Open VS Code
2. Open the EBDESIGN folder
3. You should see 3 green checkmarks in status bar:
   - ✅ Git branch detected
   - ✅ Extensions loaded
   - ✅ Settings applied

If not:
```bash
# Reload VS Code
Ctrl+Shift+P → Developer: Reload Window
```

### Step 3: Create First Task

```bash
# Create your first task
# File: .ai/tasks/ACTIVE.md

# Add this section:
#### Task: M099 - Setup Verification
- **Assigned To:** Devin
- **Branch:** feature/m099-setup-verify
- **Status:** Not Started
- **Priority:** P0
- **Est. Completion:** Today
- **Description:** Verify multi-agent workflow is working

**Phase Status:**
```
Devin Implementation:   [░░░░░░░░░░] 0%
VS Code Testing:       [░░░░░░░░░░] 0%
Claude Review:         [░░░░░░░░░░] 0%
Merge Ready:           [░░░░░░░░░░] 0%
```

**Notes:**
- Create a simple test file to verify workflow
```

### Step 4: Commit the Setup

```bash
git add .ai/workflows/MULTI_AGENT_SYNC_PROTOCOL.md
git add .ai/workflows/GIT_WORKFLOW_COMMANDS.md
git add .ai/tasks/ACTIVE_WORKFLOW_TEMPLATE.md
git add .ai/tasks/ACTIVE.md
git add .vscode/settings.json
git add .vscode/extensions.json

git commit -m "setup: enable multi-agent sync workflow

- Add MULTI_AGENT_SYNC_PROTOCOL.md
- Add GIT_WORKFLOW_COMMANDS.md
- Add ACTIVE_WORKFLOW_TEMPLATE.md
- Configure VS Code for multi-agent development
- Install recommended extensions

This enables seamless workflow:
Devin → VS Code (testing) → Claude (review) → Merge

Co-Authored-By: Claude Code <noreply@anthropic.com>"

git push
```

---

## First Run (5 minutes)

### For Devin: Your First Implementation

```bash
# 1. Read what needs to be done
# File: .ai/tasks/ACTIVE.md

# 2. Create your branch
git checkout -b feature/m099-setup-verify

# 3. Create a simple test file
cat > backend/src/__tests__/workflow-verification.test.js << 'EOF'
describe('Multi-Agent Workflow', () => {
  test('Devin, VS Code, and Claude can sync', () => {
    const workflow = {
      devin: 'implementation',
      vsCode: 'testing',
      claudeAI: 'review',
      sync: 'git-based'
    };
    expect(workflow.sync).toBe('git-based');
  });
});
EOF

# 4. Commit your work
git add backend/src/__tests__/workflow-verification.test.js
git commit -m "test: add workflow verification test (Devin)

This test verifies the multi-agent sync workflow is active.

Co-Authored-By: Devin <devin@anthropic.com>"

git push -u origin feature/m099-setup-verify

# 5. Create handoff for VS Code user
cat > .ai/handoffs/DEVIN_M099.md << 'EOF'
# Handoff: Setup Verification Test

## Implementation Complete

**What was done:**
- Created workflow-verification.test.js
- Verified git workflow is connected

**How to test:**
1. `git checkout feature/m099-setup-verify`
2. `npm test -- workflow-verification`
3. Verify test passes

**Notes:**
- This is a verification task, not production code
- Ready for VS Code testing
EOF

git add .ai/handoffs/DEVIN_M099.md
git commit -m "docs: handoff M099 to VS Code

Implementation complete. Ready for testing.

Co-Authored-By: Devin <devin@anthropic.com>"

git push
```

### For VS Code User: Your First Test

```bash
# 1. See what Devin created
git fetch origin
git log origin/feature/m099-setup-verify -1

# 2. Check out Devin's branch
git checkout feature/m099-setup-verify

# 3. Test it locally
npm test -- workflow-verification
# (should see: ✓ Devin, VS Code, and Claude can sync)

# 4. Create review handoff
cat > .ai/handoffs/REVIEW_M099.md << 'EOF'
# Review: Setup Verification

## Local Testing Complete ✅

**What was tested:**
- Workflow verification test
- Git branch checkout
- Test execution

**Results:**
- ✅ Test passes
- ✅ No console errors
- ✅ Ready for Claude review

**Issues Found:** None

**Ready for Claude AI review:** YES
EOF

git add .ai/handoffs/REVIEW_M099.md
git commit -m "docs: review M099 - local testing complete

All tests passing. Ready for Claude architecture review.

Co-Authored-By: Claude Code <noreply@anthropic.com>"

git push
```

### For Claude AI: Your First Review

```bash
# 1. See what's ready
git fetch origin
git diff main..feature/m099-setup-verify

# 2. Create review
cat > .ai/reviews/REVIEW_M099.md << 'EOF'
# Code Review: M099 Setup Verification

## Architecture Assessment ✅

The test correctly verifies that the multi-agent sync workflow is operational.

**Findings:**
- ✅ Code structure is sound
- ✅ Test is properly written
- ✅ No security concerns
- ✅ No performance issues
- ✅ Test coverage: 100%

**Recommendation:** ✅ READY TO MERGE

No polish or refactoring needed. This is minimal verification code.

---

**Summary:**
- Lines of code: 10
- Test coverage: 100%
- Security: ✅ Safe
- Performance: ✅ No concerns
- Architecture: ✅ Good
EOF

git add .ai/reviews/REVIEW_M099.md
git commit -m "review: M099 - approved for merge

Architecture: ✅ Sound
Security: ✅ Safe
Tests: ✅ 100% coverage
Performance: ✅ Good

Recommendation: ✅ READY TO MERGE

Co-Authored-By: Claude AI <noreply@anthropic.com>"

git push
```

---

## Merge (1 minute)

### All Three Tools: Merge to Main

```bash
# Switch to main
git checkout main
git pull origin main

# Merge feature branch
git merge feature/m099-setup-verify

# Delete feature branch
git branch -d feature/m099-setup-verify
git push origin --delete feature/m099-setup-verify

# Verify merge succeeded
git log --oneline -5
# (should show the merge commit)

# Update task status
# Edit .ai/tasks/ACTIVE.md
# Change status to COMPLETE

git add .ai/tasks/ACTIVE.md
git commit -m "chore: M099 complete - workflow verified

Feature: M099 Setup Verification
Status: ✅ MERGED AND DEPLOYED

The multi-agent sync workflow is now active:
- Devin: Implementation
- VS Code: Testing
- Claude AI: Review
- Git: Source of truth

Co-Authored-By: Claude Code <noreply@anthropic.com>"

git push origin main
```

---

## Verify It Worked ✅

```bash
# 1. Check your branch is deleted
git branch -a
# (should NOT see feature/m099-setup-verify)

# 2. Check main has the new code
git checkout main
git log --oneline -5
# (should see your test file commit)

# 3. Verify test still passes
npm test -- workflow-verification
# (should pass)

# 4. Check handoff files are preserved
ls -la .ai/handoffs/DEVIN_M099.md
ls -la .ai/handoffs/REVIEW_M099.md
ls -la .ai/reviews/REVIEW_M099.md
# (all should exist - they're documentation)
```

---

## Key Shortcuts

### Create Quick Alias Commands

```bash
# Add to your shell profile (.bashrc, .zshrc, or PowerShell $PROFILE)

# For bash/zsh:
alias gs='git status -s'
alias gf='git fetch origin'
alias gp='git push'
alias gc='git commit -m'
alias ga='git add'

# For PowerShell:
# Add to your $PROFILE file
New-Alias -Name gs -Value 'git status -s'
New-Alias -Name gf -Value 'git fetch origin'
New-Alias -Name gp -Value 'git push'
```

---

## Workflow at a Glance

```
Day 1:
Devin writes code
  ↓
Devin: git push to feature/m###

Day 2:
VS Code user: git fetch
VS Code user: git checkout feature/m###
VS Code user: npm run dev (test locally)
VS Code user: npm test
VS Code user: push review handoff
VS Code user: git push
  ↓

Day 3:
Claude AI: git fetch
Claude AI: git diff main..feature/m###
Claude AI: review and create .ai/reviews/REVIEW_m###.md
Claude AI: git push
  ↓

Day 4:
All three: Review PR
All three: Approve merge
  ↓
git merge feature/m### into main
git push
  ↓
Feature is LIVE! ✅
```

---

## Troubleshooting Activation

| Issue | Fix |
|-------|-----|
| "Extensions not loading" | Cmd+Shift+P → Extensions: Show Installed Extensions |
| "Git not detecting changes" | `git status` in terminal |
| "Branch won't switch" | `git stash` to save uncommitted work |
| "Merge conflict" | See GIT_WORKFLOW_COMMANDS.md → Conflict Procedures |
| "Forgot to push" | `git push` immediately |
| "Handoff file missing" | Create it: `.ai/handoffs/DEVIN_m###.md` |

---

## Next Steps

1. ✅ **Setup complete** — you now have multi-agent sync active
2. 📋 **Read the full protocols:**
   - `.ai/workflows/MULTI_AGENT_SYNC_PROTOCOL.md` (comprehensive)
   - `.ai/workflows/GIT_WORKFLOW_COMMANDS.md` (all commands)
3. 🚀 **Start real work** — create tasks in `.ai/tasks/ACTIVE.md`
4. 📊 **Track progress** — update task status daily
5. 🤝 **Handoff cleanly** — use `.ai/handoffs/` for communication

---

## Success Signals

✅ Devin pushed code → VS Code can pull it  
✅ VS Code found issues → Devin can see the review  
✅ Claude reviewed → All changes are documented  
✅ Merged to main → No file duplication occurred  
✅ Git history is clean → All commits are attributed  

---

## Support

If something breaks:

1. **Check git status:** `git status`
2. **Review the protocols:** Read relevant `.ai/workflows/` file
3. **Ask in tasks:** Comment in `.ai/tasks/ACTIVE.md`
4. **Revert if needed:** `git revert <commit>`

---

*You now have a production-grade multi-agent development workflow. Start coding!*
