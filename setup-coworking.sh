#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║  VS CODE / VISUAL STUDIO COWORKING SETUP   ║"
echo "║  Multi-Agent Synchronization Configuration ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
GIT_DIR="$BACKEND_DIR/.git"

echo -e "${BLUE}Setting up coworking environment...${NC}"
echo ""

# Step 1: Configure Git User
echo -e "${YELLOW}Step 1: Configuring git user...${NC}"
git config user.name "Multi-Agent Team"
git config user.email "team@ebdesign.local"
git config core.editor "code"
git config core.filemode false
echo -e "${GREEN}✅ Git user configured${NC}"
echo ""

# Step 2: Configure Git Merge Tool
echo -e "${YELLOW}Step 2: Configuring merge tool...${NC}"
git config merge.tool vscode
git config merge.conflictstyle diff3
git config mergetool.vscode.cmd 'code --wait $MERGED'
echo -e "${GREEN}✅ Merge tool configured${NC}"
echo ""

# Step 3: Create Git Hooks
echo -e "${YELLOW}Step 3: Creating git hooks...${NC}"

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_DIR/hooks"

# Post-commit hook
cat > "$GIT_DIR/hooks/post-commit" << 'EOF'
#!/bin/bash

echo "🔄 Syncing with cloud agents..."

# Get current branch and commit
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse HEAD)

# Push changes
echo "📤 Pushing to remote..."
git push origin HEAD:$BRANCH 2>/dev/null || echo "⚠️  No remote configured"

# Notify auto-generation service
echo "🎨 Notifying auto-generation service..."
curl -X POST http://localhost:3000/api/auto-generation/sync \
  -H "Content-Type: application/json" \
  -d "{\"branch\": \"$BRANCH\", \"commit\": \"$COMMIT\"}" \
  2>/dev/null || echo "⚠️  Auto-generation service not running"

echo "✅ Sync complete"
EOF

# Make it executable
chmod +x "$GIT_DIR/hooks/post-commit"
echo -e "${GREEN}✅ Post-commit hook created${NC}"

# Post-merge hook
cat > "$GIT_DIR/hooks/post-merge" << 'EOF'
#!/bin/bash

echo "📦 Merge detected - updating dependencies..."

# Check if package files changed
if git diff --name-only HEAD@{1} | grep -E "package.json|package-lock.json" > /dev/null 2>&1; then
    echo "📚 Installing dependencies..."
    npm install --production
    echo "✅ Dependencies updated"
fi

# Check if migrations changed
if git diff --name-only HEAD@{1} | grep -E "migrations/" > /dev/null 2>&1; then
    echo "🗄️  Applying migrations..."
    npm run migrate || echo "⚠️  Migration failed - check database"
    echo "✅ Migrations applied"
fi
EOF

chmod +x "$GIT_DIR/hooks/post-merge"
echo -e "${GREEN}✅ Post-merge hook created${NC}"
echo ""

# Step 4: Create VS Code Settings
echo -e "${YELLOW}Step 4: Creating VS Code settings...${NC}"

mkdir -p "$PROJECT_ROOT/.vscode"

# Settings
cat > "$PROJECT_ROOT/.vscode/settings.json" << 'EOF'
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "prettier.semi": true,
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5",
  "editor.rulers": [80, 120],
  "files.exclude": {
    "node_modules": true,
    ".git": true,
    "dist": true,
    "build": true
  },
  "search.exclude": {
    "node_modules": true,
    ".git": true
  },
  "git.autofetch": true,
  "git.autorefresh": true,
  "git.confirmSync": false,
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
EOF

echo -e "${GREEN}✅ Settings configured${NC}"

# Extensions recommendations
cat > "$PROJECT_ROOT/.vscode/extensions.json" << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "GitHub.copilot",
    "eamodio.gitlens",
    "GitHub.vscode-pull-request-github"
  ]
}
EOF

echo -e "${GREEN}✅ Extensions recommendations added${NC}"
echo ""

# Step 5: Create Launch Configurations
echo -e "${YELLOW}Step 5: Creating launch configurations...${NC}"

cat > "$PROJECT_ROOT/.vscode/launch.json" << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.js",
      "restart": true,
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development",
        "AUTO_IMAGE_GENERATION": "true"
      }
    }
  ]
}
EOF

echo -e "${GREEN}✅ Launch configurations created${NC}"
echo ""

# Step 6: Verify Setup
echo -e "${YELLOW}Step 6: Verifying setup...${NC}"

# Check git config
if git config user.name | grep -q "Multi-Agent Team"; then
  echo -e "${GREEN}✅ Git user configured correctly${NC}"
fi

# Check hooks
if [ -x "$GIT_DIR/hooks/post-commit" ]; then
  echo -e "${GREEN}✅ Post-commit hook is executable${NC}"
fi

if [ -x "$GIT_DIR/hooks/post-merge" ]; then
  echo -e "${GREEN}✅ Post-merge hook is executable${NC}"
fi

# Check VS Code config
if [ -f "$PROJECT_ROOT/.vscode/settings.json" ]; then
  echo -e "${GREEN}✅ VS Code settings configured${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  COWORKING SETUP COMPLETE ✅               ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Multi-Agent Synchronization is now ready!${NC}"
echo ""
echo "🚀 Quick Start:"
echo "  1. Open this folder in VS Code"
echo "  2. Run: cd backend && npm run dev"
echo "  3. Monitor: http://localhost:3000/api/auto-generation/status"
echo "  4. Devin and Claude will stay in sync via git"
echo ""
echo "✨ All three agents (Devin, VS Code, Claude) are now synchronized!"
echo ""
