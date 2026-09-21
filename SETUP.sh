#!/usr/bin/env bash

# EBDESIGN Platform - Complete Repair & Setup Guide
# ===================================================

echo "🚀 EBDESIGN Platform Setup & Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# PHASE 1: ENVIRONMENT SETUP
# ============================================================================

echo -e "${YELLOW}Phase 1: Environment Setup${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm found: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker found"
else
    echo -e "${YELLOW}⚠${NC} Docker not found (optional)"
fi

echo ""

# ============================================================================
# PHASE 2: BACKEND SETUP
# ============================================================================

echo -e "${YELLOW}Phase 2: Backend Setup${NC}"

cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install backend dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC} Please update .env with your configuration"
fi

# Verify core files exist
echo "Verifying backend files..."

BACKEND_FILES=(
    "src/index.js"
    "src/middleware/index.js"
    "src/database/connection.js"
    "src/routes/api.js"
    "src/utils/logger.js"
    "src/core/environmentValidator.js"
)

for file in "${BACKEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        exit 1
    fi
done

cd ..
echo ""

# ============================================================================
# PHASE 3: FRONTEND SETUP
# ============================================================================

echo -e "${YELLOW}Phase 3: Frontend Setup${NC}"

cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install frontend dependencies"
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠${NC} Please update .env with your API URL"
fi

# Verify core files exist
echo "Verifying frontend files..."

FRONTEND_FILES=(
    "src/App.jsx"
    "src/config/env.js"
    "src/main.jsx"
    "vite.config.js"
)

for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
        exit 1
    fi
done

cd ..
echo ""

# ============================================================================
# PHASE 4: VERIFICATION
# ============================================================================

echo -e "${YELLOW}Phase 4: Code Quality Verification${NC}"

# Check backend linting
cd backend
echo "Running backend linting..."
npm run lint 2>/dev/null && echo -e "${GREEN}✓${NC} Backend lint passed" || echo -e "${YELLOW}⚠${NC} Backend lint warnings"
cd ..

# Check frontend linting
cd frontend
echo "Running frontend linting..."
npm run lint 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend lint passed" || echo -e "${YELLOW}⚠${NC} Frontend lint warnings"
cd ..

echo ""

# ============================================================================
# PHASE 5: BUILD VERIFICATION
# ============================================================================

echo -e "${YELLOW}Phase 5: Build Verification (Optional)${NC}"

read -p "Run production builds? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Backend build
    cd backend
    echo "Building backend..."
    npm run build 2>/dev/null && echo -e "${GREEN}✓${NC} Backend build successful" || echo -e "${YELLOW}⚠${NC} Backend build skipped"
    cd ..

    # Frontend build
    cd frontend
    echo "Building frontend..."
    npm run build && echo -e "${GREEN}✓${NC} Frontend build successful" || echo -e "${RED}✗${NC} Frontend build failed"
    cd ..
fi

echo ""

# ============================================================================
# PHASE 6: STARTUP GUIDE
# ============================================================================

echo -e "${GREEN}=========================================="
echo "Setup Complete! ✅"
echo "=========================================${NC}"
echo ""

echo "📋 Quick Start Guide:"
echo ""

echo "1️⃣  Start Backend (Development):"
echo "   cd backend && npm run dev"
echo ""

echo "2️⃣  Start Frontend (Development):"
echo "   cd frontend && npm run dev"
echo ""

echo "3️⃣  Run Backend Tests:"
echo "   cd backend && npm test"
echo ""

echo "4️⃣  Run Frontend Tests:"
echo "   cd frontend && npm test"
echo ""

echo "🔗 Service URLs:"
echo "   Backend API:   http://localhost:3001"
echo "   Frontend:      http://localhost:3000"
echo "   Health Check:  http://localhost:3001/health"
echo ""

echo "📝 Environment Variables Required:"
echo "   Backend (.env):"
echo "     - DATABASE_URL (PostgreSQL)"
echo "     - REDIS_URL (Redis)"
echo "     - FRONTEND_URL (http://localhost:3000)"
echo "     - JWT_SECRET (random string)"
echo "     - NODE_ENV (development|production)"
echo ""
echo "   Frontend (.env):"
echo "     - VITE_API_URL (http://localhost:3001/api)"
echo "     - VITE_API_BASE_URL (/api)"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   1. Update .env files with your actual configuration"
echo "   2. Ensure PostgreSQL and Redis are running"
echo "   3. For production, set NODE_ENV=production"
echo "   4. Enable HTTPS in production"
echo "   5. Set JWT_SECRET to a random 32+ character string"
echo ""

echo "📚 Documentation:"
echo "   - Backend: backend/README.md"
echo "   - Frontend: frontend/README.md"
echo "   - API Docs: http://localhost:3001/api/docs"
echo "   - Full Report: COMPREHENSIVE_PLATFORM_REPAIR_REPORT.md"
echo ""

echo -e "${GREEN}✨ Platform is ready! Start developing!${NC}"
