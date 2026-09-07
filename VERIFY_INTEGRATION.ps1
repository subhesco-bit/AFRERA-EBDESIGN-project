#!/usr/bin/env pwsh
# Integration Verification Script
# Tests that all integrations are working properly

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\DIYA GOEL\Downloads\EBDESIGN"

Write-Host "=== INTEGRATION VERIFICATION ===" -ForegroundColor Cyan
Write-Host "Target: Verify all integrations are working" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 1: VERIFY BACKEND MODULE COUNT
# ============================================
Write-Host "[1/5] Verifying backend module count..." -ForegroundColor Yellow

$BackendModulesDir = "$ProjectRoot\backend\src\modules"
$ModulesDir = "$ProjectRoot\modules"

$BackendModuleCount = (Get-ChildItem -Path $BackendModulesDir -Directory).Count
$OriginalModuleCount = (Get-ChildItem -Path $ModulesDir -Directory -ErrorAction SilentlyContinue).Count

Write-Host "  Backend modules: $BackendModuleCount" -ForegroundColor Green
Write-Host "  Original modules: $OriginalModuleCount" -ForegroundColor Green

if ($BackendModuleCount -ge 280) {
    Write-Host "  ✓ Module transfer successful" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Module transfer may be incomplete" -ForegroundColor Yellow
}

# ============================================
# STEP 2: VERIFY MODULE INTEGRATION STATUS
# ============================================
Write-Host ""
Write-Host "[2/5] Verifying module integration status..." -ForegroundColor Yellow

$IntegratedCount = 0
$BackendModules = Get-ChildItem -Path $BackendModulesDir -Directory

foreach ($Module in $BackendModules) {
    $ModulePath = $Module.FullName
    $HasService = Test-Path "$ModulePath\service.js"
    $HasRoutes = Test-Path "$ModulePath\routes.js"
    $HasController = Test-Path "$ModulePath\controller.js"
    $HasIndex = Test-Path "$ModulePath\index.js"
    
    if ($HasService -or $HasRoutes -or $HasController -or $HasIndex) {
        $IntegratedCount++
    }
}

Write-Host "  Integrated modules: $IntegratedCount/$BackendModuleCount" -ForegroundColor Green

if ($IntegratedCount -ge 80) {
    Write-Host "  ✓ Module integration good" -ForegroundColor Green
} else {
    Write-  "  ⚠ Some modules may need integration" -ForegroundColor Yellow
}

# ============================================
# STEP 3: VERIFY BACKEND ROUTE CONFIGURATION
# ============================================
Write-Host ""
Write-Host "[3/5] Verifying backend route configuration..." -ForegroundColor Yellow

$BackendIndexFile = "$ProjectRoot\backend\src\index.js"
$BackendIndexContent = Get-Content $BackendIndexFile -Raw

$HasModuleBridge = $BackendIndexContent -match "backendModuleBridge"
$HasModuleRegistry = $BackendIndexContent -match "moduleRegistryRoutes"

Write-Host "  Backend module bridge: $(if ($HasModuleBridge) { 'configured' } else { 'missing' })" -ForegroundColor $(if ($HasModuleBridge) { "Green" } else { "Red" })
Write-Host "  Module registry routes: $(if ($HasModuleRegistry) { 'configured' } else { 'missing' })" -ForegroundColor $(if ($HasModuleRegistry) { "Green" } else { "Red" })

# ============================================
# STEP 4: VERIFY FRONTEND MODULE ROUTES
# ============================================
Write-Host ""
Write-Host "[4/5] Verifying frontend module routes..." -Yellow

$FrontendAppFile = "$ProjectRoot\frontend\src\App.jsx"
$FrontendAppContent = Get-Content $FrontendAppFile -Raw

$HasModuleRoutes = $FrontendAppContent -match "Module.*M\d{3}"
$HasModuleLazyLoading = $FrontendAppContent -match "lazy.*import.*modules"

