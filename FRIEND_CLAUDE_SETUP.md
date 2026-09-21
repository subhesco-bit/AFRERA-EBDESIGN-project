# Friend Claude — Setup & Work Guide

**Correct Repo:** `https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git`  
**Base Branch:** `claude/keen-gates-663i5d` (NOT main — this has 56+ commits of active work)  
**Your Branch:** `feature/claude-friend-work`  

---

## 🚀 SETUP (One-Time Only)

### Step 1: Clone the Real Repo

```bash
git clone https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git AFRERA-EBDESIGN-project
cd AFRERA-EBDESIGN-project
```

### Step 2: Configure Your Identity

```bash
git config user.email "friend@claude.ai"
git config user.name "Claude-Friend-Worker"
```

### Step 3: Read These Files (IMPORTANT!)

Before touching ANY code, read these in order:

```bash
# 1. Project rules and constraints
cat CLAUDE.md

# 2. Multi-agent collaboration protocol
cat .ai/AGENT_PROTOCOL.md

# 3. What's already been done on this branch
cat .ai/tasks/2026-09-15-nextgen-vision-todo.md

# 4. Who's working on what
cat .ai/tasks/AGENT_ASSIGNMENTS.md
```

**Why?** These files tell you:
- ✅ What's already fixed (don't re-do it)
- ✅ What's still broken
- ✅ Who's working on what areas (avoid conflicts)
- ✅ What git rules to follow

### Step 4: Base Your Branch on Active Work

**DO NOT branch from `main` — branch from `claude/keen-gates-663i5d`**

```bash
# Fetch latest
git fetch origin

# Checkout the active work branch
git checkout -b feature/claude-friend-work origin/claude/keen-gates-663i5d

# Push your branch
git push -u origin feature/claude-friend-work

echo "✅ Setup complete! Ready to work."
```

---

## 📋 BEFORE YOU START WORK

### Step 1: Check What's Already Done

```bash
cat .ai/tasks/2026-09-15-nextgen-vision-todo.md
```

Look for:
- What's already **✅ FIXED** (don't redo)
- What's **❌ NOT DONE** (pick from here)
- What's **⚠️ IN PROGRESS** (talk to Main Claude)

### Step 2: Check Who's Working On What

```bash
cat .ai/tasks/AGENT_ASSIGNMENTS.md
```

Look for:
- Your name (if you already have assignment)
- Other agents' assignments (don't overlap)
- Available areas to work on

### Step 3: Add Your Assignment

Edit `.ai/tasks/AGENT_ASSIGNMENTS.md` and add your row:

```markdown
| Claude-Friend | backend/src/routes/[area]/ <br/> frontend/src/services/[client].js | [Task description] | In Progress | 2026-09-16 14:30 | [Notes] |
```

**Be specific:** List actual file paths, not vague areas.

```bash
# Commit your assignment
git add .ai/tasks/AGENT_ASSIGNMENTS.md
git commit -m "docs: assignment - Friend Claude starting work on [area]"
git push origin feature/claude-friend-work
```

### Step 4: Now You Can Start

You've now:
- ✅ Read what's been done
- ✅ Checked what's available
- ✅ Claimed your work area
- ✅ Won't conflict with others

---

## 💻 DURING WORK

### Work on Your Files Only

```bash
# Only touch files in your assignment
# DO NOT touch files outside your assignment
# DO NOT use git add .

# Edit your files
vi backend/src/routes/myarea/myfile.js
vi frontend/src/services/myAPI.js
```

### Track Your Progress

```bash
# Check what changed
git status

# See the diff
git diff backend/src/routes/myarea/myfile.js
```

### Commit After Each Logical Unit

**After 1-2 hours of work on a specific thing:**

```bash
# Add ONLY your files (be explicit, never git add .)
git add backend/src/routes/myarea/myfile.js
git add frontend/src/services/myAPI.js

# Commit with meaningful message
git commit -m "fix(myarea): fixed X and wired Y because of Z

- Detailed explanation of what changed
- Why you made this change
- Any relevant notes for the reviewer"

# Fetch latest from main work branch (to stay current)
git fetch origin claude/keen-gates-663i5d

# Rebase to avoid conflicts
git rebase origin/claude/keen-gates-663i5d

# Push to your branch
git push origin feature/claude-friend-work
```

---

## ✅ WHEN YOU'RE DONE

### Update Your Assignment Status

