# TokenOptimization.psm1
# PowerShell wrapper module for the .ai/plugins/*.js zero-token plugins.
# Import with:  Import-Module "$PSScriptRoot\TokenOptimization.psm1" -Force
#
# Purpose: give PowerShell-native entry points (no need to remember node
# invocation syntax) that call the same plugin scripts used by bash/agents,
# so results and token savings are identical regardless of shell.

$script:PluginsRoot = Split-Path -Parent $PSScriptRoot

function Invoke-DepAudit {
    <#
    .SYNOPSIS
    Zero-token dependency/vulnerability audit (wraps dep-auditor.js).
    .PARAMETER Target
    Directory to audit (default: backend)
    #>
    param([string]$Target = 'backend')
    node (Join-Path $script:PluginsRoot 'dep-auditor.js') $Target
}

function Invoke-AuditChain {
    <#
    .SYNOPSIS
    Runs the full zero-token audit chain across backend + frontend.
    #>
    param([string[]]$Targets = @('backend', 'frontend'))
    node (Join-Path $script:PluginsRoot 'audit-chain.js') @Targets
}

function Invoke-BrowserTestBatch {
    <#
    .SYNOPSIS
    Zero-token E2E batch test runner (wraps browser-test-batch.js).
    .PARAMETER TestCasesFile
    Path to a JSON file with test case definitions.
    .PARAMETER BaseUrl
    Base URL of the running dev server (default http://localhost:3000).
    #>
    param(
        [Parameter(Mandatory)][string]$TestCasesFile,
        [string]$BaseUrl = 'http://localhost:3000'
    )
    node (Join-Path $script:PluginsRoot 'browser-test-batch.js') $TestCasesFile $BaseUrl
}

function Get-LatestPluginResult {
    <#
    .SYNOPSIS
    Returns the most recent JSON artifact of a given plugin result prefix
    (e.g. 'dep-audit', 'e2e', 'audit-chain') without re-running the plugin —
    the zero-token "check cache before recompute" pattern.
    #>
    param([Parameter(Mandatory)][string]$Prefix)
    $resultsDir = Join-Path $script:PluginsRoot 'results'
    Get-ChildItem -Path $resultsDir -Filter "$Prefix-*.json" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 |
        ForEach-Object { Get-Content $_.FullName -Raw | ConvertFrom-Json }
}

Export-ModuleMember -Function Invoke-DepAudit, Invoke-AuditChain, Invoke-BrowserTestBatch, Get-LatestPluginResult
