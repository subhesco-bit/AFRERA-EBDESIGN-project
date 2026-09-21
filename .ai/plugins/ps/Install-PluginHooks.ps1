# Install-PluginHooks.ps1
# One-time PowerShell setup: installs plugin dependencies and wires the
# pre-commit hook to run the zero-token dep audit automatically.
# Usage:  pwsh .ai/plugins/ps/Install-PluginHooks.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Write-Host 'Installing plugin dependencies (puppeteer, depcheck)...' -ForegroundColor Cyan
npm install --no-save --prefix backend puppeteer depcheck 2>$null

$hookPath = Join-Path $repoRoot '.git/hooks/pre-commit'
$hookLine = 'node .ai/plugins/dep-auditor.js backend || exit 1'

if (Test-Path $hookPath) {
    $existing = Get-Content $hookPath -Raw
    if ($existing -notmatch [regex]::Escape($hookLine)) {
        Add-Content -Path $hookPath -Value $hookLine
        Write-Host "Appended dep-auditor to existing pre-commit hook." -ForegroundColor Green
    } else {
        Write-Host "pre-commit hook already wired." -ForegroundColor Yellow
    }
} else {
    Set-Content -Path $hookPath -Value "#!/bin/sh`n$hookLine`n"
    Write-Host "Created pre-commit hook with dep-auditor." -ForegroundColor Green
}

Write-Host "Done. Import module with: Import-Module .ai/plugins/ps/TokenOptimization.psm1" -ForegroundColor Cyan
