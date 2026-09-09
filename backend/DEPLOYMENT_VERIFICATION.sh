#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║  DEPLOYMENT VERIFICATION SCRIPT            ║"
echo "║  Verifying all auto-generation components  ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check if file exists
check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $description"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}❌${NC} $description - NOT FOUND: $file"
    ((CHECKS_FAILED++))
  fi
}

# Function to check if line exists in file
check_line() {
  local file=$1
  local pattern=$2
  local description=$3

  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $description"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}❌${NC} $description"
    ((CHECKS_FAILED++))
  fi
}

echo "1️⃣  Checking Core Service Files..."
check_file "src/services/productImageAutoGenerationService.js" "Auto-generation service"
check_file "src/middleware/productImageAutoGenerationHooks.js" "Auto-generation middleware"
check_file "src/routes/productImageAutoGenerationRoutes.js" "Auto-generation routes"

echo ""
echo "2️⃣  Checking Route Integrations..."
check_file "src/routes/aiImageGenerationEnhancedRoutes.js" "Enhanced image generation routes"
check_file "src/routes/ecommerceImageIntegrationRoutes.js" "E-commerce image routes"
check_file "src/routes/farmerImagePortalRoutes.js" "Farmer image portal routes"

echo ""
echo "3️⃣  Checking Main Index File Integration..."
check_line "src/index.js" "productImageAutoGenerationRoutes" "Routes imported"
check_line "src/index.js" "autoGenerateOnPageViewMiddleware" "Middleware imported"
check_line "src/index.js" "app.use('/api/auto-generation'" "Routes mounted"

echo ""
echo "4️⃣  Checking Product Routes Integration..."
check_line "src/routes/productRoutes.js" "productImageAutoGenerationService" "Service imported"
check_line "src/routes/productRoutes.js" "onProductCreated" "Auto-gen trigger added"
check_line "src/routes/productRoutes.js" "autoImageGenerationQueued" "Response includes status"

echo ""
echo "5️⃣  Checking Environment Configuration..."
check_line "../.env" "AUTO_IMAGE_GENERATION=true" "Master switch enabled"
check_line "../.env" "AUTO_GENERATE_ON_PRODUCT_ADD=true" "Product add trigger enabled"
check_line "../.env" "AUTO_GENERATE_ON_PAGE_VIEW=true" "Page view trigger enabled"
check_line "../.env" "DEFAULT_LANGUAGES=en,hi" "Default languages configured"

echo ""
echo "6️⃣  Checking Test Files..."
check_file "src/__tests__/auto-generation-test.js" "Test suite"

echo ""
echo "7️⃣  Checking Frontend Components..."
if [ -d "../frontend" ]; then
  check_file "../frontend/src/components/Admin/AutoGenerationDashboard.jsx" "Admin dashboard"
else
  echo -e "${YELLOW}⚠️${NC}  Frontend directory not found"
fi

echo ""
echo "8️⃣  Checking Dependencies..."
if npm ls express @anthropic-ai/sdk 2>/dev/null | grep -q "express@\|@anthropic-ai/sdk@"; then
  echo -e "${GREEN}✅${NC} Core dependencies installed"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}❌${NC} Core dependencies missing"
  ((CHECKS_FAILED++))
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  VERIFICATION SUMMARY                      ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo "🎉 ALL CHECKS PASSED!"
  echo ""
  echo "✅ Backend is ready for deployment"
  echo "✅ All auto-generation components are integrated"
  echo "✅ Environment variables are configured"
  echo ""
  echo "📝 Next steps:"
  echo "  1. npm run dev          # Start development server"
  echo "  2. curl http://localhost:3000/health  # Check if running"
  echo "  3. Create test product via API"
  echo "  4. Monitor queue via /api/auto-generation/status"
  echo "  5. View dashboard at http://localhost:5173/admin/auto-generation"
  echo ""
  exit 0
else
  echo "⚠️  Some checks failed - review the issues above"
  echo ""
  exit 1
fi
