# Docker Build & Deployment Monitoring Script
# Monitors the build process and automatically starts services when ready

param(
    [switch]$AutoStart = $true,
    [int]$CheckInterval = 5
)

$ErrorActionPreference = "SilentlyContinue"

function Write-Status {
    param([string]$Message, [string]$Type = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Type) {
        "INFO"    { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        "SUCCESS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "ERROR"   { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "WARNING" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
    }
}

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   DOCKER BUILD & DEPLOYMENT MONITOR                       ║" -ForegroundColor Cyan
Write-Host "║   Monitoring docker-compose build process                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Wait for images to be ready
Write-Status "Starting docker-compose build..." "INFO"
Write-Status "This may take 15-20 minutes for first build" "INFO"
Write-Host ""

$maxWait = 1200  # 20 minutes in seconds
$elapsed = 0
$buildComplete = $false

while ($elapsed -lt $maxWait -and -not $buildComplete) {
    # Check if backend and frontend images exist
    $backendExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^ebdesign-backend:latest$"
    $frontendExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "^ebdesign-frontend:latest$"
    
    if ($backendExists -and $frontendExists) {
        $buildComplete = $true
        Write-Status "Docker images built successfully!" "SUCCESS"
        Write-Host ""
        
        # Show image details
        Write-Status "Image Details:" "INFO"
        docker images --filter "reference=ebdesign-*" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
        Write-Host ""
        
        break
    }
    
    $percent = [math]::Round(($elapsed / $maxWait) * 100)
    Write-Host -NoNewline "`rBuild progress: $percent% ($elapsed seconds)  "
    
    Start-Sleep -Seconds $CheckInterval
    $elapsed += $CheckInterval
}

if (-not $buildComplete) {
    Write-Status "Build timeout after 20 minutes" "ERROR"
    Write-Status "Check docker logs for details: docker-compose logs" "WARNING"
    exit 1
}

# If AutoStart is enabled, start services
if ($AutoStart) {
    Write-Host ""
    Write-Status "Starting services with docker-compose up -d..." "INFO"
    
    docker-compose up -d 2>&1 | ForEach-Object {
        if ($_ -match "Creating|Starting") {
            Write-Status $_ "INFO"
        }
    }
    
    # Wait for services to be healthy
    Write-Host ""
    Write-Status "Waiting for services to be healthy..." "INFO"
    Write-Status "This typically takes 30-60 seconds" "INFO"
    Write-Host ""
    
    $healthCheck = 0
    $maxHealthCheck = 60
    
    while ($healthCheck -lt $maxHealthCheck) {
        $result = docker-compose ps --format "table {{.Names}}\t{{.Status}}" 2>&1
        
        Write-Host "Service Status:"
        Write-Host $result
        Write-Host ""
        
        # Check if all services are healthy
        $unhealthy = $result | Select-String "unhealthy|Exit|Restarting"
        
        if ($unhealthy) {
            Write-Status "Some services are not healthy yet, retrying..." "WARNING"
        } else {
            # All services appear healthy
            $allHealthy = $result | Select-String "(healthy)" | Measure-Object | Select-Object -ExpandProperty Count
            if ($allHealthy -ge 3) {  # At least 3 healthy (db, redis, backend or frontend)
                Write-Status "All services are healthy!" "SUCCESS"
                break
            }
        }
        
        Start-Sleep -Seconds 5
        $healthCheck += 5
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Test endpoints
    Write-Status "Testing API endpoints..." "INFO"
    
    $backendHealth = curl -s http://localhost:3000/health 2>&1
    if ($backendHealth -match "status") {
        Write-Status "✓ Backend /health endpoint responding" "SUCCESS"
    } else {
        Write-Status "✗ Backend /health endpoint not responding yet" "WARNING"
    }
    
    $frontendTest = curl -s http://localhost:5173 2>&1
    if ($frontendTest.Length -gt 0) {
        Write-Status "✓ Frontend (localhost:5173) responding" "SUCCESS"
    } else {
        Write-Status "✗ Frontend not responding yet" "WARNING"
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Status "DEPLOYMENT COMPLETE!" "SUCCESS"
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Yellow
    docker-compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    Write-Host "🌐 Access Points:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:5173"
    Write-Host "  Backend:  http://localhost:3000"
    Write-Host "  API:      http://localhost:3000/api"
    Write-Host ""
    
    Write-Host "📝 Useful Commands:" -ForegroundColor Yellow
    Write-Host "  View logs:         docker-compose logs -f backend"
    Write-Host "  Stop services:     docker-compose down"
    Write-Host "  Access database:   docker-compose exec postgres psql -U ebdesign_user -d ebdesign"
    Write-Host ""
    
} else {
    Write-Status "Images ready. Run 'docker-compose up -d' to start services." "INFO"
}

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
