# Multi-Claude Collaboration Setup

**Purpose:** Enable safe, coordinated work between you and another Claude AI instance working on the same EBDESIGN repository.

---

## 🚀 Quick Start

### For Your Friend Claude (One-time Setup)

```bash
# 1. Clone the repository
git clone https://github.com/Subhesco/EBDESIGN.git EBDESIGN
cd EBDESIGN

# 2. Configure git
git config user.email "friend@claude.ai"
git config user.name "Claude-Friend-Worker"

# 3. Fetch and setup work branch
git fetch origin
git checkout -b feature/claude-friend-work origin/main
git push -u origin feature/claude-friend-work
```

### For Your Friend Claude (After Each Work Session)

```bash
# After working 1-2 hours on code:
./friend-sync-work.sh "describe what you completed"
```

### For You (When Friend Pushes Work)

```bash
# Review and merge Friend's work:
./review-friend-work.sh
```

---

## 📋 How It Works

### Workflow Diagram

```
Friend Claude                          You (Main Claude)
─────────────────────────────────────  ──────────────────
     Work 1-2 hours                    Monitor Git
           ↓
     Run sync script                   
     (friend-sync-work.sh)
           ↓
     Commit + Push to GitHub
     (feature/claude-friend-work)
           ↓─────────────────────→      Git alerts new commits
                                        ↓
                                   Review script
                                   (review-friend-work.sh)
                                        ↓
                                   Accept or Reject
                                        ↓
                                   Merge to main (if approved)
```

---

## 🛠️ Script Details

### 1. `friend-sync-work.sh` (For Friend Claude)

**Purpose:** Safely commit and push work after a work session

**Usage:**
```bash
./friend-sync-work.sh "fixed API routes and mounted 42 services"
```

**What it does:**
- ✅ Checks for sensitive files (secrets, .env, credentials)
- ✅ Excludes dangerous files automatically
- ✅ Shows diff preview for review
- ✅ Creates meaningful commit message
- ✅ Pushes to `feature/claude-friend-work-[date]`
- ✅ Creates handoff documentation

**Safety features:**
- Never commits .env files, API keys, or credentials
- Requires confirmation before pushing
- Shows full diff before commit
- Detects and blocks suspicious patterns
- No `git add -A` (selective staging)

**Example output:**
```
👋 FRIEND CLAUDE - SAFE WORK SYNC
Step 1: Checking current state...
Step 2: Reviewing changes...
Step 3: Security check...
✅ No sensitive files detected
Step 4: Staging files...
   Staged: 47 files
Step 5: Code review preview...
[shows 500 lines of diff]
📝 COMMIT INFORMATION
Commit message: feat: fixed API routes and mounted 42 services
👉 Commit and push? (y/n) 
```

---

### 2. `review-friend-work.sh` (For You)

**Purpose:** Review, audit, and merge Friend's work

**Usage:**
```bash
./review-friend-work.sh
# Or specify branch:
./review-friend-work.sh feature/claude-friend-work-2026-09-16
```

**What it does:**
- ✅ Fetches Friend's branch from GitHub
- ✅ Shows all commits
- ✅ Lists all modified files
- ✅ Shows statistics (lines added/removed)
- ✅ Displays code diff (first 1000 lines)
- ✅ Runs security scan
- ✅ Asks for your approval
- ✅ Merges to main if approved
- ✅ Records merge in MERGE_LOG.md

**Safety features:**
- ⚠️ Detects possible secrets in diff
- ⚠️ Flags if .env or credentials modified
- ⚠️ Warns about very large changes
- 👀 Shows preview before merge
- 🔍 Requires user confirmation

**Example output:**
```
📋 REVIEWING FRIEND CLAUDE'S WORK
📊 Changes from Friend:
a1b2c3d feat: mounted market intelligence service
d4e5f6g feat: fixed 2 silent route bugs
📁 FILES MODIFIED
M backend/src/index.js
M backend/src/routes/marketIntelligenceRoutes.js
A frontend/src/services/marketIntelligenceAPI.js
📊 STATISTICS
Commits: 2
Files changed: 3
Lines added: +87
Lines removed: -5
🔍 CODE REVIEW
[shows diff preview]
🔐 SECURITY CHECK
✅ Security check passed
🎯 MERGE DECISION
👉 Merge to main? (y/n)
```

---

## 🔄 Recommended Workflow

### Timeline for Parallel Work

**Day 1 - Your Baseline**
```bash
# You're on main
git status  # Clean working directory
```

**Day 1 - Friend Claude Starts**
```bash
# Friend clones and creates branch
git clone https://github.com/Subhesco/EBDESIGN.git EBDESIGN
cd EBDESIGN
git checkout -b feature/claude-friend-work origin/main
```

**Day 1 - Friend Works 2 Hours**
```bash
# Friend modifies files, then:
./friend-sync-work.sh "implemented payment API client methods"
# Pushed to: feature/claude-friend-work-2026-09-16
```

**Day 1 - You Review**
```bash
# You review their work
./review-friend-work.sh feature/claude-friend-work-2026-09-16
# You approve and merge
# Now main has their changes
```

**Day 1 - Friend Continues**
```bash
# Friend pulls latest main (with your changes if any)
git fetch origin
git pull origin main
git rebase origin/main  # Optional: keep history clean
# Continue working...
./friend-sync-work.sh "wired backend payment routes"
```

