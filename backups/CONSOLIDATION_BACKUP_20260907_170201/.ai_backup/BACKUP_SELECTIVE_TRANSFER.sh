#!/bin/bash

echo "PHASE 3B: SELECTIVE TRANSFER FROM BACKUPS"
echo "=========================================="
echo ""

# Priority files to recover from backups
# Avoid duplicates already in main branch

echo "Extracting HIGH VALUE items from backup branches..."
echo ""

# From worktree-af3ae463e9a2009a7 - AI Services
echo "1. AI Services (worktree-agent-af3ae463e9a2009a7):"
FILES=(
  "backend/src/services/advancedAIService.js"
  "backend/src/services/advancedFeaturesService.js"
  "backend/src/services/advancedVoiceAI.js"
  "backend/src/services/agriculturalIntelligenceService.js"
)

for file in "${FILES[@]}"
do
  if git show worktree-agent-af3ae463e9a2009a7:$file >/dev/null 2>&1; then
    mkdir -p "$(dirname "$file")"
    git show worktree-agent-af3ae463e9a2009a7:$file > "$file" 2>/dev/null
    echo "  ✅ Recovered: $(basename $file)"
  fi
done

echo ""
echo "2. AI Pages (worktree-agent-af3ae463e9a2009a7):"
FILES=(
  "frontend/src/pages/AIAgentPage.jsx"
  "frontend/src/pages/AIBrainPage.jsx"
  "frontend/src/pages/AIChatPage.jsx"
  "frontend/src/pages/AICollaborationPage.jsx"
  "frontend/src/pages/AIDashboard.jsx"
)

for file in "${FILES[@]}"
do
  if git show worktree-agent-af3ae463e9a2009a7:$file >/dev/null 2>&1; then
    mkdir -p "$(dirname "$file")"
    git show worktree-agent-af3ae463e9a2009a7:$file > "$file" 2>/dev/null
    echo "  ✅ Recovered: $(basename $file)"
  fi
done

echo ""
echo "3. Test Suites (worktree-agent-af3ae463e9a2009a7):"
git show worktree-agent-af3ae463e9a2009a7:backend/integration-test-report.json 2>/dev/null > backend/integration-test-report.json && echo "  ✅ Integration test report"
git show worktree-agent-af3ae463e9a2009a7:backend/src/tests/analyticsService.test.js 2>/dev/null > backend/src/tests/analyticsService.test.js && echo "  ✅ Analytics test suite"

echo ""
echo "========================================"
echo "BACKUP TRANSFER COMPLETE"
echo "STATUS: Selective high-value items recovered"
echo "========================================"

