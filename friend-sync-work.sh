#!/bin/bash
# FRIEND CLAUDE - SAFE WORK SYNC SCRIPT
# Commits and pushes work with safety checks
# Usage: ./friend-sync-work.sh "describe your work here"

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Config
WORK_DESCRIPTION="${1:-auto-sync work session}"
FRIEND_BRANCH="feature/claude-friend-work-$(date +%Y-%m-%d)"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
SESSION_ID=$(date +%s)

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}👋 FRIEND CLAUDE - SAFE WORK SYNC${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Session Info:"
echo "   Timestamp: ${TIMESTAMP}"
echo "   Branch: ${FRIEND_BRANCH}"
echo "   Work: ${WORK_DESCRIPTION}"
echo ""

# 1. Verify we're in right repo
if [ ! -d .git ]; then
    echo -e "${RED}❌ Not a git repository!${NC}"
    echo "Did you forget to cd into EBDESIGN?"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking current state...${NC}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "   Current branch: ${CURRENT_BRANCH}"

# 2. Ensure on friend's work branch
if [ "${CURRENT_BRANCH}" != "${FRIEND_BRANCH}" ]; then
    echo -e "${YELLOW}   Creating work branch...${NC}"
    git fetch origin main 2>/dev/null || true
    git checkout -b ${FRIEND_BRANCH} origin/main 2>/dev/null || git checkout ${FRIEND_BRANCH}
    CURRENT_BRANCH=${FRIEND_BRANCH}
fi

echo -e "${GREEN}✅ On correct branch${NC}"
echo ""

# 3. Show what changed
echo -e "${YELLOW}Step 2: Reviewing changes...${NC}"
echo ""

CHANGED_FILES=$(git status -s | wc -l)
echo "Files with changes: ${CHANGED_FILES}"

if [ ${CHANGED_FILES} -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No changes to commit${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Changed files:${NC}"
git status -s | head -20
if [ ${CHANGED_FILES} -gt 20 ]; then
    echo "   ... and $((CHANGED_FILES - 20)) more"
fi
echo ""

# 4. Security check - exclude sensitive files
echo -e "${YELLOW}Step 3: Security check...${NC}"

EXCLUDED_PATTERNS=(
    '.env*'
    'secrets*'
    '*.key'
    '*.pem'
    'credentials*'
    '.DS_Store'
    'node_modules'
    '.git'
    'build/'
    'dist/'
)

echo "   Checking for sensitive files..."

SENSITIVE_FOUND=0
for pattern in "${EXCLUDED_PATTERNS[@]}"; do
    MATCHES=$(git status -s | grep -E "${pattern}" || true)
    if [ -n "${MATCHES}" ]; then
        echo -e "${RED}⚠️  Sensitive pattern found: ${pattern}${NC}"
        echo "${MATCHES}"
        SENSITIVE_FOUND=1
    fi
done

if [ ${SENSITIVE_FOUND} -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Remove sensitive files and try again:${NC}"
    echo "  git reset HEAD [sensitive-file]"
    echo "  rm [sensitive-file]"
    exit 1
fi

echo -e "${GREEN}✅ No sensitive files detected${NC}"
echo ""

# 5. Add files (with exclusions)
echo -e "${YELLOW}Step 4: Staging files...${NC}"

git add . \
    --exclude='.env*' \
    --exclude='secrets*' \
    --exclude='*.key' \
    --exclude='*.pem' \
    --exclude='credentials*' \
    --exclude='.DS_Store' \
    --exclude='node_modules' \
    --exclude='build' \
    --exclude='dist'

STAGED_COUNT=$(git diff --cached --name-only | wc -l)
echo "   Staged: ${STAGED_COUNT} files"

if [ ${STAGED_COUNT} -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No files to stage after exclusions${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Files to commit:${NC}"
git diff --cached --name-only | head -20
if [ ${STAGED_COUNT} -gt 20 ]; then
    echo "   ... and $((STAGED_COUNT - 20)) more"
fi
echo ""

echo -e "${GREEN}✅ Files staged${NC}"
echo ""

# 6. Show diff preview
echo -e "${YELLOW}Step 5: Code review preview...${NC}"
echo ""
echo -e "${BLUE}Diff (first 500 lines):${NC}"
git diff --cached | head -500
echo ""
echo "(showing first 500 lines of diff)"
echo ""

# 7. Confirmation
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 COMMIT INFORMATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COMMIT_MSG="feat: ${WORK_DESCRIPTION}

Session: ${TIMESTAMP}
Branch: ${FRIEND_BRANCH}
Files: ${STAGED_COUNT}
Status: Ready for review"

echo -e "${BLUE}Commit message:${NC}"
echo "${COMMIT_MSG}"
echo ""

# 8. Final confirmation
read -p "👉 Commit and push? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    echo ""
    echo "To continue later:"
    echo "  git status"
    echo "  git diff"
    exit 1
fi

# 9. Commit
echo ""
echo -e "${YELLOW}Step 6: Committing...${NC}"
git commit -m "${COMMIT_MSG}"
echo -e "${GREEN}✅ Committed${NC}"

# 10. Push
echo -e "${YELLOW}Step 7: Pushing to GitHub...${NC}"
git push -u origin ${FRIEND_BRANCH}
echo -e "${GREEN}✅ Pushed${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SUCCESS! Work synced to GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "📊 Summary:"
echo "   Branch: ${FRIEND_BRANCH}"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Files: ${STAGED_COUNT}"
echo "   Work: ${WORK_DESCRIPTION}"
echo ""

echo "🎯 Next steps:"
echo "   1. Main Claude will review your work"
echo "   2. Use: ./review-friend-work.sh ${FRIEND_BRANCH}"
echo "   3. If approved, work merges to main"
echo ""

echo "📝 Continue working or create new handoff:"
echo "   ./friend-sync-work.sh 'next batch of work'"
echo ""

echo "📖 Check your commits:"
echo "   git log ${FRIEND_BRANCH} --oneline -5"
echo ""
