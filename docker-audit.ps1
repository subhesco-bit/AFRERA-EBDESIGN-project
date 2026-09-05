###############################################################################
# DOCKER ECOSYSTEM AUDIT & REPAIR SCRIPT (PowerShell)
# Purpose: Comprehensive verification of Docker setup, images, and services
# Compliance: Audit-ready documentation with reproducible commands
###############################################################################

param(
    [switch]$SkipBuild = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$AuditReport = "docker-audit-report-$Timestamp.md"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# ============================================================================
# COLOR OUTPUT
# ============================================================================

function Write-Header {
    param([string]$Message)
    Write-Host "=================================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "=================================================" -ForegroundColor Blue
    Write-Host ""
    Add-Content -Path $AuditReport -Value "# $Message"
    Add-Content -Path $AuditReport -Value ""
}

function Write-Section {
    param([string]$Message)
    Write-Host ">> $Message" -ForegroundColor Yellow
    Add-Content -Path $AuditReport -Value "### $Message"
    Add-Content -Path $AuditReport -Value ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    Add-Content -Path $AuditReport -Value "✅ $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    Add-Content -Path $AuditReport -Value "❌ $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
    Add-Content -Path $AuditReport -Value "ℹ️  $Message"
}

function Write-Raw {
    param([string]$Message)
    Add-Content -Path $AuditReport -Value $Message
}

# ============================================================================
# PHASE 1: ENVIRONMENT & DEPENDENCIES
# ============================================================================

function Audit-Environment {
    Write-Header "PHASE 1: ENVIRONMENT & DEPENDENCIES AUDIT"
    
    Write-Section "Docker Installation"
    $DockerVersion = docker --version
    if ($DockerVersion) {
        Write-Success "Docker installed: $DockerVersion"
        Write-Raw "``````"
        Write-Raw $DockerVersion
        Write-Raw "``````"
    } else {
        Write-Error "Docker not found"
        exit 1
    }

    Write-Section "Docker Compose Installation"
    $ComposeVersion = docker compose version 2>&1
    if ($ComposeVersion -match "Docker Compose") {
        Write-Success "Docker Compose installed: $ComposeVersion"
    } else {
        Write-Error "Docker Compose not found"
    }

    Write-Section "Docker Daemon Status"
    $DaemonStatus = docker ps 2>&1
    if ($?) {
        Write-Success "Docker daemon running"
    } else {
        Write-Error "Docker daemon not running"
        exit 1
    }

    Write-Section ".env File Validation"
    if (Test-Path ".env") {
        Write-Success ".env file exists"
        Write-Info "Checking required variables..."
        $RequiredVars = @("DB_USER", "DB_PASSWORD", "DB_NAME", "ANTHROPIC_API_KEY")
        foreach ($var in $RequiredVars) {
            $content = Get-Content ".env" | Select-String "^${var}="
            if ($content) {
                Write-Success "$var is set"
            } else {
                Write-Error "$var is NOT set"
            }
        }
    } else {
        Write-Error ".env file not found"
    }
}

# ============================================================================
# PHASE 2: DOCKERFILE ANALYSIS
# ============================================================================

function Audit-Dockerfiles {
    Write-Header "PHASE 2: DOCKERFILE ANALYSIS"
    
    Write-Section "Backend Dockerfile"
    if (Test-Path "backend/Dockerfile") {
        Write-Success "backend/Dockerfile exists"
        Write-Raw "``````dockerfile"
        Get-Content "backend/Dockerfile" | ForEach-Object { Write-Raw $_ }
        Write-Raw "``````"
    } else {
        Write-Error "backend/Dockerfile not found"
    }

    Write-Section "Frontend Dockerfile"
    if (Test-Path "frontend/Dockerfile") {
        Write-Success "frontend/Dockerfile exists"
        Write-Raw "``````dockerfile"
        Get-Content "frontend/Dockerfile" | ForEach-Object { Write-Raw $_ }
        Write-Raw "``````"
    } else {
        Write-Error "frontend/Dockerfile not found"
    }

    Write-Section "Multi-stage Build Verification"
    $BackendContent = Get-Content "backend/Dockerfile"
    if ($BackendContent -match "^FROM.*AS") {
        Write-Success "Backend uses multi-stage build"
    } else {
        Write-Error "Backend does NOT use multi-stage build"
    }

    Write-Section ".dockerignore Validation"
    if (Test-Path ".dockerignore") {
        Write-Success ".dockerignore exists"
        $PatternCount = (Get-Content ".dockerignore" | Measure-Object -Line).Lines
        Write-Raw "- $PatternCount patterns defined"
    } else {
        Write-Error ".dockerignore not found"
    }
}

# ============================================================================
# PHASE 3: DOCKER COMPOSE VALIDATION
# ============================================================================

function Audit-DockerCompose {
    Write-Header "PHASE 3: DOCKER COMPOSE VALIDATION"
    
    Write-Section "docker-compose.yml Structure"
    if (Test-Path "docker-compose.yml") {
        Write-Success "docker-compose.yml exists"
        
        Write-Info "Checking services defined..."
        $Services = Get-Content "docker-compose.yml" | Select-String "^  [a-z_]+:" | ForEach-Object { $_.Line.Trim().TrimEnd(':') }
        foreach ($service in $Services) {
            Write-Success "Service: $service"
        }
    } else {
        Write-Error "docker-compose.yml not found"
    }

    Write-Section "Health Checks"
    $Content = Get-Content "docker-compose.yml"
    if ($Content -match "healthcheck:") {
        Write-Success "Health checks configured"
    } else {
        Write-Error "No health checks found in docker-compose.yml"
    }
}

# ============================================================================
# PHASE 4: SCRIPT & ENTRYPOINT VALIDATION
# ============================================================================

function Audit-Scripts {
    Write-Header "PHASE 4: STARTUP SCRIPTS VALIDATION"
    
    Write-Section "Backend Entrypoint"
    if (Test-Path "backend/entrypoint.sh") {
        Write-Success "backend/entrypoint.sh exists"
    } else {
        Write-Error "backend/entrypoint.sh not found"
    }

    Write-Section "Migration Runner"
    if (Test-Path "backend/src/database/migrate.js") {
        Write-Success "backend/src/database/migrate.js exists"
    } else {
        Write-Error "backend/src/database/migrate.js not found"
    }

    Write-Section "Migrations Directory"
    if (Test-Path "backend/migrations") {
        $MigrationCount = (Get-ChildItem "backend/migrations" -Filter "*.sql" | Measure-Object).Count
        Write-Success "Migrations directory exists with $MigrationCount SQL files"
    } else {
        Write-Error "backend/migrations directory not found"
    }
}

# ============================================================================
# PHASE 5: CURRENT CONTAINER STATE
# ============================================================================

function Audit-Containers {
    Write-Header "PHASE 5: CURRENT CONTAINER STATE"
    
    Write-Section "Running Containers"
    $Containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1
    if ($Containers -eq "NAMES   STATUS  PORTS") {
        Write-Info "No containers currently running"
    } else {
        Write-Success "Running containers:"
        Write-Raw "``````"
        Write-Raw $Containers
        Write-Raw "``````"
    }

    Write-Section "All Containers (Running & Stopped)"
    Write-Raw "``````"
    docker ps -a --format "table {{.Names}}`t{{.Status}}`t{{.Image}}" | ForEach-Object { Write-Raw $_ }
    Write-Raw "``````"

    Write-Section "Container Logs (Backend)"
    $BackendExists = docker ps -a --format "{{.Names}}" 2>&1 | Select-String "ebdesign-backend"
    if ($BackendExists) {
        Write-Success "Backend container found"
        Write-Raw "``````"
        docker logs ebdesign-backend --tail 20 2>&1 | ForEach-Object { Write-Raw $_ }
        Write-Raw "``````"
    }
}

# ============================================================================
# PHASE 6: IMAGE ANALYSIS
# ============================================================================

function Audit-Images {
    Write-Header "PHASE 6: DOCKER IMAGES ANALYSIS"
    
    Write-Section "Local Images"
    Write-Raw "``````"
    docker images --format "table {{.Repository}}`t{{.Tag}}`t{{.Size}}`t{{.CreatedAt}}" | ForEach-Object { Write-Raw $_ }
    Write-Raw "``````"

    Write-Section "Image Build Verification"
    foreach ($image in @("ebdesign-backend", "ebdesign-frontend")) {
        $ImageExists = docker images --format "{{.Repository}}" 2>&1 | Select-String "^$image$"
        if ($ImageExists) {
            Write-Success "Image $image exists"
        } else {
            Write-Error "Image $image not found"
        }
    }
}

# ============================================================================
# PHASE 7: SECURITY RECOMMENDATIONS
# ============================================================================

function Audit-Security {
    Write-Header "PHASE 7: SECURITY RECOMMENDATIONS"
    
    Write-Section "Security Best Practices"
    Write-Raw "- [ ] Containers run as non-root user"
    Write-Raw "- [ ] Capabilities dropped (CAP_DROP: ALL)"
    Write-Raw "- [ ] Read-only root filesystem enabled"
    Write-Raw "- [ ] Resource limits configured (CPU/memory)"
    Write-Raw "- [ ] Health checks defined"
    Write-Raw "- [ ] Secrets NOT hardcoded in images"
    Write-Raw "- [ ] Images scanned for vulnerabilities"
    
    Write-Section "Recommended Tools"
    Write-Raw "- Trivy: \`docker run aquasec/trivy image ebdesign-backend:latest\`"
    Write-Raw "- Snyk: \`snyk test --docker ebdesign-backend:latest\`"
    Write-Raw "- Scout: \`docker scout cves ebdesign-backend:latest\`"
}

# ============================================================================
# PHASE 8: SUMMARY & NEXT STEPS
# ============================================================================

function Audit-Summary {
    Write-Header "PHASE 8: AUDIT SUMMARY & NEXT STEPS"
    
    Write-Section "Critical Items to Review"
    Write-Raw "1. Review any ❌ failures above"
    Write-Raw "2. Ensure all .env variables are populated"
    Write-Raw "3. Verify migrations directory has SQL files"
    Write-Raw "4. Confirm entrypoint.sh is executable and correct"
    
    Write-Section "Startup Procedure"
    Write-Raw "``````bash"
    Write-Raw "# Start services"
    Write-Raw "docker compose up -d"
    Write-Raw ""
    Write-Raw "# Verify services"
    Write-Raw "docker compose ps"
    Write-Raw ""
    Write-Raw "# Check health"
    Write-Raw "curl http://localhost:3000/health"
    Write-Raw ""
    Write-Raw "# View logs"
    Write-Raw "docker compose logs -f backend"
    Write-Raw "``````"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Main {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║   DOCKER ECOSYSTEM AUDIT & REPAIR SCRIPT (PowerShell)      ║" -ForegroundColor Blue
    Write-Host "║   Timestamp: $Timestamp                        ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    
    # Initialize report
    "# Docker Audit Report" | Out-File -FilePath $AuditReport -Encoding UTF8
    "**Generated:** $Timestamp" | Add-Content -Path $AuditReport
    "" | Add-Content -Path $AuditReport
    
    # Run audit phases
    Audit-Environment
    Audit-Dockerfiles
    Audit-DockerCompose
    Audit-Scripts
    Audit-Containers
    Audit-Images
    Audit-Security
    Audit-Summary
    
    Write-Host ""
    Write-Host "✅ Audit complete!" -ForegroundColor Green
    Write-Host "📄 Report saved to: $AuditReport" -ForegroundColor Yellow
    Write-Host ""
}

Main
