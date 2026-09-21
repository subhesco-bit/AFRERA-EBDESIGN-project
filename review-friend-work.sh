#!/bin/bash
# REVIEW & MERGE FRIEND CLAUDE'S WORK
# Safe review gate for multi-Claude collaboration
# Usage: ./review-friend-work.sh [branch-name]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
FRIEND_BRANCH="${1:-feature/claude-friend-work-$(date +%Y-%m-%d)}"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 REVIEWING FRIEND CLAUDE'S WORK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Review Parameters:"
echo "   Branch: ${FRIEND_BRANCH}"
echo "   Base: main"
echo "   Timestamp: ${TIMESTAMP}"
echo ""

# 1. Fetch latest
echo -e "${YELLOW}Step 1: Fetching from remote...${NC}"
if ! git fetch origin ${FRIEND_BRANCH} 2>/dev/null; then
    echo -e "${RED}❌ Branch not found: ${FRIEND_BRANCH}${NC}"
    echo ""
    echo "Available feature branches:"
    git branch -r | grep feature/ | head -10
    exit 1
fi
echo -e "${GREEN}✅ Fetched${NC}"
echo ""

# 2. Check if branch exists locally
if ! git rev-parse --verify ${FRIEND_BRANCH} >/dev/null 2>&1; then
    echo -e "${YELLOW}Step 2: Creating local tracking branch...${NC}"
    git checkout -b ${FRIEND_BRANCH} origin/${FRIEND_BRANCH}
else
    echo -e "${YELLOW}Step 2: Local branch exists, updating...${NC}"
    git checkout ${FRIEND_BRANCH}
    git pull origin ${FRIEND_BRANCH}
fi
echo -e "${GREEN}✅ Branch ready${NC}"
echo ""

# 3. Show commits
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 COMMITS FROM FRIEND${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

COMMIT_COUNT=$(git log main..origin/${FRIEND_BRANCH} --oneline 2>/dev/null | wc -l)

if [ ${COMMIT_COUNT} -eq 0 ]; then
    echo -e "${YELLOW}ℹ️  No new commits compared to main${NC}"
    exit 0
fi

git log main..origin/${FRIEND_BRANCH} --oneline
echo ""

# 4. Show files changed
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📁 FILES MODIFIED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git diff --name-status main...origin/${FRIEND_BRANCH}
echo ""

# 5. Show statistics
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 STATISTICS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Commits: $(git log main..origin/${FRIEND_BRANCH} --oneline | wc -l)"
echo "Files changed: $(git diff --name-only main...origin/${FRIEND_BRANCH} | wc -l)"

INSERTIONS=$(git diff main...origin/${FRIEND_BRANCH} --numstat | awk '{sum+=$1} END {print sum}')
DELETIONS=$(git diff main...origin/${FRIEND_BRANCH} --numstat | awk '{sum+=$2} END {print sum}')

echo "Lines added: +${INSERTIONS}"
echo "Lines removed: -${DELETIONS}"
echo ""

# 6. Preview diff
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔍 CODE REVIEW (First 1000 lines)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

git diff main...origin/${FRIEND_BRANCH} | head -1000
echo ""
echo "(... showing first 1000 lines ...)"
echo ""

# 7. Security check
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🔐 SECURITY CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SUSPICIOUS=0

# Check for secrets
if git diff main...origin/${FRIEND_BRANCH} | grep -i "password\|secret\|api_key\|token" >/dev/null 2>&1; then
    echo -e "${RED}⚠️  WARNING: Possible secrets found in diff${NC}"
    SUSPICIOUS=$((SUSPICIOUS+1))
fi

# Check for .env files
if git diff --name-only main...origin/${FRIEND_BRANCH} | grep -E "\.env|credentials|secrets" >/dev/null 2>&1; then
    echo -e "${RED}⚠️  WARNING: .env or credential files modified${NC}"
    SUSPICIOUS=$((SUSPICIOUS+1))
fi

# Check for large files
if git diff --numstat main...origin/${FRIEND_BRANCH} | awk '{print $1}' | grep -E '^[0-9]{4,}' >/dev/null 2>&1; then
    echo -e "${RED}⚠️  WARNING: Large files added (>1000 lines)${NC}"
    SUSPICIOUS=$((SUSPICIOUS+1))
fi

if [ ${SUSPICIOUS} -eq 0 ]; then
    echo -e "${GREEN}✅ Security check passed${NC}"
else
    echo -e "${YELLOW}⚠️  ${SUSPICIOUS} security issue(s) found - review carefully${NC}"
fi

echo ""

# 8. Decision prompt
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🎯 MERGE DECISION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "Review summary:"
echo -e "  ${BLUE}Branch:${NC} ${FRIEND_BRANCH}"
echo -e "  ${BLUE}Commits:${NC} ${COMMIT_COUNT}"
echo -e "  ${BLUE}Files:${NC} $(git diff --name-only main...origin/${FRIEND_BRANCH} | wc -l)"
echo -e "  ${BLUE}Changes:${NC} +${INSERTIONS}/-${DELETIONS}"
echo -e "  ${BLUE}Security:${NC} $([ ${SUSPICIOUS} -eq 0 ] && echo -e "${GREEN}✅ Passed${NC}" || echo -e "${RED}⚠️  Issues${NC}")"
echo ""

read -p "👉 Merge to main? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Merging...${NC}"
    git checkout main
    git pull origin main
    git merge --no-ff ${FRIEND_BRANCH} -m "Merge: Friend Claude work from ${TIMESTAMP}"

    echo -e "${YELLOW}Pushing...${NC}"
    git push origin main

    echo ""
    echo -e "${GREEN}✅ SUCCESS! Friend's work merged to main${NC}"
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo -e "  Merged branch: ${FRIEND_BRANCH}"
    echo -e "  Commits: ${COMMIT_COUNT}"
    echo -e "  Files changed: $(git diff --name-only main~1..main | wc -l)"
    echo ""

    # Create merge record
    cat >> .ai/handoffs/MERGE_LOG.md <<EOF
## Merge: ${TIMESTAMP}

- **Branch:** ${FRIEND_BRANCH}
- **Commits:** ${COMMIT_COUNT}
- **Files:** $(git diff --name-only main~1..main | wc -l)
- **Changes:** +${INSERTIONS}/-${DELETIONS}
- **Status:** ✅ Merged

EOF

    echo -e "${YELLOW}📝 Merge recorded in .ai/handoffs/MERGE_LOG.md${NC}"
else
    echo -e "${RED}❌ Merge cancelled${NC}"
    echo ""
    echo "To review again:"
    echo "  ./review-friend-work.sh ${FRIEND_BRANCH}"
    echo ""
    echo "To reject and delete branch:"
    echo "  git branch -D ${FRIEND_BRANCH}"
    echo "  git push origin --delete ${FRIEND_BRANCH}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