**Day 2 - Parallel Work**
```
Friend: Working on notifications
You: Pull Friend's latest, review, start your own work
Friend: After 2 hours, run sync script
You: Review and merge
Repeat...
```

---

## 📊 Files and Branches

### Branch Structure

```
main (production ready)
├── feature/claude-friend-work-2026-09-16
│   └── [Friend's commits]
├── feature/claude-friend-work-2026-09-17
│   └── [Friend's next batch]
└── [Other branches as needed]
```

### Important Files

| File | Purpose | User |
|------|---------|------|
| `friend-sync-work.sh` | Sync script | Friend Claude |
| `review-friend-work.sh` | Review script | You |
| `.ai/handoffs/` | Session documentation | Both |
| `.ai/handoffs/MERGE_LOG.md` | Merge record | Auto-created |

---

## 🚨 Safety Guidelines

### What NOT to Do

❌ **Friend Claude should NOT:**
- Run `git add -A` (use the script)
- Commit .env files or credentials
- Auto-push without review
- Commit incomplete/broken work
- Force push to any branch
- Delete branches
- Merge their own work to main

❌ **You should NOT:**
- Manually edit Friend's commits
- Force push over Friend's work
- Merge without reviewing
- Skip the review script
- Allow suspicious commits

### What TO Do

✅ **Friend Claude should:**
- Use `./friend-sync-work.sh` after each session
- Write meaningful commit messages
- Only commit complete, working code
- Let me review before merge
- Create handoff documentation

✅ **You should:**
- Run `./review-friend-work.sh` regularly
- Review diff before approving
- Check for security issues
- Approve or request changes
- Document decisions

---

## 🔧 Troubleshooting

### Problem: "Branch not found"

```bash
# Solution: Create the branch
git checkout -b feature/claude-friend-work origin/main
git push -u origin feature/claude-friend-work
```

### Problem: "Merge conflicts"

If Friend's branch conflicts with main:
```bash
# Tell Friend Claude to:
git fetch origin main
git rebase origin/main  # Resolve conflicts
./friend-sync-work.sh "resolved merge conflicts"

# Then you retry:
./review-friend-work.sh
```

### Problem: "Accidentally committed secrets"

```bash
# DO NOT PUSH - instead:
git reset HEAD~1              # Undo commit
git rm --cached .env          # Unstage secret file
rm .env                        # Delete from working dir
git add .                      # Re-stage
git commit -m "removed secrets"
git push -u origin [branch]
```

### Problem: "Review script doesn't work"

```bash
# Try manual review:
git fetch origin feature/claude-friend-work-[date]
git diff main...origin/feature/claude-friend-work-[date]
```

---

## 📝 Handoff Documentation

When Friend runs `friend-sync-work.sh`, it creates handoffs in `.ai/handoffs/`:

```markdown
# Example handoff document

## Friend Claude Work Session - 2026-09-16_14:30

**Branch:** feature/claude-friend-work-2026-09-16  
**Timestamp:** 2026-09-16 14:30:00  
**Status:** Ready for review  

### What I Did
- ✅ Mounted 42 real services
- ✅ Fixed 2 silent route-registration bugs
- ✅ Added 15+ API client methods

### Files Modified
- backend/src/index.js
- backend/src/routes/marketIntelligenceRoutes.js
- frontend/src/services/api.js

### Quality Checks
- Frontend build: ✅ Passed
- No console errors: ✅ Passed
- Tests: ⚠️ Not run (no PostgreSQL)

### Blockers
- PostgreSQL not available for full testing

### For Reviewer
Review files above, check diff, merge if approved.
```

---

## 🎯 Best Practices

1. **Keep work focused:** 1-2 hour chunks on specific features
2. **Meaningful commits:** Describe what was done, why
3. **Review before merge:** Don't skip security check
4. **Document blockers:** Help next person understand issues
5. **Pull before working:** Avoid stale branches
6. **Communicate:** Tell Friend when you've merged

---

## 📞 Getting Help

If something goes wrong:

```bash
# See what branch you're on
git status

# See recent commits
git log --oneline -5

# See available branches
git branch -a

# See remotes
git remote -v

# Check Friend's latest work
git log origin/feature/claude-friend-work-[date] --oneline
```

---

## ✨ Summary

| Step | Who | Command | Time |
|------|-----|---------|------|
| Setup (once) | Friend | Clone + config | 5 min |
| Work | Friend | Edit code | 60-120 min |
| Sync | Friend | `./friend-sync-work.sh "work done"` | 2 min |
| Review | You | `./review-friend-work.sh` | 10 min |
| Approve | You | Type `y` when prompted | 1 min |
| Merge | Script | Auto-merge on approval | 1 min |
| Continue | Friend | Pull + work | 60-120 min |

**Total overhead per sync: ~3-5 minutes for complete review & merge cycle**

---

## 🚀 Ready to Go!

Your friend Claude can now:
1. Clone the repo once
2. Work for 1-2 hours
3. Run `./friend-sync-work.sh "description"`
4. You review and merge with `./review-friend-work.sh`
5. Both stay in sync!

**Questions? Check the scripts for detailed output and confirmations.** ✨
