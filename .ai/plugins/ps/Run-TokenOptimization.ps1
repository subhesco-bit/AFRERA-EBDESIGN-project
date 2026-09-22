$ErrorActionPreference = 'Stop'
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Import-Module "$PSScriptRoot\TokenOptimization.psm1" -Force

Write-Host 'Running dependency audit via zero-token plugin wrappers...' -ForegroundColor Cyan
Invoke-DepAudit -Target 'backend'
Invoke-DepAudit -Target 'frontend'

Write-Host 'Running chained audit workflow...' -ForegroundColor Cyan
Invoke-AuditChain -Targets @('backend', 'frontend')

Write-Host 'Token optimization workflow complete.' -ForegroundColor Green
