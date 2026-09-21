# 🚀 Quick Reference Card — Friend Claude Collaboration

**Print this or bookmark it!**

---

## 🔗 KEY URLS & BRANCHES

```
Repository:      https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git
Active Branch:   claude/keen-gates-663i5d  (PR #21)
Friend's Branch: feature/claude-friend-work
Base From:       origin/claude/keen-gates-663i5d (NOT main!)
```

---

## ⚡ QUICK COMMANDS

### First Time Setup (Friend Claude)

```bash
git clone https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git AFRERA-EBDESIGN-project
cd AFRERA-EBDESIGN-project
git config user.email "friend@claude.ai"
git config user.name "Claude-Friend-Worker"
git fetch origin
git checkout -b feature/claude-friend-work origin/claude/keen-gates-663i5d
git push -u origin feature/claude-friend-work
```

### Before You Work

```bash
cat .ai/tasks/2026-09-15-nextgen-vision-todo.md      # What's done/not done
cat .ai/tasks/AGENT_ASSIGNMENTS.md                    # Who's doing what
# Edit AGENT_ASSIGNMENTS.md and add yourself
git add .ai/tasks/AGENT_ASSIGNMENTS.md
git commit -m "docs: assignment - [you] working on [area]"
git push origin feature/claude-friend-work
```

### While Working

```bash
git status                          # See what changed
git diff path/to/file.js            # See specific changes
```

### When Done With Work Block

```bash
git add path/to/file1.js path/to/file2.js
git commit -m "fix(area): what you changed

- Detailed explanation
- Why this matters
- Testing notes"

git fetch origin claude/keen-gates-663i5d
git rebase origin/claude/keen-gates-663i5d
git push origin feature/claude-friend-work
```

### Update Assignment Status (When Done)

```bash
# Edit .ai/tasks/AGENT_ASSIGNMENTS.md
# Change status: In Progress → Done
git add .ai/tasks/AGENT_ASSIGNMENTS.md
git commit -m "docs: assignment - [you] completed [area]"
git push origin feature/claude-friend-work
```

### Main Claude Reviews

```bash
git fetch origin feature/claude-friend-work
git diff claude/keen-gates-663i5d...origin/feature/claude-friend-work
git checkout claude/keen-gates-663i5d
git merge feature/claude-friend-work -m "Merge: Friend Claude work"
git push origin claude/keen-gates-663i5d
```

---

## ✅ PRE-WORK CHECKLIST

- [ ] Cloned correct repo: `subhesco-bit/AFRERA-EBDESIGN-project`
- [ ] Configured git identity
- [ ] Read `CLAUDE.md` — project rules
- [ ] Read `.ai/AGENT_PROTOCOL.md` — git safety rules
- [ ] Read `.ai/tasks/2026-09-15-nextgen-vision-todo.md` — what's done
- [ ] Read `.ai/tasks/AGENT_ASSIGNMENTS.md` — assignments
- [ ] Branched from `claude/keen-gates-663i5d` (NOT main)
- [ ] Added yourself to AGENT_ASSIGNMENTS.md
- [ ] Verified no file conflicts with others
- [ ] Ready to code! ✅

---

## 🚨 DO's AND DON'Ts

### ✅ DO

```bash
git add path/to/specific/file.js         # Specific files
git commit -m "fix(area): what and why"  # Meaningful message
git fetch && git rebase origin/...       # Stay current
git push origin feature/claude-friend-work
```

### ❌ DON'T

```bash
git add .                               # NEVER! Dangerous
git add *.js                            # Vague!
git commit -m "fix"                     # Empty message
git push without rebase                 # Causes conflicts
git checkout/edit other people's files  # Not assigned to you
```

---

## 📋 COMMIT MESSAGE TEMPLATE

```
fix(area): short summary

- What you changed
- Why you changed it
- How it solves the problem
- Any notes for reviewer
```

**Good example:**
```
fix(routes): mount marketIntelligenceRoutes with auth

- Route file existed but was never called
- Added setupRoutes() to index.js
- Added authMiddleware to require real credentials
- Verified against actual backend service at /api/v1
```

---

## 🔍 COMMON CHECKS

### What's already been fixed?
```bash
cat .ai/tasks/2026-09-15-nextgen-vision-todo.md | grep "✅"
```

### What's still to do?
```bash
cat .ai/tasks/2026-09-15-nextgen-vision-todo.md | grep "❌"
```

### Who's working on what?
```bash
cat .ai/tasks/AGENT_ASSIGNMENTS.md
```

### What did Main Claude do?
```bash
git log origin/claude/keen-gates-663i5d --oneline -10
```

### Show my commits
```bash
git log feature/claude-friend-work --oneline -5
```

### See all changes I made
```bash
git diff main...feature/claude-friend-work
```

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "Need latest updates" | `git fetch origin claude/keen-gates-663i5d && git rebase origin/claude/keen-gates-663i5d` |
| "Rebase conflicts" | Resolve conflicts in editor, then `git add . && git rebase --continue && git push` |
| "Wrong branch" | `git checkout feature/claude-friend-work` |
| "Need to undo commit" | `git reset HEAD~1` |
| "Accidentally edited wrong file" | `git restore path/to/file.js` |
| "Can't find branch" | `git fetch origin` then `git branch -a` |

---

## 📞 CONTACT POINTS

| Need Help With | Who To Ask |
|------------------|-----------|
| Git workflow | See `.ai/AGENT_PROTOCOL.md` |
| What to work on | See `.ai/tasks/2026-09-15-nextgen-vision-todo.md` |
| File conflicts | See `.ai/tasks/AGENT_ASSIGNMENTS.md` |
| Project rules | See `CLAUDE.md` |
| Previous handoffs | See `.ai/handoffs/` |

---

## 🎯 WORKFLOW SUMMARY

```
1. Setup (once)        → git clone + config + checkout -b
2. Read files          → CLAUDE.md + AGENT_PROTOCOL.md + todo + assignments
3. Add assignment      → Edit AGENT_ASSIGNMENTS.md, commit, push
4. Work (1-2 hours)    → Edit your files only
5. Commit explicitly   → git add [files] && git commit -m "fix(...)"
6. Rebase before push  → git fetch && git rebase origin/...
7. Push to your branch → git push origin feature/claude-friend-work
8. Main Claude reviews → Diff check, security check, merge
9. Repeat from step 4
```

---

## ⏱️ TIME BREAKDOWN

| Step | Time |
|------|------|
| Initial clone + config | 5 min |
| Reading critical files | 15 min |
| Branch setup + assignment | 5 min |
| One work session | 60-120 min |
| Commit + rebase + push | 3-5 min |
| Total per session | ~70-135 min |
| Your review + merge | ~10-15 min |

---

## ✨ REMEMBER

- ✅ Branch from `claude/keen-gates-663i5d`, NOT `main`
- ✅ Read the 4 key files BEFORE coding
- ✅ Only touch files in your assignment
- ✅ Use explicit `git add path/file.js` (not `git add .`)
- ✅ Rebase before push
- ✅ Write meaningful commit messages
- ✅ Update assignment status when done
- ✅ Main Claude reviews before merge

---

**Ready? Start here: `FRIEND_CLAUDE_SETUP.md`** 🚀

Made this for you, print it and keep it handy! ✨