```bash
# Edit .ai/tasks/AGENT_ASSIGNMENTS.md
# Change your status from "In Progress" → "Done"

git add .ai/tasks/AGENT_ASSIGNMENTS.md
git commit -m "docs: assignment - Friend Claude completed work on [area]"
git push origin feature/claude-friend-work
```

### Create a Handoff Document

```bash
cat > .ai/handoffs/CLAUDE_FRIEND_SESSION_$(date +%Y-%m-%d_%H%M).md <<'EOF'
# Friend Claude Work Session

**Date:** $(date +%Y-%m-%d)
**Branch:** feature/claude-friend-work
**Status:** Ready for review & merge

## What I Did
- ✅ [List actual accomplishments]
- ✅ [Specific fixes/features]
- ✅ [Tests added]

## Files Modified
- backend/src/routes/...
- frontend/src/services/...
- [Other files]

## Testing
- Frontend build: [✅ Pass / ❌ Fail]
- Tests: [✅ All pass / ⚠️ Some fail / ❌ Not run]
- Manual testing: [describe]

## Blockers
- [None / describe issues]

## For Reviewer
[Any special notes for Main Claude when reviewing]

---
Ready for review and merge into claude/keen-gates-663i5d
EOF

git add .ai/handoffs/
git commit -m "docs: handoff session $(date +%Y-%m-%d)"
git push origin feature/claude-friend-work
```

---

## 🔄 MAIN CLAUDE WILL THEN

1. See your push notification
2. Review your branch: `git diff main...feature/claude-friend-work`
3. Check your code quality
4. Either approve and merge to `claude/keen-gates-663i5d`, or request changes
5. Tell you when merged

You'll see:
```bash
git log origin/claude/keen-gates-663i5d --oneline | head
# Will show your commits merged in
```

---

## 📋 Commit Message Template

```bash
git commit -m "fix(area): short summary of what you did

- Detailed explanation
- Why this change was needed
- How it fixes the issue
- Any important notes for the reviewer"
```

**Good examples:**
```
fix(routes): mount marketIntelligenceRoutes for real backend access

- Previously unmounted route file was never called
- Added setupRoutes() call to index.js
- Added authMiddleware to require real authentication
- Verified backend service exists at /api/v1/market-intelligence

fix(api): add 15 missing marketIntelligenceAPI methods

- Pages were calling methods that didn't exist on exported client
- Added: getMarkets(), getPrices(), getForecasts(), etc.
- Each method maps to real backend route
- Verified against actual service responses
```

---

## ❌ COMMON MISTAKES TO AVOID

❌ **DON'T:**
```bash
git add .                    # Never! Too dangerous
git add *.js                 # Vague! Could include unrelated files
git commit -m "fix"          # Empty message! No detail
git push without rebase      # Causes merge conflicts
```

✅ **DO:**
```bash
git add path/to/specific/file.js   # Explicit and safe
git commit -m "fix(area): what you changed and why"
git fetch origin claude/keen-gates-663i5d
git rebase origin/claude/keen-gates-663i5d
git push origin feature/claude-friend-work
```

---

## 🆘 TROUBLESHOOTING

### "I'm on the wrong branch"
```bash
git status  # See current branch
git checkout feature/claude-friend-work  # Switch to your branch
```

### "I need to pull latest updates"
```bash
git fetch origin claude/keen-gates-663i5d
git rebase origin/claude/keen-gates-663i5d
```

### "I accidentally modified a file outside my assignment"
```bash
git restore path/to/wrong/file.js  # Undo the change
git status  # Verify
```

### "I want to see what Main Claude did"
```bash
git log origin/claude/keen-gates-663i5d --oneline -10
git diff HEAD...origin/claude/keen-gates-663i5d
```

---

## 📞 Key URLs

- **Repository:** https://github.com/subhesco-bit/AFRERA-EBDESIGN-project
- **Active Branch:** `claude/keen-gates-663i5d`
- **Your Branch:** `feature/claude-friend-work`
- **PR:** #21 (the active work PR)

---

## ✨ Summary

1. ✅ Clone repo
2. ✅ Read CLAUDE.md + AGENT_PROTOCOL.md + todo + assignments
3. ✅ Base branch on `claude/keen-gates-663i5d` (NOT main)
4. ✅ Check what's available in AGENT_ASSIGNMENTS.md
5. ✅ Add your assignment
6. ✅ Work on your files only
7. ✅ Commit explicitly (not `git add .`)
8. ✅ Rebase before push
9. ✅ Push to `feature/claude-friend-work`
10. ✅ Main Claude reviews and merges

**Ready? Start with: `git clone https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git`** 🚀
