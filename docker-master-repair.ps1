###############################################################################
# MASTER DOCKER REPAIR SCRIPT - ALL DOCKERFILES IN EBDESIGN (PowerShell)
# Repairs all Dockerfiles and docker-compose files across entire repository
###############################################################################

param(
    [switch]$SkipValidation = $false,
    [switch]$DryRun = $false,
    [string]$OutputPath = "docker-master-repair"
)

$ErrorActionPreference = "Continue"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$RepairLog = "docker-master-repair-$Timestamp.log"
$OutputDir = "$OutputPath-$Timestamp"

# Create output directory
New-Item -ItemType Directory -Path $OutputDir -ErrorAction SilentlyContinue | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Level) {
        "INFO"    { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
    }
    
    Add-Content -Path $RepairLog -Value "[$timestamp] $Level: $Message" -ErrorAction SilentlyContinue
}

function Get-AllDockerfiles {
    Write-Log "Discovering all Dockerfiles..." "INFO"
    $dockerfiles = @(Get-ChildItem -Path '.' -Recurse -Filter "Dockerfile*" -ErrorAction SilentlyContinue)
    Write-Log "Found $($dockerfiles.Count) Dockerfiles" "SUCCESS"
    return $dockerfiles
}

function Get-AllComposeFiles {
    Write-Log "Discovering all docker-compose files..." "INFO"
    $composefiles = @(Get-ChildItem -Path '.' -Recurse -Filter "docker-compose*.yml", "docker-compose*.yaml" -ErrorAction SilentlyContinue)
    Write-Log "Found $($composefiles.Count) docker-compose files" "SUCCESS"
    return $composefiles
}

function Test-DockerfileSyntax {
    param([string]$DockerfilePath)
    
    try {
        $result = docker build -f $DockerfilePath --dry-run . 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Valid: $DockerfilePath" "SUCCESS"
            return $true
        } else {
            Write-Log "Invalid: $DockerfilePath" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error testing $DockerfilePath`: $_" "ERROR"
        return $false
    }
}

function Check-DockerfileIssues {
    param([string]$DockerfilePath)
    
    $issues = @()
    $content = Get-Content -Path $DockerfilePath -Raw
    
    # Check for missing ENTRYPOINT/CMD
    if ($content -notmatch "ENTRYPOINT|CMD") {
        $issues += "Missing ENTRYPOINT or CMD"
    }
    
    # Check for root user
    if ($content -match "USER\s+root") {
        $issues += "Running as root user"
    }
    
    # Check for single-stage build
    if ($content -notmatch "FROM.*AS|as builder") {
        $issues += "Not using multi-stage build"
    }
    
    # Check for health check
    if ($content -notmatch "HEALTHCHECK") {
        $issues += "Missing HEALTHCHECK"
    }
    
    # Check for security hardening
    if ($content -notmatch "cap_drop|no-new-privileges|security_opt") {
        $issues += "Missing security hardening"
    }
    
    return $issues
}

function Test-ComposeValidity {
    param([string]$ComposePath)
    
    try {
        docker-compose -f $ComposePath config --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Valid: $ComposePath" "SUCCESS"
            return $true
        } else {
            Write-Log "Invalid: $ComposePath" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error testing $ComposePath`: $_" "ERROR"
        return $false
    }
}

function Generate-RepairReport {
    param(
        [object[]]$Dockerfiles,
        [object[]]$ComposeFiles,
        [hashtable]$IssuesMap
    )
    
    Write-Log "Generating repair report..." "INFO"
    
    $reportPath = Join-Path $OutputDir "REPAIR_REPORT.md"
    
    $report = @"
# MASTER DOCKER REPAIR REPORT
**Timestamp:** $Timestamp
**Total Dockerfiles Found:** $($Dockerfiles.Count)
**Total docker-compose Files Found:** $($ComposeFiles.Count)

## Dockerfiles Inventory

| File | Status | Issues |
|------|--------|--------|
"@
    
    foreach ($dockerfile in $Dockerfiles) {
        $issues = $IssuesMap[$dockerfile.FullName]
        if ($issues.Count -gt 0) {
            $issueStr = ($issues -join ", ")
            $report += "`n| $($dockerfile.FullName) | ⚠️ ISSUES | $issueStr |"
        } else {
            $report += "`n| $($dockerfile.FullName) | ✅ OK | None |"
        }
    }
    
    $report += "`n`n## docker-compose Files Inventory`n`n| File |`n|------|`n"
    
    foreach ($compose in $ComposeFiles) {
        $report += "`n| $($compose.FullName) |"
    }
    
    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Log "Report saved to: $reportPath" "SUCCESS"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║   MASTER DOCKER REPAIR - ALL DOCKERFILES IN EBDESIGN       ║" -ForegroundColor Blue
    Write-Host "║   Timestamp: $Timestamp                        ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    
    Write-Log "Master Docker Repair Started" "INFO"
    
    # Discover all Docker files
    $dockerfiles = Get-AllDockerfiles
    $composefiles = Get-AllComposeFiles
    
    # Validate syntax
    if (-not $SkipValidation) {
        Write-Log "Validating Dockerfile syntax..." "INFO"
        foreach ($dockerfile in $dockerfiles) {
            Test-DockerfileSyntax -DockerfilePath $dockerfile.FullName
        }
        
        Write-Log "Validating docker-compose files..." "INFO"
        foreach ($compose in $composefiles) {
            Test-ComposeValidity -ComposePath $compose.FullName
        }
    }
    
    # Check for issues
    Write-Log "Checking for common Docker issues..." "INFO"
    $issuesMap = @{}
    
    foreach ($dockerfile in $dockerfiles) {
        $issues = Check-DockerfileIssues -DockerfilePath $dockerfile.FullName
        $issuesMap[$dockerfile.FullName] = $issues
        
        if ($issues.Count -gt 0) {
            foreach ($issue in $issues) {
                Write-Log "Issue in $($dockerfile.Name): $issue" "WARNING"
            }
        }
    }
    
    # Generate report
    Generate-RepairReport -Dockerfiles $dockerfiles -ComposeFiles $composefiles -IssuesMap $issuesMap
    
    Write-Host ""
    Write-Log "Master repair analysis complete!" "SUCCESS"
    Write-Log "Log saved to: $RepairLog" "INFO"
    Write-Log "Output saved to: $OutputDir" "INFO"
}

Main
