# VS Code / Visual Studio Coworking Setup Script (Windows PowerShell)
# Multi-Agent Synchronization Configuration

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VS CODE / VISUAL STUDIO COWORKING SETUP   ║" -ForegroundColor Cyan
Write-Host "║  Multi-Agent Synchronization Configuration ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get project root
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$GitDir = Join-Path $BackendDir ".git"

Write-Host "Setting up coworking environment..." -ForegroundColor Blue
Write-Host ""

# Step 1: Configure Git User
Write-Host "Step 1: Configuring git user..." -ForegroundColor Yellow
git config user.name "Multi-Agent Team"
git config user.email "team@ebdesign.local"
git config core.editor "code"
git config core.filemode false
git config fetch.prune true
Write-Host "✅ Git user configured" -ForegroundColor Green
Write-Host ""

# Step 2: Configure Git Merge Tool
Write-Host "Step 2: Configuring merge tool..." -ForegroundColor Yellow
git config merge.tool vscode
git config merge.conflictstyle diff3
git config mergetool.vscode.cmd 'code --wait $MERGED'
Write-Host "✅ Merge tool configured" -ForegroundColor Green
Write-Host ""

# Step 3: Create Git Hooks
Write-Host "Step 3: Creating git hooks..." -ForegroundColor Yellow

# Create hooks directory if it doesn't exist
$HooksDir = Join-Path $GitDir "hooks"
if (-not (Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir -Force | Out-Null
}

# Post-commit hook
$PostCommitHook = @'
#!/bin/bash

echo "🔄 Syncing with cloud agents..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse HEAD)

echo "📤 Pushing to remote..."
git push origin HEAD:$BRANCH 2>/dev/null || echo "⚠️  No remote configured"

echo "🎨 Notifying auto-generation service..."
curl -X POST http://localhost:3000/api/auto-generation/sync \
  -H "Content-Type: application/json" \
  -d "{\"branch\": \"$BRANCH\", \"commit\": \"$COMMIT\"}" \
  2>/dev/null || echo "⚠️  Auto-generation service not running"

echo "✅ Sync complete"
'@

$PostCommitPath = Join-Path $HooksDir "post-commit"
Set-Content -Path $PostCommitPath -Value $PostCommitHook -Encoding UTF8
Write-Host "✅ Post-commit hook created" -ForegroundColor Green

# Post-merge hook
$PostMergeHook = @'
#!/bin/bash

echo "📦 Merge detected - updating dependencies..."

if git diff --name-only HEAD@{1} | grep -E "package.json|package-lock.json" > /dev/null 2>&1; then
    echo "📚 Installing dependencies..."
    npm install --production
    echo "✅ Dependencies updated"
fi

if git diff --name-only HEAD@{1} | grep -E "migrations/" > /dev/null 2>&1; then
    echo "🗄️  Applying migrations..."
    npm run migrate || echo "⚠️  Migration failed - check database"
    echo "✅ Migrations applied"
fi
'@

$PostMergePath = Join-Path $HooksDir "post-merge"
Set-Content -Path $PostMergePath -Value $PostMergeHook -Encoding UTF8
Write-Host "✅ Post-merge hook created" -ForegroundColor Green
Write-Host ""

# Step 4: Create VS Code Settings
Write-Host "Step 4: Creating VS Code settings..." -ForegroundColor Yellow

$VSCodeDir = Join-Path $ProjectRoot ".vscode"
if (-not (Test-Path $VSCodeDir)) {
    New-Item -ItemType Directory -Path $VSCodeDir -Force | Out-Null
}

# Settings
$Settings = @{
    "editor.defaultFormatter" = "esbenp.prettier-vscode"
    "editor.formatOnSave" = $true
    "prettier.semi" = $true
    "prettier.singleQuote" = $true
    "prettier.trailingComma" = "es5"
    "editor.rulers" = @(80, 120)
    "files.exclude" = @{
        "node_modules" = $true
        ".git" = $true
        "dist" = $true
        "build" = $true
    }
    "search.exclude" = @{
        "node_modules" = $true
        ".git" = $true
    }
    "git.autofetch" = $true
    "git.autorefresh" = $true
    "git.confirmSync" = $false
}

$SettingsJson = $Settings | ConvertTo-Json
Set-Content -Path (Join-Path $VSCodeDir "settings.json") -Value $SettingsJson -Encoding UTF8
Write-Host "✅ Settings configured" -ForegroundColor Green

# Extensions recommendations
$Extensions = @{
    "recommendations" = @(
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "GitHub.copilot",
        "eamodio.gitlens",
        "GitHub.vscode-pull-request-github"
    )
}

$ExtensionsJson = $Extensions | ConvertTo-Json
Set-Content -Path (Join-Path $VSCodeDir "extensions.json") -Value $ExtensionsJson -Encoding UTF8
Write-Host "✅ Extensions recommendations added" -ForegroundColor Green
Write-Host ""

# Step 5: Create Launch Configurations
Write-Host "Step 5: Creating launch configurations..." -ForegroundColor Yellow

$LaunchConfig = @{
    "version" = "0.2.0"
    "configurations" = @(
        @{
            "name" = "Backend Server"
            "type" = "node"
            "request" = "launch"
            "program" = "`${workspaceFolder}/backend/src/index.js"
            "restart" = $true
            "console" = "integratedTerminal"
            "env" = @{
                "NODE_ENV" = "development"
                "AUTO_IMAGE_GENERATION" = "true"
            }
        }
    )
}

$LaunchJson = $LaunchConfig | ConvertTo-Json -Depth 10
Set-Content -Path (Join-Path $VSCodeDir "launch.json") -Value $LaunchJson -Encoding UTF8
Write-Host "✅ Launch configurations created" -ForegroundColor Green
Write-Host ""

# Step 6: Verify Setup
Write-Host "Step 6: Verifying setup..." -ForegroundColor Yellow

$GitUserName = git config user.name
if ($GitUserName -like "*Multi-Agent Team*") {
    Write-Host "✅ Git user configured correctly" -ForegroundColor Green
}

if (Test-Path $PostCommitPath) {
    Write-Host "✅ Post-commit hook created" -ForegroundColor Green
}

if (Test-Path $PostMergePath) {
    Write-Host "✅ Post-merge hook created" -ForegroundColor Green
}

if (Test-Path (Join-Path $VSCodeDir "settings.json")) {
    Write-Host "✅ VS Code settings configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  COWORKING SETUP COMPLETE ✅               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Multi-Agent Synchronization is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Quick Start:"
Write-Host "  1. Open this folder in VS Code"
Write-Host "  2. Run: cd backend && npm run dev"
Write-Host "  3. Monitor: http://localhost:3000/api/auto-generation/status"
Write-Host "  4. Devin and Claude will stay in sync via git"
Write-Host ""
Write-Host "✨ All three agents (Devin, VS Code, Claude) are now synchronized!" -ForegroundColor Green
Write-Host ""
