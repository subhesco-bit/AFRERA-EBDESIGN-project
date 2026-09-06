#!/bin/bash
# Recover valuable components from worktree-enterprise-audit branch

echo "🔄 RECOVERING VALUABLE COMPONENTS FROM WORKTREE..."
echo ""

# Files to recover - core + important modules + routes
FILES_TO_RECOVER=(
  "backend/src/controllers/devinController.js"
  "backend/src/core/aiOrchestrator.js"
  "backend/src/core/erpAgents.js"
  "backend/src/modules/M056/service.js"
  "backend/src/modules/M056/routes.js"
  "backend/src/modules/M076/service.js"
  "backend/src/modules/M077/service.js"
  "backend/src/modules/M078/service.js"
  "backend/src/modules/M079/service.js"
  "backend/src/modules/M080/service.js"
  "backend/src/routes/animalHealthRoutes.js"
  "backend/src/routes/cropPlanningRoutes.js"
  "backend/src/routes/devinRoutes.js"
  "backend/src/routes/goatRoutes.js"
  "backend/src/routes/insuranceEnhancements.js"
  "backend/src/routes/landRecordsRoutes.js"
  "backend/src/routes/legacy/apicultureRoutes.js"
  "backend/src/routes/legacy/fisheriesRoutes.js"
  "backend/src/routes/legacy/forestryRoutes.js"
)

RECOVERED_COUNT=0
RECOVERED_FILES=()

for file in "${FILES_TO_RECOVER[@]}"; do
  if git show worktree-enterprise-audit:"$file" > /dev/null 2>&1; then
    # Create directory
    mkdir -p "$(dirname "$file")"
    
    # Recover file
    git show worktree-enterprise-audit:"$file" > "$file"
    
    RECOVERED_COUNT=$((RECOVERED_COUNT + 1))
    RECOVERED_FILES+=("$file")
    echo "✅ $file"
  fi
done

echo ""
echo "✅ RECOVERED: $RECOVERED_COUNT files"
echo ""
echo "📋 Files recovered:"
for file in "${RECOVERED_FILES[@]}"; do
  wc -l "$file" 2>/dev/null | awk '{print "   " $1 " lines - " $2}'
done

