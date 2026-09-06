#!/bin/bash

echo "ULTRA COMPREHENSIVE RECOVERY AUDIT"
echo "==================================="
echo ""

# Get all recovered files
TOTAL=$(git diff --name-only main..worktree-enterprise-audit | wc -l)
echo "Total Files Recovered: $TOTAL"
echo ""

# By type
echo "By File Type:"
git diff --name-only main..worktree-enterprise-audit | sed 's/.*\.//' | sort | uniq -c | sort -rn | awk '{print "  " $2 ": " $1}'
echo ""

# By category
echo "By Category:"
echo "  Backend Services: $(git diff --name-only main..worktree-enterprise-audit | grep 'services/' | grep '\.js$' | wc -l)"
echo "  Backend Routes: $(git diff --name-only main..worktree-enterprise-audit | grep 'routes/' | grep '\.js$' | wc -l)"
echo "  Backend Controllers: $(git diff --name-only main..worktree-enterprise-audit | grep 'controllers/' | grep '\.js$' | wc -l)"
echo "  Frontend Pages: $(git diff --name-only main..worktree-enterprise-audit | grep 'pages/' | grep '\.jsx$' | wc -l)"
echo "  Frontend Components: $(git diff --name-only main..worktree-enterprise-audit | grep 'components/' | grep '\.jsx$' | wc -l)"
echo "  Database Migrations: $(git diff --name-only main..worktree-enterprise-audit | grep 'migrations/' | grep '\.sql$' | wc -l)"
echo "  Documentation: $(git diff --name-only main..worktree-enterprise-audit | grep '\.md$' | wc -l)"
echo ""

# Code metrics
echo "Code Metrics:"
TOTALLINES=$(git diff main..worktree-enterprise-audit | grep '^+' | grep -v '^+++' | wc -l)
echo "  Total lines of new code: $TOTALLINES"
echo ""

# Critical files
echo "Critical Files Recovered:"
for file in "backend/src/index.js" "backend/src/core/aiOrchestrator.js" "frontend/src/App.jsx" "frontend/src/config/routes.js"
do
  if git show worktree-enterprise-audit:$file >/dev/null 2>&1; then
    LINES=$(git show worktree-enterprise-audit:$file | wc -l)
    echo "  OK: $file ($LINES lines)"
  fi
done

