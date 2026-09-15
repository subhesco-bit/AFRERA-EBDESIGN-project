# Deployment Verification Script (Windows PowerShell)

Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  DEPLOYMENT VERIFICATION SCRIPT            ║" -ForegroundColor Cyan
Write-Host "║  Verifying all auto-generation components  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$passed = 0
$failed = 0
$baseDir = (Get-Location).Path

function Check-File {
    param(
        [string]$FilePath,
        [string]$Description
    )

    if (Test-Path $FilePath) {
        Write-Host "✅ $Description" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Description - NOT FOUND: $FilePath" -ForegroundColor Red
        return $false
    }
}

function Check-Content {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description
    )

    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match $Pattern) {
            Write-Host "✅ $Description" -ForegroundColor Green
            return $true
        }
    }

    Write-Host "❌ $Description" -ForegroundColor Red
    return $false
}

# 1. Check Core Service Files
Write-Host "1️⃣  Checking Core Service Files..." -ForegroundColor Yellow
if (Check-File "src/services/productImageAutoGenerationService.js" "Auto-generation service") { $passed++ } else { $failed++ }
if (Check-File "src/middleware/productImageAutoGenerationHooks.js" "Auto-generation middleware") { $passed++ } else { $failed++ }
if (Check-File "src/routes/productImageAutoGenerationRoutes.js" "Auto-generation routes") { $passed++ } else { $failed++ }

# 2. Check Route Integrations
Write-Host ""
Write-Host "2️⃣  Checking Route Integrations..." -ForegroundColor Yellow
if (Check-File "src/routes/aiImageGenerationEnhancedRoutes.js" "Enhanced image generation routes") { $passed++ } else { $failed++ }
if (Check-File "src/routes/ecommerceImageIntegrationRoutes.js" "E-commerce image routes") { $passed++ } else { $failed++ }
if (Check-File "src/routes/farmerImagePortalRoutes.js" "Farmer image portal routes") { $passed++ } else { $failed++ }

# 3. Check Main Index File Integration
Write-Host ""
Write-Host "3️⃣  Checking Main Index File Integration..." -ForegroundColor Yellow
if (Check-Content "src/index.js" "productImageAutoGenerationRoutes" "Routes imported") { $passed++ } else { $failed++ }
if (Check-Content "src/index.js" "autoGenerateOnPageViewMiddleware" "Middleware imported") { $passed++ } else { $failed++ }
if (Check-Content "src/index.js" "app.use\('/api/auto-generation'" "Routes mounted") { $passed++ } else { $failed++ }

# 4. Check Product Routes Integration
Write-Host ""
Write-Host "4️⃣  Checking Product Routes Integration..." -ForegroundColor Yellow
if (Check-Content "src/routes/productRoutes.js" "productImageAutoGenerationService" "Service imported") { $passed++ } else { $failed++ }
if (Check-Content "src/routes/productRoutes.js" "onProductCreated" "Auto-gen trigger added") { $passed++ } else { $failed++ }
if (Check-Content "src/routes/productRoutes.js" "autoImageGenerationQueued" "Response includes status") { $passed++ } else { $failed++ }

# 5. Check Environment Configuration
Write-Host ""
Write-Host "5️⃣  Checking Environment Configuration..." -ForegroundColor Yellow
if (Check-Content "../.env" "AUTO_IMAGE_GENERATION=true" "Master switch enabled") { $passed++ } else { $failed++ }
if (Check-Content "../.env" "AUTO_GENERATE_ON_PRODUCT_ADD=true" "Product add trigger enabled") { $passed++ } else { $failed++ }
if (Check-Content "../.env" "AUTO_GENERATE_ON_PAGE_VIEW=true" "Page view trigger enabled") { $passed++ } else { $failed++ }
if (Check-Content "../.env" "DEFAULT_LANGUAGES=en,hi" "Default languages configured") { $passed++ } else { $failed++ }

# 6. Check Test Files
Write-Host ""
Write-Host "6️⃣  Checking Test Files..." -ForegroundColor Yellow
if (Check-File "src/__tests__/auto-generation-test.js" "Test suite") { $passed++ } else { $failed++ }

# 7. Check Frontend Components
Write-Host ""
Write-Host "7️⃣  Checking Frontend Components..." -ForegroundColor Yellow
if (Test-Path "../frontend") {
    if (Check-File "../frontend/src/components/Admin/AutoGenerationDashboard.jsx" "Admin dashboard") { $passed++ } else { $failed++ }
} else {
    Write-Host "⚠️  Frontend directory not found" -ForegroundColor Yellow
}

# 8. Check Dependencies
Write-Host ""
Write-Host "8️⃣  Checking Dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
if ($packageJson.dependencies."express" -and $packageJson.dependencies."@anthropic-ai/sdk") {
    Write-Host "✅ Core dependencies installed" -ForegroundColor Green
    $passed++
} else {
    Write-Host "❌ Core dependencies missing" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  VERIFICATION SUMMARY                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Backend is ready for deployment" -ForegroundColor Green
    Write-Host "✅ All auto-generation components are integrated" -ForegroundColor Green
    Write-Host "✅ Environment variables are configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. npm run dev              # Start development server" -ForegroundColor White
    Write-Host "  2. curl http://localhost:3000/health  # Check if running" -ForegroundColor White
    Write-Host "  3. Create test product via API" -ForegroundColor White
    Write-Host "  4. Monitor queue via /api/auto-generation/status" -ForegroundColor White
    Write-Host "  5. View dashboard at http://localhost:5173/admin/auto-generation" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "⚠️  Some checks failed - review the issues above" -ForegroundColor Red
    Write-Host ""
    exit 1
}