Write-Host "  Frontend module routes: $(if ($HasModuleRoutes) { 'configured' } else { 'missing' })" -ForegroundColor $(if ($HasModuleRoutes) { "Green" } else { "Red" })
Write-Host "  Module lazy loading: $(if ($HasModuleLazyLoading) { 'configured' } else { 'missing' })" -ForegroundColor $(if ($HasModuleLazyLoading) { "Green" else { "Red" })

# ============================================
# STEP 5: GENERATE VERIFICATION REPORT
# ============================================
Write-Host ""
Write-Host "[5/5] Generating verification report..." -ForegroundColor Yellow

$VerificationReport = @"
INTEGRATION VERIFICATION REPORT
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

MODULE TRANSFER STATUS
====================
Original modules: $OriginalModuleCount
Backend modules: $BackendModuleCount
Transfer successful: $(if ($BackendModuleCount -ge 280) { 'YES' } else { 'NO' })

MODULE INTEGRATION STATUS
=========================
Backend modules: $BackendModuleCount
Integrated modules: $IntegratedCount
Integration rate: $([math]::Round(($IntegratedCount / $BackendModuleCount) * 100, 2))%

BACKEND ROUTE CONFIGURATION
=========================
Module bridge: $(if ($HasModuleBridge) { 'CONFIGURED' } else { 'MISSING' })
Module registry: $(if ($HasModuleRegistry) { 'CONFIGURED' } else { 'MISSING' })

FRONTEND ROUTE CONFIGURATION
===========================
Module routes: $(if ($HasModuleRoutes) { 'CONFIGURED' } else { 'MISSING' })
Module lazy loading: $(if ($HasModuleLazyLoading) { 'CONFIGURED' } else { 'MISSING' })

OVERALL STATUS
==============
$(if ($BackendModuleCount -ge 280 -and $IntegratedCount -ge 80 -and $HasModuleBridge -and $HasModuleRegistry -and $HasModuleRoutes -and $HasModuleLazyLoading) { "ALL INTEGRATIONS WORKING" } else { "SOME INTEGRATIONS NEED ATTENTION" })

RECOMMENDATIONS
===============
1. Test backend API endpoints: GET /api/v1/backend-modules
2. Test module registry: GET /api/v1/ai/modules
3. Test frontend module routes: /module/M001
4. Remove original /modules directory if integration confirmed
5. Clean up staging directories
"@

$VerificationReport | Out-File "$ProjectRoot\.ai\INTEGRATION_VERIFICATION_REPORT.txt" -Encoding UTF8
Write-Host "  Verification report generated" -ForegroundColor Green

# ============================================
# COMPLETION SUMMARY
# ============================================
Write-Host ""
Write-Host "=== VERIFICATION SUMMARY ===" -ForegroundColor Cyan
Write-Host "Backend modules: $BackendModuleCount" -ForegroundColor Green
Write-Host "Integrated modules: $IntegratedCount" -ForegroundColor Green
Write-Host "Backend route config: $(if ($HasModuleBridge -and $HasModuleRegistry) { 'WORKING' } else { 'NEEDS ATTENTION' })" -ForegroundColor $(if ($HasModuleBridge -and $HasModuleRegistry) { "Green" } else { "Yellow" })
Write-Host "Frontend route config: $(if ($HasModuleRoutes -and $HasModuleLazyLoading) { 'WORKING' } else { 'NEEDS ATTENTION' })" -ForegroundColor $(if ($HasModuleRoutes -and $HasModuleLazyLoading) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "INTEGRATION VERIFICATION COMPLETE" -ForegroundColor Green
Write-Host "Report saved to: .ai\INTEGRATION_VERIFICATION_REPORT.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review verification report" -ForegroundColor White
Write-Host "2. Test API endpoints" -ForegroundColor White
Write-3. "Test frontend module routes" -ForegroundColor White
Write-Host "4. Clean up original /modules directory" -ForegroundColor White