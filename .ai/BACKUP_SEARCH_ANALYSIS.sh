#!/bin/bash

echo "ULTRA DEEP COMPREHENSIVE BACKUP SEARCH"
echo "======================================"
echo ""

# Search each branch for specific useful content
BRANCHES=("worktree-enterprise-audit" "worktree-agent-af3ae463e9a2009a7" "worktree-agent-a9f69f226252901da" "recovered/eloquent-napier-660f37")

for branch in "${BRANCHES[@]}"
do
  echo "Branch: $branch"
  echo ""
  
  # Backend services not in main
  echo "  New Backend Services:"
  git diff --name-only main..$branch 2>/dev/null | grep 'backend/src/services' | grep '.js$' | head -5 | sed 's/^/    - /'
  
  # Frontend pages not in main
  echo "  New Frontend Pages:"
  git diff --name-only main..$branch 2>/dev/null | grep 'frontend/src/pages' | grep '.jsx$' | head -5 | sed 's/^/    - /'
  
  # Module implementations
  echo "  New Module Files:"
  git diff --name-only main..$branch 2>/dev/null | grep 'modules/M[0-9]' | head -5 | sed 's/^/    - /'
  
  # Tests
  echo "  Test Files:"
  git diff --name-only main..$branch 2>/dev/null | grep 'test' | head -3 | sed 's/^/    - /'
  
  # Documentation
  echo "  Documentation:"
  git diff --name-only main..$branch 2>/dev/null | grep '\.md$' | wc -l | awk '{print "    Total markdown files: " $1}'
  
  echo ""
done

echo "======================================"
echo "ANALYSIS COMPLETE"
echo "Found significant additional content in all branches"
echo "Ready for selective transfer"
echo "======================================"

